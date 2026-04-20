import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  FileSearch, ArrowRight, User, Building2, Stethoscope, Hash, 
  Calendar, DollarSign, ShieldCheck, ChevronDown, ChevronUp, 
  Download, Info, AlertCircle, FileText, CheckCircle2, AlertTriangle, Check, ChevronRight, RefreshCw
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAppContext } from '../context/AppContext';
import CheckCard from '../components/CheckCard';
import { ScoreRing, RagItem, StatusRow, StatCard } from '../components/ReportComponents';
import { getQualityReport } from '../services/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// ── Extracted field row component ────────────────────────────────────────────
const DataRow = ({ label, value }) => {
  if (!value && value !== 0) return null;
  return (
    <div className="grid grid-cols-[130px_1fr] gap-4 py-3 border-b border-gray-50 last:border-0 items-start">
      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">{label}</span>
      <span className="text-[14px] font-semibold text-[#1E3A5F] leading-snug whitespace-pre-wrap">{value}</span>
    </div>
  );
};

// ── Extracted data panel ──────────────────────────────────────────────────────
const ExtractedDataPanel = ({ extracted, audit }) => {
  const [open, setOpen] = useState(true);
  if (!extracted && !audit) return null;

  const data = extracted || {};
  const aud = audit || {};

  const hosp   = data.hospital_details   || {};
  const doc    = data.doctor_details     || {};
  const med    = data.medical_details    || {};
  const claim  = data.claim_details      || {};
  const period = data.policy_period      || {};
  const docs   = data.documents_submitted || [];

  // Use audit data as fallback for core fields
  const claimId = data.claim_id || aud.claim_id;
  const certId = data.certificate_id || aud.certificate_id;
  const patientName = data.patient_name || aud.patient_name;
  const policyNum = data.policy_number || aud.policy_number;
  const hospitalName = hosp.name || aud.hospital_name;
  const diagnosis = med.diagnosis || aud.diagnosis;
  const icdCode = med.icd_code || aud.icd_code;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-blue-100 overflow-hidden mb-6">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-blue-50/40 transition-colors"
      >
        <div className="flex items-center gap-2">
          <FileSearch className="w-5 h-5 text-blue-600" />
          <span className="font-bold text-gray-900">AI-Extracted Document Data</span>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">RAG Match</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>

      {open && (
        <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 border-t border-blue-50">

          {/* Patient & Policy */}
          <div>
            <div className="flex items-center gap-2 mt-5 mb-3">
              <User className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Patient & Policy</span>
            </div>
            <DataRow label="Claim ID"        value={claimId} />
            <DataRow label="Certificate ID"  value={certId} />
            <DataRow label="Patient Name"    value={patientName} />
            <DataRow label="Date of Birth"   value={data.date_of_birth} />
            <DataRow label="Policy Number"   value={policyNum} />
            <DataRow label="Policy Holder"   value={data.policy_holder} />
            <DataRow label="Insurer"         value={data.insurance_provider} />
            <DataRow label="Policy Start"    value={period.start_date} />
            <DataRow label="Policy End"      value={period.end_date} />
            <DataRow label="Policy Status"   value={period.status} />
          </div>

          {/* Hospital & Doctor */}
          <div>
            <div className="flex items-center gap-2 mt-5 mb-3">
              <Building2 className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Hospital & Doctor</span>
            </div>
            <DataRow label="Hospital"        value={hospitalName} />
            <DataRow label="Address"         value={hosp.address || aud.hospital_address} />
            <DataRow label="Reg. No."        value={hosp.registration_number} />
            <DataRow label="Doctor"          value={doc.name} />
            <DataRow label="Qualification"   value={doc.qualification} />
            <DataRow label="Doctor Reg. No." value={doc.registration_number} />
          </div>

          {/* Claim & Medical */}
          <div>
            <div className="flex items-center gap-2 mt-5 mb-3">
              <Stethoscope className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Claim & Medical</span>
            </div>
            <DataRow label="Diagnosis"       value={diagnosis} />
            <DataRow label="Procedure"       value={med.procedure} />
            <DataRow label="ICD Code"        value={icdCode} />
            <DataRow label="Claim Amount"    value={claim.claim_amount ? `₹ ${Number(String(claim.claim_amount).replace(/[₹\s,]/g, '')).toLocaleString('en-IN')}` : (aud.claim_amount ? `₹ ${Number(String(aud.claim_amount).replace(/[₹\s,]/g, '')).toLocaleString('en-IN')}` : null)} />
            <DataRow label="Admission"       value={claim.admission_date} />
            <DataRow label="Discharge"       value={claim.discharge_date} />
            {docs.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-gray-500 mb-1">Docs Submitted</p>
                <ul className="space-y-1">
                  {docs.map((d, i) => d && (
                    <li key={i} className="text-xs bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 text-gray-700">
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

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

// ── Main QualityReportScreen ─────────────────────────────────────────────────
const QualityReportScreen = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlId = searchParams.get('id');
  
  const { uploadId, setUploadId, reportData, setReportData } = useAppContext();
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    const activeId = urlId || uploadId;
    if (activeId && (!reportData || reportData.upload_id !== activeId)) {
      setFetching(true);
      if (urlId) setUploadId(urlId); 
      getQualityReport(activeId).then(data => {
        setReportData(data);
        setFetching(false);
      }).catch(() => setFetching(false));
    }
  }, [urlId, uploadId, reportData, setReportData, setUploadId]);

  const handleDownloadPDF = () => {
    if (!reportData) return;
    
    try {
      // Extract variables locally to avoid TDZ and closure issues
      const { overall_score, checks, quality_checks, audit, extracted } = reportData;
      const qc = quality_checks || {};
      const passCnt = qc.passed ?? checks?.filter(c => c.status === 'PASS').length ?? 0;
      const warnCnt = qc.warnings ?? checks?.filter(c => c.status === 'WARNING').length ?? 0;
      const failCnt = qc.failed ?? checks?.filter(c => c.status === 'FAIL').length ?? 0;

      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text("Scanify AI Quality Assessment Report", 14, 20);
      
      doc.setFontSize(12);
      doc.text(`Claim ID: ${audit?.claim_id || extracted?.claim_id || '—'}`, 14, 30);
      doc.text(`Decision: ${reportData.decision?.replace('_', ' ') || 'ANALYSIS COMPLETE'}`, 14, 38);
      doc.text(`Accuracy Score: ${overall_score || 0}%`, 14, 46);
      doc.text(`Quality Checks: ${passCnt} Passed, ${failCnt} Failed, ${warnCnt} Warnings`, 14, 54);

      let currentY = 68;

      // Extract Document Data Panel
      if (extracted) {
        doc.text("AI-Extracted Core Data:", 14, currentY);
        const hosp = extracted.hospital_details || {};
        const med = extracted.medical_details || {};
        const claim = extracted.claim_details || {};

        const extractedData = [
          [{ content: 'PATIENT & POLICY', colSpan: 2, styles: { fillColor: [241, 245, 249], fontStyle: 'bold', textColor: [30, 58, 95] } }],
          ['Claim ID', extracted.claim_id || '—'],
          ['Patient Name', extracted.patient_name || '—'],
          ['Policy Number', extracted.policy_number || '—'],
          
          [{ content: 'HOSPITAL & DOCTOR', colSpan: 2, styles: { fillColor: [241, 245, 249], fontStyle: 'bold', textColor: [30, 58, 95] } }],
          ['Hospital Name', hosp.name || '—'],
          ['Address', hosp.address || '—'],
          ['Registration Number', hosp.registration_number || '—'],
          
          [{ content: 'CLAIM & MEDICAL', colSpan: 2, styles: { fillColor: [241, 245, 249], fontStyle: 'bold', textColor: [30, 58, 95] } }],
          ['Diagnosis', med.diagnosis || '—'],
          ['ICD Code', med.icd_code || '—'],
          ['Claim Amount', claim.claim_amount ? `INR ${Number(String(claim.claim_amount).replace(/[₹\s,]/g, '')).toLocaleString('en-IN')}` : '—'],
          ['Admission Date', claim.admission_date || '—'],
          ['Discharge Date', claim.discharge_date || '—']
        ];

        autoTable(doc, {
          startY: currentY + 6,
          head: [['Assessment Categories', 'Extracted Value']],
          body: extractedData,
          theme: 'grid',
          styles: { fontSize: 9, cellPadding: 3.5 },
          headStyles: { fillColor: [45, 132, 113] },
          columnStyles: { 0: { cellWidth: 60, fontStyle: 'bold' } }
        });

        currentY = doc.lastAutoTable.finalY + 16;
      }

      if (checks && checks.length > 0) {
        doc.addPage();
        let pageTwoY = 20;
        doc.text("Quality Audit Trail:", 14, pageTwoY);
        
        const tableData = checks.map(c => [
          c.check_name || 'System Assessment', 
          c.status || 'UNKNOWN', 
          c.confidence != null ? `${Math.round(c.confidence * 100)}%` : '—',
          c.message || 'No additional details provided.'
        ]);
        
        autoTable(doc, {
          startY: pageTwoY + 6,
          head: [['Check Name', 'Status', 'Confidence', 'Message']],
          body: tableData,
          theme: 'striped',
          styles: { fontSize: 9, cellPadding: 3 },
          headStyles: { fillColor: [30, 58, 95] },
          columnStyles: { 3: { cellWidth: 80 } }
        });
      }
      
      doc.save(`ScanifyAI_Report_${reportData.upload_id || 'Validation'}.pdf`);
    } catch (err) {
        console.error("PDF generation failed:", err);
        alert("Failed to generate PDF. Make sure all libraries are loaded properly.");
    }
  };
  if (fetching) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-4">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-gray-500 font-bold animate-pulse">Retrieving analysis artifacts...</p>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="p-20 text-center flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300">
           <FileText size={32} />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">No report metadata found</h3>
        <p className="text-gray-500 text-sm mb-6">This document analysis might have expired or not exist.</p>
        <button onClick={() => navigate('/')} className="px-6 py-2 bg-[#2563EB] text-white rounded-lg font-bold">Return to Upload</button>
      </div>
    );
  }

  const { overall_score, checks, extracted, quality_checks, rag_context, audit } = reportData;
  const qc         = quality_checks || {};
  const passCnt    = qc.passed    ?? checks?.filter(c => c.status === 'PASS').length    ?? 0;
  const warnCnt    = qc.warnings  ?? checks?.filter(c => c.status === 'WARNING').length ?? 0;
  const failCnt    = qc.failed    ?? checks?.filter(c => c.status === 'FAIL').length    ?? 0;
  const totalCnt   = qc.total_checks ?? checks?.length ?? 0;
  const certId     = (extracted?.certificate_id) || audit?.certificate_id || '—';
  const ragMatch   = rag_context?.top_similarity_score
    ? `${Math.round(rag_context.top_similarity_score * 100)}%`
    : '—';

  return (
    <div className="max-w-[1260px] mx-auto py-6 animate-in fade-in duration-700">

      {/* 1. Header & Stepper */}
      <div className="flex flex-col items-center mb-8">
        <Stepper currentStep={2} />
        
        <div className="w-full text-left">
          <div className="flex items-center gap-2 text-[12px] font-semibold text-blue-600 mb-2">
            <span>Kodivian Technologies</span>
            <ChevronRight size={14} className="opacity-40" />
            <span className="opacity-80">Document Quality Check</span>
            <ChevronRight size={14} className="opacity-40" />
            <span className="opacity-100 font-bold">Analysis Output</span>
          </div>
          
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-[34px] font-bold text-[#1E3A5F] mb-1">Quality Assessment Report</h1>
              <p className="text-[14px] text-gray-500 font-medium">Automated validation completed — review AI findings before final sign-off.</p>
            </div>
            <div className="flex flex-col items-end gap-2 mb-1">
               <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full text-[11px] font-bold text-blue-600 shadow-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></div> Analysis Engine Online
               </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-10 gap-6">
        
        {/* LEFT COLUMN: Report Details */}
        <div className="col-span-12 lg:col-span-7 flex flex-col gap-6">
          
          {/* Score Summary Panel */}
          <div className="bg-white border border-[#E2E8F0] rounded-[20px] shadow-sm p-8 flex items-center justify-between">
             <div className="flex gap-8 items-center border-r border-[#F1F3F8] pr-8">
                <ScoreRing score={overall_score} />
                <div className="flex flex-col gap-1">
                   <div className="flex items-center gap-2 mb-1">
                      <span className={clsx(
                        "text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded border shadow-sm",
                        overall_score >= 80 ? "bg-[#059669]/10 text-[#059669] border-[#059669]/20" : "bg-[#D97706]/10 text-[#D97706] border-[#D97706]/20"
                      )}>
                        {overall_score >= 80 ? 'HIGH ACCURACY' : 'ACTION REQUIRED'}
                      </span>
                      <span className="text-[#64748B] text-[11px] font-medium font-mono uppercase">ID: {certId.slice(0,8)}</span>
                   </div>
                   <h2 className="text-[24px] font-bold text-[#1E3A5F]">Decision: {reportData?.decision?.replace('_', ' ') || 'ANALYSIS COMPLETE'}</h2>
                   <p className="text-[#64748B] text-[13px] max-w-sm">
                     {reportData?.decision === 'AUTO_PASS' 
                       ? "The document meets all internal compliance standards for automated processing."
                       : "Findings require manual verification by a senior claim officer due to flagged warnings."}
                   </p>
                </div>
             </div>
             <div className="flex flex-col gap-4 pl-4 grow">
                <div className="flex justify-between items-center text-[13px] p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                   <span className="text-[#64748B] font-semibold">Checks Summary</span>
                   <span className="text-[#1E3A5F] font-bold flex items-center gap-2">
                     <span className="text-green-600">✓ {passCnt}</span>
                     <span className="text-amber-500">⚠ {warnCnt}</span>
                     <span className="text-rose-600">✗ {failCnt}</span>
                   </span>
                </div>
                <div className="flex gap-3">
                   <button onClick={() => navigate('/review')} className="flex-1 py-2.5 bg-[#1E3A5F] hover:bg-[#0F172A] text-white text-[13px] font-bold rounded-lg shadow-sm transition-all transform hover:scale-[0.98]">
                     {reportData.decision === 'AUTO_PASS' ? "Review Audit Trail" : "Enter Human Queue"}
                   </button>
                   <button onClick={handleDownloadPDF} title="Download PDF Report" className="px-4 border border-[#E2E8F0] hover:bg-[#F8FAFC] rounded-lg text-[#64748B] hover:text-[#2563EB] transition-colors"><Download size={18}/></button>
                </div>
             </div>
          </div>

          {/* Extracted Data Panel */}
          <ExtractedDataPanel extracted={extracted} audit={audit} />

          {/* Detailed Check List */}
          <div className="bg-white shadow-sm border border-[#E2E8F0] rounded-[16px] overflow-hidden flex flex-col">
            <div className="px-6 py-4 flex items-center justify-between border-b border-[#E2E8F0] bg-[#F8FAFC]">
              <h2 className="font-bold text-[#1E3A5F] flex items-center gap-2"><FileText className="w-5 h-5 text-[#2563EB]" /> Quality Audit Trail</h2>
              <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-widest">Processing Time: {reportData.processing_time_seconds || '—'}s</span>
            </div>
            <div className="divide-y divide-[#E2E8F0]">
              {checks?.map((check, index) => (
                <CheckRow key={index} check={check} />
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: RAG & Metrics */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-6">
           <div className="flex flex-col gap-4">
              <StatCard title="TIME-TO-EXTRACT" value={`${reportData.processing_time_seconds || 0}s`} valueColor="text-[#2563EB]" sub="Real-time Inference" subIcon={<Check className="w-3 h-3"/>} />
              <StatCard title="RAG GROUNDING" value={rag_context?.top_similarity_score ? "HIGH" : "NA"} valueColor="text-[#059669]" sub="Vector Search Match" />
           </div>

           {/* RAG Evidence Panel */}
           <div className="bg-white border border-[#E2E8F0] rounded-[18px] shadow-sm p-6 flex flex-col h-fit">
              <h2 className="text-[#1E3A5F] font-bold text-[14px] flex items-center gap-2 mb-4">
                <div className="w-1.5 h-1.5 bg-[#475569] rounded-full"></div> RAG Evidence Panel
              </h2>
              <div className="flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
                <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest pl-1">Knowledge base Matches</span>
                <div className="space-y-3">
                  {rag_context?.retrieved_chunks?.map((item, id) => (
                    <RagItem key={id} score={`${(item.similarity * 100).toFixed(1)}%`} text={item.rule_text} />
                  )) || (
                    <p className="text-xs text-gray-400 italic">No direct context matches mapped for this view.</p>
                  )}
                </div>
                <p className="text-[10px] text-center text-[#94A3B8] font-bold mt-2 uppercase border-t border-[#F1F3F8] pt-4">Verified against Internal KB</p>
              </div>
           </div>

           {/* Infrastructure */}
           <div className="bg-white border border-[#E2E8F0] rounded-[16px] shadow-sm p-6">
              <h2 className="text-[#1E3A5F] font-bold text-[14px] flex items-center gap-2 mb-5">
                <div className="w-1.5 h-1.5 bg-[#475569] rounded-full"></div> System Infrastructure
              </h2>
              <div className="space-y-4">
                 <StatusRow label="Process model" value="claims-v3-engine" mono />
                 <StatusRow label="Knowledge base" value={rag_context?.checklist_name || "Insurance v2.1"} />
                 <StatusRow label="Status" value="• Verified Audit" green />
              </div>
           </div>
        </div>
      </div>

    </div>
  );
};

function CheckRow({ check }) {
  const [expanded, setExpanded] = useState(false);
  const isPass = check.status === 'PASS';
  const isWarning = check.status === 'WARNING';
  const Icon = isPass ? CheckCircle2 : (isWarning ? AlertTriangle : AlertCircle);
  
  const colorClass = isPass ? '#059669' : (isWarning ? '#D97706' : '#DC2626');
  const bgClass = isPass ? 'bg-[#059669]/10' : (isWarning ? 'bg-[#D97706]/10' : 'bg-[#DC2626]/10');
  const textClass = isPass ? 'text-[#059669]' : (isWarning ? 'text-[#D97706]' : 'text-[#DC2626]');

  return (
    <div className="flex flex-col hover:bg-[#F8FAFC] transition-colors border-b border-[#E2E8F0] last:border-b-0">
      <div className="flex items-center justify-between px-6 py-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-3 w-[45%]">
          <div className={clsx("w-7 h-7 rounded-full flex items-center justify-center shrink-0 border", bgClass, isPass ? "border-[#059669]/20" : (isWarning ? "border-[#D97706]/20" : "border-[#DC2626]/20"))}>
            <Icon size={16} className={textClass} />
          </div>
          <span className="text-[14px] font-semibold text-[#1E3A5F] truncate">{check.check_name}</span>
        </div>
        <div className="w-[35%] flex items-center gap-4">
          <div className="w-full bg-[#E2E8F0] h-[6px] rounded-full overflow-hidden">
            <div className="h-full transition-all duration-1000 ease-out" style={{ width: `${check.confidence * 100}%`, backgroundColor: colorClass }}></div>
          </div>
          <span className="text-[11px] font-mono font-bold text-[#64748B] w-12">{Math.round(check.confidence * 100)}%</span>
        </div>
        <div className="flex items-center gap-4">
          <span className={clsx("text-[10px] font-bold tracking-widest uppercase px-2 py-1 rounded border", bgClass, textClass)}>{check.status}</span>
        </div>
      </div>
      {expanded && (
        <div className="px-6 pb-4 pt-1 bg-[#F1F3F8]/30 animate-in slide-in-from-top-2 duration-200">
           <div className="ml-10 flex flex-col gap-2 p-4 bg-white border border-[#E2E8F0] rounded-xl shadow-sm">
              <p className="text-[#475569] text-[13px] leading-relaxed"><span className="font-bold text-[#1E3A5F]">System Analysis:</span> {check.message}</p>
              {check.guidance && <p className="text-[#D97706] text-[12px] font-bold bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100 flex items-center gap-2"><Info size={14}/> Guidance: {check.guidance}</p>}
              <div className="mt-2 text-[11px] font-mono italic text-[#64748B] bg-[#F8FAFC] p-2 rounded border border-[#E2E8F0]">
                RAG Rule: {check.rag_rule || "Standard Compliance Standard Applied"}
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

export default QualityReportScreen;
