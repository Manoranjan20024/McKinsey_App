import React, { useEffect, useState } from 'react';
import { 
  Library, Folder, FileText, Search, 
  ChevronRight, ExternalLink, Info, Filter,
  BookOpen, Hash, Clock, RefreshCw, AlertTriangle
} from 'lucide-react';
import { clsx } from 'clsx';
import { getKBList, getKBFile } from '../services/api';

export default function KnowledgeBaseScreen() {
  const [categories, setCategories] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null); // { category, filename, content }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCat, setExpandedCat] = useState('');

  useEffect(() => {
    const fetchList = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getKBList();
        const cats = data.categories || [];
        setCategories(cats);
        if (cats.length > 0) {
            setExpandedCat(cats[0].name);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to connect to Knowledge Base service.");
      } finally {
        setLoading(false);
      }
    };
    fetchList();
  }, []);

  const loadFile = async (category, filename) => {
    try {
      setLoading(true);
      const data = await getKBFile(category, filename);
      setSelectedFile(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.map(cat => ({
    ...cat,
    files: cat.files.filter(f => f.toLowerCase().includes(searchTerm.toLowerCase()))
  })).filter(cat => cat.files.length > 0);

  return (
    <div className="max-w-[1400px] mx-auto h-[calc(100vh-140px)] flex flex-col animate-in fade-in duration-500">
      
      {/* Header Area */}
      <div className="flex items-center justify-between mb-8 px-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1E3A5F] mb-1">Knowledge Base Explorer</h1>
          <p className="text-gray-500 text-sm">Browse RAG-grounded rules, compliance standards, and provider registries.</p>
        </div>
        <div className="relative w-72">
           <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
           <input 
             type="text" 
             placeholder="Search documents..." 
             value={searchTerm}
             onChange={e => setSearchTerm(e.target.value)}
             className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 shadow-sm"
           />
        </div>
      </div>

      <div className="flex-1 flex gap-8 overflow-hidden px-4 pb-4">
        
        {/* Sidebar - Explorer */}
        <div className="w-80 bg-white border border-gray-200 rounded-2xl flex flex-col overflow-hidden shadow-sm">
            <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center gap-2 font-bold text-[#1E3A5F] text-sm uppercase tracking-wider">
                <Library size={18} className="text-blue-600" /> Explorer
            </div>
            <div className="flex-1 overflow-y-auto p-2">
                {loading ? (
                    <div className="p-10 text-center flex flex-col items-center gap-4">
                        <RefreshCw size={24} className="text-blue-400 animate-spin" />
                        <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Scanning Repository...</span>
                    </div>
                ) : error ? (
                    <div className="p-10 text-center flex flex-col items-center gap-3">
                        <AlertTriangle size={24} className="text-rose-400" />
                        <span className="text-[11px] text-rose-500 font-bold leading-tight">{error}</span>
                        <button onClick={() => window.location.reload()} className="mt-2 text-[10px] underline text-blue-600 font-bold">Try Refreshing</button>
                    </div>
                ) : filteredCategories.length === 0 ? (
                    <div className="p-10 text-center flex flex-col items-center gap-3">
                        <Search size={24} className="text-gray-200" />
                        <span className="text-[11px] text-gray-400 font-bold">No documents found matching your search.</span>
                    </div>
                ) : filteredCategories.map(cat => (
                    <div key={cat.name} className="mb-2">
                        <button 
                            onClick={() => setExpandedCat(expandedCat === cat.name ? '' : cat.name)}
                            className={clsx(
                                "w-full flex items-center justify-between p-3 rounded-xl transition-all",
                                expandedCat === cat.name ? "bg-blue-50 text-blue-700" : "hover:bg-gray-100 text-gray-600"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <Folder size={18} className={expandedCat === cat.name ? "text-blue-600" : "text-gray-400"} />
                                <span className="text-sm font-bold capitalize">{cat.name}</span>
                            </div>
                            <ChevronRight size={14} className={clsx("transition-transform", expandedCat === cat.name && "rotate-90")} />
                        </button>
                        
                        {expandedCat === cat.name && (
                            <div className="mt-1 ml-4 border-l-2 border-blue-100 pl-2 space-y-1">
                                {cat.files.map(file => (
                                    <button 
                                        key={file}
                                        onClick={() => loadFile(cat.name, file)}
                                        className={clsx(
                                            "w-full text-left p-2.5 rounded-lg text-xs font-semibold truncate transition-all",
                                            selectedFile?.filename === file ? "text-blue-600 bg-blue-50/50" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                                        )}
                                    >
                                        <div className="flex items-center gap-2">
                                            <FileText size={14} className="shrink-0" />
                                            <span className="truncate">{file}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>

        {/* Main Panel - Viewer */}
        <div className="flex-1 bg-white border border-gray-200 rounded-2xl flex flex-col overflow-hidden shadow-sm shadow-blue-100/20">
            {selectedFile ? (
                <>
                    {/* Viewer Header */}
                    <div className="px-8 py-6 bg-gray-50 border-b border-gray-100 flex items-center justify-between shrink-0">
                        <div>
                            <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1">
                                <Hash size={12} /> {selectedFile.category} / {selectedFile.filename}
                            </div>
                            <h2 className="text-xl font-bold text-[#1E3A5F]">{selectedFile.filename.replace('.txt', '')}</h2>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Last Indexed</span>
                                <span className="text-xs font-mono font-bold text-[#1E3A5F]">Apr 10, 2026</span>
                            </div>
                            <button onClick={() => alert('External source linking is disabled in this demo environment.')} className="p-2 border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 transition-all" title="View External Source">
                                <ExternalLink size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Viewer Content */}
                    <div className="flex-1 overflow-y-auto p-10">
                        <div className="max-w-3xl mx-auto">
                            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl mb-12 border border-blue-100 shadow-sm">
                                <Info size={20} className="text-blue-600 shrink-0" />
                                <p className="text-xs text-blue-900 font-medium leading-relaxed">
                                    This document is currently used by the <strong>Scanify AI Engine</strong> as a ground truth for automated claim validation. 
                                    Any changes to this source will reflect in the RAG retrieval scores.
                                </p>
                            </div>
                            
                            <div className="prose prose-slate max-w-none">
                                <pre className="whitespace-pre-wrap font-sans text-[15px] leading-8 text-[#334155] bg-transparent border-none p-0 selection:bg-blue-100">
                                    {selectedFile.content}
                                </pre>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-20">
                    <div className="mb-8 relative">
                        <div className="absolute inset-0 bg-blue-100 blur-3xl rounded-full opacity-50 scale-150" />
                        <BookOpen size={100} className="text-blue-100 relative" />
                    </div>
                    <h3 className="text-lg font-bold text-[#1E3A5F] mb-2">No document selected</h3>
                    <p className="max-w-sm text-gray-400 text-sm">Select a file from the explorer sidebar to view the RAG reference guidelines and compliance data.</p>
                </div>
            )}
        </div>

      </div>
    </div>
  );
}
