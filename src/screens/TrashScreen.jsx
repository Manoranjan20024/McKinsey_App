import React, { useState, useEffect } from 'react';
import { 
  Trash2, RotateCcw, Search, Inbox, Hash, User, Building2, 
  ChevronRight, Activity, AlertCircle, FileText, CheckSquare, Square, Trash
} from 'lucide-react';
import { clsx } from 'clsx';
import { getTrashReports, restoreReports, permanentDeleteReport, emptyTrash, deleteReportsPermanentBulk } from '../services/api';
import { StatusBadge } from '../components/ReportComponents';

const StatMini = ({ label, value, colorClass }) => (
  <div className="flex flex-col gap-0.5 px-4 first:pl-0 border-r border-gray-100 last:border-0 grow">
    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</span>
    <span className={clsx("text-lg font-bold font-mono", colorClass)}>{value}</span>
  </div>
);

export default function TrashScreen() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());

  const fetchTrash = async () => {
    setLoading(true);
    try {
      const data = await getTrashReports();
      setReports(data || []);
    } catch (error) {
      console.error("Failed to fetch trash:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrash();
  }, []);

  const filteredReports = reports.filter(r => {
    return (
      (r.claim_id?.toLowerCase().includes(filter.toLowerCase())) ||
      (r.patient_name?.toLowerCase().includes(filter.toLowerCase())) ||
      (r.hospital?.toLowerCase().includes(filter.toLowerCase()))
    );
  });

  const toggleSelect = (id) => {
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

  const handleRestoreRow = async (id, e) => {
    e.stopPropagation();
    try {
      await restoreReports([id]);
      fetchTrash();
      const next = new Set(selectedIds);
      next.delete(id);
      setSelectedIds(next);
    } catch (error) {
      alert("Failed to restore.");
    }
  };

  const handleDeleteRow = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Permanently delete this document analysis? This cannot be undone.")) return;
    try {
      await permanentDeleteReport(id);
      fetchTrash();
      const next = new Set(selectedIds);
      next.delete(id);
      setSelectedIds(next);
    } catch (error) {
      alert("Failed to delete.");
    }
  };

  const handleBulkRestore = async () => {
    try {
      await restoreReports(Array.from(selectedIds));
      fetchTrash();
      setSelectedIds(new Set());
    } catch (error) {
      alert("Bulk restore failed.");
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Permanently delete ${selectedIds.size} documents? This is irreversible.`)) return;
    try {
       await deleteReportsPermanentBulk(Array.from(selectedIds));
       fetchTrash();
       setSelectedIds(new Set());
    } catch (error) {
       alert("Bulk delete encountered an issue.");
    }
  };

  const handleEmptyTrash = async () => {
    if (!window.confirm("Are you sure you want to empty the trash? All current records will be PERMANENTLY lost.")) return;
    try {
      await emptyTrash();
      fetchTrash();
      setSelectedIds(new Set());
    } catch (error) {
      alert("Failed to empty trash.");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-gray-500 font-medium">Scanning trash collection...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1240px] mx-auto animate-in fade-in duration-500">
      
      {/* Header Area */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="text-[13px] font-semibold text-rose-600 mb-2 uppercase tracking-wide">Archived Intelligence / Trash</div>
          <h1 className="text-[32px] font-bold text-[#1E3A5F] mb-1">Archive Shell</h1>
          <p className="text-[14px] text-[#64748B]">Review deleted claim validations before permanent binary erasure.</p>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex gap-4 min-w-[200px]">
              <StatMini label="Awaiting Erasure" value={reports.length} colorClass="text-rose-600" />
           </div>
           <button 
             onClick={handleEmptyTrash}
             className="px-6 py-3 bg-rose-600 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-rose-700 transition-all flex items-center gap-2"
           >
              <Trash size={16} /> Empty Trash
           </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text"
              placeholder="Search archived claims..."
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-gray-200 rounded-[20px] shadow-sm overflow-hidden border-t-4 border-t-rose-500/20">
        {filteredReports.length === 0 ? (
          <div className="p-20 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300">
              <Inbox className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Trash is empty</h3>
            <p className="text-gray-500 text-sm">Any documents you delete will appear here temporarily.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 font-mono tracking-tighter uppercase text-[10px] text-gray-400 font-bold">
                  <th className="px-6 py-4">Document</th>
                  <th className="px-6 py-4">Claim Details</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Deleted On</th>
                  <th className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2 cursor-pointer" onClick={handleSelectAll}>
                       Action <button className="text-gray-400 hover:text-blue-600 transition-colors">
                          {selectedIds.size === filteredReports.length ? <CheckSquare size={14} /> : <Square size={14} />}
                       </button>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredReports.map((report) => (
                  <tr key={report.upload_id} className="group hover:bg-rose-50/30 transition-all">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-rose-100 group-hover:text-rose-600 transition-colors">
                          <FileText size={20} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[14px] font-bold text-[#1E3A5F]">{report.filename}</span>
                          <span className="text-[11px] font-mono text-gray-400 uppercase tracking-widest">{report.upload_id.slice(0,8)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-[14px] font-semibold text-gray-900">
                           <Hash size={14} className="text-gray-400" /> {report.claim_id}
                        </div>
                        <div className="flex items-center gap-3 text-[12px] text-gray-500">
                           <span className="flex items-center gap-1"><User size={12}/> {report.patient_name}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                       <StatusBadge status={report.decision} />
                    </td>
                    <td className="px-6 py-5">
                       <div className="flex flex-col">
                          <span className="text-[13px] font-semibold text-gray-600">{new Date(report.deleted_at).toLocaleDateString()}</span>
                          <span className="text-[11px] text-gray-400 font-mono uppercase italic">{new Date(report.deleted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                       </div>
                    </td>
                    <td className="px-6 py-5">
                       <div className="flex items-center justify-center gap-3">
                          <button 
                             onClick={() => toggleSelect(report.upload_id)}
                             className={clsx(
                               "transition-colors",
                               selectedIds.has(report.upload_id) ? "text-blue-600" : "text-gray-300 hover:text-gray-400"
                             )}
                          >
                             {selectedIds.has(report.upload_id) ? <CheckSquare size={18} /> : <Square size={18} />}
                          </button>
                          <div className="w-px h-4 bg-gray-100" />
                          <button 
                             onClick={(e) => handleRestoreRow(report.upload_id, e)}
                             className="text-gray-300 hover:text-green-600 transition-colors flex items-center gap-1.5"
                             title="Restore to Queue"
                           >
                             <RotateCcw size={16} />
                          </button>
                          <button 
                             onClick={(e) => handleDeleteRow(report.upload_id, e)}
                             className="text-gray-300 hover:text-rose-600 transition-colors"
                             title="Permanently Delete"
                           >
                             <Trash2 size={16} />
                          </button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Bulk Action Bar */}
        {selectedIds.size > 0 && (
          <div className="bg-[#1E3A5F] px-6 py-4 flex items-center justify-between animate-in slide-in-from-bottom-2 duration-300">
             <div className="flex items-center gap-4 text-white">
                <span className="text-[14px] font-bold">{selectedIds.size} Items Flagged for Action</span>
                <button onClick={() => setSelectedIds(new Set())} className="text-[12px] font-bold text-blue-200 hover:underline">Deselect All</button>
             </div>
             <div className="flex items-center gap-3">
                <button 
                  onClick={handleBulkRestore}
                  className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-[13px] font-bold transition-all flex items-center gap-2 border border-white/20"
                >
                   <RotateCcw size={16} /> Restore Selected
                </button>
                <button 
                  onClick={handleBulkDelete}
                  className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg text-[13px] font-bold shadow-sm transition-all flex items-center gap-2"
                >
                   <Trash size={16} /> Permanent Erasure
                </button>
             </div>
          </div>
        )}
        
        <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between font-mono text-[10px] text-gray-400">
           <span className="flex items-center gap-2 uppercase tracking-tight"><AlertCircle size={10} /> Data in trash is stored temporarily until binary scrub.</span>
           <Activity size={14} className="text-rose-500 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
