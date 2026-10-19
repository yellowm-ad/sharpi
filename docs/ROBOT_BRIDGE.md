# 로봇 측 설치 — 라즈베리파이

확정 BOM(B안) 기준입니다.

| 구성 | 품목 |
|---|---|
| 구동부 | MJX H8P 1/8 (브러시리스, 80A FOC ESC, 35kg 서보, 2단 기어) |
| 전원 | CNHL 3S 5300mAh LiPo + SKYRC S65 충전기 |
| PWM | **D-FLIFE PCA9685** 16채널 12비트 I2C ×2 |
| 제어 | 라즈베리파이 + micro SD 64GB |
| 장력 | SBA-50L 로드셀 + HX711 (별도 신청분) |
| 줄 길이 | AS5600 + 네오디뮴 자석 N35 6.0×2.5mm |
| 리드줄 | RELUNE 릴루핀 트윈 리드줄 |
| 연결부 | 로드엔드 베어링 JF6L/JF6R M6×1.0P |

---

## ⚠️ 먼저 확인할 것

이 문서대로 진행하기 전에 PRD §2-3의 **누락 부품**이 해결되어야 합니다.

| # | 누락 | 영향 |
|---|---|---|
| 1 | **카메라 모듈** | 영상 송출 + **경로 기억 주행 전체** 불가 |
| 2 | **네트워크** (핫스팟/LTE) | 연동 기능 전부 불가 |
| 3 | **라즈베리파이 본체** | BOM에 micro SD만 있음 |
| 4 | UBEC 5V 5A | 파이 전원 (ESC BEC 6V → 5V) |
| 5 | E-stop 물리버튼 | 안전설계 L3 |

**1·2번이 막혀도 앱 개발은 `npm run mock:robot` 으로 계속할 수 있습니다.**

---

## 1. 배선

```
3S LiPo ─ XT60 ─┬─→ [80A FOC ESC] ─→ 모터
                │        └─ BEC 6V/13A ─┬─→ 조향 서보 (CH0)
                │                        ├─→ 변속 서보 (CH2)
                │                        └─→ [UBEC 5V] ─→ 라즈베리파이
                └─→ [E-stop 릴레이]

라즈베리파이
 ├─ I2C (SDA/SCL) ─┬─→ [PCA9685 0x40] ─┬─ CH0 조향 서보
 │                 │                     ├─ CH1 ESC 스로틀
 │                 │                     └─ CH2 변속 서보
 │                 └─→ [AS5600 0x36]  (릴 회전각)
 ├─ GPIO (DT/SCK) ──→ [HX711] ─→ [SBA-50L 로드셀]
 └─ CSI 또는 USB ───→ [카메라]
```

> **ESC 전류가 최대 80A까지 튑니다.** 같은 배터리에서 파이 전원을 뽑으면
> 순간 전압강하로 파이가 리부팅될 수 있습니다. 가능하면 파이·센서용으로
> USB 보조배터리를 따로 두세요 (회의록 3절의 "전원 2계통 분리" 방향과 일치).

---

## 2. PCA9685 설정

### 왜 아두이노 나노에서 바뀌었나

기존 `hal.py` 는 나노에 시리얼로 `"R<조향us>,<스로틀us>,<모드>\n"` 을 보내는
구조였습니다. PCA9685는 파이가 I2C로 직접 PWM을 만들므로 중간 MCU가
사라지고, 하드웨어 타이머라 파이 소프트웨어 PWM의 지터 문제도 없습니다.

### 분해능 검증

```
50Hz → 주기 20,000us
12비트 4096스텝 → 1스텝 ≈ 4.88us
RC 범위 1000~2000us → 205~410 카운트 (205단계)
조향 ±30도 기준 → 0.29도/스텝
```

경로추종 제어에 충분합니다.

### 채널 배정

| 채널 | 용도 |
|---|---|
| CH0 | 조향 서보 (35kg) |
| CH1 | ESC 스로틀 |
| CH2 | 변속 서보 (2단 기어) |
| CH3~15 | 예비 |

### I2C 활성화

```bash
sudo raspi-config     # Interface Options → I2C → Enable
sudo reboot
i2cdetect -y 1        # 0x40(PCA9685), 0x36(AS5600) 이 보여야 함
```

---

## 3. 소프트웨어 설치

