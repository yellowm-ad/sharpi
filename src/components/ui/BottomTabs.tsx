"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Map, Bot, MessagesSquare, User } from "lucide-react";

const TABS = [
  { href: "/home",      label: "홈",     icon: Home },
  { href: "/map",       label: "지도",   icon: Map, also: ["/routes"] },
  { href: "/robot",     label: "셰르피", icon: Bot, primary: true },
  { href: "/community", label: "커뮤니티", icon: MessagesSquare, also: ["/market"] },
  { href: "/my",        label: "마이",   icon: User, also: ["/walks"] },
];

export default function BottomTabs() {
  const pathname = usePathname();

  // 화면 전체를 덮는 페이지(카메라·채팅방)에서는 탭을 그리지 않는다 — 전환 중에 탭이 위로 비치지 않게
  if (pathname === "/robot/camera" || /^\/community\/\d+/.test(pathname)) return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-[480px] border-t border-line bg-surface/95 pb-safe backdrop-blur">
      <ul className="flex">
        {TABS.map((t) => {
          const active = [t.href, ...(t.also ?? [])].some((p) => pathname.startsWith(p));
          const Icon = t.icon;
          return (
            <li key={t.href} className="flex-1">
              <Link
                href={t.href}
                className={[
                  "press touch flex flex-col items-center justify-center gap-0.5 pt-1.5 text-[11px]",
                  t.primary ? "font-semibold" : "",
                  active ? "text-sherpy-600" : "text-muted",
                ].join(" ")}
              >
                {t.primary ? (
                  <span
                    className={[
                      "-mt-5 flex h-12 w-12 items-center justify-center rounded-full border-4 border-surface shadow-md transition",
                      active ? "bg-sherpy-600 text-white" : "bg-sherpy-100 text-sherpy-600",
                    ].join(" ")}
                  >
                    <Icon size={22} strokeWidth={2.2} />
                  </span>
                ) : (
                  // 활성화되는 순간 아이콘이 톡 튄다 (key 가 바뀌면 애니메이션이 다시 재생됨)
                  <span key={String(active)} className={active ? "animate-tab" : ""}>
                    <Icon size={22} strokeWidth={active ? 2.4 : 1.8} />
                  </span>
                )}
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
