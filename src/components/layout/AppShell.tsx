import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { IconRail } from "./IconRail";

export function AppShell() {
  return (
    <div className="flex h-dvh bg-canvas text-fg">
      <Sidebar className="hidden xl:flex" />
      <IconRail className="flex xl:hidden" />

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}