```bash
cd ~
git clone <저장소> sherpy
cd sherpy/robot

python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 환경변수

```bash
cat >> ~/.bashrc <<'ENV'
export SHERPY_SERVER_URL="https://sherpy.vercel.app"
export SHERPY_ROBOT_ID="1"
export SHERPY_API_KEY="여기에-서버에서-발급받은-키"
ENV
source ~/.bashrc
```

> API 키는 서버 DB에 **해시로만** 저장됩니다. 평문은 이 파일에만 둡니다.

---

## 4. 기존 코드에서 바꿔야 할 것

| 파일 | 변경 |
|---|---|
| `walkbot/hal.py` | `RealHAL` → `robot/hal_pca9685.py` 의 `PCA9685HAL` 로 교체 |
| `walkbot/config.py` | PCA9685 채널 상수 추가, `THRESHOLDS` 를 앱과 동일하게 유지 |
| `walkbot/main.py` | `TelemetryUplink` / `CommandDownlink` 기동 추가 |

### main.py 연결 예시

```python
from bridge import TelemetryUplink, CommandDownlink
from hal_pca9685 import PCA9685HAL

hal = PCA9685HAL()
hal.set_gear(low=True)        # 산책 속도는 저속단

def snapshot():
    """현재 상태를 dict로 — 1Hz로 호출된다"""
    return {
        "mode": state.mode,
        "safety_level": monitor.level,
        "faults": monitor.active_faults(),
        "tension_n": leash.tension_n,
        "leash_len_m": leash.length_m,
        "speed_cmd": driver.speed,
        "steer_cmd": driver.steer,
        "kf_index": follower.index,
        "kf_total": len(route.keyframes),
        "match_quality": follower.quality,
        "battery_v": None,           # ADC 미장착
    }

def on_command(cmd_type, payload):
    if cmd_type == "ESTOP":        hal.estop(); state.mode = "estop"
    elif cmd_type == "START_TEACH": state.mode = "teach"
    elif cmd_type == "STOP_TEACH":  route.save(); state.mode = "idle"
    elif cmd_type == "START_FOLLOW": state.mode = "follow"
    elif cmd_type == "PAUSE":       state.mode = "idle"
    elif cmd_type == "RESUME":      state.mode = "follow"
    elif cmd_type == "SET_SPEED_LIMIT":
        driver.speed_limit = float(payload.get("mps", 1.0))

def on_watchdog():
    """서버 응답이 3초 이상 없으면 스스로 감속·정지"""
    hal.estop()

uplink = TelemetryUplink(); uplink.start(snapshot)
downlink = CommandDownlink(); downlink.start(on_command, on_watchdog)
```

---

## 5. 영상 (MediaMTX + Cloudflare Tunnel)

```bash
# MediaMTX 설치 (아키텍처에 맞는 릴리스를 받으세요)
wget https://github.com/bluenviron/mediamtx/releases/latest/download/mediamtx_linux_arm64v8.tar.gz
tar -xzf mediamtx_linux_arm64v8.tar.gz
cp ~/sherpy/robot/mediamtx.yml ./mediamtx.yml
./mediamtx
```

```bash
# Cloudflare Tunnel — 공유기 포트포워딩 없이 고정 HTTPS 주소를 얻는다
cloudflared tunnel --url http://localhost:8889
```

출력된 주소를 앱의 `.env.local` → `NEXT_PUBLIC_ROBOT_STREAM_BASE` 에 넣습니다.

> **⚠️ 부하 테스트를 꼭 하세요.** ORB 특징점 매칭 + H.264 인코딩 + 센서 폴링을
> 동시에 돌리면 CPU가 포화될 수 있습니다. 영상 때문에 경로추종 루프가
> 느려지면 주행 품질이 떨어집니다. 느리면 해상도를 낮추거나
> 파이 4 이상의 하드웨어 인코더를 쓰세요.

---

## 6. 서비스 등록 (자동 시작)

```ini
# /etc/systemd/system/sherpy-bridge.service
[Unit]
Description=Sherpy robot bridge
After=network-online.target

[Service]
User=pi
WorkingDirectory=/home/pi/sherpy/robot
EnvironmentFile=/home/pi/sherpy/robot/.env
ExecStart=/home/pi/sherpy/robot/.venv/bin/python -m walkbot.main
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now sherpy-bridge
journalctl -u sherpy-bridge -f
```

---

## 7. 점검 순서

1. `i2cdetect -y 1` → `0x40`, `0x36` 확인
2. 바퀴를 들고 `PCA9685HAL().drive(0, 0.2)` → 모터가 천천히 도는지
3. 로드셀에 손으로 힘을 줘서 `tension_n` 이 변하는지
4. 릴을 당겨 `leash_len_m` 이 변하는지
5. 서버 대시보드에 값이 2초 내로 올라오는지
6. 앱에서 ESTOP → 2초 내 정지하는지
7. **랜선/와이파이를 뽑아서 3초 뒤 로봇이 스스로 멈추는지** ← 워치독 검증
