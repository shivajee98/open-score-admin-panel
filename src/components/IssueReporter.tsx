'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
    MessageSquare, 
    X, 
    Upload, 
    Send, 
    CheckCircle2, 
    AlertCircle, 
    Loader2, 
    ChevronLeft, 
    Clock, 
    User,
    MessageCircle,
    ArrowRight,
    Shield
} from 'lucide-react';
import { apiFetch, getStorageUrl } from '@/lib/api';
import { toast } from 'sonner';

interface Message {
    id: number;
    message: string;
    is_admin: boolean;
    created_at: string;
}

interface Issue {
    id: number;
    description: string;
    app_name: string;
    status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
    messages_count: number;
    created_at: string;
    screenshot_path?: string;
}

interface IssueReporterProps {
    appName: string;
}

const IssueReporter: React.FC<IssueReporterProps> = ({ appName }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [view, setView] = useState<'HOME' | 'NEW' | 'CHAT'>('HOME');
    const [issues, setIssues] = useState<Issue[]>([]);
    const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    
    const [description, setDescription] = useState('');
    const [screenshot, setScreenshot] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingIssues, setIsLoadingIssues] = useState(false);
    const [isLoadingChat, setIsLoadingChat] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [isSendingReply, setIsSendingReply] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initial Fetch of User's Issues
    useEffect(() => {
        if (isOpen && view === 'HOME') {
            fetchMyIssues();
        }
    }, [isOpen, view]);

    // Polling for Chat Messages
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isOpen && view === 'CHAT' && selectedIssue) {
            fetchChatMessages(selectedIssue.id);
            interval = setInterval(() => {
                fetchChatMessages(selectedIssue.id, true);
            }, 5000);
        }
        return () => clearInterval(interval);
    }, [isOpen, view, selectedIssue]);

    useEffect(() => {
        if (view === 'CHAT') {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, view]);

    const fetchMyIssues = async () => {
        setIsLoadingIssues(true);
        try {
            const data = await apiFetch('/my-reported-issues');
            setIssues(data || []);
        } catch (error) {
            console.error('Failed to fetch issues:', error);
        } finally {
            setIsLoadingIssues(false);
        }
    };

    const fetchChatMessages = async (issueId: number, isPolling = false) => {
        if (!isPolling) setIsLoadingChat(true);
        try {
            const data = await apiFetch(`/reported-issues/${issueId}/messages`);
            setMessages(data.messages || []);
        } catch (error) {
            console.error('Failed to fetch chat:', error);
        } finally {
            if (!isPolling) setIsLoadingChat(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 5 * 1024 * 1024) {
                toast.error('File size too large. Max 5MB allowed.');
                return;
            }
            setScreenshot(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmitNewIssue = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!description.trim()) {
            toast.error('Please describe your issue.');
            return;
        }

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('description', description);
            formData.append('app_name', appName);
            if (screenshot) {
                formData.append('screenshot', screenshot);
            }
            formData.append('metadata', JSON.stringify({
                url: window.location.href,
                userAgent: navigator.userAgent,
                timestamp: new Date().toISOString()
            }));

            await apiFetch('/report-issue', {
                method: 'POST',
                body: formData
            });

            toast.success('Your report has been submitted.');
            setDescription('');
            setScreenshot(null);
            setPreviewUrl(null);
            setView('HOME');
            fetchMyIssues();
        } catch (error: any) {
            toast.error(error.message || 'Failed to submit report.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSendReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyText.trim() || !selectedIssue) return;

        setIsSendingReply(true);
        try {
            await apiFetch(`/reported-issues/${selectedIssue.id}/messages`, {
                method: 'POST',
                body: JSON.stringify({ message: replyText })
            });
            setReplyText('');
            fetchChatMessages(selectedIssue.id, true);
        } catch (error: any) {
            toast.error(error.message || 'Failed to send message.');
        } finally {
            setIsSendingReply(false);
        }
    };

    const openChat = (issue: Issue) => {
        setSelectedIssue(issue);
        setView('CHAT');
        setMessages([]);
    };

    return (
        <div className="fixed bottom-6 right-6 z-[9999] no-print">
            {/* Trigger Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="group relative flex items-center gap-2 bg-slate-900/90 hover:bg-slate-950 text-white px-3 py-2 rounded-full shadow-2xl backdrop-blur-md border border-white/10 transition-all duration-300 hover:scale-105 active:scale-95"
                >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 transition-colors">
                        <MessageSquare className="w-1 h-1 text-white" />
                    </div>
                    <span className="font-bold pr-1">Support & Feedback</span>
                    
                    <span className="absolute -top-1 -right-1 flex h-1 w-1">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1 w-1 bg-blue-500"></span>
                    </span>
                </button>
            )}

            {/* Main Widget Container */}
            {isOpen && (
                <div className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 w-full sm:w-[420px] h-full sm:h-[600px] animate-in slide-in-from-bottom-10 fade-in duration-300">
                    <div className="bg-white/95 dark:bg-slate-950 border border-black/10 dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-3xl h-full flex flex-col overflow-hidden backdrop-blur-2xl">
                        
                        {/* Header */}
                        <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-700 flex items-center justify-between shadow-lg">
                            <div className="flex items-center gap-3">
                                {view !== 'HOME' ? (
                                    <button 
                                        onClick={() => setView('HOME')}
                                        className="p-1 hover:bg-white/20 rounded-lg text-white transition-colors"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                ) : (
                                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                                        <AlertCircle className="w-4 h-4 text-white" />
                                    </div>
                                )}
                                <div>
                                    <h3 className="font-bold text-white text-sm">
                                        {view === 'HOME' ? 'Support Center' : view === 'NEW' ? 'New Report' : `Issue #${selectedIssue?.id}`}
                                    </h3>
                                    {view === 'HOME' && <p className="text-[10px] text-white/70 font-medium">How can we help you today?</p>}
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-white/20 rounded-full text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-transparent">
                            
                            {/* HOME VIEW: List of Issues */}
                            {view === 'HOME' && (
                                <div className="flex-1 flex flex-col overflow-hidden">
                                    <div className="p-4 space-y-4 flex-1 overflow-y-auto custom-scrollbar">
                                        <button 
                                            onClick={() => setView('NEW')}
                                            className="w-full p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl flex items-center justify-between shadow-md transition-all group"
                                        >
                                            <div className="flex items-center gap-3 text-left">
                                                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                                                    <MessageSquare className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm">Report a Fresh Issue</p>
                                                    <p className="text-[10px] text-white/70">Found a bug? Tell us about it.</p>
                                                </div>
                                            </div>
                                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </button>

                                        <div className="space-y-3 pt-2">
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Your Recent Conversations</h4>
                                            
                                            {isLoadingIssues ? (
                                                <div className="flex items-center justify-center py-10">
                                                    <Loader2 className="w-6 h-6 animate-spin text-blue-500/50" />
                                                </div>
                                            ) : issues.length === 0 ? (
                                                <div className="text-center py-20 px-8 opacity-40">
                                                    <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-800 mx-auto flex items-center justify-center mb-4">
                                                        <MessageCircle className="w-6 h-6" />
                                                    </div>
                                                    <p className="text-xs font-medium">No prior issues reported yet.</p>
                                                </div>
                                            ) : (
                                                issues.map(issue => (
                                                    <div 
                                                        key={issue.id} 
                                                        onClick={() => openChat(issue)}
                                                        className="bg-white dark:bg-slate-900 border border-black/5 dark:border-white/5 rounded-2xl p-4 cursor-pointer hover:shadow-md transition-all group"
                                                    >
                                                        <div className="flex justify-between items-start mb-2">
                                                            <span className="text-[10px] text-slate-400 font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">#{issue.id}</span>
                                                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter ${
                                                                issue.status === 'OPEN' ? 'bg-red-500/10 text-red-500' :
                                                                issue.status === 'IN_PROGRESS' ? 'bg-blue-500/10 text-blue-500' :
                                                                'bg-emerald-500/10 text-emerald-500'
                                                            }`}>
                                                                {issue.status}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm font-semibold line-clamp-1 mb-1 group-hover:text-blue-500 transition-colors">{issue.description}</p>
                                                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                                                            <div className="flex items-center gap-1">
                                                                <Clock className="w-3 h-3" />
                                                                {new Date(issue.created_at).toLocaleDateString()}
                                                            </div>
                                                            {issue.messages_count > 1 && (
                                                                <span className="text-blue-500">{issue.messages_count} messages</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* NEW ISSUE VIEW */}
                            {view === 'NEW' && (
                                <form onSubmit={handleSubmitNewIssue} className="p-6 space-y-4 flex-1 overflow-y-auto custom-scrollbar">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">The Gist of problem</label>
                                        <textarea
                                            required
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="What's not working? Be as detailed as you like..."
                                            className="w-full h-40 px-5 py-4 bg-white dark:bg-slate-900 border border-black/10 dark:border-white/5 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none shadow-sm placeholder:text-slate-400"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Visual Context (Optional)</label>
                                        <div 
                                            onClick={() => fileInputRef.current?.click()}
                                            className={`cursor-pointer group flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded-2xl transition-all ${
                                                previewUrl 
                                                ? 'border-blue-500/50 bg-blue-500/5' 
                                                : 'border-black/10 dark:border-white/5 hover:border-blue-500/50 bg-white dark:bg-slate-900'
                                            }`}
                                        >
                                            {previewUrl ? (
                                                <div className="relative w-full max-h-[150px] overflow-hidden rounded-xl">
                                                    <img src={previewUrl} alt="Preview" className="w-full h-auto object-contain" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <Upload className="w-6 h-6 text-white" />
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600">
                                                        <Upload className="w-5 h-5" />
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-tight">Drop screenshot here</p>
                                                        <p className="text-[10px] text-slate-500">Max size 5MB allowed</p>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-2xl font-black shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-3"
                                    >
                                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                        SUBMIT REPORT
                                    </button>
                                </form>
                            )}

                            {/* CHAT VIEW */}
                            {view === 'CHAT' && selectedIssue && (
                                <div className="flex-1 flex flex-col overflow-hidden">
                                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-100/50 dark:bg-slate-950/50">
                                        
                                        {/* Issue Source Box */}
                                        <div className="bg-white dark:bg-slate-900 border border-black/5 dark:border-white/5 rounded-2xl p-4 mb-6 shadow-sm">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] px-1">Initial Report</p>
                                                {selectedIssue.screenshot_path && (
                                                    <a 
                                                        href={getStorageUrl(selectedIssue.screenshot_path || null)!} 
                                                        target="_blank" 
                                                        className="flex items-center gap-1 text-[10px] text-blue-500 font-bold hover:underline"
                                                    >
                                                        <ArrowRight className="w-3 h-3" />
                                                        VIEW FULL
                                                    </a>
                                                )}
                                            </div>
                                            <p className="text-sm leading-relaxed mb-3">{selectedIssue.description}</p>
                                            {selectedIssue.screenshot_path && (
                                                <div className="rounded-xl overflow-hidden border border-black/5 bg-black/5">
                                                    <img 
                                                        src={getStorageUrl(selectedIssue.screenshot_path || null)!} 
                                                        alt="Initial Screenshot" 
                                                        className="max-h-[300px] w-full object-contain cursor-zoom-in" 
                                                        onClick={() => window.open(getStorageUrl(selectedIssue.screenshot_path || null)!, '_blank')}
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        {isLoadingChat ? (
                                            <div className="flex items-center justify-center py-10">
                                                <Loader2 className="w-6 h-6 animate-spin text-blue-500/30" />
                                            </div>
                                        ) : (
                                            messages.map((msg, idx) => (
                                                <div key={msg.id} className={`flex ${msg.is_admin ? 'justify-start' : 'justify-end'}`}>
                                                    <div className={`max-w-[85%] flex gap-2 ${msg.is_admin ? '' : 'flex-row-reverse'}`}>
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${
                                                            msg.is_admin ? 'bg-gradient-to-br from-blue-600 to-indigo-700' : 'bg-slate-200 dark:bg-slate-800'
                                                        }`}>
                                                            {msg.is_admin ? <AlertCircle className="w-4 h-4 text-white" /> : <User className="w-4 h-4 text-slate-500" />}
                                                        </div>
                                                        <div className={`space-y-1 ${msg.is_admin ? '' : 'text-right'}`}>
                                                            <div className={`px-4 py-3 shadow-sm ${
                                                                msg.is_admin 
                                                                ? 'bg-white dark:bg-slate-900 rounded-2xl rounded-tl-none border border-black/5 dark:border-white/5 text-slate-800 dark:text-white' 
                                                                : 'bg-blue-600 text-white rounded-2xl rounded-tr-none'
                                                            }`}>
                                                                <p className="text-sm leading-relaxed">{msg.message}</p>
                                                            </div>
                                                            <p className="text-[9px] text-slate-400 font-bold px-1">
                                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                        <div ref={messagesEndRef} />
                                    </div>

                                    {/* Chat Input */}
                                    <div className="p-4 bg-white dark:bg-slate-900 border-t border-black/5 dark:border-white/5">
                                        <form onSubmit={handleSendReply} className="flex gap-2">
                                            <input 
                                                type="text" 
                                                value={replyText}
                                                onChange={(e) => setReplyText(e.target.value)}
                                                placeholder="Ask a question or update..."
                                                className="flex-1 bg-slate-100 dark:bg-black/40 border border-black/5 dark:border-white/5 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400"
                                            />
                                            <button 
                                                type="submit"
                                                disabled={isSendingReply || !replyText.trim()}
                                                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20 transition-all"
                                            >
                                                {isSendingReply ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4" />}
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer Branding */}
                        <div className="py-2 bg-slate-100 dark:bg-slate-900/50 border-t border-black/5 dark:border-white/5 flex items-center justify-center gap-1">
                            <Shield className="w-3 h-3 text-blue-500" />
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">OpenScore Secure Observability</span>
                        </div>
                    </div>
                </div>
            )}
            
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(0, 0, 0, 0.05);
                    border-radius: 10px;
                }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.05);
                }
            `}</style>
        </div>
    );
};

export default IssueReporter;
