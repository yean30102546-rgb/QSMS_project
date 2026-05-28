'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Send, UploadCloud, FileText, CheckCircle2, AlertCircle, Trash2, HelpCircle, Sparkles, Bot, BrainCircuit } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import * as pdfjsLib from 'pdfjs-dist';
import { User } from '../../services/auth';

// Set up PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co';
// Client-safe anonymous key used in frontend
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-key-to-prevent-crash';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

if (typeof window !== 'undefined' && !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn('⚠️ NEXT_PUBLIC_SUPABASE_ANON_KEY is missing in .env. Supabase client features will fail.');
}

interface RagAppProps {
  user: User | null;
  onBackToPortal: () => void;
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface DocFile {
  id: string;
  filename: string;
  file_type: string;
  created_at: string;
}

interface UploadQueueItem {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'processing' | 'success' | 'failed';
  progress: number;
  error?: string;
}

export function RagApp({ user, onBackToPortal }: RagAppProps) {
  const [activeTab, setActiveTab] = useState<'chat' | 'documents'>('chat');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'สวัสดีครับ ยินดีต้อนรับสู่ระบบ QSMS DocAI RAG บรรณารักษ์ความรู้ประจำโรงงาน คุณสามารถพิมพ์ถามคำถามเพื่อสืบค้นข้อมูลในไฟล์ PDF หรือ Excel ที่อัปโหลดไว้ได้เลยครับ' }
  ]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<DocFile[]>([]);
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list_documents' })
      });
      const result = await res.json();
      if (result.success) {
        setDocuments(result.data || []);
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบเอกสารนี้? ข้อมูลเวกเตอร์จะถูกลบทั้งหมด')) return;
    try {
      const res = await fetch('/api/rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_document', id })
      });
      const result = await res.json();
      if (result.success) {
        setDocuments(prev => prev.filter(d => d.id !== id));
      } else {
        alert('เกิดข้อผิดพลาดในการลบเอกสาร: ' + result.error);
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  // Convert File object to Base64 helper
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = error => reject(error);
    });
  };

  // Helper to convert PDF pages to Blob images
  const extractPdfPagesAsImages = async (file: File): Promise<Blob[]> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const images: Blob[] = [];

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.5 }); // 1.5 scale for good quality

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) continue;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport: viewport }).promise;

        const blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob(resolve, 'image/jpeg', 0.8);
        });

        if (blob) {
          images.push(blob);
        }
      }
      return images;
    } catch (err) {
      console.error('PDF to Image conversion error:', err);
      return [];
    }
  };

  // Process the file upload queue sequentially (concurrency control)
  const processQueue = async (itemsToProcess: UploadQueueItem[]) => {
    for (const item of itemsToProcess) {
      setUploadQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'uploading', progress: 20 } : q));

      try {
        const fileType = item.file.name.endsWith('.xlsx') ? 'xlsx' : 'pdf';
        
        // Extract and upload images if PDF
        let imageUrls: string[] = [];
        if (fileType === 'pdf') {
          setUploadQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'uploading', progress: 40 } : q));
          const pageImages = await extractPdfPagesAsImages(item.file);
          
          setUploadQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'uploading', progress: 60 } : q));
          
          for (let i = 0; i < pageImages.length; i++) {
            const fileName = `doc_${item.id}_page_${i + 1}.jpg`;
            const { data, error } = await supabase.storage
              .from('rag_images')
              .upload(fileName, pageImages[i], { contentType: 'image/jpeg' });
              
            if (!error && data) {
              const { data: publicData } = supabase.storage
                .from('rag_images')
                .getPublicUrl(fileName);
              if (publicData.publicUrl) {
                imageUrls.push(publicData.publicUrl);
              }
            }
          }
        }

        // Convert file to base64
        setUploadQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'processing', progress: 80 } : q));
        const base64Data = await fileToBase64(item.file);

        // Call our ingest API endpoint
        const res = await fetch('/api/rag', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'ingest',
            filename: item.file.name,
            fileType,
            base64Data,
            imageUrls
          })
        });

        const result = await res.json();

        if (result.success) {
          setUploadQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'success', progress: 100 } : q));
        } else {
          throw new Error(result.error || 'Ingest API failed');
        }
      } catch (err) {
        console.error(`Error processing ${item.file.name}:`, err);
        const errMsg = err instanceof Error ? err.message : String(err);
        setUploadQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'failed', progress: 0, error: errMsg || 'เกิดข้อผิดพลาด' } : q));
      }
    }
    fetchDocuments();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files);
    
    const newQueueItems: UploadQueueItem[] = filesArray.map(f => ({
      id: Math.random().toString(36).substring(7),
      file: f,
      status: 'pending',
      progress: 0
    }));

    setUploadQueue(prev => [...prev, ...newQueueItems]);
    processQueue(newQueueItems);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || loading) return;

    const userMsg = query;
    setQuery('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch('/api/rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'chat', message: userMsg })
      });
      const result = await res.json();

      if (result.success) {
        setMessages(prev => [...prev, { role: 'model', text: result.data.text }]);
      } else {
        setMessages(prev => [...prev, { role: 'model', text: `❌ เกิดข้อผิดพลาด: ${result.error}` }]);
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [...prev, { role: 'model', text: '❌ เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์' }]);
    } finally {
      setLoading(false);
    }
  };

  // Helper to format timestamps
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Simple renderer to extract markdown-like links and images dynamically
  const renderMessageContent = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      // Check for markdown image syntax: ![alt](url)
      const imgRegex = /!\[(.*?)\]\((.*?)\)/g;
      const match = imgRegex.exec(line);
      
      if (match) {
        const alt = match[1];
        const url = match[2];
        return (
          <div key={idx} className="my-3 flex flex-col items-center">
            <img 
              src={url} 
              alt={alt} 
              className="max-h-60 rounded-xl border border-slate-200 object-contain shadow-xs hover:scale-[1.02] transition-transform duration-200" 
              onError={(e) => {
                // If it fails to load, render a placeholder or alternative
                e.currentTarget.style.display = 'none';
              }}
            />
            <span className="mt-1 text-[11px] text-slate-500 italic">{alt || 'ภาพเอกสารอ้างอิง'}</span>
          </div>
        );
      }
      return <p key={idx} className="leading-relaxed mb-1">{line}</p>;
    });
  };

  return (
    <div className="flex h-screen flex-col bg-[#f5f5f7] text-[#1d1d1f] dark:bg-[#121212] dark:text-[#f5f5f7] font-sans">
      {/* Top Header */}
      <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 dark:border-slate-800 dark:bg-[#1c1c1e] shadow-xs">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBackToPortal}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-lg w-7 h-7 shadow-sm">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <h1 className="text-base font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-purple-400">QSMS DocAI RAG</h1>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
              <BrainCircuit className="h-3 w-3" /> ระบบสืบค้นเอกสารด้วย AI (Gemini 1.5)
            </p>
          </div>
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-semibold transition ${activeTab === 'chat' ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'}`}
          >
            <Bot className="h-3.5 w-3.5" /> แชทกับ AI
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-semibold transition ${activeTab === 'documents' ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'}`}
          >
            <FileText className="h-3.5 w-3.5" /> คลังความรู้ ({documents.length})
          </button>
        </div>
      </header>

      {/* Main Panel */}
      <main className="flex-1 overflow-hidden">
        {activeTab === 'chat' ? (
          <div className="flex h-full flex-col">
            {/* Chat Box */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50 dark:bg-[#121212]">
              {messages.map((m, idx) => (
                <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div 
                    className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-xs ${
                      m.role === 'user' 
                        ? 'bg-gradient-to-tr from-slate-800 to-slate-700 text-white rounded-br-none dark:from-slate-700 dark:to-slate-600' 
                        : 'bg-white/80 backdrop-blur-sm border border-indigo-100/50 text-[#1d1d1f] rounded-bl-none dark:bg-[#1c1c1e]/80 dark:border-indigo-900/30 dark:text-white shadow-[0_4px_20px_-4px_rgba(79,70,229,0.05)]'
                    }`}
                  >
                    {m.role === 'user' ? (
                      <p className="whitespace-pre-line leading-relaxed">{m.text}</p>
                    ) : (
                      <div className="flex gap-3">
                        <div className="shrink-0 mt-0.5">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shadow-sm">
                            <Bot className="h-3.5 w-3.5 text-white" />
                          </div>
                        </div>
                        <div className="flex-1 w-full overflow-hidden">
                          {renderMessageContent(m.text)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-none bg-white border border-slate-200 px-4 py-3.5 shadow-xs dark:bg-[#1c1c1e] dark:border-slate-800">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-purple-600" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-purple-600" style={{ animationDelay: '0.2s' }} />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-purple-600" style={{ animationDelay: '0.4s' }} />
                      <span className="text-xs text-slate-500">บอทกำลังประมวลผลข้อมูลเอกสารสเปก...</span>
                    </span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} className="border-t border-indigo-100/50 bg-white/80 backdrop-blur-xl p-4 dark:border-indigo-900/30 dark:bg-[#1c1c1e]/80 flex gap-3 shadow-[0_-8px_30px_rgba(0,0,0,0.04)] z-10">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
                  <Sparkles className="h-4 w-4 text-indigo-400" />
                </div>
                <input
                  type="text"
                  placeholder="ถาม AI เกี่ยวกับสเปกผลิตภัณฑ์ เช่น 'ขวด PTT MAX SPEED ใช้ฝาสีอะไร?'"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  disabled={loading}
                  className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/50 pl-10 pr-4 py-3.5 text-[13px] text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none dark:border-slate-700 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-[#1c1c1e] transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none"
              >
                <Send className="h-5 w-5 ml-0.5" />
              </button>
            </form>
          </div>
        ) : (
          <div className="grid h-full grid-cols-3 gap-6 p-6">
            {/* Left Upload Column */}
            <div className="col-span-1 flex flex-col gap-4 border-r border-slate-200 pr-6 dark:border-slate-800 overflow-hidden">
              <div className="flex flex-col gap-1">
                <h2 className="text-sm font-bold tracking-tight text-slate-800 dark:text-slate-200">นำเข้าสเปกขวดและข้อมูล Excel</h2>
                <p className="text-[11px] text-slate-400">อัปโหลดไฟล์ข้อมูลดิบเพื่อนำมาสร้างชุดข้อมูล RAG</p>
              </div>
              
              {/* Drag Area */}
              <label className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-300 bg-white p-6 text-center cursor-pointer hover:border-purple-600 transition hover:bg-slate-50/50 dark:border-slate-700 dark:bg-[#1c1c1e] dark:hover:bg-[#252528]">
                <UploadCloud className="h-8 w-8 text-purple-600" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">เลือกไฟล์เอกสาร (.pdf, .xlsx)</span>
                <span className="text-[10px] text-slate-400 leading-normal px-2">PDF แนะนำไม่เกิน 2MB หน้าเดียว | Excel ไม่เกิน 5MB</span>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.xlsx"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {/* Upload Progress Queue */}
              {uploadQueue.length > 0 && (
                <div className="flex-1 overflow-y-auto space-y-2 mt-2">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">คิวอัปโหลด</h3>
                  {uploadQueue.map(q => (
                    <div key={q.id} className="rounded-xl border border-slate-200/60 bg-white p-3 shadow-xs dark:border-slate-800 dark:bg-[#1c1c1e] flex flex-col gap-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-xs font-medium text-slate-700 dark:text-slate-300 max-w-[75%]">{q.file.name}</span>
                        {q.status === 'success' && <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />}
                        {q.status === 'failed' && <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />}
                        {q.status === 'uploading' && <span className="h-3 w-3 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />}
                        {q.status === 'processing' && <span className="h-3 w-3 animate-ping rounded-full bg-amber-500" />}
                      </div>
                      <div className="h-1 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div 
                          className="h-full rounded-full bg-[#5b21b6] transition-all duration-300"
                          style={{ width: `${q.progress}%` }}
                        />
                      </div>
                      {q.error && <p className="text-[9px] text-red-500 font-semibold">{q.error}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right List Column */}
            <div className="col-span-2 flex flex-col gap-4 overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <h2 className="text-sm font-bold tracking-tight text-slate-800 dark:text-slate-200">เอกสารสเปกที่แปลงแล้ว ({documents.length})</h2>
                  <p className="text-[11px] text-slate-400">ระบบประมวลผลเป็น Vector และพร้อมใช้งานสำหรับแชทสืบค้น</p>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                {documents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400">
                    <HelpCircle className="h-10 w-10 stroke-[1.5] text-slate-300 mb-2" />
                    <p className="text-xs">ยังไม่มีเอกสารใดในคลังข้อมูล</p>
                  </div>
                ) : (
                  documents.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-[#1c1c1e] hover:border-slate-300 dark:hover:border-slate-700 transition">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-purple-50 p-2 text-purple-600 dark:bg-purple-950/20">
                          <FileText className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-md">{doc.filename}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            ประเภท: {doc.file_type.toUpperCase()} • วันนำเข้า: {formatDate(doc.created_at)}
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-100 text-slate-400 hover:border-red-100 hover:text-red-500 hover:bg-red-50/50 dark:border-slate-800 transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
