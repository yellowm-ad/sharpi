"""
공공데이터포털 서비스키를 .env.local 과 Vercel 환경변수에 한 번에 넣는다.

키는 화면에 표시되지 않고(getpass), 대화창이나 로그에도 남지 않는다.

사용법 (sherpy 폴더에서 PowerShell로):
    python scripts/set_weather_key.py

공공데이터포털 > 마이페이지 > 데이터활용 > Open API > 활용신청 현황 >
'기상청_단기예보 조회서비스' > 일반 인증키(Decoding) 값을 복사해서 붙여넣으세요.
"""

import getpass
import pathlib
import shutil
import subprocess
import sys

NAME = "DATA_GO_KR_SERVICE_KEY"
ROOT = pathlib.Path(__file__).resolve().parent.parent
ENV_FILE = ROOT / ".env.local"


def write_env_local(value: str) -> None:
    lines = ENV_FILE.read_text(encoding="utf-8").splitlines() if ENV_FILE.exists() else []
    lines = [l for l in lines if not l.startswith(f"{NAME}=")]
    lines.append(f"{NAME}={value}")
    ENV_FILE.write_text("\n".join(lines) + "\n", encoding="utf-8")


def push_vercel(value: str) -> bool:
    vercel = shutil.which("vercel") or shutil.which("vercel.cmd")
    if not vercel:
        print("  - vercel CLI를 찾지 못했습니다. 로컬에만 저장했습니다.")
        return False
    ok = True
    for env in ("production", "preview", "development"):
        # Windows 기본 코드페이지(cp949)로 vercel 출력을 읽다 깨지지 않게 utf-8 로 받는다
        subprocess.run([vercel, "env", "rm", NAME, env, "--yes"], cwd=ROOT,
                       capture_output=True, text=True, encoding="utf-8", errors="replace")
        r = subprocess.run([vercel, "env", "add", NAME, env], cwd=ROOT, input=value,
                           capture_output=True, text=True, encoding="utf-8", errors="replace")
        print(f"  - Vercel {env}: {'완료' if r.returncode == 0 else '실패'}")
        ok &= r.returncode == 0
    return ok


def main() -> int:
    print("공공데이터포털 '일반 인증키(Decoding)'를 붙여넣고 Enter (입력해도 화면에 안 보입니다)")
    value = getpass.getpass("> ").strip().strip('"').strip("'")
    # 오른쪽 클릭과 Ctrl+V 를 둘 다 해서 같은 키가 두 번 붙는 경우
    half = len(value) // 2
    if len(value) % 2 == 0 and value[:half] == value[half:]:
        value = value[:half]
        print("  - 같은 키가 두 번 붙여넣어져서 하나만 남겼습니다.")
    if len(value) < 20:
        print("키가 너무 짧습니다. Decoding 키 전체를 복사했는지 확인하세요.")
        return 1
    if "%" in value:
        print("'%'가 들어 있는 건 Encoding 키입니다. Decoding 키를 넣어주세요.")
        return 1

    write_env_local(value)
    print(f"  - .env.local 저장 완료 (끝 4자리 …{value[-4:]})")
    push_vercel(value)
    print("\n끝났습니다. Claude에게 '키 넣었어'라고 말하면 재배포하고 연결을 확인합니다.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
