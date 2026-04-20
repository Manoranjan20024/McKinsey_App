import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Filter, ArrowRight, FileText, 
  CheckCircle2, AlertCircle, Clock, User, 
  Building2, Hash, Calendar,  ChevronRight, TrendingUp, Activity, Inbox,
  Trash2, Square, CheckSquare, Trash
} from 'lucide-react';
import { clsx } from 'clsx';
import { getReports, deleteReport, deleteReportsBulk } from '../services/api';
import { useAppContext } from '../context/AppContext';
import { StatusBadge } from '../components/ReportComponents';

const StatMini = ({ label, value, colorClass }) => (
  <div className="flex flex-col gap-0.5 px-4 first:pl-0 border-r border-gray-100 last:border-0 grow">
    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</span>
    <span className={clsx("text-lg font-bold font-mono", colorClass)}>{value}</span>
  </div>
);

export default function ClaimsQueueScreen({ initialStatus = 'ALL' }) {
  const navigate = useNavigate();
  const { setReportData, setUploadId } = useAppContext();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Update status filter if prop changes
  useEffect(() => {
    setStatusFilter(initialStatus);
  }, [initialStatus]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await getReports();
      setReports(data || []);
    } catch (error) {
      console.error("Failed to fetch reports:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const filteredReports = reports.filter(r => {
    const matchesSearch = 
      (r.claim_id?.toLowerCase().includes(filter.toLowerCase())) ||
      (r.patient_name?.toLowerCase().includes(filter.toLowerCase())) ||
      (r.hospital?.toLowerCase().includes(filter.toLowerCase()));
    
    const matchesStatus = statusFilter === 'ALL' || r.decision === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleViewReport = (uploadId) => {
    setUploadId(uploadId);
    navigate(`/report?id=${uploadId}`);
  };

  const toggleSelect = (id, e) => {
    e.stopPropagation(); // Don't trigger "View Report"
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredReports.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredReports.map(r => r.upload_id)));
    }
  };

  const handleDeleteOne = async (id, e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (!window.confirm("Are you sure to delete the documente")) return;
    try {
      await deleteReport(id);
      await fetchReports(); // Ensure it refreshes
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Delete failed.");
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.size} documents?`)) return;
    try {
      await deleteReportsBulk(Array.from(selectedIds));
      fetchReports();
      setSelectedIds(new Set());
    } catch (err) {
      alert("Bulk delete failed.");
    }
  };

  const handleExportCSV = () => {
    if (filteredReports.length === 0) return;
    const headers = ['Upload ID', 'Filename', 'Claim ID', 'Patient Name', 'Hospital', 'Decision', 'Quality Score', 'Processed Date'];
    const rows = filteredReports.map(r => [
      r.upload_id, r.filename, r.claim_id, r.patient_name, r.hospital,
      r.decision, `${r.score}%`, new Date(r.created_at).toLocaleString()
    ]);
    const csvContent = [headers.join(','), ...rows.map(e => e.map(String).map(v => `"${v.replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ScanifyAI_Claims_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
  };

  const stats = {
    total: reports.length,
    approved: reports.filter(r => r.decision === 'AUTO_PASS' || r.decision === 'APPROVE').length,
    pending: reports.filter(r => r.decision === 'HUMAN_REVIEW' || r.status === 'processing').length,
    rejected: reports.filter(r => r.decision === 'AUTO_FAIL' || r.decision === 'REJECT').length
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-gray-500 font-medium">Loading analysis history...</p>
      </div>
    );
  }

  const getHeaderContent = () => {
    if (initialStatus === 'AUTO_PASS') return {
      breadcrumb: "Internal Ledger / Success Logs",
      title: "Approved Claims Ledger",
      subtitle: "Verified audit trail for all claims successfully passed by the AI quality gate."
    };
    if (initialStatus === 'AUTO_FAIL') return {
      breadcrumb: "Internal Ledger / Exception Logs",
      title: "Rejected Document Queue",
      subtitle: "Archive of medical documents that failed to meet compliance and quality standards."
    };
    return {
      breadcrumb: "Internal Ledger / Claims Intelligence",
      title: "Claims Queue & History",
      subtitle: "Audit trail for all AI-processed medical document validations."
    };
  };

  const header = getHeaderContent();

  return (
    <div className="max-w-[1240px] mx-auto animate-in fade-in duration-500">
      
      {/* Header Area */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="text-[13px] font-semibold text-[#2563EB] mb-2">{header.breadcrumb}</div>
          <h1 className="text-[32px] font-bold text-[#1E3A5F] mb-1">{header.title}</h1>
          <p className="text-[14px] text-[#64748B]">{header.subtitle}</p>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex gap-4 min-w-[400px]">
           <StatMini label="Total Scanned" value={stats.total} colorClass="text-blue-600" />
           <StatMini label="Auto Pass" value={stats.approved} colorClass="text-green-600" />
           <StatMini label="Action Required" value={stats.pending} colorClass="text-amber-500" />
           <StatMini label="Rejected" value={stats.rejected} colorClass="text-rose-600" />
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text"
              placeholder="Filter by Claim ID, Patient, or Hospital..."
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
          
          <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
            {['ALL', 'AUTO_PASS', 'HUMAN_REVIEW', 'AUTO_FAIL'].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={clsx(
                  "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                  statusFilter === s ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                )}
              >
                {s.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
        <button onClick={handleExportCSV} className="px-4 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-gray-50 transition-colors">
          <FileText size={16} /> Export CSV
        </button>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-gray-200 rounded-[20px] shadow-sm overflow-hidden">
        {filteredReports.length === 0 ? (
          <div className="p-20 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Inbox className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">No matching claims found</h3>
            <p className="text-gray-500 text-sm">Adjust your filters or upload a new document to begin.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Document</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Claim Details</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Status / Intelligence</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Quality Score</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Submitted</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-center">
                     <div className="flex items-center justify-center gap-2">
                        <span>Delete</span>
                        <button 
                          onClick={handleSelectAll}
                          className="text-gray-400 hover:text-blue-600 transition-colors"
                          title="Select All"
                        >
                           {selectedIds.size === filteredReports.length ? <CheckSquare size={16} /> : <Square size={16} />}
                        </button>
                     </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredReports.map((report) => (
                  <tr 
                    key={report.upload_id}
                    onClick={() => handleViewReport(report.upload_id)}
                    className="group hover:bg-blue-50/30 transition-all cursor-pointer"
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          <FileText size={20} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[14px] font-bold text-[#1E3A5F]">{report.filename}</span>
                          <span className="text-[11px] font-mono text-gray-400">ID: {report.upload_id.slice(0,8)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-[14px] font-semibold text-gray-900">
                           <Hash size={14} className="text-gray-400" /> {report.claim_id}
                        </div>
                        <div className="flex items-center gap-4 text-[12px] text-gray-500">
                           <span className="flex items-center gap-1"><User size={12}/> {report.patient_name}</span>
                           <span className="flex items-center gap-1"><Building2 size={12}/> {report.hospital}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                       <StatusBadge status={report.status === 'processing' ? 'PROCESSING' : report.decision} />
                    </td>
                    <td className="px-6 py-5">
                       <div className="flex items-center gap-2 px-2 py-1 bg-gray-50 border border-gray-100 rounded-lg w-fit font-mono font-bold text-sm">
                          <div className={clsx(
                            "w-2 h-2 rounded-full",
                            report.score >= 80 ? "bg-green-500" : report.score >= 60 ? "bg-amber-500" : "bg-rose-500"
                          )} />
                          {report.score}%
                       </div>
                    </td>
                    <td className="px-6 py-5">
                       <div className="flex flex-col">
                          <span className="text-[13px] font-semibold text-[#1E3A5F]">
                             {new Date(report.created_at).toLocaleDateString()}
                          </span>
                          <span className="text-[11px] text-gray-400">
                             {new Date(report.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                       </div>
                    </td>
                    <td className="px-6 py-5">
                       <div className="flex items-center justify-center gap-3">
                          <button 
                            onClick={(e) => toggleSelect(report.upload_id, e)}
                            className={clsx(
                              "transition-colors",
                              selectedIds.has(report.upload_id) ? "text-blue-600" : "text-gray-300 hover:text-gray-400"
                            )}
                          >
                             {selectedIds.has(report.upload_id) ? <CheckSquare size={18} /> : <Square size={18} />}
                          </button>
                          <button 
                             onClick={(e) => handleDeleteOne(report.upload_id, e)}
                             className="text-gray-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                           >
                             <Trash2 size={18} />
                          </button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Bulk Actions Bar */}
        {selectedIds.size > 0 && (
          <div className="bg-blue-600 px-6 py-4 flex items-center justify-between animate-in slide-in-from-bottom-2 duration-300">
             <div className="flex items-center gap-4 text-white">
                <span className="text-[14px] font-bold">{selectedIds.size} Items Selected</span>
                <button onClick={() => setSelectedIds(new Set())} className="text-[12px] font-bold text-blue-100 hover:underline">Cancel</button>
             </div>
             <button 
               onClick={handleBulkDelete}
               className="bg-white text-rose-600 px-4 py-2 rounded-lg text-[13px] font-bold shadow-sm hover:bg-rose-50 transition-colors flex items-center gap-2"
             >
                <Trash size={16} /> Delete Selected
             </button>
          </div>
        )}
        
        <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
           <span className="text-xs text-gray-500 font-medium font-mono">ENCRYPTED LEDGER / SECURE AUDIT TRAIL</span>
           <div className="flex items-center gap-4">
              <span className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">Storage Node: AP-SOUTH-1</span>
              <Activity size={14} className="text-green-500" />
           </div>
        </div>
      </div>

    </div>
  );
}
