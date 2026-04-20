import { Outlet } from "react-router-dom";
import Topbar from "./Topbar";
import Sidebar from "./Sidebar";
import { useQueueCount } from "../hooks/useQueueCount";

export default function AppLayout() {
  const { count } = useQueueCount();

  return (
    <div className="min-h-screen bg-[#F1F3F8] flex flex-col font-sans">
      <Topbar />
      <div className="flex flex-1 pt-[60px] overflow-hidden">
        <Sidebar queueCount={count} />
        <main className="ml-[220px] w-full p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
