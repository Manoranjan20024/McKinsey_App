import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, AlertCircle, CheckCircle2, FileText, 
  ChevronRight, RefreshCw, AlertTriangle, 
  FileWarning, ShieldAlert, BadgeCheck, Zap, Info
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { getQualityReport } from '../services/api';
import { clsx } from 'clsx';

const Stepper = ({ currentStep }) => {
  const steps = [
    { n: 1, label: 'Upload' },
    { n: 2, label: 'Quality Report' },
    { n: 3, label: 'Human Review' },
    { n: 4, label: 'Processing' },
    { n: 5, label: 'Rejected' },
    { n: 6, label: 'Auto Approved' },
  ];
  return (
    <div className="flex items-center gap-4 bg-white/50 backdrop-blur-sm p-1.5 rounded-full border border-gray-200/50 mb-10 overflow-x-auto scrollbar-hide">
      {steps.map((s) => (
        <div key={s.n} className={clsx(
          "flex items-center gap-2 px-4 py-1.5 rounded-full text-[12px] font-bold whitespace-nowrap transition-all",
          currentStep === s.n 
            ? "bg-[#1E3A5F] text-white shadow-lg shadow-blue-900/20" 
            : "text-gray-400"
        )}>
          <span className="opacity-60">{s.n} —</span> {s.label}
        </div>
      ))}
    </div>
  );
};

