/** 탭 화면 전환 — template 은 이동할 때마다 새로 마운트되므로 진입 애니메이션이 매번 재생된다 */
export default function MainTemplate({ children }: { children: React.ReactNode }) {
  return <div className="animate-page">{children}</div>;
}
