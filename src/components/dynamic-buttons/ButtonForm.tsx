'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { Save, ArrowLeft, Eye, Code, Palette, Users } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';
import { EditorState, convertToRaw, ContentState } from 'draft-js';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';

// Dynamic import for the editor to avoid SSR issues
const Editor = dynamic(
    () => import('react-draft-wysiwyg').then((mod) => mod.Editor),
    { ssr: false }
);

// Helper functions for content conversion
let draftToHtml: any;
let htmlToDraftjs: any;

if (typeof window !== 'undefined') {
    draftToHtml = require('draftjs-to-html');
    htmlToDraftjs = require('html-to-draftjs').default;
}

interface ButtonFormProps {
    initialData?: {
        id?: number;
        name: string;
        visibility: string[];
        text_color: string;
        bg_color?: string;
        content: string;
        is_active: boolean;
    };
    isEdit?: boolean;
}

export default function ButtonForm({ initialData, isEdit = false }: ButtonFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [previewMode, setPreviewMode] = useState(false);
    const [editorState, setEditorState] = useState(EditorState.createEmpty());
    
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        visibility: initialData?.visibility || [],
        text_color: initialData?.text_color || '#0f172a',
        bg_color: initialData?.bg_color || '#ffffff',
        content: initialData?.content || '',
        is_active: initialData?.is_active ?? true,
    });

    // Initialize editor state from HTML content
    useEffect(() => {
        if (formData.content && typeof window !== 'undefined' && htmlToDraftjs) {
            const contentBlock = htmlToDraftjs(formData.content);
            if (contentBlock) {
                const contentState = ContentState.createFromBlockArray(contentBlock.contentBlocks);
                setEditorState(EditorState.createWithContent(contentState));
            }
        }
    }, []);

    const onEditorStateChange = (newEditorState: EditorState) => {
        setEditorState(newEditorState);
        if (draftToHtml) {
            const html = draftToHtml(convertToRaw(newEditorState.getCurrentContent()));
            setFormData(prev => ({ ...prev, content: html }));
        }
    };

    const roles = ['CUSTOMER', 'MERCHANT', 'STUDENT'];

    const toggleRole = (role: string) => {
        setFormData(prev => ({
            ...prev,
            visibility: prev.visibility.includes(role)
                ? prev.visibility.filter(r => r !== role)
                : [...prev.visibility, role]
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.visibility.length === 0) {
            toast.error('Please select at least one role for visibility');
            return;
        }

        setLoading(true);
        try {
            const endpoint = isEdit ? `/admin/dynamic-buttons/${initialData?.id}` : '/admin/dynamic-buttons';
            const method = isEdit ? 'PUT' : 'POST';

            await apiFetch(endpoint, {
                method,
                body: JSON.stringify(formData)
            });

            toast.success(isEdit ? 'Button updated successfully' : 'Button created successfully');
            router.push('/dynamic-buttons');
        } catch (error) {
            toast.error('Failed to save button');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
            <div className="flex justify-between items-center">
                <Link href="/dynamic-buttons" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-bold text-sm uppercase tracking-widest">
                    <ArrowLeft className="w-4 h-4" /> Back to List
                </Link>
                <div className="flex items-center gap-3 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">
                    Administration / Interface / {isEdit ? 'Edit' : 'Create'}
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100 space-y-8">
                    {/* Basic Settings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Button Name</label>
                            <input
                                required
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. Terms of Service"
                                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-bold text-slate-900 transition-all"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Icon Color</label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        value={formData.text_color}
                                        onChange={(e) => setFormData({ ...formData, text_color: e.target.value })}
                                        className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-xl p-1 cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={formData.text_color}
                                        onChange={(e) => setFormData({ ...formData, text_color: e.target.value })}
                                        placeholder="#000000"
                                        className="flex-1 px-3 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-100 outline-none font-mono text-xs"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Page BG Color</label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        value={formData.bg_color}
                                        onChange={(e) => setFormData({ ...formData, bg_color: e.target.value })}
                                        className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-xl p-1 cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={formData.bg_color}
                                        onChange={(e) => setFormData({ ...formData, bg_color: e.target.value })}
                                        placeholder="#ffffff"
                                        className="flex-1 px-3 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-100 outline-none font-mono text-xs"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Visibility Settings */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2">
                            <Users className="w-3 h-3" /> Targeted Visibility
                        </label>
                        <div className="flex flex-wrap gap-3">
                            {roles.map(role => (
                                <button
                                    key={role}
                                    type="button"
                                    onClick={() => toggleRole(role)}
                                    className={`px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all border-2 ${
                                        formData.visibility.includes(role)
                                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105'
                                        : 'bg-white border-slate-100 text-slate-400 hover:border-blue-200'
                                    }`}
                                >
                                    {role}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Active Toggle */}
                    <div className="flex items-center border-t border-slate-50 pt-6">
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.is_active}
                                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                            <span className="ml-3 text-sm font-bold text-slate-700 uppercase tracking-widest">Active & Visible to Users</span>
                        </label>
                    </div>
                </div>

                {/* Content Editor */}
                <div className="bg-white rounded-[2.5rem] p-4 shadow-xl border border-slate-100 overflow-hidden flex flex-col min-h-[600px]">
                    <div className="flex items-center justify-between p-4 border-b border-slate-50 bg-slate-50/50 -m-4 mb-4">
                        <div className="flex items-center gap-2">
                             <Palette className="w-4 h-4 text-slate-400" />
                             <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Content Designer</span>
                        </div>
                        <div className="flex bg-white rounded-xl border border-slate-200 p-1">
                            <button
                                type="button"
                                onClick={() => setPreviewMode(false)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${!previewMode ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <Code size={14} /> Designer
                            </button>
                            <button
                                type="button"
                                onClick={() => setPreviewMode(true)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${previewMode ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <Eye size={14} /> Live Preview
                            </button>
                        </div>
                    </div>

                    <div className="flex-1">
                        {previewMode ? (
                            <div className="p-8 prose prose-slate max-w-none h-full overflow-y-auto bg-slate-50/50 rounded-2xl min-h-[400px]">
                                <style dangerouslySetInnerHTML={{ __html: `
                                    .preview-container {
                                        background-color: ${formData.bg_color};
                                        padding: 2rem;
                                        border-radius: 1rem;
                                        min-height: 400px;
                                    }
                                `}} />
                                <div className="preview-container">
                                    <div dangerouslySetInnerHTML={{ __html: formData.content || '<p class="text-slate-400 italic">No content to preview.</p>' }} />
                                </div>
                            </div>
                        ) : (
                            <Editor
                                editorState={editorState}
                                onEditorStateChange={onEditorStateChange}
                                wrapperClassName="editor-wrapper h-full flex flex-col"
                                editorClassName="editor-content p-6 min-h-[400px] font-sans text-sm leading-relaxed text-slate-700 h-full overflow-y-auto"
                                toolbarClassName="editor-toolbar !border-none !bg-transparent !mb-4"
                                toolbar={{
                                    options: ['inline', 'blockType', 'fontSize', 'list', 'textAlign', 'link', 'history'],
                                    inline: { inDropdown: false, options: ['bold', 'italic', 'underline', 'strikethrough'] },
                                    blockType: { inDropdown: true, options: ['Normal', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'Blockquote', 'Code'] },
                                    list: { options: ['unordered', 'ordered'] },
                                    textAlign: { options: ['left', 'center', 'right', 'justify'] },
                                    link: { inDropdown: true },
                                    history: { inDropdown: true },
                                }}
                                placeholder="Start designing your page here..."
                            />
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-4">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-8 py-4 bg-white border border-slate-100 rounded-2xl text-slate-500 font-bold text-sm uppercase tracking-widest hover:bg-slate-50 transition-colors"
                    >
                        Discard
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-12 py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 flex items-center gap-3 disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : <><Save className="w-5 h-5" /> Save Button</>}
                    </button>
                </div>
            </form>
            
            <style jsx global>{`
                .editor-content {
                    border: 1px solid #f1f5f9 !important;
                    border-radius: 1rem !important;
                    background-color: #f8fafc !important;
                }
                .rdw-editor-toolbar {
                    padding: 6px 10px !important;
                    border-radius: 12px !important;
                    background: #f8fafc !important;
                    border: 1px solid #f1f5f9 !important;
                }
            `}</style>
        </div>
    );
}
