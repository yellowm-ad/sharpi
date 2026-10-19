import BottomTabs from "@/components/ui/BottomTabs";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <main className="flex-1 pb-20">{children}</main>
      <BottomTabs />
    </div>
  );
}