const RejectedScreen = () => {
  const navigate = useNavigate();
  const { uploadId, reportData, setReportData, resetState } = useAppContext();
  const [loading, setLoading] = useState(!reportData || reportData.upload_id !== uploadId);

  useEffect(() => {
    if (uploadId && (!reportData || reportData.upload_id !== uploadId)) {
      setLoading(true);
      getQualityReport(uploadId).then(data => {
        setReportData(data);
        setLoading(false);
      }).catch(err => {
        console.error(err);
        setLoading(false);
      });
    } else if (reportData) {
      setLoading(false);
    }
  }, [uploadId, reportData, setReportData]);

  const handleResubmit = () => {
    resetState();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-[600px] flex flex-col items-center justify-center gap-4">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-gray-500 font-bold animate-pulse">Syncing rejection artifacts...</p>
      </div>
    );
  }

  const data = reportData || {};
  const audit = data.audit ?? {};
  const fd = data.final_decision ?? {};
  const score = data.overall_score ?? 0;
  const checks = data.checks ?? [];
  const qc = data.quality_checks ?? {};
  
  const claimId = audit.claim_id ?? "—";
  const policy = audit.policy_number ?? "—";
  
  const failedChecks = checks.filter(c => c.status === 'FAIL');
  const passCount = checks.filter(c => c.status === 'PASS').length;
  const failCount = failedChecks.length;

  return (
    <div className="max-w-[1260px] mx-auto py-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* 1. Header & Stepper */}
      <div className="flex flex-col items-center mb-8">
        <Stepper currentStep={5} />
        
        <div className="w-full text-left">
          <div className="flex items-center gap-2 text-[12px] font-semibold text-blue-600 mb-2">
            <span>Kodivian Technologies</span>
            <ChevronRight size={14} className="opacity-40" />
            <span className="opacity-60">Document Quality Check</span>
            <ChevronRight size={14} className="opacity-40" />
            <span className="opacity-80 font-bold">{claimId}</span>
          </div>
          
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-[34px] font-bold text-[#1E3A5F] mb-1">Document Rejected — Resubmission Required</h1>
              <div className="flex items-center gap-2 text-[14px] text-gray-500 font-medium">
                <span>{claimId}</span>
                <span className="opacity-30">·</span>
                <span>{policy}</span>
                <span className="opacity-30">·</span>
                <span>Health Insurance</span>
                <span className="opacity-30">·</span>
                <span className="text-rose-600 font-bold">{failCount} issues found</span>
                <span className="opacity-30">·</span>
                <span className="font-bold">Score {score}%</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 mb-1">
               <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 border border-rose-200 rounded-full text-[11px] font-bold text-rose-600 shadow-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse"></div> Auto rejected · {data.model_used || "Scan Engine"}
               </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8 items-start">
        
        {/* 2. Main Center Content */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          
          {/* HERO: Document Not Accepted */}
          <div className="bg-white border border-gray-100 rounded-[28px] shadow-sm py-12 flex flex-col items-center text-center relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-rose-500" />
             <div className="w-20 h-20 rounded-full bg-rose-50 flex items-center justify-center mb-6 border border-rose-100">
                <X size={44} className="text-rose-600" strokeWidth={1.5} />
             </div>
             <h2 className="text-[28px] font-bold text-rose-600 mb-2">Document Not Accepted</h2>
             <p className="max-w-md text-gray-500 text-[14px] leading-relaxed mb-8 font-medium">
                Your claim document failed {failCount} of 8 quality checks and cannot be processed in its current state.
                Please review the items below and resubmit corrected documents.
             </p>
             <div className="flex gap-3">
                <div className="px-5 py-2 bg-rose-50 text-rose-600 border border-rose-100 rounded-full text-[13px] font-bold flex items-center gap-2">
                   <ShieldAlert size={16} /> Accuracy: {score}%
                </div>
                <span className="px-5 py-2 bg-green-50 text-green-700 border border-green-100 rounded-full text-[13px] font-bold">{passCount} passed</span>
                <span className="px-5 py-2 bg-rose-50 text-rose-600 border border-rose-100 rounded-full text-[13px] font-bold">{failCount} failed</span>
                <span className="px-5 py-2 bg-gray-50 text-gray-500 border border-gray-200 rounded-full text-[13px] font-bold">Limit: 80%</span>
             </div>
          </div>

          {/* ISSUES LIST */}
          <div className="flex flex-col gap-4">
             <h3 className="text-[15px] font-bold text-[#1E3A5F] flex items-center gap-2 pl-2">
               <div className="w-2 h-2 rounded-full bg-[#1E3A5F]" /> Critical issues found in analysis
             </h3>
             
             {failedChecks.map((check, i) => (
                <div key={i} className="bg-white border border-rose-100 rounded-[24px] p-8 shadow-sm relative overflow-hidden group hover:border-rose-300 transition-colors">
                   <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500" />
                   <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-4">
                         <div className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center text-[13px] font-bold shrink-0 shadow-lg shadow-rose-900/10">
                           {i + 1}
                         </div>
                         <h4 className="text-[17px] font-bold text-[#1E3A5F]">{check.check_name}</h4>
                      </div>
                      <span className="bg-rose-50 text-rose-700 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md border border-rose-200">CRITICAL ERROR</span>
                   </div>
                   
                   <div className="ml-12 space-y-4">
                      <p className="text-[14px] text-gray-600 leading-relaxed italic border-l-2 border-gray-100 pl-4 py-1">
                        {check.message}
                      </p>
                      
                      {check.guidance && (
                        <div className="flex gap-3 p-4 bg-rose-50/50 rounded-xl border border-rose-100 shadow-inner">
                           <AlertTriangle size={18} className="text-rose-600 shrink-0" />
                           <p className="text-[13px] text-rose-900 leading-relaxed font-bold italic">
                             Action: {check.guidance}
                           </p>
                        </div>
                      )}
                      
                      <div className="text-[10px] font-mono text-blue-600 bg-blue-50 px-2.5 py-1 rounded w-fit uppercase font-bold tracking-tight border border-blue-100 italic transition-all group-hover:bg-blue-100">
                        RAG Evidence: {check.rag_rule || "Rule 1.2: Standard Compliance Parameter"}
                      </div>
                   </div>
                </div>
             ))}

             <button 
               onClick={handleResubmit}
               className="mt-4 w-full py-5 bg-[#1E3A5F] hover:bg-[#0F172A] text-white font-bold rounded-2xl flex items-center justify-center gap-3 transition-all transform hover:scale-[0.99] shadow-xl shadow-blue-900/20"
             >
               <RefreshCw size={20} className="animate-spin-slow" />
               Upload Corrected Document
             </button>
          </div>
        </div>

        {/* 3. Right Sidebar Rail */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
           
           {/* CLAIM SUMMARY CARD */}
           <div className="bg-white border border-gray-100 rounded-[28px] shadow-sm p-6 flex flex-col h-fit">
              <h3 className="text-[14px] font-bold text-[#1E3A5F] flex items-center gap-2 mb-6 cursor-default">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" /> Analysis Metadata
              </h3>
              
              <div className="bg-gray-50/50 border border-gray-200/50 rounded-2xl p-6 flex flex-col items-center text-center mb-6">
                 <div className="w-14 h-16 bg-white rounded-lg border border-gray-200 flex flex-col items-center justify-center relative shadow-sm mb-3">
                    <FileText size={24} className="text-gray-300" />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center border border-white">
                       <Zap size={12} fill="currentColor" />
                    </div>
                 </div>
                 <span className="text-[11px] font-mono font-bold text-gray-400 truncate w-full px-2">{data.filename || "document_scan.jpg"}</span>
              </div>

              <div className="space-y-4 mb-2">
                 <SummaryRow label="Claim ID" value={claimId} />
                 <SummaryRow label="Policy Account" value={policy} mono />
                 <SummaryRow label="Submitted" value={new Date(audit.submitted_at || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} />
                 <SummaryRow label="Inference Model" value={data.model_used || "gemini-2.0-flash"} mono />
                 <SummaryRow label="Process Time" value={`${data.processing_time_seconds || "—"}s`} />
                 <div className="pt-4 border-t border-gray-50 flex flex-col gap-4">
                    <SummaryRow label="Audit Passes" value={`${passCount}/8`} green />
                    <SummaryRow label="Audit Fails" value={`${failCount}/8`} red />
                    <SummaryRow label="Quality Accuracy" value={`${score}%`} red />
                    <SummaryRow label="Final Threshold" value="80.0%" />
                    <SummaryRow label="Decision" value="REJECTED" red />
                 </div>
              </div>
           </div>

           {/* MINI LIST: All 8 checks */}
           <div className="bg-white border border-gray-100 rounded-[28px] shadow-sm p-6 h-fit italic">
              <h3 className="text-[14px] font-bold text-[#1E3A5F] flex items-center gap-2 mb-4">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" /> Full Audit Trace
              </h3>
              <div className="space-y-3">
                 {checks.map((c, i) => (
                    <div key={i} className="flex items-center justify-between group">
                       <div className="flex items-center gap-2">
                          {c.status === 'PASS' 
                            ? <BadgeCheck size={14} className="text-green-500" /> 
                            : <AlertCircle size={14} className="text-rose-500" />
                          }
                          <span className="text-[12px] text-gray-400 group-hover:text-gray-900 transition-colors uppercase tracking-tight font-bold">{c.check_name}</span>
                       </div>
                       <span className={clsx("text-[11px] font-bold font-mono", c.status === 'PASS' ? "text-green-600" : "text-rose-600")}>
                         {Math.round(c.confidence * 100)}%
                       </span>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

const SummaryRow = ({ label, value, green, red, mono }) => (
  <div className="flex justify-between items-center text-[12px]">
    <span className="text-gray-400 font-bold uppercase tracking-tighter text-[10px]">{label}</span>
    <span className={clsx(
      "font-bold",
      green ? "text-green-600" : red ? "text-rose-600" : "text-[#1E3A5F]",
      mono && "font-mono"
    )}>{value}</span>
  </div>
);

export default RejectedScreen;
