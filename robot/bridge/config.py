"""브리지 설정 — 로봇에서 .env 또는 환경변수로 주입한다."""
import os

SERVER_URL = os.environ.get("SHERPY_SERVER_URL", "https://sherpy.vercel.app")
ROBOT_ID   = int(os.environ.get("SHERPY_ROBOT_ID", "1"))
API_KEY    = os.environ.get("SHERPY_API_KEY", "")

TELEMETRY_HZ   = 1.0    # 상태 업링크 주기
COMMAND_HZ     = 1.0    # 명령 폴링 주기
HTTP_TIMEOUT   = 3.0    # 초
BUFFER_MAX     = 30     # 네트워크 끊김 시 로컬 버퍼 최대 개수

# ── PCA9685 (I2C) ──────────────────────────────
# 확정 BOM: D-FLIFE PCA9685 16채널 12비트, 2EA (1개는 예비)
I2C_ADDRESS   = 0x40
PWM_FREQ_HZ   = 50      # RC 표준
CH_STEER      = 0       # 조향 서보 (35kg)
CH_THROTTLE   = 1       # ESC 스로틀
CH_GEAR       = 2       # 변속 서보 (2단 기어)

PWM_MIN_US    = 1000
PWM_NEUTRAL_US= 1500
PWM_MAX_US    = 2000

# ── 안전 ───────────────────────────────────────
# 서버 명령을 이 시간 이상 못 받으면 스스로 감속·정지한다.
# 원격 정지는 보조 수단이고, 1차 안전장치는 물리 E-stop 버튼이다.
WATCHDOG_SEC  = 3.0
