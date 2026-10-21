// 채팅 시간 표기 — 먹메이트 lib/format.ts 에서 채팅에 쓰는 것만 가져왔다 (한국어, 상대 표기)

const KR_DAY = ["일", "월", "화", "수", "목", "금", "토"];
const pad = (n: number) => n.toString().padStart(2, "0");
const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();

/** 채팅 목록용 상대 시각: "방금", "12분 전", "오후 7:30", "어제" */
export function formatRelativeTime(iso: string): string {
  const d = new Date(iso);
  const mins = Math.floor((Date.now() - d.getTime()) / 60_000);
  if (mins < 1) return "방금";
  if (mins < 60) return `${mins}분 전`;
  const diffDays = Math.round((startOfDay(new Date()) - startOfDay(d)) / 86_400_000);
  if (diffDays === 0) return formatClock(iso);
  if (diffDays === 1) return "어제";
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

/** 말풍선 옆 짧은 시각: "오후 7:30" */
export function formatClock(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours();
  return `${h < 12 ? "오전" : "오후"} ${h % 12 === 0 ? 12 : h % 12}:${pad(d.getMinutes())}`;
}

/** 날짜 구분선: "2026년 10월 19일 월요일" */
export function formatDateDivider(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${KR_DAY[d.getDay()]}요일`;
}

export function isSameDay(a: string, b: string): boolean {
  return startOfDay(new Date(a)) === startOfDay(new Date(b));
}

/** 받침에 맞는 조사 — josa("콩이", "와", "과") → "콩이와", josa("보리", "을", "를") 처럼 앞이 받침 있을 때 쓰는 꼴을 두 번째로 */
export function josa(word: string, noBatchim: string, batchim: string): string {
  const last = word.charCodeAt(word.length - 1);
  if (last < 0xac00 || last > 0xd7a3) return `${word}${noBatchim}(${batchim})`; // 한글이 아니면 둘 다 표기
  return word + ((last - 0xac00) % 28 ? batchim : noBatchim);
}
