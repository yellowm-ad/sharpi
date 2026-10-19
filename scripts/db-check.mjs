// DB 점검 — sherpy / public 스키마의 테이블 목록 (값은 출력하지 않음)
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
config({ path: ".env.local" });
const sql = neon(process.env.DATABASE_URL);
const rows = await sql`select table_schema, table_name from information_schema.tables
  where table_schema in ('sherpy','public') order by 1,2`;
const by = {};
for (const r of rows) (by[r.table_schema] ??= []).push(r.table_name);
console.log("sherpy:", (by.sherpy ?? []).join(", "));
console.log("public:", (by.public ?? []).length, "tables");
