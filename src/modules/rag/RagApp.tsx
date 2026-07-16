'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Send, UploadCloud, FileText, CheckCircle2, AlertCircle, Trash2, HelpCircle, Sparkles, Bot, X, RotateCw, Eye } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { User } from '../../services/auth';
import { useNotification } from '@/src/contexts/NotificationContext';

const supabaseUrl = process.env.NEXT_PUBLIC_RAG_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co';
// Client-safe anonymous key used in frontend
const supabaseAnonKey = process.env.NEXT_PUBLIC_RAG_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-key-to-prevent-crash';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

if (typeof window !== 'undefined' && !process.env.NEXT_PUBLIC_RAG_SUPABASE_ANON_KEY && !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn('⚠️ NEXT_PUBLIC_SUPABASE_ANON_KEY is missing in .env. Supabase client features will fail.');
}

interface RagAppProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface MessageSource {
  content: string;
  image_urls?: string[];
  similarity: number;
}

interface Message {
  role: 'user' | 'model';
  text: string;
  suggestions?: string[];
  sources?: MessageSource[];
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

const WELCOME_MESSAGE = 'สวัสดีครับ ผมคือ QSMS AI Assistant ยินดีให้บริการครับ \n\nผมสามารถช่วยคุณค้นหาข้อมูลจากคู่มือ (PDF/Excel) หรือตรวจสอบสถิติข้อมูลจริงในระบบได้ พิมพ์คำถามของคุณได้เลยครับ';

export function RagApp({ user, open, onOpenChange }: RagAppProps) {
  const { showAlert, showConfirm } = useNotification();
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
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [inspectingDoc, setInspectingDoc] = useState<DocFile | null>(null);
  const [inspectingChunks, setInspectingChunks] = useState<Array<{ id: string; content: string; image_urls?: string[] }>>([]);
  const [loadingChunks, setLoadingChunks] = useState(false);

  const fetchDocumentChunks = async (doc: DocFile) => {
    setInspectingDoc(doc);
    setLoadingChunks(true);
    setInspectingChunks([]);
    try {
      const res = await fetch('/api/rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_document_chunks', documentId: doc.id })
      });
      const result = await res.json();
      if (result.success) {
        setInspectingChunks(result.data || []);
      } else {
        showAlert('ไม่สามารถดึงข้อมูลชิ้นส่วนได้: ' + result.error, 'error');
      }
    } catch (err) {
      console.error('Error fetching document chunks:', err);
      showAlert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์', 'error');
    } finally {
      setLoadingChunks(false);
    }
  };

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
        setSelectedDocs(new Set());
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    showConfirm('คุณแน่ใจหรือไม่ว่าต้องการลบเอกสารนี้? ข้อมูลเวกเตอร์จะถูกลบทั้งหมด', async () => {
      try {
        const res = await fetch('/api/rag', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ action: 'delete_document', id })
        });
        const result = await res.json();
        if (result.success) {
          setDocuments(prev => prev.filter(d => d.id !== id));
        } else {
          showAlert('เกิดข้อผิดพลาดในการลบเอกสาร: ' + result.error, 'error');
        }
      } catch (err) {
        console.error('Delete error:', err);
      }
    });
  };

  const handleToggleSelect = (id: string) => {
    const newSet = new Set(selectedDocs);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedDocs(newSet);
  };

  const handleSelectAll = () => {
    if (selectedDocs.size === documents.length && documents.length > 0) {
      setSelectedDocs(new Set());
    } else {
      setSelectedDocs(new Set(documents.map(d => d.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedDocs.size === 0) return;
    setIsBulkDeleting(true);
    try {
      const res = await fetch('/api/rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'bulk_delete_documents', ids: Array.from(selectedDocs) })
      });
      const result = await res.json();
      if (result.success) {
        setDocuments(prev => prev.filter(d => !selectedDocs.has(d.id)));
        setSelectedDocs(new Set());
        setShowDeleteModal(false);
      } else {
        showAlert('เกิดข้อผิดพลาดในการลบเอกสาร: ' + result.error, 'error');
      }
    } catch (err) {
      console.error('Bulk delete error:', err);
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Helper to convert File object to Base64 helper
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

  // Process the file upload queue sequentially (concurrency control)
  const processQueue = async (itemsToProcess: UploadQueueItem[]) => {
    for (const item of itemsToProcess) {
      setUploadQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'uploading', progress: 20 } : q));

      try {
        const fileType = item.file.name.endsWith('.xlsx') ? 'xlsx' : 'pdf';
        const imageUrls: string[] = []; // No longer extracting images on the frontend to avoid pdf.js errors

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
              if (payload.type === 'metadata') {
                setMessages(prev => {
                  const newMsgs = [...prev];
                  newMsgs[newMsgs.length - 1].sources = payload.data?.sources;
                  return newMsgs;
                });
              } else if (payload.type === 'text') {
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

    } catch (err: unknown) {
      console.error('Chat error:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage.includes('โทเคนลิมิตเต็ม') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
        setCooldown(60);
      }
      setMessages(prev => {
        const newMsgs = [...prev];
        // If the last message was the empty model response, replace it. Otherwise append.
        if (newMsgs[newMsgs.length - 1].role === 'model' && !newMsgs[newMsgs.length - 1].text) {
          newMsgs[newMsgs.length - 1].text = `❌ เกิดข้อผิดพลาด: ${errorMessage || 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้'}`;
        } else {
          newMsgs.push({ role: 'model', text: `❌ เกิดข้อผิดพลาด: ${errorMessage || 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้'}` });
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
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="fixed inset-0 z-[100] bg-black/30 backdrop-blur-[6px]"
              />
            </DialogPrimitive.Overlay>

            {/* Content */}
            <DialogPrimitive.Content asChild forceMount onOpenAutoFocus={(e) => e.preventDefault()}>
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } }}
                exit={{ x: '100%', transition: { duration: 0.3, ease: 'easeIn' } }}
                className="fixed top-0 right-0 bottom-0 w-[420px] max-w-[100vw] z-[101] flex flex-col bg-white border-l border-slate-200/80 shadow-2xl overflow-hidden font-quicksand dark:bg-[#1c1c1e] dark:border-slate-700/60"
              >
                {/* Header */}
                <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-blue-200/60 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-700/40 text-blue-600 dark:text-blue-400">
                        <Bot size={20} />
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-[#1c1c1e] rounded-full" />
                    </div>
                    <div>
                      <DialogPrimitive.Title className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">QSMS Assistant</DialogPrimitive.Title>
                      <DialogPrimitive.Description className="text-xs text-blue-600 dark:text-blue-400 font-medium">DocAI & Data Analyst</DialogPrimitive.Description>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Tab Switcher */}
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg relative">
                      <button
                        onClick={() => setActiveTab('chat')}
                        className={`relative flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors z-10 ${
                          activeTab === 'chat'
                            ? 'text-slate-900 dark:text-white'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                        }`}
                      >
                        {activeTab === 'chat' && (
                          <motion.div layoutId="rag-tab-indicator" className="absolute inset-0 bg-white dark:bg-slate-700 shadow-sm rounded-md -z-10" transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} />
                        )}
                        <Bot className="h-3.5 w-3.5" /> แชท
                      </button>
                      <button
                        onClick={() => setActiveTab('documents')}
                        className={`relative flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors z-10 ${
                          activeTab === 'documents'
                            ? 'text-slate-900 dark:text-white'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                        }`}
                      >
                        {activeTab === 'documents' && (
                          <motion.div layoutId="rag-tab-indicator" className="absolute inset-0 bg-white dark:bg-slate-700 shadow-sm rounded-md -z-10" transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} />
                        )}
                        <FileText className="h-3.5 w-3.5" /> เอกสาร
                      </button>
                    </div>

                    {activeTab === 'chat' && (
                      <button 
                        onClick={() => { 
                          showConfirm('ต้องการล้างประวัติการแชทหรือไม่?', () => {
                            setMessages([{ role: 'model', text: WELCOME_MESSAGE }]);
                          });
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                        title="ล้างประวัติการแชท"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}

                    <DialogPrimitive.Close className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors">
                      <X className="h-4 w-4" />
                    </DialogPrimitive.Close>
                  </div>
                </div>

                {/* Main Area Container */}
                <div className="relative flex-1 overflow-hidden">
                  
                  {/* Chat Tab */}
                  <div className={`absolute inset-0 flex-col overflow-hidden ${activeTab === 'chat' ? 'flex z-10' : 'hidden z-0'}`}>
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
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                            className="flex flex-col w-full origin-bottom"
                          >
                            <div className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                              {m.role === 'model' && (
                                <div className="shrink-0 mt-auto mr-2">
                                  <div className="flex items-center justify-center w-7 h-7 rounded-full border border-blue-200/50 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                    <Bot size={14} />
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
                            
                            {/* Sources Accordion */}
                            {m.role === 'model' && m.sources && m.sources.length > 0 && (
                              <div className="mt-2 ml-9">
                                <details className="group [&_summary::-webkit-details-marker]:hidden">
                                  <summary className="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors dark:text-slate-400">
                                    <FileText size={12} />
                                    <span>อ้างอิงจาก {m.sources.length} แหล่งข้อมูล</span>
                                    <span className="transition duration-300 group-open:-rotate-180">
                                      <svg fill="none" height="12" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="12"><path d="M6 9l6 6 6-6"></path></svg>
                                    </span>
                                  </summary>
                                  <div className="mt-2 flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50/50 p-2.5 dark:border-slate-700 dark:bg-slate-800/50">
                                    {m.sources.map((src, sIdx) => (
                                      <div key={sIdx} className="text-[11px] text-slate-600 dark:text-slate-300 bg-white dark:bg-[#1c1c1e] p-2 rounded border border-slate-100 dark:border-slate-700/50 shadow-sm leading-relaxed whitespace-pre-wrap">
                                        <div className="font-semibold text-blue-600 dark:text-blue-400 mb-1">ส่วนที่ {sIdx + 1}</div>
                                        {src.content.length > 200 ? src.content.substring(0, 200) + '...' : src.content}
                                      </div>
                                    ))}
                                  </div>
                                </details>
                              </div>
                            )}
                            
                            {/* Suggestion Chips */}
                            {m.role === 'model' && m.suggestions && m.suggestions.length > 0 && idx === messages.length - 1 && (
                              <motion.div 
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
                                className="flex flex-wrap gap-2 mt-3 ml-9"
                              >
                                {m.suggestions.map((chip, cIdx) => (
                                  <button
                                    key={cIdx}
                                    onClick={() => handleSendMessage(undefined, chip)}
                                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-full hover:bg-slate-50 hover:border-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700/80 transition-colors shadow-sm"
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
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } }}
                            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                            className="flex justify-start origin-bottom"
                          >
                            <div className="shrink-0 mt-auto mr-2">
                              <div className="flex items-center justify-center w-7 h-7 rounded-full border border-blue-200/50 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                <Bot size={14} />
                              </div>
                            </div>
                            <div className="rounded-2xl rounded-bl-md bg-slate-100 dark:bg-slate-800 px-4 py-3">
                              <span className="flex items-center gap-1.5">
                                <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.6 }} className="h-2 w-2 rounded-full bg-blue-400" />
                                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 ml-1">กำลังค้นหาข้อมูลและสรุปคำตอบ...</span>
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
                        <div className="flex items-center justify-center gap-2 mb-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">⏳ กรุณารอสักครู่ ({cooldown} วินาที) โควตาเต็มครับ</span>
                        </div>
                      )}
                      <form onSubmit={handleSendMessage} className="relative flex items-center">
                        <input
                          ref={inputRef}
                          type="text"
                          placeholder="พิมพ์ข้อความถึง QSMS Assistant..."
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          disabled={loading || cooldown > 0}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-4 pr-12 py-3 text-sm text-slate-900 dark:text-slate-200 placeholder-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-400/20 focus:outline-none dark:border-slate-700 dark:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          transition={{ duration: 0.15, ease: 'easeOut' }}
                          type="submit"
                          disabled={loading || !query.trim() || cooldown > 0}
                          className="absolute right-1.5 flex h-8 w-8 items-center justify-center rounded-lg bg-[#1d1d1f] text-white shadow-sm transition-all disabled:opacity-40 disabled:shadow-none hover:bg-black dark:bg-slate-700 dark:hover:bg-slate-600"
                        >
                          <Send className="h-3.5 w-3.5" />
                        </motion.button>
                      </form>
                      <p className="text-center mt-2 text-xs text-slate-400 font-medium flex items-center justify-center gap-1">
                        <Sparkles className="h-3 w-3 text-blue-500" /> Powered by QSMS DocAI
                      </p>
                    </div>
                  </div>

                  {/* Documents Tab */}
                  <div className={`absolute inset-0 flex-col overflow-y-auto p-4 space-y-4 ${activeTab === 'documents' ? 'flex z-10' : 'hidden z-0'}`}>
                    {/* Upload */}
                    <div className="space-y-3">
                      <div>
                        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">นำเข้าเอกสาร</h2>
                        <p className="text-xs text-slate-400 mt-0.5">อัปโหลด PDF หรือ Excel เพื่อสร้างชุดข้อมูล RAG</p>
                      </div>
                      <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-5 text-center cursor-pointer hover:border-slate-400 hover:bg-slate-100 transition dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-500">
                        <UploadCloud className="h-7 w-7 text-slate-600 dark:text-slate-400" />
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
                              layout
                              initial={{ opacity: 0, scale: 0.95, y: -10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, height: 0, marginTop: 0, marginBottom: 0, padding: 0, overflow: 'hidden' }}
                              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                              className="rounded-lg border border-slate-100 bg-white p-3 dark:border-slate-800 dark:bg-[#1c1c1e] space-y-1.5 origin-top"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <span className="truncate text-xs font-medium text-slate-700 dark:text-slate-300">{q.file.name}</span>
                                  {q.status === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />}
                                  {q.status === 'failed' && <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />}
                                  {q.status === 'uploading' && <span className="h-3 w-3 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />}
                                  {q.status === 'processing' && <span className="h-3 w-3 animate-ping rounded-full bg-blue-400" />}
                                </div>
                                {(q.status === 'failed' || q.status === 'success') && (
                                  <button onClick={() => setUploadQueue(prev => prev.filter(item => item.id !== q.id))} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 shrink-0 transition-colors">
                                    <X className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                              <div className="h-1 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${q.status === 'failed' ? 'bg-red-500' : 'bg-blue-500'}`}
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
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">เอกสารที่พร้อมใช้ ({documents.length})</h3>
                        {documents.length > 0 && (
                          <div className="flex items-center gap-3">
                            <label className="flex items-center gap-1.5 cursor-pointer group">
                              <div className="relative flex items-center justify-center">
                                <input
                                  type="checkbox"
                                  className="peer appearance-none w-4 h-4 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-[#1c1c1e] checked:bg-blue-600 checked:border-blue-600 transition-colors cursor-pointer"
                                  checked={documents.length > 0 && selectedDocs.size === documents.length}
                                  onChange={handleSelectAll}
                                />
                                <CheckCircle2 className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none stroke-[3]" />
                              </div>
                              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">เลือกทั้งหมด</span>
                            </label>
                            {selectedDocs.size > 0 && (
                              <button
                                onClick={() => setShowDeleteModal(true)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 text-xs font-bold transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> ลบที่เลือก ({selectedDocs.size})
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      {documents.length === 0 ? (
                        <motion.div 
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1, duration: 0.3 }}
                          className="flex flex-col items-center justify-center py-12 text-center text-slate-400"
                        >
                          <HelpCircle className="h-8 w-8 stroke-[1.5] text-slate-300 mb-2" />
                          <p className="text-xs">ยังไม่มีเอกสารในคลังข้อมูล</p>
                        </motion.div>
                      ) : (
                        <div className="space-y-2 relative">
                          <AnimatePresence mode="popLayout">
                            {documents.map((doc, idx) => (
                              <motion.label 
                                layout
                                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95, filter: 'blur(2px)' }}
                                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1], delay: Math.min(idx * 0.03, 0.3) }}
                                key={doc.id} 
                                className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-3 dark:border-slate-800 dark:bg-[#1c1c1e] hover:border-blue-200 hover:shadow-sm transition cursor-pointer group"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="relative flex items-center justify-center shrink-0">
                                    <input
                                      type="checkbox"
                                      className="peer appearance-none w-4 h-4 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-[#1c1c1e] checked:bg-blue-600 checked:border-blue-600 transition-colors cursor-pointer"
                                      checked={selectedDocs.has(doc.id)}
                                      onChange={() => handleToggleSelect(doc.id)}
                                    />
                                    <CheckCircle2 className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none stroke-[3]" />
                                  </div>
                                  <div className="rounded-lg bg-blue-50 p-2 text-blue-600 border border-blue-100 dark:bg-blue-900/30 dark:border-blue-800/30 shrink-0 transition-colors group-hover:bg-blue-100 group-hover:border-blue-200 dark:group-hover:bg-blue-900/50">
                                    <FileText className="h-4 w-4" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{doc.filename}</p>
                                    <p className="text-xs text-slate-400 mt-0.5 font-medium">
                                      {doc.file_type.toUpperCase()} • {formatDate(doc.created_at)}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); fetchDocumentChunks(doc); }}
                                    className="flex h-7 w-7 items-center justify-center rounded-lg text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 transition"
                                    title="ส่องดูชิ้นส่วนเวกเตอร์ (Vector Chunks)"
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteDocument(doc.id); }}
                                    className="flex h-7 w-7 items-center justify-center rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 transition"
                                    title="ลบเอกสารนี้"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </motion.label>
                            ))}
                          </AnimatePresence>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
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
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } }}
                  exit={{ opacity: 0, scale: 0.95, y: 10, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } }}
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
                      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
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

      {/* Bulk Delete Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <DialogPrimitive.Root open={showDeleteModal} onOpenChange={setShowDeleteModal}>
            <DialogPrimitive.Portal forceMount>
              <DialogPrimitive.Overlay asChild forceMount>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-sm"
                />
              </DialogPrimitive.Overlay>
              <DialogPrimitive.Content asChild forceMount>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } }}
                  exit={{ opacity: 0, scale: 0.95, y: 10, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } }}
                  className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[120] w-[90vw] max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-[#1c1c1e] dark:border dark:border-slate-800"
                >
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                      <AlertCircle className="h-6 w-6" />
                    </div>
                    <div>
                      <DialogPrimitive.Title className="text-lg font-bold text-slate-900 dark:text-white">
                        ยืนยันการลบ
                      </DialogPrimitive.Title>
                      <DialogPrimitive.Description className="mt-2 text-sm text-slate-500 dark:text-slate-400 font-medium">
                        คุณกำลังจะลบเอกสารจำนวน <span className="font-bold text-red-600 dark:text-red-400">{selectedDocs.size} ไฟล์</span> <br/> ข้อมูลเวกเตอร์ที่เกี่ยวข้องทั้งหมดจะถูกลบถาวร
                      </DialogPrimitive.Description>
                    </div>
                    <div className="flex w-full gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowDeleteModal(false)}
                        disabled={isBulkDeleting}
                        className="flex-1 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                      >
                        ยกเลิก
                      </button>
                      <button
                        type="button"
                        onClick={handleBulkDelete}
                        disabled={isBulkDeleting}
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition disabled:opacity-50"
                      >
                        {isBulkDeleting ? (
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        ) : (
                          'ลบเอกสาร'
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
          </DialogPrimitive.Root>
        )}
      </AnimatePresence>

      {/* Vector Chunks Inspector Modal */}
      <AnimatePresence>
        {inspectingDoc && (
          <DialogPrimitive.Root open={!!inspectingDoc} onOpenChange={(o) => !o && setInspectingDoc(null)}>
            <DialogPrimitive.Portal forceMount>
              <DialogPrimitive.Overlay asChild forceMount>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-sm"
                />
              </DialogPrimitive.Overlay>
              <DialogPrimitive.Content asChild forceMount>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } }}
                  exit={{ opacity: 0, scale: 0.95, y: 10, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } }}
                  className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[120] w-[90vw] max-w-xl max-h-[80vh] rounded-2xl bg-white p-6 shadow-2xl dark:bg-[#1c1c1e] dark:border dark:border-slate-800 flex flex-col"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 shrink-0">
                    <div className="min-w-0 flex-1">
                      <DialogPrimitive.Title className="text-base font-bold text-slate-900 dark:text-white truncate pr-4">
                        ส่องเวกเตอร์: {inspectingDoc.filename}
                      </DialogPrimitive.Title>
                      <DialogPrimitive.Description className="text-xs text-slate-400 mt-0.5">
                        แสดงชิ้นส่วนเนื้อหา (Chunks) ที่จัดเก็บเพื่อทำ Semantic Search ใน AI
                      </DialogPrimitive.Description>
                    </div>
                    <button
                      onClick={() => setInspectingDoc(null)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
                    {loadingChunks ? (
                      <div className="flex flex-col items-center justify-center py-12 space-y-2">
                        <span className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                        <span className="text-xs text-slate-500 font-semibold">กำลังดึงข้อมูลเวกเตอร์ชิ้นส่วน...</span>
                      </div>
                    ) : inspectingChunks.length === 0 ? (
                      <div className="text-center py-12 text-xs text-slate-400">
                        ไม่พบข้อมูลเวกเตอร์ชิ้นส่วนในระบบ
                      </div>
                    ) : (
                      inspectingChunks.map((chunk, index) => (
                        <div
                          key={chunk.id}
                          className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold text-[10px]">
                              ชิ้นส่วนที่ #{index + 1}
                            </span>
                            <span className="text-[10px] text-slate-400 truncate max-w-[200px]">
                              ID: {chunk.id}
                            </span>
                          </div>
                          <p className="whitespace-pre-wrap select-all font-mono leading-relaxed">{chunk.content}</p>
                          {chunk.image_urls && chunk.image_urls.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {chunk.image_urls.map((url, i) => (
                                <img
                                  key={i}
                                  src={url}
                                  alt={`image-${i}`}
                                  className="h-12 w-12 rounded object-cover border border-slate-200 dark:border-slate-700"
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      ))
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
