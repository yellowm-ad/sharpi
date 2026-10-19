"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sheet from "@/components/ui/Sheet";
import { useUser } from "@/lib/session";

/**
 * 로그인이 필요한 동작을 감싼다.
 *   const { guard, gate } = useLoginGate();
 *   <button onClick={() => guard("코스를 저장하려면", save)} />
 *   {gate}
 * 게스트면 바텀시트로 로그인을 권하고, 로그인 후 지금 화면으로 돌아온다.
 */
export function useLoginGate() {
  const user = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [reason, setReason] = useState<string | null>(null);

  const guard = (why: string, action: () => void) => {
    if (user) action();
    else setReason(why);
  };

  const gate = (
    <Sheet
      open={reason != null}
      title="로그인이 필요해요"
      confirmLabel="로그인"
      cancelLabel="계속 둘러보기"
      onClose={() => setReason(null)}
      onConfirm={() => router.push(`/login?next=${encodeURIComponent(pathname)}`)}
    >
      {reason} 로그인해 주세요.
      <br />
      <span className="text-xs text-muted">로그인하지 않아도 모든 화면은 계속 둘러볼 수 있어요.</span>
    </Sheet>
  );

  return { user, guard, gate };
}
