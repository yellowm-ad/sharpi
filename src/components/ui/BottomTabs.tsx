"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/home",      label: "홈" },
  { href: "/map",       label: "지도" },
  { href: "/robot",     label: "셰르피", primary: true },
  { href: "/community", label: "커뮤니티" },
  { href: "/my",        label: "마이" },
];

export default function BottomTabs() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-[480px] border-t border-line bg-surface pb-safe">
      <ul className="flex">
        {TABS.map((t) => {
          const active = pathname.startsWith(t.href);
          return (
            <li key={t.href} className="flex-1">
              <Link
                href={t.href}
                className={[
                  "touch flex flex-col items-center justify-center gap-1 py-2 text-xs",
                  t.primary ? "font-semibold" : "",
                  active ? "text-sherpy-600" : "text-muted",
                ].join(" ")}
              >
                <span
                  className={[
                    "flex h-7 w-7 items-center justify-center rounded-full",
                    t.primary && active ? "bg-sherpy-600 text-white" : "",
                    t.primary && !active ? "bg-sherpy-100 text-sherpy-600" : "",
                  ].join(" ")}
                >
                  {t.label.charAt(0)}
                </span>
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
