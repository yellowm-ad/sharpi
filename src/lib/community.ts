import { and, asc, desc, eq, gt, gte, isNotNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { chatRooms, messages, users } from "@/db/schema";
import { maskProfanity } from "@/lib/profanity";

/**
 * 커뮤니티 — 먹메이트 "음식 커뮤니티"와 같은 고정 오픈채팅방.
 *  - 2.5초 폴링, messages.id 커서(after) 이후만 증분 조회 (WebSocket/SSE 상시연결 안 씀)
 *  - 삭제는 소프트: 원문은 보존하고 읽기 경로에서 항상 "삭제된 메시지예요"로 가린다
 *  - 비속어는 저장은 그대로, 읽을 때 걸린 부분만 * 로 가린다
 *  - 게스트도 읽을 수 있고, 보내기·삭제·신고는 로그인 필요 (셰르피는 게스트 우선)
 */
export const DELETED_MESSAGE_PLACEHOLDER = "삭제된 메시지예요";
export const CONTENT_MAX = 500;

export type ChatMessage = {
  id: number;
  roomId: number;
  senderId: number | null;
  senderNickname: string;
  type: "TEXT" | "SYSTEM";
  content: string;
  createdAt: string;
  isMine: boolean;
  deleted: boolean;
};

export async function listRooms() {
  const rooms = await db.select().from(chatRooms).orderBy(asc(chatRooms.sortOrder));
  // 방마다 마지막 메시지 1건 + 최근 24시간 메시지 수
  const lasts = await db.execute(sql`
    select distinct on (room_id) room_id, content, created_at, deleted_at
    from sherpy.messages order by room_id, id desc`);
  const counts = await db
    .select({ roomId: messages.roomId, n: sql<number>`count(*)::int` })
    .from(messages)
    .where(gte(messages.createdAt, new Date(Date.now() - 86_400_000)))
    .groupBy(messages.roomId);

  type Last = { room_id: number; content: string; created_at: string; deleted_at: string | null };
  const lastRows = (lasts as unknown as { rows: Last[] }).rows ?? (lasts as unknown as Last[]);
  return rooms.map((r) => {
    const last = lastRows.find((l) => Number(l.room_id) === r.id);
    return {
      id: r.id,
      title: r.title,
      description: r.description ?? "",
      emoji: r.emoji ?? "💬",
      lastMessage: last ? (last.deleted_at ? DELETED_MESSAGE_PLACEHOLDER : maskProfanity(last.content)) : "",
      lastMessageAt: last ? new Date(last.created_at).toISOString() : "",
      todayCount: counts.find((c) => c.roomId === r.id)?.n ?? 0,
    };
  });
}

export async function getRoom(id: number) {
  const [r] = await db.select().from(chatRooms).where(eq(chatRooms.id, id)).limit(1);
  return r ?? null;
}

/** after 커서 이후 메시지. 첫 진입(after=0)은 최근 100개 */
export async function getMessages(roomId: number, after: number, viewerId: number | null): Promise<ChatMessage[]> {
  const base = db
    .select({ m: messages, nickname: users.nickname })
    .from(messages)
    .leftJoin(users, eq(users.id, messages.senderId));

  const rows = after > 0
    ? await base.where(and(eq(messages.roomId, roomId), gt(messages.id, after))).orderBy(asc(messages.id)).limit(200)
    : (await base.where(eq(messages.roomId, roomId)).orderBy(desc(messages.id)).limit(100)).reverse();

  return rows.map(({ m, nickname }) => ({
    id: m.id,
    roomId: m.roomId,
    senderId: m.senderId,
    senderNickname: nickname ?? "셰르피",
    type: m.type as ChatMessage["type"],
    content: m.deletedAt ? DELETED_MESSAGE_PLACEHOLDER : maskProfanity(m.content),
    createdAt: m.createdAt.toISOString(),
    isMine: viewerId != null && m.senderId === viewerId,
    deleted: !!m.deletedAt,
  }));
}

/** 이미 화면에 떠 있던 메시지가 방금 삭제됐는지 — 폴링마다 같이 확인 */
export async function getRecentlyDeletedIds(roomId: number, since: Date) {
  const rows = await db
    .select({ id: messages.id })
    .from(messages)
    .where(and(eq(messages.roomId, roomId), isNotNull(messages.deletedAt), gte(messages.deletedAt, since)));
  return rows.map((r) => r.id);
}
