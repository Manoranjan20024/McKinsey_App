import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FileCheck, Search, User, CheckCircle2, BarChart3, FileText, Trash2, AlertCircle, ShieldCheck } from "lucide-react";

// Define nav structure
const NAV_SECTIONS = [
  {
    label: "VALIDATION",
    items: [
      { label: "Quality Check", path: "/",      icon: <FileCheck size={16}/> },
      { label: "Batch Upload",  path: "/batch", icon: <Search size={16}/> },
    ]
  },
  {
    label: "REVIEW",
    items: [
      { label: "Human Queue",  path: "/queue",    icon: <User size={16}/>, badge: true },
      { label: "Approved",     path: "/approved", icon: <CheckCircle2 size={16}/> },
      { label: "Rejected",     path: "/rejected", icon: <AlertCircle size={16}/> },
      { label: "Trash",        path: "/trash",    icon: <Trash2 size={16}/> },
    ]
  },
  {
    label: "INSIGHTS",
    items: [
      { label: "Analytics",     path: "/analytics",      icon: <BarChart3 size={16}/> },
      { label: "RAG Knowledge", path: "/knowledge-base", icon: <FileText size={16}/> },
    ]
  },
  {
    label: "SYSTEM",
    items: [
      { label: "API Status",    path: "/status",         icon: <ShieldCheck size={16}/> },
    ]
  }
];

export default function Sidebar({ queueCount }) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const filterItems = (items) =>
    query.trim() === ''
      ? items
      : items.filter(item =>
          item.label.toLowerCase().includes(query.toLowerCase())
        );

  return (
    <aside className="w-[220px] bg-white border-r border-[#E2E8F0] h-full py-5 flex flex-col gap-4 shadow-sm overflow-y-auto shrink-0 fixed left-0 top-[60px]">
      <div className="px-4 mb-2">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-[#94A3B8]" />
          <input
            className="nav-search w-full bg-[#F1F3F8] text-sm border-transparent rounded-md pl-9 pr-3 py-2 text-[#1E3A5F] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
            placeholder="Search routing..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && query.trim()) {
                navigate(`/search?q=${encodeURIComponent(query.trim())}`);
              }
            }}
          />
        </div>
      </div>

      {NAV_SECTIONS.map(section => {
        const visible = filterItems(section.items);
        if (visible.length === 0) return null;
        return (
          <div key={section.label} className="nav-section mb-2">
            <h4 className="px-5 mb-2 text-[10px] font-bold tracking-widest text-[#94A3B8] uppercase">{section.label}</h4>
            <div className="space-y-0.5 px-3">
              {visible.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 group cursor-pointer ${
                      isActive 
                        ? "bg-[#EFF6FF] text-[#2563EB] font-bold" 
                        : "text-[#64748B] hover:bg-[#F1F3F8] hover:text-[#1E3A5F] font-semibold"
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <span className="transition-colors group-hover:text-[#2563EB]">{item.icon}</span>
                    <span className="text-[13px]">{item.label}</span>
                  </div>
                  {item.badge && queueCount > 0 && (
                    <span className="bg-[#F59E0B] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{queueCount}</span>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        );
      })}
    </aside>
  );
}
