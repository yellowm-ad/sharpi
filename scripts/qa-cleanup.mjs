// QA 정리 — scripts/qa_api.py 가 남긴 QA 계정의 메시지·신고·코스만 지운다 (다른 사용자 데이터는 건드리지 않음)
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
config({ path: ".env.local" });
const sql = neon(process.env.DATABASE_URL);
const names = [process.env.QA_USER, process.env.QA_USER2].filter(Boolean);
const ids = (await sql`select id from sherpy.users where username = any(${names})`).map((r) => r.id);
if (ids.length) {
  const r1 = await sql`delete from sherpy.reports where reporter_id = any(${ids}) or reported_user_id = any(${ids}) returning id`;
  const r2 = await sql`delete from sherpy.messages where sender_id = any(${ids}) returning id`;
  const rs = await sql`select id from sherpy.routes where user_id = any(${ids})`;
  const rids = rs.map((r) => r.id);
  if (rids.length) {
    await sql`delete from sherpy.route_points where route_id = any(${rids})`;
    await sql`delete from sherpy.route_pois where route_id = any(${rids})`;
    await sql`delete from sherpy.routes where id = any(${rids})`;
  }
  console.log(`QA 정리: 신고 ${r1.length} · 메시지 ${r2.length} · 코스 ${rids.length}`);
}
