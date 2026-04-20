import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { 
  UploadCloud, ChevronRight, Check, 
  Search, FileText, Zap, RefreshCw,
  Plus, AlertTriangle, ArrowRight
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { uploadDocument } from '../services/api';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { StatCard } from '../components/ReportComponents';

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
    <div className="flex items-center gap-4 bg-white/80 backdrop-blur-sm p-1.5 rounded-full border border-gray-200 shadow-sm mb-10 overflow-x-auto scrollbar-hide w-fit mx-auto">
      {steps.map((s) => (
        <div key={s.n} className={clsx(
          "flex items-center gap-2 px-4 py-2 rounded-full text-[12px] font-bold whitespace-nowrap transition-all",
          currentStep === s.n 
            ? "bg-[#1E3A5F] text-white shadow-md shadow-blue-900/20" 
            : "text-gray-400"
        )}>
          <span className="opacity-60">{s.n} —</span> {s.label}
        </div>
      ))}
    </div>
  );
};

export default function UploadScreen() {
  const navigate = useNavigate();
  const { setUploadId } = useAppContext();
  const { stats } = useDashboardStats(10000);
  const fileInputRef = useRef(null);
  
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [duplicateNotice, setDuplicateNotice] = useState(null); 
  const [formData, setFormData] = useState({
    claimId: "CLM-2026-001",
    policyNumber: "POL-HEALTH-4421",
    insuranceType: "Health Insurance",
    claimType: "Reimbursement"
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleRouting = (res) => {
    if (res.is_duplicate) {
      setDuplicateNotice(res);
      setTimeout(() => {
        if (res.actual_status === 'processing') navigate('/processing');
        else if (res.decision === 'AUTO_PASS') navigate('/result/approved');
        else if (res.decision === 'AUTO_FAIL') navigate('/result/rejected');
        else navigate(`/report?id=${res.upload_id}`);
      }, 3000);
    } else {
      navigate('/processing');
    }
  };

  const handleLoadDemo = async (scenario = 'A') => {
    setLoading(true);
    try {
      const config = {
        'A': { file: 'perfect_bill.png', id: 'ABC-7788-99', pol: 'POL-100', type: 'Health', name: 'Perfect' },
        'B': { file: 'partial_failure.png', id: 'DB-9900-11', pol: 'POL-200', type: 'Health', name: 'Partial' },
        'C': { file: 'fail_poor_quality.png', id: 'BAD-6655-44', pol: 'POL-300', type: 'Health', name: 'Fail' }
      }[scenario];

      const response = await fetch('/mock_medical_bill_alex_rivera.png');
      if (!response.ok) throw new Error("Demo file not found");
      const blob = await response.blob();
      const demoFile = new File([blob], config.file, { type: "image/png" });
      
      setFile(demoFile);
      setFormData({
        claimId: config.id,
        policyNumber: config.pol,
        insuranceType: config.type + " Insurance",
        claimType: "Reimbursement"
      });

      const data = new FormData();
      data.append('file', demoFile);
      data.append('claim_id', config.id);
      data.append('policy_number', config.pol);
      data.append('insurance_type', config.type.toLowerCase());
      data.append('claim_type', "reimbursement");
      
      const res = await uploadDocument(data);
      setUploadId(res.upload_id);
      handleRouting(res);
    } catch (error) {
      console.error("Demo scenario failed:", error);
      alert("Failed to load demo scenario. Please try uploading a file manually.");
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    try {
      const data = new FormData();
      data.append('file', file);
      data.append('claim_id', formData.claimId);
      data.append('policy_number', formData.policyNumber);
      data.append('insurance_type', formData.insuranceType.toLowerCase());
      data.append('claim_type', formData.claimType.toLowerCase());
      
      const response = await uploadDocument(data);
      setUploadId(response.upload_id);
      handleRouting(response);
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Analysis initialization failed. Please check your connection.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[1260px] mx-auto py-6 animate-in fade-in duration-700">
      
      {/* 1. Stepper & Header */}
      <div className="flex flex-col items-center mb-10">
        <Stepper currentStep={1} />
        
        <div className="w-full text-left">
          <div className="flex items-center gap-2 text-[12px] font-semibold text-blue-600 mb-2">
            <span>Kodivian Technologies</span>
            <ChevronRight size={14} className="opacity-40" />
            <span className="opacity-80">Insurance AI Platform</span>
            <ChevronRight size={14} className="opacity-40" />
            <span className="opacity-100 font-bold">Document Validation</span>
          </div>
          
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-[34px] font-bold text-[#1E3A5F] mb-1">Upload claim documents</h1>
              <p className="text-[14px] text-gray-500 font-medium">Automated extraction and 8-point quality gate analysis</p>
            </div>
            <div className="flex flex-col items-end gap-2 mb-1">
               <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full text-[11px] font-bold text-[#059669] shadow-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#059669] animate-pulse"></div> All systems operational
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. STATS ROW */}
      <div className="grid grid-cols-4 gap-6 mb-10">
        <StatCard title="DOCUMENTS TODAY" value={stats.documents_today} valueColor="text-[#2563EB]" sub="↑ 12% vs yesterday" subIcon={<Check size={12}/>} />
        <StatCard title="AUTO APPROVED" value={stats.auto_approved} valueColor="text-[#059669]" sub="75.4% pass rate" />
        <StatCard title="HUMAN REVIEW" value={stats.human_review} valueColor="text-[#D97706]" sub="16.5% flagged" />
        <StatCard title="AVG. CHECK TIME" value={stats.avg_check_time} valueColor="text-[#1E3A5F]" sub="Target: under 10s" />
      </div>

      {/* 3. CORE GRID */}
      <div className="grid grid-cols-12 gap-8 items-start">
        
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-8">
           
           {/* Upload Box */}
           <div className="bg-white border border-gray-100 rounded-[28px] shadow-sm p-8 group hover:border-blue-100 transition-all">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={clsx(
                  "border-2 border-dashed rounded-[20px] p-16 flex flex-col items-center justify-center transition-all cursor-pointer text-center relative",
                  file ? "border-green-200 bg-green-50/30" : "border-gray-200 bg-gray-50/30 hover:bg-blue-50/30 hover:border-blue-200"
                )}
              >
                <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.jpg,.png,.tiff" onChange={e => e.target.files && setFile(e.target.files[0])} />
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm mb-6">
                  {file ? <Check className="text-green-600" size={32} /> : <UploadCloud size={32} />}
                </div>
                <h3 className="text-[#1E3A5F] font-bold text-[18px] mb-2">
                  {file ? file.name : "Drag and drop documents here"}
                </h3>
                <p className="text-gray-500 text-[14px] mb-8 max-w-xs">
                  Upload medical bills, prescriptions, or discharge summaries for instant AI validation.
                </p>
                
                {!file && (
                  <button className="px-8 py-3 bg-[#1E3A5F] text-white font-bold rounded-xl shadow-lg shadow-blue-900/10 mb-8 transform hover:scale-[1.02] transition-transform">
                    Browse Files
                  </button>
                )}

                <div className="flex gap-2 text-[10px] uppercase font-bold tracking-widest text-gray-400">
                  <span className="px-2.5 py-1 bg-white border border-gray-200 rounded">PDF</span>
                  <span className="px-2.5 py-1 bg-white border border-gray-200 rounded">JPG/PNG</span>
                  <span className="px-2.5 py-1 bg-white border border-gray-200 rounded">MAX 10MB</span>
                </div>
              </div>
           </div>

           {/* Detail Form */}
           <div className="bg-white border border-gray-100 rounded-[28px] shadow-sm p-8">
              <h3 className="text-[17px] font-bold text-[#1E3A5F] flex items-center gap-2 mb-6">
                <div className="w-2 h-2 rounded-full bg-blue-600" /> Administrative details
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                 <div className="grid grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                       <label className="text-[12px] font-bold text-gray-400 uppercase tracking-widest pl-1">Claim Identifier</label>
                       <input type="text" name="claimId" value={formData.claimId} onChange={handleChange} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-[14px] font-bold text-[#1E3A5F] focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                    </div>
                    <div className="flex flex-col gap-2">
                       <label className="text-[12px] font-bold text-gray-400 uppercase tracking-widest pl-1">Policy Number</label>
                       <input type="text" name="policyNumber" value={formData.policyNumber} onChange={handleChange} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-[14px] font-bold text-[#1E3A5F] focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                       <label className="text-[12px] font-bold text-gray-400 uppercase tracking-widest pl-1">Insurance Product</label>
                       <select name="insuranceType" value={formData.insuranceType} onChange={handleChange} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-[14px] font-bold text-[#1E3A5F] focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none">
                         <option>Health Insurance</option>
                         <option>Motor Insurance</option>
                       </select>
                    </div>
                    <div className="flex flex-col gap-2">
                       <label className="text-[12px] font-bold text-gray-400 uppercase tracking-widest pl-1">Service Category</label>
                       <select name="claimType" value={formData.claimType} onChange={handleChange} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-[14px] font-bold text-[#1E3A5F] focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none">
                         <option>Reimbursement</option>
                         <option>Cashless</option>
                       </select>
                    </div>
                 </div>

                 <div className="pt-4 border-t border-gray-50 flex flex-col gap-4">
                    <p className="text-[12px] font-bold text-gray-400 uppercase tracking-widest pl-1">Or Select Demo Scenario</p>
                    <div className="grid grid-cols-3 gap-4">
                       <button type="button" onClick={() => handleLoadDemo('A')} className="py-4 bg-green-50 hover:bg-green-100 text-[#059669] font-bold rounded-2xl border border-green-200/50 transition-all text-[13px]">
                          Scenario A <span className="font-normal opacity-70">(Perfect)</span>
                       </button>
                       <button type="button" onClick={() => handleLoadDemo('B')} className="py-4 bg-amber-50 hover:bg-amber-100 text-[#D97706] font-bold rounded-2xl border border-amber-200/50 transition-all text-[13px]">
                          Scenario B <span className="font-normal opacity-70">(Partial)</span>
                       </button>
                       <button type="button" onClick={() => handleLoadDemo('C')} className="py-4 bg-rose-50 hover:bg-rose-100 text-[#DC2626] font-bold rounded-2xl border border-rose-200/50 transition-all text-[13px]">
                          Scenario C <span className="font-normal opacity-70">(Fail)</span>
                       </button>
                    </div>
                 </div>

                 <button 
                   type="submit" 
                   disabled={loading || !file} 
                   className="w-full py-5 bg-[#1E3A5F] hover:bg-[#0F172A] text-white font-bold rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-blue-900/20 disabled:opacity-50 transition-all transform hover:scale-[0.99]"
                 >
                   {loading ? "Initializing Analysis..." : "Run Quality Gate Check →"}
                 </button>
              </form>
           </div>
        </div>

        <div className="col-span-12 lg:col-span-4 flex flex-col gap-8">
           
           {/* RAG Knowledge Base */}
           <div className="bg-white border border-gray-100 rounded-[28px] shadow-sm p-6">
              <h3 className="text-[14px] font-bold text-[#1E3A5F] flex items-center gap-2 mb-6">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" /> RAG Knowledge Base
              </h3>
              <div className="flex items-center gap-2 text-[12px] font-bold text-blue-600 mb-6 bg-blue-50 px-3 py-1.5 rounded-lg w-fit">
                 <Search size={14} /> 4 Collections — ChromaDB Indexed
              </div>
              
              <div className="space-y-4">
                 <KnowledgeItem title="Health Insurance Checklist v2.1" count="28 rules" color="bg-blue-600" />
                 <KnowledgeItem title="Approved Provider Directory v3.2" count="50+ hospitals" color="bg-blue-600" />
                 <KnowledgeItem title="Coverage Rules v4.1" count="12 rules" color="bg-blue-600" />
                 <KnowledgeItem title="IRDAI Guidelines 2024" count="8 standards" color="bg-blue-600" />
                 <button className="w-full py-3 bg-gray-50 hover:bg-gray-100 text-gray-500 font-bold rounded-xl border border-gray-200 text-[12px] flex items-center justify-center gap-2 transition-colors">
                    <Plus size={14} /> Add Knowledge Source
                 </button>
              </div>
           </div>

           {/* Quick Tips */}
           <div className="bg-[#1E3A5F] rounded-[28px] p-8 text-white">
              <Zap className="w-10 h-10 text-amber-400 mb-6" />
              <h3 className="text-[18px] font-bold mb-3">AI-First Validation</h3>
              <p className="text-[14px] text-blue-200 leading-relaxed mb-6">
                Using Gemini 2.0 Flash to perform zero-truth validation against medical taxonomy and policy guidelines.
              </p>
              <div className="text-[11px] font-mono font-bold bg-white/10 p-4 rounded-xl border border-white/10 uppercase tracking-widest text-center">
                Sub-5s Latency Guaranteed
              </div>
           </div>
        </div>
      </div>

      {/* 4. Duplicate Notification Overlay */}
      {duplicateNotice && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-[#1E3A5F]/40 backdrop-blur-md" />
           <div className="relative bg-white rounded-[32px] shadow-2xl p-10 max-w-md w-full text-center border border-white/20 animate-in zoom-in-95 duration-300">
              <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-amber-100">
                 <AlertTriangle size={40} className="text-amber-500" />
              </div>
              <h2 className="text-[24px] font-bold text-[#1E3A5F] mb-3">Duplicate Detected</h2>
              <p className="text-gray-500 text-[15px] mb-8 leading-relaxed">
                This document has already been analyzed. Redirecting you to the existing results for <span className="font-bold text-blue-600 font-mono">{duplicateNotice.upload_id.slice(0,8)}</span>.
              </p>
              <div className="flex items-center justify-center gap-2 text-blue-600 font-bold text-[13px] animate-pulse">
                <span>Redirecting now</span>
                <ArrowRight size={16} />
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

const KnowledgeItem = ({ title, count, color }) => (
  <div className="flex flex-col gap-1 p-4 border border-gray-100 rounded-2xl hover:border-blue-200 transition-colors bg-white">
     <h4 className="text-[13px] font-bold text-[#1E3A5F]">{title}</h4>
     <p className="text-[11px] text-gray-400 font-medium">{count} · policy_rules</p>
  </div>
);
