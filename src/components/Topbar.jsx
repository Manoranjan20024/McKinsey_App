import { Link } from "react-router-dom";
import SessionTimer from "./SessionTimer";
import BackendStatusBadge from "./BackendStatusBadge";
import { clsx } from "clsx";
import logo from "../assets/logo.svg";
import { useState, useRef, useEffect } from "react";
import { LogOut } from "lucide-react";
import { useAppContext } from "../context/AppContext";

function TopTab({ label, active, to }) {
  return (
    <Link to={to} className={clsx(
      "h-full px-5 flex items-center justify-center text-[13px] font-semibold border-b-[3px] transition-all",
      active ? "border-white bg-[#1E293B] text-white" : "border-transparent text-[#94A3B8] hover:text-white hover:bg-[#1E293B]/40"
    )}>
      {label}
    </Link>
  );
}

export default function Topbar() {
  const { logout } = useAppContext();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="h-[60px] bg-[#142947] w-full flex items-center justify-between px-6 shadow-sm text-white shrink-0 z-50 fixed top-0">
      <div className="flex items-center h-full">
        <Link to="/" className="flex items-center gap-3 mr-8 hover:opacity-90 transition-opacity">
          <img src={logo} alt="Kodivian Logo" className="h-9 w-auto object-contain" />
          <div className="flex items-baseline gap-1.5 border-l border-[#1E3A5F] pl-4 ml-1">
            <span className="font-bold text-white text-[16px] tracking-tight">Kodivian Technologies</span>
            <span className="text-[#64748B] text-[15px]">/</span>
            <span className="text-[#94A3B8] text-[14px]">Insurance AI Platform</span>
          </div>
        </Link>
        <div className="hidden lg:flex items-center h-full gap-1">
          <TopTab label="Document Validation" active={true} to="/" />
          <TopTab label="Claims Queue" to="/queue" />
          <TopTab label="Analytics" to="/analytics" />
          <TopTab label="Settings" to="/" />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <BackendStatusBadge />
        <div className="pl-4 border-l border-[#1E3A5F] flex items-center gap-2">
          <SessionTimer />
        </div>
        
        <div className="relative ml-2" ref={profileRef}>
          <div 
            onClick={() => setProfileOpen(!profileOpen)}
            className={clsx(
              "w-8 h-8 rounded-full border flex items-center justify-center text-sm font-bold cursor-pointer transition-colors text-white",
              profileOpen ? "bg-[#2B5180] border-[#3B82F6]" : "bg-[#1E3A5F] border-[#2B5180] hover:bg-[#2B5180]"
            )}
          >
            SR
          </div>
          
          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-50 font-sans animate-in fade-in zoom-in-95 duration-100">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-800">System Administrator</p>
                <p className="text-xs text-slate-500 truncate mt-0.5">mckinsey@kodivian.com</p>
              </div>
              <div className="py-1">
                <button 
                  onClick={() => { setProfileOpen(false); logout(); }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
