/**
 * 시드 데이터 — 명목상 기능(마켓·혼잡도)과 개발용 계정/로봇을 넣는다.
 * 실행: npm run seed
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { db } from "../src/db";
import { users, robots, marketItems, crowdMock } from "../src/db/schema";

async function main() {
  console.log("시드 시작…");

  const [user] = await db.insert(users).values({
    username: "dev",
    passwordHash: await bcrypt.hash("dev1234", 10),
    nickname: "개발자",
  }).returning();

  const apiKey = process.env.MOCK_ROBOT_API_KEY ?? "dev-robot-key-change-me";
  await db.insert(robots).values({
    ownerId: user.id,
    serial: "SHERPY-DEV-0001",
    name: "셰르피",
    apiKeyHash: await bcrypt.hash(apiKey, 10),
    pairingCode: "000000",
    fwVersion: "0.1.0",
  });
  console.log(`  로봇 1대 등록 (API 키: ${apiKey})`);

  // ⚠️ 명목상 기능 — 시드 데이터만, 실거래 없음
  await db.insert(marketItems).values([
    { title: "소형견 하네스 S",       price: 18000, condition: "중고" },
    { title: "휴대용 급수통 500ml",   price: 9000,  condition: "새상품" },
    { title: "야간 LED 목줄",         price: 12000, condition: "중고" },
    { title: "배변봉투 디스펜서",      price: 5000,  condition: "새상품" },
    { title: "강아지 레인코트 M",      price: 22000, condition: "중고" },
  ]);

  await db.insert(crowdMock).values([
    { areaCode: "jj-deokjin-park", name: "덕진공원",      level: 2 },
    { areaCode: "jj-jbnu-front",   name: "전북대 정문",    level: 3 },
    { areaCode: "jj-geonji-mt",    name: "건지산 둘레길",  level: 1 },
    { areaCode: "jj-jeonjucheon",  name: "전주천 산책로",  level: 2 },
  ]);

  console.log("시드 완료. 로그인: dev / dev1234");
}

main().catch((e) => { console.error(e); process.exit(1); });
