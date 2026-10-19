import type { Metadata } from "next";
import { adminConfigured, isAdmin } from "@/lib/admin-auth";
import AdminLogin from "@/components/admin/AdminLogin";
import AdminConsole from "@/components/admin/AdminConsole";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "셰르피 어드민", robots: { index: false } };

/** /admin — 운영·시연 관리. 권한은 서버에서 쿠키로 확인한다 (클라이언트 가드만 믿지 않는다) */
export default async function AdminPage() {
  if (!adminConfigured()) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-2 px-6 text-center">
        <p className="font-bold">어드민이 잠겨 있어요</p>
        <p className="text-sm text-muted">환경변수 ADMIN_PASSWORD 를 설정하면 열립니다.</p>
      </main>
    );
  }
  return (await isAdmin()) ? <AdminConsole /> : <AdminLogin />;
}
