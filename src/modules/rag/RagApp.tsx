'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Send, UploadCloud, FileText, CheckCircle2, AlertCircle, Trash2, HelpCircle, Sparkles, Bot, X, RotateCw } from 'lucide-react';
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
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Message {
  role: 'user' | 'model';
  text: string;
  suggestions?: string[];
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

// น้องผึ้งพา — ผู้ชาย พูดจาน่ารักไพเราะ อยากช่วยเหลือทุกคน
const WELCOME_MESSAGE = 'สวัสดีครับ ผมน้องผึ้งพาเองครับ ผู้ช่วยประจำโรงงาน QSMS ยินดีให้บริการทุกท่านเลยครับ! 🐝✨ ผมพูดจาไพเราะเป็นพิเศษ เพราะอยากให้ทุกคนรู้สึกดีเวลาคุยกับผมนะครับ คุณสามารถถามเรื่องสเปกขวด, ข้อมูลเอกสาร PDF หรือ Excel ที่อัปโหลดไว้ได้เลยครับ ผมพร้อมช่วยเสมอครับ!';

export function RagApp({ user, open, onOpenChange }: RagAppProps) {
  const [activeTab, setActiveTab] = useState<'chat' | 'documents'>('chat');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: WELCOME_MESSAGE }
  ]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<DocFile[]>([]);
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const [cooldown, setCooldown] = useState(0);
  const [previewImage, setPreviewImage] = useState<{url: string, alt: string} | null>(null);
  const [imageRotation, setImageRotation] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      fetchDocuments();
      // Focus input after open animation
      const timer = setTimeout(() => inputRef.current?.focus(), 400);
      return () => clearTimeout(timer);
    }
  }, [open]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

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
          setTimeout(() => {
            setUploadQueue(prev => prev.filter(q => q.id !== item.id));
          }, 3000);
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

  const handleSendMessage = async (e?: React.FormEvent, presetQuery?: string) => {
    if (e) e.preventDefault();
    const finalQuery = presetQuery || query;
    if (!finalQuery.trim() || loading || cooldown > 0) return;

    setQuery('');
    setMessages(prev => [...prev, { role: 'user', text: finalQuery }]);
    setLoading(true);

    try {
      // Send last 5 messages to provide context without overloading token limits
      const messageHistory = messages.slice(-5).map(m => ({ role: m.role, text: m.text }));
      
      const res = await fetch('/api/rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'chat', 
          message: finalQuery,
          messages: messageHistory
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP error ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No stream available');
      
      const decoder = new TextDecoder();
      let responseText = '';
      
      // Initialize an empty model message
      setMessages(prev => [...prev, { role: 'model', text: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunkText = decoder.decode(value, { stream: true });
        const lines = chunkText.split('\n\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const payload = JSON.parse(line.replace('data: ', ''));
              if (payload.type === 'text') {
                responseText += payload.data;
                // Update the last message in state
                setMessages(prev => {
                  const newMsgs = [...prev];
                  newMsgs[newMsgs.length - 1].text = responseText;
                  return newMsgs;
                });
              } else if (payload.type === 'error') {
                throw new Error(payload.data);
              }
            } catch (e) {
              // Ignore incomplete JSON chunks or parse errors from split
            }
          }
        }
      }

      // After streaming finishes, extract suggestion chips if any
      let suggestions: string[] = [];
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[1]);
          if (parsed.suggested_questions && Array.isArray(parsed.suggested_questions)) {
            suggestions = parsed.suggested_questions;
          }
        } catch (e) {
          console.error('Failed to parse suggestions:', e);
        }
        responseText = responseText.replace(jsonMatch[0], '').trim();
        
        setMessages(prev => {
          const newMsgs = [...prev];
          newMsgs[newMsgs.length - 1].text = responseText;
          newMsgs[newMsgs.length - 1].suggestions = suggestions;
          return newMsgs;
        });
      }

    } catch (err: any) {
      console.error('Chat error:', err);
      if (err.message?.includes('โทเคนลิมิตเต็ม') || err.message?.includes('RESOURCE_EXHAUSTED')) {
        setCooldown(60);
      }
      setMessages(prev => {
        const newMsgs = [...prev];
        // If the last message was the empty model response, replace it. Otherwise append.
        if (newMsgs[newMsgs.length - 1].role === 'model' && !newMsgs[newMsgs.length - 1].text) {
          newMsgs[newMsgs.length - 1].text = `❌ เกิดข้อผิดพลาด: ${err.message || 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้'}`;
        } else {
          newMsgs.push({ role: 'model', text: `❌ เกิดข้อผิดพลาด: ${err.message || 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้'}` });
        }
        return newMsgs;
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (response: string, is_positive: boolean) => {
    // Find the last user query to pair with this response
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    const queryUsed = lastUserMessage ? lastUserMessage.text : 'Unknown query';
    
    try {
      await fetch('/api/rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'feedback', query: queryUsed, response, is_positive })
      });
    } catch (e) {
      console.error('Failed to submit feedback', e);
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
              onClick={() => { setPreviewImage({ url, alt }); setImageRotation(0); }}
              className="max-h-60 rounded-xl border border-slate-200/50 object-contain shadow-sm hover:scale-[1.02] transition-transform duration-300 ease-out cursor-pointer"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <span className="mt-1 text-xs text-slate-500 italic">{alt || 'ภาพเอกสารอ้างอิง'}</span>
          </div>
        );
      }
      return <p key={idx} className="leading-relaxed mb-1.5">{line}</p>;
    });
  };

  return (
    <>
      <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <DialogPrimitive.Portal forceMount>
            {/* Overlay */}
            <DialogPrimitive.Overlay asChild forceMount>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                className="fixed inset-0 z-[100] bg-black/30 backdrop-blur-[6px]"
              />
            </DialogPrimitive.Overlay>

            {/* Content */}
            <DialogPrimitive.Content asChild forceMount onOpenAutoFocus={(e) => e.preventDefault()}>
              <motion.div
                initial={{ opacity: 0, scale: 0.85, y: 40 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 30 }}
                transition={{ type: 'spring', stiffness: 380, damping: 30, mass: 0.8 }}
                className="fixed inset-4 sm:inset-auto sm:bottom-8 sm:right-8 sm:top-auto sm:left-auto sm:w-[420px] sm:h-[600px] md:w-[480px] md:h-[680px] z-[101] flex flex-col rounded-2xl bg-white border border-slate-200/80 shadow-2xl shadow-black/10 overflow-hidden font-quicksand dark:bg-[#1c1c1e] dark:border-slate-700/60"
              >
                {/* Header */}
                <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full overflow-hidden border-2 border-amber-200/60 bg-amber-50 dark:bg-amber-900/30 dark:border-amber-700/40">
                        <img src="/img/nongbeepa_default.png" alt="น้องผึ้งพา" className="w-full h-full object-cover" />
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-[#1c1c1e] rounded-full" />
                    </div>
                    <div>
                      <DialogPrimitive.Title className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">น้องผึ้งพา</DialogPrimitive.Title>
                      <DialogPrimitive.Description className="text-xs text-amber-600 dark:text-amber-400 font-medium">Always Busy Helping • Online</DialogPrimitive.Description>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Tab Switcher */}
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
                      <button
                        onClick={() => setActiveTab('chat')}
                        className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-all ${
                          activeTab === 'chat'
                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                        }`}
                      >
                        <Bot className="h-3.5 w-3.5" /> แชท
                      </button>
                      <button
                        onClick={() => setActiveTab('documents')}
                        className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-all ${
                          activeTab === 'documents'
                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                        }`}
                      >
                        <FileText className="h-3.5 w-3.5" /> เอกสาร
                      </button>
                    </div>

                    <DialogPrimitive.Close className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors">
                      <X className="h-4 w-4" />
                    </DialogPrimitive.Close>
                  </div>
                </div>

                {/* Main Area */}
                {activeTab === 'chat' ? (
                  <div className="flex flex-1 flex-col overflow-hidden">
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                      <div className="flex justify-center">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                          Today
                        </span>
                      </div>

                      <AnimatePresence initial={false}>
                        {messages.map((m, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                            className="flex flex-col w-full"
                          >
                            <div className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                              {m.role === 'model' && (
                                <div className="shrink-0 mt-auto mr-2">
                                  <div className="flex items-center justify-center w-7 h-7 rounded-full overflow-hidden border border-amber-200/50 bg-amber-50 dark:bg-amber-900/30">
                                    <img src="/img/nongbeepa_default.png" alt="น้องผึ้งพา" className="w-full h-full object-cover" />
                                  </div>
                                </div>
                              )}
                              <div
                                className={`max-w-[80%] px-4 py-3 text-[13px] leading-relaxed ${
                                  m.role === 'user'
                                    ? 'bg-slate-900 text-white rounded-2xl rounded-br-md dark:bg-slate-700'
                                    : 'bg-slate-100 text-slate-800 rounded-2xl rounded-bl-md dark:bg-slate-800 dark:text-slate-200'
                                }`}
                              >
                                {m.role === 'user' ? (
                                  <p className="whitespace-pre-line">{m.text}</p>
                                ) : (
                                  <div className="font-medium relative group">
                                    {renderMessageContent(m.text)}
                                    {/* Feedback Loop */}
                                    {idx > 0 && !loading && (
                                      <div className="absolute -bottom-8 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 rounded-lg px-1.5 py-1 z-10">
                                        <button onClick={(e) => { e.currentTarget.style.color = '#10b981'; handleFeedback(m.text, true); }} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-emerald-500 transition-colors" title="คำตอบนี้ดี">
                                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"/></svg>
                                        </button>
                                        <div className="w-px h-3 bg-slate-200 dark:bg-slate-700"></div>
                                        <button onClick={(e) => { e.currentTarget.style.color = '#ef4444'; handleFeedback(m.text, false); }} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-red-500 transition-colors" title="คำตอบผิดพลาด">
                                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 14V2"/><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z"/></svg>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Suggestion Chips */}
                            {m.role === 'model' && m.suggestions && m.suggestions.length > 0 && idx === messages.length - 1 && (
                              <motion.div 
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="flex flex-wrap gap-2 mt-3 ml-9"
                              >
                                {m.suggestions.map((chip, cIdx) => (
                                  <button
                                    key={cIdx}
                                    onClick={() => handleSendMessage(undefined, chip)}
                                    className="px-3 py-1.5 text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded-full hover:bg-amber-100 dark:bg-amber-900/30 dark:border-amber-700/50 dark:text-amber-400 dark:hover:bg-amber-900/50 transition-colors shadow-sm"
                                  >
                                    {chip}
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </motion.div>
                        ))}

                        {loading && (
                          <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="flex justify-start"
                          >
                            <div className="shrink-0 mt-auto mr-2">
                              <div className="flex items-center justify-center w-7 h-7 rounded-full overflow-hidden border border-amber-200/50 bg-amber-50 dark:bg-amber-900/30">
                                <img src="/img/nongbeepa_default.png" alt="น้องผึ้งพา" className="w-full h-full object-cover" />
                              </div>
                            </div>
                            <div className="rounded-2xl rounded-bl-md bg-slate-100 dark:bg-slate-800 px-4 py-3">
                              <span className="flex items-center gap-1.5">
                                <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0 }} className="h-2 w-2 rounded-full bg-amber-500" />
                                <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.3 }} className="h-2 w-2 rounded-full bg-amber-400" />
                                <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.6 }} className="h-2 w-2 rounded-full bg-amber-300" />
                                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 ml-1">น้องผึ้งพากำลังหาคำตอบให้ครับ...</span>
                              </span>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <div ref={chatEndRef} />
                    </div>

                    {/* Input */}
                    <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-[#1c1c1e]">
                      {cooldown > 0 && (
                        <div className="flex items-center justify-center gap-2 mb-2 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-700/30">
                          <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">⏳ กรุณารอสักครู่ ({cooldown} วินาที) โควตาเต็มครับ</span>
                        </div>
                      )}
                      <form onSubmit={handleSendMessage} className="relative flex items-center">
                        <input
                          ref={inputRef}
                          type="text"
                          placeholder="พิมพ์ข้อความถึงน้องผึ้งพา..."
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          disabled={loading || cooldown > 0}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-4 pr-12 py-3 text-sm text-slate-900 dark:text-slate-200 placeholder-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 focus:outline-none dark:border-slate-700 dark:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.92 }}
                          type="submit"
                          disabled={loading || !query.trim() || cooldown > 0}
                          className="absolute right-1.5 flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-white shadow-sm transition-all disabled:opacity-40 disabled:shadow-none hover:bg-amber-600"
                        >
                          <Send className="h-3.5 w-3.5" />
                        </motion.button>
                      </form>
                      <p className="text-center mt-2 text-xs text-slate-400 font-medium flex items-center justify-center gap-1">
                        <Sparkles className="h-3 w-3 text-amber-400" /> Powered by QSMS DocAI
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Documents Tab */
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Upload */}
                    <div className="space-y-3">
                      <div>
                        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">นำเข้าเอกสาร</h2>
                        <p className="text-xs text-slate-400 mt-0.5">อัปโหลด PDF หรือ Excel เพื่อสร้างชุดข้อมูล RAG</p>
                      </div>
                      <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-5 text-center cursor-pointer hover:border-amber-400 hover:bg-amber-50/30 transition dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-800/80">
                        <UploadCloud className="h-7 w-7 text-amber-500" />
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">เลือกไฟล์ (.pdf, .xlsx, .jpg, .png)</span>
                        <span className="text-xs text-slate-400 mt-1">PDF ≤ 2MB | Excel ≤ 5MB | Image ≤ 5MB</span>
                        <input
                          type="file"
                          multiple
                          accept=".pdf,.xlsx,.xls,.jpg,.jpeg,.png"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* Upload Queue */}
                    {uploadQueue.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">คิวอัปโหลด</h3>
                        <AnimatePresence>
                          {uploadQueue.map(q => (
                            <motion.div
                              key={q.id}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95, height: 0, marginTop: 0, marginBottom: 0, padding: 0, overflow: 'hidden' }}
                              transition={{ duration: 0.2 }}
                              className="rounded-lg border border-slate-100 bg-white p-3 dark:border-slate-800 dark:bg-[#1c1c1e] space-y-1.5"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <span className="truncate text-xs font-medium text-slate-700 dark:text-slate-300">{q.file.name}</span>
                                  {q.status === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />}
                                  {q.status === 'failed' && <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />}
                                  {q.status === 'uploading' && <span className="h-3 w-3 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />}
                                  {q.status === 'processing' && <span className="h-3 w-3 animate-ping rounded-full bg-amber-400" />}
                                </div>
                                {(q.status === 'failed' || q.status === 'success') && (
                                  <button onClick={() => setUploadQueue(prev => prev.filter(item => item.id !== q.id))} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 shrink-0 transition-colors">
                                    <X className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                              <div className="h-1 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${q.status === 'failed' ? 'bg-red-500' : 'bg-amber-500'}`}
                                  style={{ width: `${q.progress}%` }}
                                />
                              </div>
                              {q.error && <p className="text-xs text-red-500/90 font-medium max-h-24 overflow-y-auto leading-relaxed pr-2 scrollbar-thin scrollbar-thumb-red-200 dark:scrollbar-thumb-red-900/50">{q.error}</p>}
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    )}

                    {/* Document List */}
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">เอกสารที่พร้อมใช้ ({documents.length})</h3>
                      {documents.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
                          <HelpCircle className="h-8 w-8 stroke-[1.5] text-slate-300 mb-2" />
                          <p className="text-xs">ยังไม่มีเอกสารในคลังข้อมูล</p>
                        </div>
                      ) : (
                        documents.map(doc => (
                          <div key={doc.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-3 dark:border-slate-800 dark:bg-[#1c1c1e] hover:border-amber-200 hover:shadow-sm transition">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="rounded-lg bg-amber-50 p-2 text-amber-600 border border-amber-100 dark:bg-amber-900/30 dark:border-amber-800/30 shrink-0">
                                <FileText className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{doc.filename}</p>
                                <p className="text-xs text-slate-400 mt-0.5 font-medium">
                                  {doc.file_type.toUpperCase()} • {formatDate(doc.created_at)}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleDeleteDocument(doc.id)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 transition shrink-0"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
      </DialogPrimitive.Root>

      {/* Image Preview Modal */}
      <AnimatePresence>
        {previewImage && (
          <DialogPrimitive.Root open={!!previewImage} onOpenChange={(o) => !o && setPreviewImage(null)}>
            <DialogPrimitive.Portal forceMount>
              <DialogPrimitive.Overlay asChild forceMount>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm"
                />
              </DialogPrimitive.Overlay>
              <DialogPrimitive.Content asChild forceMount>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  className="fixed inset-0 z-[120] flex items-center justify-center p-4 md:p-10 pointer-events-none"
                >
                  <div className="relative w-full h-full flex flex-col items-center justify-center pointer-events-auto">
                    {/* Top Action Bar */}
                    <div className="absolute top-4 right-4 flex items-center gap-3 z-[130]">
                      <button
                        onClick={() => setImageRotation(prev => prev + 90)}
                        className="flex items-center justify-center h-10 w-10 rounded-full bg-white/10 text-white hover:bg-white/20 transition backdrop-blur-md border border-white/20"
                        title="หมุนภาพ"
                      >
                        <RotateCw size={20} />
                      </button>
                      <button
                        onClick={() => setPreviewImage(null)}
                        className="flex items-center justify-center h-10 w-10 rounded-full bg-white/10 text-white hover:bg-white/20 transition backdrop-blur-md border border-white/20"
                        title="ปิด"
                      >
                        <X size={20} />
                      </button>
                    </div>

                    {/* Image Container */}
                    <motion.img
                      src={previewImage.url}
                      alt={previewImage.alt}
                      animate={{ rotate: imageRotation }}
                      transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                      className="max-w-full max-h-full object-contain rounded-lg drop-shadow-2xl"
                    />
                    {previewImage.alt && (
                      <div className="absolute bottom-6 px-4 py-2 bg-black/60 backdrop-blur-md text-white/90 text-sm rounded-full max-w-[80%] text-center border border-white/10 shadow-lg">
                        {previewImage.alt}
                      </div>
                    )}
                  </div>
                </motion.div>
              </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
          </DialogPrimitive.Root>
        )}
      </AnimatePresence>
    </>
  );
}
