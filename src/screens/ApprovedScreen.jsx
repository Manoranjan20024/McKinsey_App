import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle, Award, FilePlus, Calendar, Clock, Hash, 
  User, Building2, FileText, ShieldCheck, CheckCircle2, 
  Check, ChevronRight, RefreshCw, Zap, Search
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAppContext } from '../context/AppContext';
import { getQualityReport } from '../services/api';
import { StatCard, StatusRow } from '../components/ReportComponents';

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
    <div className="flex items-center gap-4 bg-white/50 backdrop-blur-sm p-1.5 rounded-full border border-gray-200/50 mb-10 overflow-x-auto scrollbar-hide w-fit mx-auto">
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

const ApprovedScreen = () => {
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


  const handleNewUpload = () => {
    resetState();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-[600px] flex flex-col items-center justify-center gap-4">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-gray-500 font-bold animate-pulse">Confirming audit certification...</p>
      </div>
    );
  }

  const data       = reportData || {};
  const score      = data.overall_score ?? 100;
  const audit      = data.audit ?? {};
  const fd         = data.final_decision ?? {};
  const qc         = data.quality_checks ?? {};
  
  const claimId    = audit.claim_id    ?? data.claim_id    ?? '—';
  const certId     = audit.certificate_id ?? '—';
  const patient    = audit.patient_name   ?? '—';
  const hospital   = audit.hospital_name  ?? '—';
  const policyNum  = audit.policy_number  ?? '—';
  const completedAt = audit.completed_at  ? new Date(audit.completed_at).toLocaleString()  : '—';
  const procTime   = data.processing_time_seconds ?? fd.processing_time ?? '—';
  const passCnt    = qc.passed            ?? 0;
  const totalCnt   = qc.total_checks      ?? 0;

  return (
    <div className="max-w-[1260px] mx-auto py-6 animate-in fade-in duration-700">
      
      {/* 1. Header & Stepper */}
      <div className="flex flex-col items-center mb-10">
        <Stepper currentStep={6} />
        
        <div className="w-full text-left">
          <div className="flex items-center gap-2 text-[12px] font-semibold text-blue-600 mb-2">
            <span>Kodivian Technologies</span>
            <ChevronRight size={14} className="opacity-40" />
            <span className="opacity-80">Document Quality Check</span>
            <ChevronRight size={14} className="opacity-40" />
            <span className="opacity-100 font-bold">Audit Success</span>
          </div>
          
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-[34px] font-bold text-[#1E3A5F] mb-1">Claim Approved & Locked</h1>
              <p className="text-[14px] text-gray-500 font-medium font-bold italic">All quality gates passed. This claim has been cryptographically signed and cleared for disbursement.</p>
            </div>
            <div className="flex flex-col items-end gap-2 mb-1">
               <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full text-[11px] font-bold text-green-600 shadow-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse"></div> Final Verification Complete
               </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8 mb-10">
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
           {/* Certification Panel */}
           <div className="bg-white border-2 border-green-100 rounded-[28px] shadow-xl p-10 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-[#059669]" />
              <div className="flex justify-between items-start mb-8">
                 <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-widest">Audit Certificate — {certId}</span>
                    <h2 className="text-[24px] font-bold text-[#1E3A5F]">Validation Artifact: {certId}</h2>
                 </div>
                 <div className="px-6 py-3 bg-green-50 text-[#059669] rounded-2xl font-bold text-[13px] border border-green-200 flex items-center gap-2 shadow-sm">
                    <ShieldCheck size={20} /> COMPLIANCE VERIFIED
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-y-7 gap-x-12 border-t border-[#F1F3F8] pt-10">
                 <SummaryItem label="Claimant Name" value={patient} />
                 <SummaryItem label="Policy Account" value={policyNum} mono />
                 <SummaryItem label="Service Provider" value={hospital} />
                 <SummaryItem label="Disbursement" value={data.claim_amount ? `₹ ${Number(String(data.claim_amount).replace(/[^\d.]/g, '')).toLocaleString('en-IN')}` : '—'} green />
                 <SummaryItem label="Commit Timestamp" value={completedAt} mono />
                 <SummaryItem label="Maturity Status" value="Immediate Approval" />
              </div>
           </div>

           {/* Metrics stats */}
           <div className="grid grid-cols-3 gap-6">
              <StatCard title="ACCURACY SCORE" value={`${score}%`} valueColor="text-[#059669]" sub="Zero-Truth Validation" subIcon={<Check size={12}/>} />
              <StatCard title="QUALITY AUDIT" value={`${passCnt}/${totalCnt}`} valueColor="text-[#1E3A5F]" sub="100% Passed Gates" />
              <StatCard title="INFERENCE TIME" value={`${procTime}s`} valueColor="text-[#2563EB]" sub="AI Processing Delay" />
           </div>
        </div>

        {/* Action column */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
           <div className="bg-[#1E3A5F] rounded-[28px] p-10 text-white flex flex-col items-center text-center shadow-2xl shadow-blue-900/20 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl animate-pulse" />
              <Award className="w-20 h-20 text-yellow-400 mb-6 drop-shadow-lg animate-bounce-slow" />
              <h3 className="text-[24px] font-bold mb-3">Audit Complete</h3>
              <p className="text-[15px] text-blue-200 mb-10 leading-relaxed font-medium">This document has been archived in the secure storage layer with high-fidelity extraction metadata.</p>
              
              <div className="w-full space-y-4">
                 <button onClick={handleNewUpload} className="w-full py-5 bg-white text-[#1E3A5F] font-bold rounded-2xl hover:bg-blue-50 transition-all flex items-center justify-center gap-3 shadow-lg transform hover:scale-[1.02]">
                    <FilePlus size={20} /> Process Next Claim
                 </button>
                 <button onClick={() => navigate('/queue')} className="w-full py-5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl border border-white/20 transition-all text-[15px] flex items-center justify-center gap-2">
                    <Search size={18} /> View Claims Queue
                 </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

const SummaryItem = ({ label, value, green, mono }) => (
  <div className="flex justify-between items-center text-[14px]">
    <span className="text-[#64748B] font-bold uppercase tracking-tighter text-[11px]">{label}</span>
    <span className={clsx(
      "font-bold",
      green ? "text-green-600" : "text-[#1E3A5F]",
      mono && "font-mono text-[13px]"
    )}>{value}</span>
  </div>
);

export default ApprovedScreen;
