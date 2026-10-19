"use client";

/**
 * S11 — 셰르피 카메라 (PRD F-3)
 *
 * 영상은 서버(Vercel)를 거치지 않고 로봇 ↔ 브라우저 P2P(WebRTC)로 흐른다.
 * 경로: Pi 카메라 → MediaMTX → Cloudflare Tunnel → 브라우저
 * MediaMTX의 WHEP 엔드포인트를 그대로 <video>에 물린다.
 *
 * ⚠️ 전제: 라즈베리파이 카메라 모듈이 아직 BOM에 없다 (PRD §2-3).
 */
export default function CameraPage() {
  const base = process.env.NEXT_PUBLIC_ROBOT_STREAM_BASE;

  if (!base) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="font-semibold">영상 주소가 설정되지 않았습니다</p>
        <p className="text-sm text-muted">
          .env.local 의 <code>NEXT_PUBLIC_ROBOT_STREAM_BASE</code> 에
          Cloudflare Tunnel 주소를 넣으세요.
        </p>
      </div>
    );
  }

  // TODO(M3): WHEP 핸드셰이크 구현 — robot/mediamtx.yml 의 webrtcAddress 사용
  return (
    <div className="relative min-h-dvh bg-black">
      <video id="robot-cam" autoPlay playsInline muted className="h-dvh w-full object-contain" />
      <div className="pointer-events-none absolute inset-x-0 top-0 p-4 text-white">
        <p className="text-xs opacity-80">셰르피 1인칭 · 목표 지연 0.5초 이하</p>
      </div>
    </div>
  );
}
