/** S06 홈 — Walk Score 카드 + 로봇 상태 요약 (PRD F-5) */
export default function HomePage() {
  return (
    <div className="px-4 py-5">
      <h1 className="text-xl font-bold">안녕하세요 👋</h1>
      <p className="mt-1 text-sm text-muted">강아지를 자유롭게</p>

      {/* TODO(M5): /api/weather 연결 — WalkScoreCard 컴포넌트로 교체 */}
      <section className="mt-4 rounded-2xl bg-sherpy-600 p-5 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-sherpy-100">오늘의 산책</p>
            <p className="tabular mt-1 text-4xl font-bold">—</p>
          </div>
          <span className="rounded-full bg-white/20 px-3 py-1 text-xs">준비 중</span>
        </div>
        <p className="mt-3 text-sm text-sherpy-100">
          기상청 API 키를 등록하면 산책적합도가 표시됩니다.
        </p>
      </section>

      <section className="mt-4 rounded-2xl border border-line bg-surface p-4">
        <p className="text-sm font-semibold">셰르피 상태</p>
        <p className="mt-1 text-xs text-muted">대시보드에서 실시간으로 확인하세요.</p>
      </section>
    </div>
  );
}
