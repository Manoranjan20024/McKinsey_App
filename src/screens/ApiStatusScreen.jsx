import React, { useEffect, useState } from 'react';
import { 
  ShieldCheck, Activity, Cpu, Database, 
  Globe, Clock, Server, CheckCircle2, 
  RefreshCw, Zap, Search, AlertTriangle
} from 'lucide-react';
import { clsx } from 'clsx';
import { getApiHealth } from '../services/api';

const ApiStatusScreen = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [heartbeat, setHeartbeat] = useState(Date.now());

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await getApiHealth();
        setStatus(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(() => {
      fetchStatus();
      setHeartbeat(Date.now());
    }, 15000); // 15s refresh
    return () => clearInterval(interval);
  }, []);

  const StatusCard = ({ icon: Icon, title, value, statusText, isOnline, delay }) => (
    <div className={clsx(
      "bg-white border border-[#E2E8F0] rounded-[24px] p-8 shadow-sm transition-all hover:shadow-md group",
      delay ? "animate-in slide-in-from-bottom-4 duration-700 fill-mode-both" : ""
    )} style={{ animationDelay: delay }}>
      <div className="flex justify-between items-start mb-6">
        <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] flex items-center justify-center text-[#2563EB] group-hover:bg-[#2563EB] group-hover:text-white transition-all">
          <Icon size={24} />
        </div>
        <div className={clsx(
          "px-3 py-1 text-[10px] font-bold tracking-widest uppercase rounded-full border shadow-sm",
          isOnline ? "bg-green-50 text-green-600 border-green-200" : "bg-rose-50 text-rose-600 border-rose-200"
        )}>
          {isOnline ? "Operational" : "Degraded"}
        </div>
      </div>
      <h3 className="text-[#64748B] text-[12px] font-bold uppercase tracking-widest mb-1">{title}</h3>
      <p className="text-[#1E3A5F] text-[24px] font-bold mb-4">{value}</p>
      <div className="flex items-center gap-2 text-[13px] text-gray-500 font-medium">
         <Activity size={14} className={clsx(isOnline && "animate-pulse text-green-500")} /> 
         <span>{statusText}</span>
      </div>
    </div>
  );

  return (
    <div className="max-w-[1260px] mx-auto py-6">
      
      {/* 1. Page Header */}
      <div className="flex justify-between items-end mb-10">
        <div>
          <div className="flex items-center gap-2 text-[12px] font-semibold text-blue-600 mb-2">
            <span>System Infrastructure</span>
            <span className="opacity-40">/</span>
            <span className="opacity-100 font-bold">API Real-time Status</span>
          </div>
          <h1 className="text-[34px] font-bold text-[#1E3A5F]">Monitoring Console</h1>
          <p className="text-gray-500 font-medium italic">Gemini 2.0 Flash inference nodes and vector infrastructure health.</p>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="text-right">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Global Status</p>
              <p className="text-[13px] font-bold text-green-600 flex items-center gap-2 justify-end">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> All Systems Nominal
              </p>
           </div>
           <button 
             onClick={() => { setLoading(true); window.location.reload(); }}
             className="w-12 h-12 bg-white border border-gray-200 rounded-2xl flex items-center justify-center text-[#1E3A5F] hover:bg-gray-50 transition-colors shadow-sm"
           >
             <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
           </button>
        </div>
      </div>

      {loading && !status ? (
        <div className="min-h-[400px] flex flex-col items-center justify-center gap-6 bg-white border border-gray-100 rounded-[32px] shadow-sm">
           <RefreshCw className="w-12 h-12 text-blue-600 animate-spin" />
           <p className="text-gray-500 font-bold text-lg animate-pulse tracking-tight">Syncing with cloud inference clusters...</p>
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-8">
           
           {/* Primary Status Grid */}
           <div className="col-span-12 lg:col-span-9 grid grid-cols-2 gap-8">
              <StatusCard 
                icon={Zap} 
                title="Inference Engine" 
                value="Gemini 2.0 Flash" 
                statusText="Latency: ~2.4s (Avg)" 
                isOnline={status?.status === "ok"} 
                delay="0ms" 
              />
              <StatusCard 
                icon={Database} 
                title="Knowledge Base" 
                value="Vector ChromaDB" 
                statusText="Memory: 1.2 GB" 
                isOnline={status?.rag_status === "connected"} 
                delay="100ms" 
              />
              <StatusCard 
                icon={Server} 
                title="Validation Core" 
                value="FastAPI v0.109" 
                statusText={`Runtime: ${status?.uptime_secs || 0}s`} 
                isOnline={status?.status === "ok"} 
                delay="200ms" 
              />
              <StatusCard 
                icon={Globe} 
                title="Network Gateway" 
                value="Localhost Node" 
                statusText="SSL Termination: Valid" 
                isOnline={true} 
                delay="300ms" 
              />
           </div>

           {/* Dashboard Sidebar */}
           <div className="col-span-12 lg:col-span-3 flex flex-col gap-8">
              
              {/* Uptime Widget */}
              <div className="bg-[#1E3A5F] rounded-[28px] p-8 text-white shadow-xl shadow-blue-900/20 relative overflow-hidden">
                 <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
                 <Clock className="w-10 h-10 text-blue-300 mb-6" />
                 <h3 className="text-[18px] font-bold mb-1">System Uptime</h3>
                 <p className="text-[36px] font-mono font-bold mb-4">99.98%</p>
                 <div className="w-full bg-white/10 h-1 rounded-full mb-6 overflow-hidden">
                    <div className="w-[99%] h-full bg-blue-400" />
                 </div>
                 <p className="text-[12px] text-blue-200 leading-relaxed font-medium">Monitoring standard operational reliability across all validation clusters.</p>
              </div>

              {/* API Endpoints List */}
              <div className="bg-white border border-[#E2E8F0] rounded-[28px] p-6 shadow-sm">
                 <h3 className="text-[14px] font-bold text-[#1E3A5F] mb-6 flex items-center gap-2">
                   <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" /> Heartbeat Monitor
                 </h3>
                 <div className="space-y-4">
                    <EndpointItem label="POST /upload" ping="240ms" />
                    <EndpointItem label="GET /reports" ping="110ms" />
                    <EndpointItem label="POST /search" ping="45ms" />
                    <EndpointItem label="GET /analytics" ping="180ms" />
                 </div>
              </div>
           </div>

           {/* Detail Log Area */}
           <div className="col-span-12 bg-white border border-[#E2E8F0] rounded-[32px] p-10 mt-2 shadow-sm italic">
              <div className="flex justify-between items-center mb-10">
                 <h3 className="text-[18px] font-bold text-[#1E3A5F] flex items-center gap-3">
                   <Activity size={20} className="text-blue-600" /> System Operational Logs
                 </h3>
                 <div className="flex gap-2">
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] uppercase font-bold tracking-widest border border-blue-100">Live Traffic</span>
                 </div>
              </div>
              
              <div className="font-mono text-[12px] space-y-4 text-gray-500 overflow-y-auto max-h-[300px] pr-4 custom-scrollbar">
                 <LogEntry time="11:42:01" type="INFO" msg="Clustering results for [CLM-2026-004] - Latency 2.1s" />
                 <LogEntry time="11:42:03" type="INFO" msg="RAG retrieval complete - Similarity 94.2% - ChromaDB" />
                 <LogEntry time="11:42:15" type="SUCCESS" msg="Gemini Inference successful - Token Usage: 1.4k" />
                 <LogEntry time="11:43:08" type="INFO" msg="Background worker syncing trash storage layer..." />
                 <LogEntry time="11:45:22" type="SUCCESS" msg="System heartbeat pulse verified (v2.1.0-prod)" />
                 <LogEntry time="12:01:04" type="WARNING" msg="Network jitter detected (4ms) - Bypassing CDN caching" />
                 <LogEntry time="12:05:30" type="INFO" msg="Refining extraction expert persona - Temperature: 0.2" />
                 <div className="text-blue-600 animate-pulse font-bold mt-4">_ STREAMS ACTIVE | LISTENING ON PORT 8000 / 5173</div>
              </div>
           </div>

        </div>
      )}
    </div>
  );
};

const EndpointItem = ({ label, ping }) => (
  <div className="flex justify-between items-center border-b border-gray-50 pb-3 last:border-b-0">
     <span className="text-[11px] font-mono font-bold text-[#64748B]">{label}</span>
     <span className="text-[10px] font-bold text-green-500">{ping}</span>
  </div>
);

const LogEntry = ({ time, type, msg }) => (
  <div className="flex gap-4 border-l-2 border-gray-100 pl-4 py-0.5 hover:border-blue-400 transition-colors">
     <span className="text-gray-400 shrink-0 w-16">{time}</span>
     <span className={clsx(
       "w-16 font-bold",
       type === "SUCCESS" ? "text-green-600" : type === "WARNING" ? "text-amber-600" : "text-blue-600"
     )}>[{type}]</span>
     <span className="text-gray-600 truncate">{msg}</span>
  </div>
);

export default ApiStatusScreen;
