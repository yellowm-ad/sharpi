/** 신고 사유 — 먹메이트 목록에서 산책 맥락에 맞게 조정 (노쇼 → 동물 학대). 클라이언트·서버 공용 */
export const REPORT_REASONS = [
  "HARASSMENT", "SEXUAL_CONTENT", "SPAM", "FRAUD", "PRIVACY", "UNSAFE_MEETING", "ANIMAL_ABUSE", "OTHER",
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export const REPORT_LABEL: Record<ReportReason, string> = {
  HARASSMENT: "욕설·비방·괴롭힘",
  SEXUAL_CONTENT: "성적·불쾌한 내용",
  SPAM: "도배·광고·스팸",
  FRAUD: "사기·거래 관련 문제",
  PRIVACY: "개인정보 요구·노출",
  UNSAFE_MEETING: "위험한 만남 또는 장소 요구",
  ANIMAL_ABUSE: "동물 학대·방치 관련",
  OTHER: "기타",
};
