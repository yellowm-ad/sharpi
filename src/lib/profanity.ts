// 비속어 검열 — 먹메이트 lib/profanity.ts 를 그대로 가져왔다. korcen(순수 함수, 외부 API 없음) 래퍼.
// 두 가지 용도로 나눠 쓴다:
//   containsProfanity — 아이디/닉네임처럼 계속 노출·재사용되는 값은 아예 못 만들게 막을 때(가입/변경 API)
//   maskProfanity      — 채팅 메시지·모집글 설명처럼 원문을 보존해야 하는 자유 문장은 저장은 그대로 하고
//                         읽어올 때만 걸린 부분만 가릴 때(카카오톡식 메시지 삭제 마스킹과 동일한 패턴)
import { check } from "korcen";

// korcen이 가장 긴 축에 속하는 패턴(특수문자 조합 우회 포함)까지 잡을 수 있도록 넉넉히 잡은 스캔 폭.
const MAX_MATCH_LEN = 12;

export function containsProfanity(text: string): boolean {
  if (!text) return false;
  return check(text);
}

function isProfaneChunk(chunk: string): boolean {
  if (!chunk.trim()) return false;
  try {
    return check(chunk);
  } catch {
    return false;
  }
}

/**
 * 문장 전체가 아니라 비속어로 걸리는 부분만 가린다 — "안녕하세시발"처럼 붙어 있어도
 * "안녕하세"는 그대로 보이고 "시발"만 *로 바뀐다.
 *
 * korcen은 "이 문자열에 비속어가 있는지"만 알려주고 위치는 안 알려주므로, 모든 부분
 * 문자열을 검사해 true가 나오는 가장 짧은(=가장 정확한) 구간들만 골라 마스킹한다.
 * 비용이 있는 스캔이라, 전체 텍스트에 비속어가 아예 없는 흔한 경우는 맨 앞의 단일
 * containsProfanity 호출에서 바로 빠져나간다.
 */
export function maskProfanity(text: string): string {
  if (!text || !containsProfanity(text)) return text;

  const chars = Array.from(text);
  const n = chars.length;

  const trueSpans: [number, number][] = [];
  for (let start = 0; start < n; start += 1) {
    if (/\s/.test(chars[start])) continue;
    const maxEnd = Math.min(n, start + MAX_MATCH_LEN);
    for (let end = start + 1; end <= maxEnd; end += 1) {
      if (isProfaneChunk(chars.slice(start, end).join(""))) {
        trueSpans.push([start, end]);
      }
    }
  }

  // 더 짧은 true 구간을 완전히 포함하는 긴 구간은 버리고, 최소 단위 구간만 남긴다.
  trueSpans.sort((a, b) => a[1] - a[0] - (b[1] - b[0]));
  const minimalSpans: [number, number][] = [];
  for (const span of trueSpans) {
    const containsSmaller = minimalSpans.some(([s, e]) => s >= span[0] && e <= span[1]);
    if (!containsSmaller) minimalSpans.push(span);
  }

  const masked = chars.slice();
  for (const [s, e] of minimalSpans) {
    for (let k = s; k < e; k += 1) masked[k] = "*";
  }
  return masked.join("");
}
