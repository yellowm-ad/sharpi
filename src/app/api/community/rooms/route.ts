import { NextResponse } from "next/server";
import { hasDb, noDb } from "@/db";
import { listRooms } from "@/lib/community";

export const dynamic = "force-dynamic";

/** GET /api/community/rooms — 고정 오픈채팅방 목록 (게스트도 조회 가능) */
export async function GET() {
  if (!hasDb) return noDb();
  return NextResponse.json({ rooms: await listRooms() });
}
