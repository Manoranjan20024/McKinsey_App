import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCheck, ShieldAlert, Check, X, RefreshCcw, AlertTriangle, Info, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { submitHumanReview } from '../services/api';
import { StatusBadge } from '../components/ReportComponents';
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

const HumanReviewScreen = () => {
  const navigate = useNavigate();
  const { uploadId, reportData } = useAppContext();
  const [formData, setFormData] = useState({
    decision: 'Approve',
    reasonCode: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  if (!reportData) {
    return <div className="p-8 text-center">No report data found.</div>;
  }

  // Filter only warnings and fails
  const reviewItems = reportData.checks?.filter(c => c.status !== 'PASS') || [];

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Map frontend case to backend expected Uppercase strings and snake_case fields
      const backendDecision = 
        formData.decision === 'Approve' ? 'APPROVE' : 
        formData.decision === 'Reject' ? 'REJECT' : 'REQUEST_RESUBMISSION';

      const payload = {
        reviewer_id: 'USR-889',
        reviewer_name: 'Alex Johnson',
        decision: backendDecision,
        reason_code: formData.reasonCode,
        notes: formData.notes
      };
      
      await submitHumanReview(uploadId, payload);

      if (formData.decision === 'Approve') {
        navigate('/approved');
      } else {
        navigate('/rejected');
      }
    } catch (error) {
      console.error(error);
      alert('Submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[1260px] mx-auto py-6 animate-in fade-in duration-700">
      
      {/* 1. Header & Stepper */}
      <div className="flex flex-col items-center mb-8">
        <Stepper currentStep={3} />
        
        <div className="w-full text-left">
          <div className="flex items-center gap-2 text-[12px] font-semibold text-blue-600 mb-2">
            <span>Kodivian Technologies</span>
            <ChevronRight size={14} className="opacity-40" />
            <span className="opacity-80">Document Quality Check</span>
            <ChevronRight size={14} className="opacity-40" />
            <span className="opacity-100 font-bold">Expert Adjudication</span>
          </div>
          
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-[34px] font-bold text-[#1E3A5F] mb-1">Human Review Terminal</h1>
              <p className="text-[14px] text-gray-500 font-medium">Verify AI extraction results and resolve flagged quality issues for {uploadId?.slice(0,8)}</p>
            </div>
            <div className="flex flex-col items-end gap-2 mb-1">
               <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full text-[11px] font-bold text-amber-600 shadow-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></div> Specialist Attention Required
               </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-10 gap-8">
        
        {/* LEFT: Issues List */}
        <div className="col-span-12 lg:col-span-6 flex flex-col gap-6">
          <div className="bg-white border border-[#E2E8F0] rounded-[16px] shadow-sm overflow-hidden">
             <div className="px-6 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
                <h3 className="text-[15px] font-bold text-[#1E3A5F] flex items-center gap-2">
                  <AlertCircle size={18} className="text-[#2563EB]" /> Flagged Quality Exceptions ({reviewItems.length})
                </h3>
             </div>
             
             <div className="divide-y divide-[#F1F3F8]">
               {reviewItems.map((item, idx) => (
                 <div key={idx} className="p-6 flex items-start gap-4 hover:bg-[#F8FAFC]/40 transition-colors">
                    <div className={clsx(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border",
                      item.status === 'FAIL' ? "bg-rose-50 border-rose-200" : "bg-amber-50 border-amber-200"
                    )}>
                       <ShieldAlert size={20} className={item.status === 'FAIL' ? 'text-rose-600' : 'text-amber-600'} />
                    </div>
                    <div className="flex flex-col gap-1 pr-4 grow">
                       <div className="flex justify-between items-center mb-1">
                          <span className="text-[15px] font-bold text-[#1E3A5F]">{item.check_name}</span>
                          <StatusBadge status={item.status} />
                       </div>
                       <p className="text-[13px] text-[#475569] leading-relaxed">{item.message}</p>
                       
                       {item.guidance && (
                         <div className="mt-3 p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-start gap-3">
                            <Info size={14} className="text-[#2563EB] mt-0.5" />
                            <p className="text-[#64748B] text-[12px] italic"><span className="font-bold text-[#1E3A5F] not-italic mr-1">RAG Guidance:</span> {item.guidance}</p>
                         </div>
                       )}
                       <div className="mt-2 text-[10px] font-mono font-bold text-[#2563EB] bg-[#EFF6FF] px-2 py-1 rounded-md w-fit border border-[#BFDBFE]">RULE_REF: {item.rag_rule || "Internal Audit Guideline v2.1"}</div>
                    </div>
                 </div>
               ))}
             </div>
          </div>
        </div>

        {/* RIGHT: Decision Form */}
        <div className="col-span-12 lg:col-span-4">
          <div className="bg-white rounded-[20px] shadow-xl shadow-blue-900/5 border border-[#E2E8F0] p-8 sticky top-24">
            <h3 className="text-[20px] font-bold text-[#1E3A5F] mb-6 flex items-center gap-2">
              <CheckCircle2 className="text-[#059669]" size={22} /> Auditor Final Disposition
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div>
                <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-widest mb-3 pl-1">Final Outcome</label>
                <div className="space-y-3">
                  <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.decision === 'Approve' ? 'bg-green-50 border-[#059669] shadow-sm shadow-green-100 scale-[1.02]' : 'bg-white border-[#E2E8F0] hover:bg-[#F8FAFC]'}`}>
                    <input type="radio" name="decision" value="Approve" checked={formData.decision === 'Approve'} onChange={handleChange} className="hidden" />
                    <div className={clsx("w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all", formData.decision === 'Approve' ? "border-[#059669] bg-[#059669]" : "border-[#CBD5E1]")}>
                       {formData.decision === 'Approve' && <div className="w-2 h-2 rounded-full bg-white shadow-sm" />}
                    </div>
                    <Check className={clsx("w-5 h-5", formData.decision === 'Approve' ? "text-[#059669]" : "text-[#94A3B8]")} />
                    <span className={clsx("font-bold text-[14px]", formData.decision === 'Approve' ? "text-[#065F46]" : "text-[#64748B]")}>Approve Claim</span>
                  </label>
                  
                  <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.decision === 'Reject' ? 'bg-rose-50 border-[#DC2626] shadow-sm shadow-rose-100 scale-[1.02]' : 'bg-white border-[#E2E8F0] hover:bg-[#F8FAFC]'}`}>
                    <input type="radio" name="decision" value="Reject" checked={formData.decision === 'Reject'} onChange={handleChange} className="hidden" />
                    <div className={clsx("w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all", formData.decision === 'Reject' ? "border-[#DC2626] bg-[#DC2626]" : "border-[#CBD5E1]")}>
                       {formData.decision === 'Reject' && <div className="w-2 h-2 rounded-full bg-white shadow-sm" />}
                    </div>
                    <X className={clsx("w-5 h-5", formData.decision === 'Reject' ? "text-[#DC2626]" : "text-[#94A3B8]")} />
                    <span className={clsx("font-bold text-[14px]", formData.decision === 'Reject' ? "text-[#991B1B]" : "text-[#64748B]")}>Reject Claim</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-widest mb-2 pl-1">Reason Code</label>
                <select required name="reasonCode" value={formData.reasonCode} onChange={handleChange} className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-3 text-[14px] text-[#1E3A5F] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] appearance-none cursor-pointer">
                  <option value="">Select auditor code...</option>
                  <option value="RC-01">Override AI Logic — Compliance Verified</option>
                  <option value="RC-02">Rejected — Insufficient Evidence</option>
                  <option value="RC-03">Rejected — Illegible Source Data</option>
                  <option value="RC-04">Policy Exception Granted</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-widest mb-2 pl-1">Auditor Commentary</label>
                <textarea required name="notes" rows="4" value={formData.notes} onChange={handleChange} className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 text-[14px] text-[#1E3A5F] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]" placeholder="Provide detailed justification per IRDAI guidelines..."></textarea>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className={clsx(
                   "w-full py-4 px-6 rounded-xl shadow-lg text-[15px] font-bold text-white transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50",
                   formData.decision === 'Approve' ? "bg-[#059669] shadow-green-200" : "bg-[#1E3A5F] shadow-blue-200"
                )}
              >
                {loading ? 'Processing Decision...' : 'Commit decision to Ledger'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HumanReviewScreen;
