import type { Config } from "drizzle-kit";
import { config } from "dotenv";

config({ path: ".env.local" });

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
  // 같은 DB의 먹메이트(public 스키마) 테이블은 절대 건드리지 않는다
  schemaFilter: ["sherpy"],
} satisfies Config;
