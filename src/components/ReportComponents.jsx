import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { 
  ShieldAlert, CheckCircle2, AlertTriangle, Info, Search 
} from 'lucide-react';

export function ScoreRing({ score }) {
  const CIRCUMFERENCE = 314.15;
  const offset = CIRCUMFERENCE * (1 - score / 100);
  const ringColor = score >= 80 ? '#059669' : score >= 60 ? '#D97706' : '#DC2626';

  return (
    <div className="relative flex items-center justify-center w-[140px] h-[140px]">
      <svg className="w-full h-full transform -rotate-90">
        <circle cx="70" cy="70" r="50" stroke="#E2E8F0" strokeWidth="12" fill="transparent" />
        <circle 
          cx="70" cy="70" r="50" stroke={ringColor} strokeWidth="12" fill="transparent" 
          strokeDasharray={CIRCUMFERENCE} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-[2000ms] ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-[32px] font-mono font-bold text-[#1E3A5F]">{score}</span>
        <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Accuracy</span>
      </div>
    </div>
  );
}

export function StatusBadge({ status }) {
  const s = status?.toUpperCase();
  const isPass = s === 'PASS' || s === 'AUTO_PASS' || s === 'APPROVED';
  const isWarning = s === 'WARNING' || s === 'HUMAN_REVIEW' || s === 'PENDING';
  const isFail = s === 'FAIL' || s === 'AUTO_FAIL' || s === 'REJECTED';

  return (
    <span className={clsx(
      "px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase rounded-full border shadow-sm inline-block min-w-[100px] text-center",
      isPass ? "bg-[#059669]/5 text-[#059669] border-[#059669]/20" : 
      isWarning ? "bg-[#D97706]/5 text-[#D97706] border-[#D97706]/20" : 
      isFail ? "bg-[#DC2626]/5 text-[#DC2626] border-[#DC2626]/20" :
      "bg-gray-100 text-gray-500 border-gray-200"
    )}>
      {status?.replace('_', ' ')}
    </span>
  );
}

export function RagItem({ score, text, onClick }) {
  return (
    <div onClick={onClick} className={clsx("bg-white border border-[#E2E8F0] rounded-[12px] p-4 text-sm flex flex-col gap-3 shadow-sm hover:border-[#2563EB] transition-colors group", onClick && "cursor-pointer")}>
      <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-widest">
        <span className="text-[#64748B]">Similarity Match</span>
        <span className="text-[#059669] font-mono px-2 py-0.5 bg-green-50 rounded text-[11px] border border-green-100">{score}</span>
      </div>
      <p className="text-[#64748B] italic leading-relaxed text-[12px] border-l-[3px] border-[#BFDBFE] pl-3 group-hover:border-[#2563EB] transition-colors bg-[#EFF6FF]/20 py-1 pr-1">
        "{text}"
      </p>
    </div>
  );
}

export function StatCard({ title, value, valueColor, sub, subIcon }) {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-[16px] shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow group shrink-0">
      <div className="flex justify-between items-start mb-3">
        <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-widest">{title}</p>
      </div>
      <div className="flex items-end justify-between">
        <p className={twMerge("text-[32px] font-mono font-bold leading-none", valueColor)}>
          {value}
        </p>
        <span className={clsx("text-[10px] font-bold flex items-center gap-1", subIcon ? "text-[#059669]" : "text-[#94A3B8]")}>
          {subIcon && subIcon} {sub}
        </span>
      </div>
    </div>
  );
}

export function StatusRow({ label, value, green, mono }) {
  return (
    <div className="flex justify-between items-center text-[13px]">
      <span className="text-[#64748B] font-semibold">{label}</span>
      <span className={clsx("text-right max-w-[140px] truncate", 
        green ? "text-[#059669] font-bold" : "text-[#1E3A5F] font-semibold", 
        mono && "font-mono text-[12px]" 
      )}>
        {value}
      </span>
    </div>
  );
}
