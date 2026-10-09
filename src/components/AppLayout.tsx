import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";

export function AppLayout() {
  return (
    <div>
      <Navbar />
      <Outlet />
    </div>
  );
}