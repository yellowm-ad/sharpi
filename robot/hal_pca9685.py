"""
PCA9685 기반 HAL — 기존 walkbot/hal.py 의 RealHAL 을 대체한다.

[변경 이유]
기존 설계는 아두이노 나노에 시리얼로 "R<조향us>,<스로틀us>,<모드>\n" 을 보내는
구조였으나, 확정 BOM이 PCA9685(I2C)로 바뀌었다. 중간 MCU가 사라져 구조가
단순해지고, PCA9685는 하드웨어 타이머로 PWM을 만들기 때문에 라즈베리파이
소프트웨어 PWM에서 생기던 지터 문제가 없다.

[분해능 검증]
  50Hz → 주기 20,000us, 12비트 4096스텝 → 1스텝 ≈ 4.88us
  RC 범위 1000~2000us → 205~410 카운트 (205단계)
  조향 ±30도 기준 0.29도/스텝 → 경로추종 제어에 충분하다.

설치: pip install adafruit-circuitpython-pca9685 adafruit-blinka
"""
import board
import busio
from adafruit_pca9685 import PCA9685

from bridge import config as C


def _us_to_duty(us: float) -> int:
    """마이크로초 → 16비트 duty_cycle (라이브러리가 16비트 인터페이스를 쓴다)"""
    us = max(C.PWM_MIN_US, min(C.PWM_MAX_US, us))
    period_us = 1_000_000.0 / C.PWM_FREQ_HZ
    return int(us / period_us * 0xFFFF)


class PCA9685HAL:
    def __init__(self) -> None:
        i2c = busio.I2C(board.SCL, board.SDA)
        self.pca = PCA9685(i2c, address=C.I2C_ADDRESS)
        self.pca.frequency = C.PWM_FREQ_HZ
        self.neutral()

    # ── 기본 출력 ──────────────────────────────
    def _write_us(self, ch: int, us: float) -> None:
        self.pca.channels[ch].duty_cycle = _us_to_duty(us)

    def neutral(self) -> None:
        """스로틀 중립 = 정지. ESC는 중립 PWM에서 멈춘다."""
        self._write_us(C.CH_THROTTLE, C.PWM_NEUTRAL_US)
        self._write_us(C.CH_STEER, C.PWM_NEUTRAL_US)

    # ── walkbot 인터페이스 호환 ────────────────
    def drive(self, steer: float, speed: float) -> None:
        """
        steer: -1.0(좌) ~ +1.0(우)   ※ +1 = 오른쪽 (기존 부호 약속 유지)
        speed:  0.0 ~ 1.0 (전진 비율)
        """
        steer = max(-1.0, min(1.0, steer))
        speed = max(0.0, min(1.0, speed))

        half = (C.PWM_MAX_US - C.PWM_MIN_US) / 2.0
        self._write_us(C.CH_STEER, C.PWM_NEUTRAL_US + steer * half)
        self._write_us(C.CH_THROTTLE, C.PWM_NEUTRAL_US + speed * half)

    def set_gear(self, low: bool = True) -> None:
        """2단 기어박스. 산책 속도에서는 저속단을 쓴다.

        2S 저속단 최고 7.5km/h(2.08m/s) 기준, 목표 1.4m/s는 스로틀 67% 지점으로
        제어 해상도가 가장 좋다.
        """
        self._write_us(C.CH_GEAR, C.PWM_MIN_US if low else C.PWM_MAX_US)

    def estop(self) -> None:
        self.neutral()

    def close(self) -> None:
        self.neutral()
        self.pca.deinit()
