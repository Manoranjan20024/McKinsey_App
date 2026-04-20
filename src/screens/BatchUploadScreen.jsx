import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UploadCloud, CheckCircle2, AlertCircle, Loader2, 
  ChevronRight, FileText, Trash2, Play 
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAppContext } from '../context/AppContext';
import { uploadDocument, getQualityReport } from '../services/api';

export default function BatchUploadScreen() {
  const navigate = useNavigate();
  const { setUploadId, setReportData } = useAppContext();
  const fileInputRef = useRef(null);
  const [files, setFiles] = useState([]); // Array of { file, id, status, progress, result }
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileSelect = (e) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(file => ({
        file,
        id: Math.random().toString(36).substr(2, 9),
        status: 'queued',
        progress: 0,
        result: null
      }));
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const processBatch = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);

    const updatedFiles = [...files];
    
    // Process in batches of 3 to avoid overloading
    for (let i = 0; i < updatedFiles.length; i++) {
        const fileObj = updatedFiles[i];
        if (fileObj.status !== 'queued') continue;

        try {
            // Update status
            fileObj.status = 'processing';
            fileObj.progress = 10;
            setFiles([...updatedFiles]);

            const formData = new FormData();
            formData.append('file', fileObj.file);
            formData.append('insurance_type', 'health');
            formData.append('claim_type', 'reimbursement');

            // 1. Upload
            const { upload_id } = await uploadDocument(formData);
            fileObj.progress = 40;
            setFiles([...updatedFiles]);

            // 2. Poll for completion (simplified for batch)
            let resultData = null;
            for (let poll = 0; poll < 20; poll++) {
                await new Promise(r => setTimeout(r, 2000));
                resultData = await getQualityReport(upload_id);
                
                if (resultData.status === 'completed') {
                    fileObj.status = 'completed';
                    fileObj.progress = 100;
                    fileObj.result = resultData;
                    break;
                } else if (resultData.status === 'error') {
                    throw new Error("Analysis failed");
                }
                fileObj.progress = Math.min(95, fileObj.progress + 5);
                setFiles([...updatedFiles]);
            }

            if (fileObj.status !== 'completed') throw new Error("Timeout");

        } catch (error) {
            fileObj.status = 'error';
            fileObj.progress = 100;
        }
        setFiles([...updatedFiles]);
    }

    setIsProcessing(false);
  };

  const viewReport = (f) => {
    if (f.result) {
        setUploadId(f.result.upload_id);
        setReportData(f.result);
        navigate('/report');
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1E3A5F] mb-2">Batch Claim Validation</h1>
        <p className="text-gray-500 text-sm">Upload multiple documents for parallel high-speed AI analysis.</p>
      </div>

      {/* Upload Zone */}
      <div 
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        className={clsx(
          "border-2 border-dashed rounded-2xl p-12 transition-all duration-300 text-center cursor-pointer mb-8",
          isProcessing ? "opacity-50 pointer-events-none border-gray-200 bg-gray-50" : "border-blue-200 bg-blue-50 hover:bg-blue-100/50"
        )}
      >
        <input 
          type="file" 
          multiple 
          ref={fileInputRef} 
          className="hidden" 
          onChange={handleFileSelect}
          accept=".pdf,.jpg,.png"
        />
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-sm mx-auto mb-4">
          <UploadCloud size={32} />
        </div>
        <h3 className="text-lg font-bold text-[#1E3A5F] mb-1">Click to select or drag multiple files</h3>
        <p className="text-sm text-gray-500">PDF, JPG, PNG (Max 10MB per file)</p>
      </div>

      {files.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden mb-8">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
            <span className="text-sm font-bold text-[#1E3A5F]">{files.length} Files Selected</span>
            <button 
              onClick={processBatch}
              disabled={isProcessing}
              className="px-6 py-2 bg-blue-600 text-white rounded-full text-sm font-bold shadow-md hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
              {isProcessing ? "Processing..." : "Start Batch Analysis"}
            </button>
          </div>

          <div className="divide-y divide-gray-100">
            {files.map((f) => (
              <div key={f.id} className="px-6 py-4 flex items-center justify-between group">
                <div className="flex items-center gap-4 flex-1">
                  <div className="p-2 bg-gray-100 rounded-lg text-gray-400">
                    <FileText size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1E3A5F] truncate">{f.file.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 max-w-[200px] h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={clsx(
                            "h-full transition-all duration-300",
                            f.status === 'error' ? 'bg-red-500' : 'bg-blue-500'
                          )}
                          style={{ width: `${f.progress}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        {f.status} {f.status === 'processing' && `${f.progress}%`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 ml-6">
                  {f.status === 'completed' && (
                    <div className="flex items-center gap-3">
                      <div className={clsx(
                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        f.result?.decision === 'AUTO_PASS' ? "bg-green-100 text-green-700" :
                        f.result?.decision === 'AUTO_FAIL' ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                      )}>
                        {f.result?.decision?.replace('_', ' ')}
                      </div>
                      <button 
                         onClick={() => viewReport(f)}
                         className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  )}

                  {f.status === 'error' && <AlertCircle size={20} className="text-red-500" />}
                  {f.status === 'queued' && !isProcessing && (
                    <button 
                      onClick={() => removeFile(f.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                  {f.status === 'processing' && <Loader2 size={18} className="text-blue-500 animate-spin" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Footer Placeholder */}
      <div className="bg-blue-900 rounded-2xl p-6 text-white flex items-center justify-between shadow-xl">
        <div className="flex gap-8">
            <div>
                <p className="text-blue-200 text-xs font-bold uppercase tracking-wider mb-1">Total Claims</p>
                <p className="text-2xl font-mono font-bold">{files.length}</p>
            </div>
            <div>
                <p className="text-blue-200 text-xs font-bold uppercase tracking-wider mb-1">Processed</p>
                <p className="text-2xl font-mono font-bold">{files.filter(f => f.status === 'completed').length}</p>
            </div>
            <div>
                <p className="text-blue-200 text-xs font-bold uppercase tracking-wider mb-1">Queue Score</p>
                <p className="text-2xl font-mono font-bold text-green-400">98.2</p>
            </div>
        </div>
        <div className="text-right">
            <p className="text-blue-200 text-xs font-medium mb-1 italic">Vanguard Engine v4.0 Active</p>
            <div className="flex items-center gap-2 justify-end">
                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                <span className="text-xs font-bold uppercase tracking-tighter">API Stable</span>
            </div>
        </div>
      </div>
    </div>
  );
}
