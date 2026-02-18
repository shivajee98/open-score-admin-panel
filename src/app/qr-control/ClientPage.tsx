'use client';

import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { apiFetch } from '@/lib/api';
import QRCode from 'react-qr-code';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { toast } from 'sonner';
import {
    Folder,
    FileText,
    ChevronRight,
    Home,
    Upload,
    MoreVertical,
    Trash2,
    Edit2,
    Move,
    QrCode,
    Search,
    Grid,
    List as ListIcon,
    CornerUpLeft,
    Zap,
    Printer,
    UserCheck,
    CheckCircle,
    Info,
    ChevronLeft,
    Settings
} from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { cn } from '@/lib/utils';

// --- Types ---
interface FileItem {
    id: string;
    name: string;
    type: 'folder' | 'file';
    size?: string;
    date: string;
    color?: string;
    url?: string;
    parentId: string | null; // null = root
    status?: string;
    merchant_name?: string;
    merchant_mobile?: string;
}

export default function QRControlClient() {
    // --- State ---
    const [fileSystem, setFileSystem] = useState<FileItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // QR Preview Modal
    const [previewQr, setPreviewQr] = useState<FileItem | null>(null);

    // Filter and Pagination
    const [filterStatus, setFilterStatus] = useState<'all' | 'assigned' | 'active'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(12);

    // Drag & Drop State
    const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
    const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);

    // Context Menu State
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, itemId: string | null } | null>(null);

    // --- Fetch Data ---
    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await apiFetch('/admin/qr/file-system');
            setFileSystem(res);
        } catch (e: any) {
            toast.error("Failed to load QR file system");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // --- Derived State ---
    const currentItems = fileSystem.filter(item => item.parentId === currentFolderId);

    const filteredItems = currentItems.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.size && item.size.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (item.merchant_name && item.merchant_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (item.merchant_mobile && item.merchant_mobile.includes(searchTerm));

        const matchesFilter = filterStatus === 'all' || item.type === 'folder' || item.status === filterStatus;

        return matchesSearch && matchesFilter;
    });

    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    const paginatedItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // Breadcrumb Logic
    const getBreadcrumbs = () => {
        const crumbs = [];
        let currId = currentFolderId;
        while (currId) {
            const folder = fileSystem.find(i => i.id === currId);
            if (folder) {
                crumbs.unshift(folder);
                currId = folder.parentId;
            } else {
                break;
            }
        }
        return crumbs;
    };

    // --- Handlers ---

    const handleNavigate = (item: FileItem) => {
        if (item.type === 'folder') {
            setCurrentFolderId(item.id);
            setSelectedIds(new Set());
            setCurrentPage(1);
        } else if (item.url) {
            // View QR Modal
            setPreviewQr(item);
        }
    };

    const handleUp = () => {
        if (!currentFolderId) return;
        const currentFolder = fileSystem.find(i => i.id === currentFolderId);
        setCurrentFolderId(currentFolder?.parentId || null);
        setSelectedIds(new Set());
        setCurrentPage(1);
    };

    // Selection
    const handleSelect = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (e.ctrlKey || e.metaKey) {
            const newSet = new Set(selectedIds);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            setSelectedIds(newSet);
        } else {
            setSelectedIds(new Set([id]));
        }
    };

    const handleBackgroundClick = () => {
        setSelectedIds(new Set());
        setContextMenu(null);
    };

    const handlePrint = () => {
        window.print();
    };

    const handleDeleteCode = async (id: string) => {
        if (confirm(`Are you sure you want to revoke this QR permanently?`)) {
            try {
                await apiFetch(`/admin/qr/${id}`, { method: 'DELETE' });
                toast.success("QR Code deleted successfully");
                fetchData();
                if (previewQr?.id === id) setPreviewQr(null);
            } catch (e: any) {
                toast.error(e.message || "Failed to delete");
            }
        }
    };

    // --- Drag & Drop Interface ---
    const onDragStart = (e: React.DragEvent, item: FileItem) => {
        setDraggedItemId(item.id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const onDragOver = (e: React.DragEvent, item: FileItem | null) => {
        e.preventDefault();
        if (item && item.type === 'folder' && item.id !== draggedItemId) {
            setDragOverFolderId(item.id);
        } else {
            setDragOverFolderId(null);
        }
    };

    const onDrop = async (e: React.DragEvent, targetFolderId: string | null) => {
        e.preventDefault();
        setDragOverFolderId(null);

        if (!draggedItemId) return;
        if (targetFolderId === draggedItemId) return;

        const itemToMove = fileSystem.find(i => i.id === draggedItemId);
        if (!itemToMove) return;

        // If target is a Batch folder and item is a QR (file)
        if (targetFolderId && targetFolderId.startsWith('batch_') && itemToMove.type === 'file') {
            const batchId = targetFolderId.replace('batch_', '');
            try {
                await apiFetch('/admin/qr/move', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        qr_ids: [itemToMove.id],
                        batch_id: batchId
                    }),
                });
                toast.success(`Moved "${itemToMove.name}" to batch`);
                fetchData();
            } catch (e: any) {
                toast.error(e.message || "Failed to move file");
            }
        } else {
            toast.error("Only moving QR codes to Batch folders is supported via backend.");
        }

        setDraggedItemId(null);
    };

    // --- Context Menu ---
    const handleContextMenu = (e: React.MouseEvent, itemId: string) => {
        e.preventDefault();
        e.stopPropagation();
        setSelectedIds(new Set([itemId]));
        setContextMenu({ x: e.clientX, y: e.clientY, itemId });
    };

    const handleContextAction = async (action: string) => {
        if (!contextMenu?.itemId) return;
        const item = fileSystem.find(i => i.id === contextMenu.itemId);
        if (!item) return;

        switch (action) {
            case 'open':
                handleNavigate(item);
                break;
            case 'rename':
                toast.info("Rename coming soon!");
                break;
            case 'delete':
                if (item.type === 'file') {
                    handleDeleteCode(item.id);
                } else {
                    toast.info("Batch/Role folders cannot be deleted manually here.");
                }
                break;
        }
        setContextMenu(null);
    };

    // Close context menu on click elsewhere
    useEffect(() => {
        const closeMenu = () => setContextMenu(null);
        window.addEventListener('click', closeMenu);
        return () => window.removeEventListener('click', closeMenu);
    }, []);

    // --- Render Helpers ---
    const crumbs = getBreadcrumbs();

    return (
        <AdminLayout title="QR Control Center">
            <div
                className="space-y-6 min-h-[500px]"
                onClick={handleBackgroundClick}
                onDragOver={(e) => {
                    e.preventDefault();
                }}
            >
                <style jsx global>{`
                @media print {
                    aside, header, .no-print {
                        display: none !important;
                    }
                    body {
                        background: white !important;
                    }
                    main {
                        margin-left: 0 !important;
                        padding: 0 !important;
                    }
                }
            `}</style>
                {/* Header / Toolbar */}
                <div className="no-print">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight invisible h-0">QR Control Center</h1>
                        <div className="flex items-center gap-3">
                            {/* Filter Buttons */}
                            <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm mr-4">
                                <button
                                    onClick={() => { setFilterStatus('all'); setCurrentPage(1); }}
                                    className={cn(
                                        "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                        filterStatus === 'all' ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:text-slate-600"
                                    )}
                                >
                                    All
                                </button>
                                <button
                                    onClick={() => { setFilterStatus('assigned'); setCurrentPage(1); }}
                                    className={cn(
                                        "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                        filterStatus === 'assigned' ? "bg-indigo-600 text-white shadow-lg" : "text-slate-400 hover:text-slate-600"
                                    )}
                                >
                                    Mapped QR
                                </button>
                                <button
                                    onClick={() => { setFilterStatus('active'); setCurrentPage(1); }}
                                    className={cn(
                                        "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                        filterStatus === 'active' ? "bg-emerald-500 text-white shadow-lg" : "text-slate-400 hover:text-slate-600"
                                    )}
                                >
                                    Unmapped
                                </button>
                            </div>

                            <Button
                                onClick={() => fetchData()}
                                className="gap-2 bg-indigo-600 hover:bg-white hover:text-indigo-600 hover:border-indigo-600 border border-transparent rounded-2xl h-11 px-6 font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/20"
                            >
                                <Zap className="w-4 h-4" /> Sync
                            </Button>
                        </div>
                    </div>

                    <div className="mb-8 flex flex-col md:flex-row gap-4 items-center">
                        <div className="relative flex-1 group w-full">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Locate Specific QR / Merchant Mapping..."
                                className="w-full pl-16 pr-8 py-4 bg-white border border-slate-100 rounded-3xl font-bold text-slate-900 placeholder:text-slate-300 shadow-sm outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                                value={searchTerm}
                                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            />
                        </div>

                        <div className="flex gap-2 w-full md:w-auto">
                            <div className="flex items-center bg-white border border-slate-100 rounded-3xl px-4 py-2 shadow-sm">
                                <Settings size={16} className="text-slate-400 mr-2" />
                                <span className="text-[10px] font-black uppercase tracking-tight text-slate-400 mr-2 whitespace-nowrap">Rows:</span>
                                <select
                                    value={itemsPerPage}
                                    onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                    className="bg-transparent border-none text-xs font-black text-slate-900 outline-none cursor-pointer"
                                >
                                    <option value={12}>12</option>
                                    <option value={24}>24</option>
                                    <option value={60}>60</option>
                                    <option value={100}>100</option>
                                </select>
                            </div>

                            <button
                                onClick={handlePrint}
                                className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                            >
                                <Printer size={18} />
                                Print
                            </button>
                        </div>
                    </div>
                </div>

                {/* Path Bar */}
                <div className="no-print flex items-center gap-2 px-6 py-4 bg-white border border-slate-200 rounded-3xl shadow-sm text-sm text-slate-600 overflow-x-auto">
                    <button
                        onClick={(e) => { e.stopPropagation(); setCurrentFolderId(null); setSelectedIds(new Set()); setCurrentPage(1); }}
                        className={`flex items-center gap-1 font-black uppercase tracking-wider transition-colors hover:text-indigo-600 ${!currentFolderId ? 'text-indigo-600' : ''}`}
                    >
                        <Home className="w-4 h-4" /> Root
                    </button>

                    {crumbs.map((folder, idx) => (
                        <div key={folder.id} className="flex items-center gap-2">
                            <ChevronRight className="w-4 h-4 text-slate-300" />
                            <button
                                onClick={(e) => { e.stopPropagation(); setCurrentFolderId(folder.id); setSelectedIds(new Set()); setCurrentPage(1); }}
                                className={`font-bold transition-colors whitespace-nowrap hover:text-indigo-600 ${idx === crumbs.length - 1 ? 'text-indigo-600' : 'text-slate-400'}`}
                            >
                                {folder.name}
                            </button>
                        </div>
                    ))}
                </div>

                {/* File Area */}
                <div className="bg-slate-50/50 rounded-[3rem] border border-slate-100 p-6 min-h-[400px]">
                    {/* Back Button if not root */}
                    {currentFolderId && (
                        <div
                            className="mb-6 inline-flex items-center gap-2 text-indigo-600 hover:underline cursor-pointer font-black text-[10px] uppercase tracking-widest transition-colors py-2 px-4 rounded-xl bg-indigo-50 border border-indigo-100 shadow-sm"
                            onClick={(e) => { e.stopPropagation(); handleUp(); }}
                        >
                            <CornerUpLeft className="w-4 h-4" /> Back to parent
                        </div>
                    )}

                    <div className={
                        viewMode === 'grid'
                            ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6"
                            : "flex flex-col gap-3"
                    }>
                        {paginatedItems.map((item) => {
                            const isSelected = selectedIds.has(item.id);
                            const isDragOver = dragOverFolderId === item.id;

                            if (item.type === 'folder') {
                                return (
                                    <div
                                        key={item.id}
                                        draggable
                                        onDragStart={(e) => onDragStart(e, item)}
                                        onDragOver={(e) => onDragOver(e, item)}
                                        onDrop={(e) => onDrop(e, item.id)}
                                        onClick={(e) => handleSelect(e, item.id)}
                                        onDoubleClick={(e) => { e.stopPropagation(); handleNavigate(item); }}
                                        onContextMenu={(e) => handleContextMenu(e, item.id)}
                                        className={cn(
                                            "group relative transition-all cursor-pointer flex flex-col items-center p-6 rounded-[2rem] border aspect-square justify-between shadow-xl shadow-blue-900/5",
                                            isSelected ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500' : 'bg-white border-slate-50 hover:border-indigo-100',
                                            isDragOver ? 'bg-indigo-100 border-indigo-500 scale-105 ring-2 ring-indigo-500 z-10' : '',
                                            draggedItemId === item.id ? 'opacity-50 grayscale' : ''
                                        )}
                                    >
                                        <div className="flex-1 flex items-center justify-center w-full">
                                            <Folder className={`w-16 h-16 ${item.color || 'text-indigo-400'} fill-current opacity-90 transition-transform group-hover:scale-105`} />
                                        </div>
                                        <div className="w-full text-center mt-3">
                                            <p className="font-bold text-slate-900 truncate text-sm" title={item.name}>{item.name}</p>
                                            <p className="text-slate-400 text-[10px] mt-1 font-black uppercase tracking-widest">{item.size}</p>
                                        </div>
                                    </div>
                                );
                            }

                            // QR Card Style
                            return (
                                <div
                                    key={item.id}
                                    onClick={(e) => { handleSelect(e, item.id); }}
                                    onDoubleClick={(e) => { e.stopPropagation(); handleNavigate(item); }}
                                    onContextMenu={(e) => handleContextMenu(e, item.id)}
                                    className={cn(
                                        "bg-white p-6 rounded-[2rem] border-2 flex flex-col items-center text-center cursor-pointer transition-all hover:scale-[1.02] hover:shadow-2xl relative group",
                                        isSelected ? 'border-blue-500 shadow-xl shadow-blue-500/10' :
                                            (item.status === 'assigned' ? 'border-indigo-100 bg-indigo-50/10' : 'border-slate-50 shadow-xl shadow-blue-900/5')
                                    )}
                                >
                                    <div className="absolute top-3 right-3">
                                        {item.status === 'assigned' ? (
                                            <div className="bg-indigo-600 p-1.5 rounded-full text-white shadow-lg"><UserCheck size={12} strokeWidth={3} /></div>
                                        ) : (
                                            <div className="bg-emerald-500 p-1.5 rounded-full text-white shadow-lg"><CheckCircle size={12} strokeWidth={3} /></div>
                                        )}
                                    </div>

                                    <div className="mb-4 mt-2">
                                        <div className="p-3 bg-white rounded-3xl shadow-lg border border-slate-100">
                                            <QRCode value={item.url || ''} size={140} level="H" />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-tighter truncate max-w-[140px]">
                                            {item.merchant_name}
                                        </h4>
                                        <p className="text-[9px] font-mono text-slate-400 font-bold">{(item.url || '').substring(0, 13)}</p>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-slate-100 w-full flex items-center justify-center gap-2 grayscale opacity-40">
                                        <span className="text-[8px] font-black italic">OpenScore Pay</span>
                                    </div>
                                </div>
                            );
                        })}

                        {paginatedItems.length === 0 && (
                            <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-300">
                                <div className="bg-white p-10 rounded-[3rem] border-2 border-dashed border-slate-100 mb-4 shadow-sm">
                                    <Search className="w-12 h-12 text-slate-200" />
                                </div>
                                <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No items found in this directory</p>
                            </div>
                        )}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="mt-12 flex items-center justify-center gap-4">
                            <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-900 disabled:opacity-30 hover:bg-slate-50 transition-all shadow-sm"
                            >
                                <ChevronLeft size={20} />
                            </button>

                            <div className="flex items-center gap-2">
                                {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                                    let pageNum = i + 1;
                                    if (totalPages > 5 && currentPage > 3) {
                                        pageNum = currentPage - 2 + i;
                                        if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                                    }

                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => setCurrentPage(pageNum)}
                                            className={cn(
                                                "w-12 h-12 rounded-2xl font-black text-xs transition-all shadow-sm",
                                                currentPage === pageNum ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-100"
                                            )}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-900 disabled:opacity-30 hover:bg-slate-50 transition-all shadow-sm"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    )}
                </div>

                {/* Context Menu Overlay */}
                {contextMenu && (
                    <div
                        className="fixed z-[100] bg-white shadow-2xl border border-slate-100 rounded-2xl py-2 w-56 animate-in fade-in zoom-in-95 duration-100"
                        style={{ top: contextMenu.y, left: contextMenu.x }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button onClick={() => handleContextAction('open')} className="w-full text-left px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-3">
                            <QrCode className="w-4 h-4" /> Open / Preview
                        </button>
                        <div className="h-px bg-slate-50 my-1" />
                        <button onClick={() => handleContextAction('delete')} className="w-full text-left px-5 py-3 text-xs font-black uppercase tracking-widest text-red-600 hover:bg-red-50 flex items-center gap-3">
                            <Trash2 className="w-4 h-4" /> Delete / Revoke
                        </button>
                    </div>
                )}

                {/* QR Preview Dialog */}
                <Dialog open={!!previewQr} onOpenChange={(open) => !open && setPreviewQr(null)}>
                    <DialogContent className="sm:max-w-sm bg-white border-none rounded-[3rem] p-10 shadow-3xl overflow-hidden no-print">
                        <div className="flex flex-col items-center">
                            <div className="p-4 bg-white rounded-[2rem] shadow-2xl border-4 border-slate-50 mb-8">
                                <QRCode value={previewQr?.url || ''} size={200} level="H" />
                            </div>

                            <div className="w-full space-y-6 text-center">
                                <div>
                                    <span className={cn(
                                        "px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest inline-block",
                                        previewQr?.status === 'assigned' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'
                                    )}>
                                        {previewQr?.status}
                                    </span>
                                    <p className="mt-2 text-[10px] font-mono font-bold text-slate-400 break-all">{previewQr?.url}</p>
                                </div>

                                {previewQr?.status === 'assigned' ? (
                                    <div className="bg-slate-50 p-6 rounded-[2rem] text-left space-y-4">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Merchant Profile</p>
                                            <h3 className="font-black text-slate-900 leading-tight">{previewQr.merchant_name}</h3>
                                            <p className="text-sm font-bold text-indigo-600">{previewQr.merchant_mobile}</p>
                                        </div>
                                        <div className="pt-4 border-t border-slate-200/50">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Activation Timeline</p>
                                            <p className="text-xs font-bold text-slate-600">{previewQr.date}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-blue-50/50 p-8 rounded-[2rem] border border-blue-100">
                                        <Info className="w-8 h-8 text-blue-400 mx-auto mb-3" />
                                        <p className="text-sm font-bold text-blue-900">Unlinked Asset</p>
                                        <p className="text-xs text-blue-600/70 mt-1">This code is ready for merchant deployment.</p>
                                    </div>
                                )}

                                <div className="grid grid-cols-5 gap-3">
                                    <button
                                        onClick={() => handlePrint()}
                                        className="col-span-4 py-5 bg-slate-900 text-white rounded-3xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-2"
                                    >
                                        <Printer size={18} /> Print
                                    </button>
                                    <button
                                        onClick={() => previewQr && handleDeleteCode(previewQr.id)}
                                        disabled={previewQr?.status === 'assigned'}
                                        className="col-span-1 py-5 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center hover:bg-rose-100 transition-all font-black disabled:opacity-30 disabled:grayscale"
                                        title="Revoke QR permanent"
                                    >
                                        <Trash2 size={24} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Loading Overlay */}
                {loading && (
                    <div className="fixed inset-0 bg-white/60 backdrop-blur-sm z-[100] flex items-center justify-center">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-indigo-600 font-black text-xs uppercase tracking-widest">Compiling Files...</p>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
