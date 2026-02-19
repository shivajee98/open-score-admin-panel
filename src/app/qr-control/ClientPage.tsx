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
    Settings,
    ArrowLeft,
    ArrowRight,
    CheckSquare,
    Square,
    FolderPlus,
    Monitor,
    MousePointer2,
    Package,
    FolderOpen,
    LayoutGrid,
    SearchCode,
    FileType2
} from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { cn } from '@/lib/utils';
import Link from 'next/link';

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

    // Print State
    const [isPreparingPrint, setIsPreparingPrint] = useState(false);

    // QR Preview Modal
    const [previewQr, setPreviewQr] = useState<FileItem | null>(null);

    // Filter and Pagination
    const [filterStatus, setFilterStatus] = useState<'all' | 'assigned' | 'active'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(12);

    // Grouping / Moving Modal
    const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
    const [targetBatchId, setTargetBatchId] = useState('');

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

    const handleSelect = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const newSet = new Set(selectedIds);
        if (e.ctrlKey || e.metaKey || e.shiftKey) {
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
        } else {
            if (newSet.has(id) && newSet.size === 1) newSet.clear();
            else {
                newSet.clear();
                newSet.add(id);
            }
        }
        setSelectedIds(newSet);
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredItems.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredItems.map(i => i.id)));
        }
    };

    const handleBackgroundClick = () => {
        setSelectedIds(new Set());
        setContextMenu(null);
    };

    const handlePrint = () => {
        setIsPreparingPrint(true);
        // We need a short delay for the DOM to render the printable view
        setTimeout(() => {
            window.print();
            setIsPreparingPrint(false);
        }, 500);
    };

    const handleDeleteMultiple = async () => {
        if (!selectedIds.size) return;
        if (confirm(`Delete ${selectedIds.size} selected items?`)) {
            setLoading(true);
            try {
                for (const id of Array.from(selectedIds)) {
                    const item = fileSystem.find(i => i.id === id);
                    if (item && item.type === 'file') {
                        await apiFetch(`/admin/qr/${id}`, { method: 'DELETE' });
                    }
                }
                toast.success("Items processed");
                fetchData();
                setSelectedIds(new Set());
            } catch (e: any) {
                toast.error("Failed to delete some items");
            } finally {
                setLoading(false);
            }
        }
    };

    const handleMoveToFolder = async (targetId?: string) => {
        const finalTarget = targetId || targetBatchId;
        if (!selectedIds.size || !finalTarget) return;

        const qrIds = Array.from(selectedIds).filter(id => {
            const item = fileSystem.find(i => i.id === id);
            return item && item.type === 'file';
        });

        if (qrIds.length === 0) {
            toast.error("Only QR codes can be moved to batches.");
            return;
        }

        const cleanBatchId = finalTarget.replace('batch_', '');
        if (!cleanBatchId || isNaN(Number(cleanBatchId))) {
            toast.error("Invalid target batch.");
            return;
        }

        setLoading(true);
        try {
            await apiFetch('/admin/qr/move', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    qr_ids: qrIds,
                    batch_id: cleanBatchId
                }),
            });
            toast.success(`Moved ${qrIds.length} items successfully`);
            fetchData();
            setSelectedIds(new Set());
            setIsMoveModalOpen(false);
        } catch (e: any) {
            toast.error(e.message || "Failed to move items");
        } finally {
            setLoading(false);
        }
    };

    // --- Drag & Drop ---
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

        if (!draggedItemId || !targetFolderId) return;
        if (targetFolderId === draggedItemId) return;

        const itemToMove = fileSystem.find(i => i.id === draggedItemId);
        if (!itemToMove) return;

        if (targetFolderId.startsWith('batch_')) {
            const batchId = targetFolderId.replace('batch_', '');
            let qrIds: string[] = [];

            if (itemToMove.type === 'file') {
                qrIds = [itemToMove.id];
            } else if (itemToMove.type === 'folder') {
                qrIds = fileSystem.filter(i => i.type === 'file' && i.parentId === itemToMove.id).map(i => i.id);
                if (qrIds.length === 0) {
                    toast.info("Folder is empty");
                    return;
                }
            }

            setLoading(true);
            try {
                await apiFetch('/admin/qr/move', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        qr_ids: qrIds,
                        batch_id: batchId
                    }),
                });
                toast.success(`Moved ${qrIds.length} items to "${fileSystem.find(f => f.id === targetFolderId)?.name}"`);
                fetchData();
            } catch (e: any) {
                toast.error(e.message || "Failed to move assets");
            } finally {
                setLoading(false);
            }
        }
        setDraggedItemId(null);
    };

    // --- Context Menu ---
    const handleContextMenu = (e: React.MouseEvent, itemId: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (!selectedIds.has(itemId)) {
            setSelectedIds(new Set([itemId]));
        }
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
            case 'move':
                setIsMoveModalOpen(true);
                break;
            case 'delete':
                handleDeleteMultiple();
                break;
        }
        setContextMenu(null);
    };

    useEffect(() => {
        window.onclick = () => setContextMenu(null);
    }, []);

    // --- Render Helpers ---
    const crumbs = getBreadcrumbs();

    // Sidebar foldery hierarchy
    const sidebarFolders = fileSystem.filter(i => i.type === 'folder');

    // For printing: only file types, matching current search/filter if applied
    const printableAssets = fileSystem.filter(item => {
        if (item.type !== 'file') return false;

        // If user has selected items, only print those. Otherwise print current view's codes.
        if (selectedIds.size > 0) return selectedIds.has(item.id);

        // Fallback to currently filtered items (excluding folders)
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.merchant_name && item.merchant_name.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesFilter = filterStatus === 'all' || item.status === filterStatus;

        // If we are in a folder, only print items from that folder
        const matchesFolder = currentFolderId ? item.parentId === currentFolderId : true;

        return matchesSearch && matchesFilter && matchesFolder;
    });

    return (
        <AdminLayout title="QR Control Center">
            <style jsx global>{`
                @media print {
                    @page {
                        size: A4 landscape;
                        margin: 0;
                    }
                    html, body {
                        background: white !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .no-print, header, aside, .sidebar, #sidebar-container {
                        display: none !important;
                    }
                    .print-view-container {
                        display: block !important;
                        width: 297mm !important;
                        background: white !important;
                    }
                    .print-page {
                        width: 297mm !important;
                        height: 208mm !important;
                        display: flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                        gap: 3mm !important;
                        padding: 3mm !important;
                        box-sizing: border-box !important;
                        page-break-after: always !important;
                        background: white !important;
                    }
                    .print-page:last-child {
                        page-break-after: avoid !important;
                    }
                    .qr-card-branded {
                        width: 95mm !important;
                        height: 198mm !important;
                        background: linear-gradient(165deg, #0a3d4f 0%, #0d5a6e 40%, #0f6b7a 70%, #1a8090 100%) !important;
                        border-radius: 6mm !important;
                        padding: 8mm !important;
                        display: flex !important;
                        flex-direction: column !important;
                        align-items: center !important;
                        position: relative !important;
                        overflow: hidden !important;
                        box-shadow: 0 4px 20px rgba(0,0,0,0.2) !important;
                        box-sizing: border-box !important;
                    }
                    .qr-card-branded::before {
                        content: '' !important;
                        position: absolute !important;
                        top: 0 !important;
                        left: 0 !important;
                        right: 0 !important;
                        bottom: 0 !important;
                        background: url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 10h20v2H10zM40 30h30v2H40zM20 50h15v2H20zM60 60h25v2H60zM5 80h20v2H5z' fill='rgba(255,255,255,0.05)'/%3E%3C/svg%3E") !important;
                        pointer-events: none !important;
                    }
                    .qr-brand-top {
                        text-align: center !important;
                        margin-bottom: 5mm !important;
                        position: relative !important;
                        z-index: 1 !important;
                    }
                    .qr-brand-top .msme {
                        font-size: 12pt !important;
                        font-weight: 700 !important;
                        color: #d4af37 !important;
                        letter-spacing: 0.15em !important;
                        text-transform: uppercase !important;
                    }
                    .qr-brand-top .openscore {
                        font-size: 26pt !important;
                        font-weight: 900 !important;
                        color: white !important;
                        letter-spacing: 0.05em !important;
                        margin-top: 2mm !important;
                    }
                    .qr-brand-top .tagline {
                        font-size: 11pt !important;
                        color: #5fd4d4 !important;
                        font-style: italic !important;
                        margin-top: 2mm !important;
                    }
                    .qr-ring-container {
                        position: relative !important;
                        display: flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                        flex: 1 !important;
                        z-index: 1 !important;
                        width: 100% !important;
                    }
                    .qr-ring {
                        position: absolute !important;
                        width: 75mm !important;
                        height: 75mm !important;
                        border: 4px solid #00d4d4 !important;
                        border-radius: 50% !important;
                        box-shadow: 0 0 30px rgba(0,212,212,0.5), inset 0 0 30px rgba(0,212,212,0.15) !important;
                    }
                    .qr-box {
                        background: white !important;
                        padding: 6mm !important;
                        border-radius: 5mm !important;
                        position: relative !important;
                        z-index: 2 !important;
                    }
                    .qr-box .check-badge {
                        position: absolute !important;
                        top: -3mm !important;
                        right: -3mm !important;
                        width: 10mm !important;
                        height: 10mm !important;
                        background: #22c55e !important;
                        border-radius: 50% !important;
                        display: flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                        border: 3px solid white !important;
                    }
                    .qr-box .check-badge svg {
                        width: 6mm !important;
                        height: 6mm !important;
                        color: white !important;
                    }
                    .qr-bottom {
                        text-align: center !important;
                        margin-top: 5mm !important;
                        position: relative !important;
                        z-index: 1 !important;
                    }
                    .qr-bottom .scan-pay {
                        font-size: 20pt !important;
                        font-weight: 900 !important;
                        color: white !important;
                        letter-spacing: 0.1em !important;
                    }
                    .qr-bottom .cashback-text {
                        font-size: 11pt !important;
                        color: white !important;
                        margin-top: 2mm !important;
                    }
                    .qr-bottom .cashback-text span {
                        color: #fcd34d !important;
                        font-weight: 700 !important;
                    }
                    .qr-bottom .for-text {
                        font-size: 9pt !important;
                        color: rgba(255,255,255,0.6) !important;
                        text-transform: uppercase !important;
                        letter-spacing: 0.1em !important;
                        margin-top: 3mm !important;
                    }
                    .qr-footer {
                        display: flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                        width: 100% !important;
                        margin-top: 5mm !important;
                        padding-top: 4mm !important;
                        border-top: 1px solid rgba(255,255,255,0.15) !important;
                        position: relative !important;
                        z-index: 1 !important;
                    }
                    .qr-footer .powered {
                        display: flex !important;
                        align-items: center !important;
                        gap: 2mm !important;
                    }
                    .qr-footer .powered .icon {
                        width: 6mm !important;
                        height: 6mm !important;
                        background: #22c55e !important;
                        border-radius: 50% !important;
                    }
                    .qr-footer .powered span {
                        font-size: 8pt !important;
                        color: rgba(255,255,255,0.8) !important;
                        text-transform: uppercase !important;
                        letter-spacing: 0.05em !important;
                    }
                }
            `}</style>

            <div className="no-print">
                <div className="flex flex-col lg:flex-row gap-6 min-h-[750px] bg-slate-50/10 p-2 sm:p-4 rounded-[4rem]">
                    {/* File Sidebar */}
                    <aside className="no-print w-full lg:w-80 shrink-0 bg-white border border-slate-100 rounded-[3rem] p-8 shadow-2xl shadow-blue-900/5 flex flex-col">
                        <div className="mb-10 px-2 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Monitor className="w-5 h-5 text-indigo-600" />
                                <h3 className="font-black text-xs uppercase tracking-[0.2em] text-slate-800">File System</h3>
                            </div>
                            <Link href="/qr-generator" className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm" title="Back to Generator">
                                <ArrowLeft size={16} />
                            </Link>
                        </div>

                        <div className="flex-1 space-y-6 overflow-y-auto no-scrollbar pb-8">
                            <div>
                                <button
                                    onClick={() => setCurrentFolderId(null)}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-5 py-4 rounded-[1.5rem] transition-all font-bold text-sm",
                                        currentFolderId === null ? "bg-slate-900 text-white shadow-xl shadow-slate-900/20 scale-105" : "text-slate-500 hover:bg-slate-50"
                                    )}
                                >
                                    <Home size={18} /> Root Volume
                                </button>
                            </div>

                            <div className="space-y-3">
                                <p className="px-5 text-[10px] font-black uppercase tracking-widest text-slate-300">Directories</p>
                                {sidebarFolders.filter(f => f.parentId === null).map(folder => (
                                    <div key={folder.id} className="space-y-1">
                                        <button
                                            onClick={() => handleNavigate(folder)}
                                            onDragOver={(e) => onDragOver(e, folder)}
                                            onDrop={(e) => onDrop(e, folder.id)}
                                            className={cn(
                                                "w-full flex items-center gap-4 px-5 py-3 rounded-2xl transition-all group",
                                                currentFolderId === folder.id ? "bg-blue-50 text-blue-700" : "text-slate-400 hover:bg-slate-50 hover:text-slate-600",
                                                dragOverFolderId === folder.id ? "bg-indigo-100 ring-4 ring-indigo-500/20 border-indigo-500 scale-105" : ""
                                            )}
                                        >
                                            <Folder size={18} className={cn("fill-current opacity-30", folder.color?.replace('text-', 'text-'))} />
                                            <span className="font-black text-[10px] uppercase tracking-widest truncate">{folder.name}</span>
                                        </button>

                                        {/* Sub-folders (Batches) */}
                                        {folder.id === 'f_batches' && (
                                            <div className="pl-8 space-y-1 border-l-2 border-slate-50 ml-7 mt-1">
                                                {sidebarFolders.filter(f => f.parentId === 'f_batches').map(batch => (
                                                    <button
                                                        key={batch.id}
                                                        onClick={() => handleNavigate(batch)}
                                                        onDragOver={(e) => onDragOver(e, batch)}
                                                        onDrop={(e) => onDrop(e, batch.id)}
                                                        className={cn(
                                                            "w-full flex items-center justify-between px-4 py-2 rounded-xl transition-all group",
                                                            currentFolderId === batch.id ? "bg-indigo-50 text-indigo-700" : "text-slate-400 hover:bg-slate-50 hover:text-slate-600",
                                                            dragOverFolderId === batch.id ? "bg-indigo-100 scale-105" : ""
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <FolderOpen size={14} className="opacity-40" />
                                                            <span className="font-bold text-[10px] truncate max-w-[120px]">{batch.name}</span>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="pt-8 border-t border-slate-50">
                            <Link href="/qr-generator" className="flex items-center gap-3 px-6 py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-800 transition-all text-center justify-center shadow-2xl shadow-slate-900/20">
                                <Monitor size={16} /> Exit Explorer
                            </Link>
                        </div>
                    </aside>

                    {/* Main Content Area */}
                    <div className="flex-1 flex flex-col gap-8">
                        <div className="flex flex-col xl:flex-row justify-between items-center gap-6 mb-8">
                            <div>
                                <h1 className="text-4xl font-black text-slate-800 tracking-tighter">QR INFRASTRUCTURE</h1>
                                <div className="flex items-center gap-2 mt-2">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                    <p className="text-muted-foreground text-[11px] font-black uppercase tracking-[0.2em] text-indigo-500">Global Cluster Mapping</p>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center justify-center gap-4">
                                {selectedIds.size > 0 && (
                                    <div className="flex items-center p-1.5 bg-slate-900 rounded-[1.5rem] shadow-2xl animate-in fade-in slide-in-from-top-4">
                                        <div className="px-6 flex flex-col justify-center border-r border-slate-700">
                                            <span className="text-blue-400 font-black text-[9px] uppercase tracking-widest">Selected</span>
                                            <span className="text-white font-black text-lg leading-none">{selectedIds.size}</span>
                                        </div>
                                        <div className="flex gap-1 px-2">
                                            <button onClick={() => setIsMoveModalOpen(true)} className="p-3 bg-white/5 hover:bg-indigo-600 text-white rounded-2xl transition-all flex items-center gap-2 px-6">
                                                <Move size={16} /> <span className="font-black text-[10px] uppercase">Migrate</span>
                                            </button>
                                            <button onClick={handleDeleteMultiple} className="p-3 bg-white/5 hover:bg-rose-600 text-white rounded-2xl transition-all flex items-center gap-2 px-6">
                                                <Trash2 size={16} /> <span className="font-black text-[10px] uppercase">Purge</span>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="flex bg-white p-1.5 rounded-2xl border border-slate-100 shadow-xl shadow-blue-900/5">
                                    {['all', 'assigned', 'active'].map((status) => (
                                        <button
                                            key={status}
                                            onClick={() => { setFilterStatus(status as any); setCurrentPage(1); }}
                                            className={cn(
                                                "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                                filterStatus === status ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:text-slate-600"
                                            )}
                                        >
                                            {status === 'all' ? 'All Assets' : status === 'assigned' ? 'Linked' : 'Available'}
                                        </button>
                                    ))}
                                </div>
                                <Button onClick={() => fetchData()} className="bg-indigo-600 hover:bg-indigo-700 rounded-2xl h-12 w-12 p-0 shadow-lg shadow-indigo-600/20">
                                    <Zap size={20} />
                                </Button>
                            </div>
                        </div>

                        {/* Search and Action Bar */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                            <div className="lg:col-span-8 relative group w-full">
                                <Search className="absolute left-8 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Execute Global Search Strategy (Name, Hash, Merchant...)"
                                    className="w-full pl-20 pr-10 py-6 bg-white border border-slate-100 rounded-[2rem] font-bold text-slate-800 shadow-xl shadow-blue-900/5 outline-none focus:ring-4 focus:ring-indigo-100 transition-all text-sm"
                                    value={searchTerm}
                                    onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                />
                                {searchTerm && (
                                    <button onClick={() => setSearchTerm('')} className="absolute right-6 top-1/2 -translate-y-1/2 p-2 bg-slate-50 rounded-full text-slate-400 hover:text-slate-600">
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>

                            <div className="lg:col-span-4 flex gap-4">
                                <button onClick={toggleSelectAll} className="flex-1 flex items-center justify-center gap-3 px-8 py-6 bg-white border border-slate-100 text-slate-600 rounded-[2rem] font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-xl shadow-blue-900/5">
                                    {selectedIds.size === filteredItems.length && filteredItems.length > 0 ? <CheckSquare size={20} className="text-indigo-600" /> : <Square size={20} />}
                                    {selectedIds.size === filteredItems.length && filteredItems.length > 0 ? "Reset" : "Select All"}
                                </button>
                                <button onClick={handlePrint} className="p-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-2xl flex items-center justify-center gap-3">
                                    <Printer size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Breadcrumbs Control */}
                        <div className="flex flex-col md:flex-row items-center justify-between px-10 py-5 bg-white border border-slate-100/50 rounded-[2.5rem] shadow-2xl shadow-blue-900/5 gap-4">
                            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar max-w-full">
                                <button onClick={() => setCurrentFolderId(null)} className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:bg-indigo-600 hover:text-white transition-all shrink-0 border border-slate-100">
                                    <Home size={20} />
                                </button>
                                {crumbs.map((folder, idx) => (
                                    <div key={folder.id} className="flex items-center gap-3">
                                        <ChevronRight className="w-5 h-5 text-slate-200" />
                                        <button
                                            onClick={() => handleNavigate(folder)}
                                            className={cn(
                                                "px-5 py-3 rounded-2xl font-black text-[10px] lg:text-xs uppercase tracking-[0.2em] transition-all",
                                                idx === crumbs.length - 1 ? "bg-indigo-600 text-white shadow-xl" : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                                            )}
                                        >
                                            {folder.name}
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <div className="flex items-center p-1.5 bg-slate-100 rounded-2xl gap-2 shadow-inner border border-slate-100">
                                <button onClick={() => setViewMode('grid')} className={cn("p-2.5 rounded-xl transition-all", viewMode === 'grid' ? "bg-white text-indigo-600 shadow-md scale-110" : "text-slate-400")}>
                                    <LayoutGrid size={20} />
                                </button>
                                <button onClick={() => setViewMode('list')} className={cn("p-2.5 rounded-xl transition-all", viewMode === 'list' ? "bg-white text-indigo-600 shadow-md scale-110" : "text-slate-400")}>
                                    <ListIcon size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Content Viewport */}
                        <div className="bg-white/40 backdrop-blur-3xl rounded-[4rem] border border-white p-6 sm:p-10 min-h-[600px] relative shadow-2xl shadow-blue-900/5" onClick={handleBackgroundClick}>
                            {currentFolderId && (
                                <button onClick={handleUp} className="mb-10 inline-flex items-center gap-3 text-slate-400 hover:text-indigo-600 transition-all font-black text-[10px] uppercase tracking-[0.2em] px-8 py-4 bg-white border border-slate-100 rounded-[1.5rem] shadow-xl group">
                                    <CornerUpLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> Directory Hierarchy
                                </button>
                            )}

                            <div className={cn(viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8 pb-12" : "flex flex-col gap-4 pb-12")}>
                                {paginatedItems.map(item => {
                                    const isSelected = selectedIds.has(item.id);
                                    return (
                                        <div
                                            key={item.id}
                                            onClick={(e) => handleSelect(e, item.id)}
                                            onDoubleClick={() => handleNavigate(item)}
                                            onContextMenu={(e) => handleContextMenu(e, item.id)}
                                            draggable
                                            onDragStart={(e) => onDragStart(e, item)}
                                            onDragOver={(e) => onDragOver(e, item)}
                                            onDrop={(e) => onDrop(e, item.id)}
                                            className={cn(
                                                "relative group transition-all cursor-pointer bg-white border-2",
                                                viewMode === 'grid' ? "p-8 rounded-[3rem] aspect-square flex flex-col items-center justify-between text-center" : "p-6 rounded-[2rem] flex items-center justify-between",
                                                isSelected ? "border-blue-500 bg-blue-50/20 shadow-2xl ring-4 ring-blue-500/10 z-10" : "border-slate-50 hover:border-indigo-100 shadow-xl shadow-slate-300/10",
                                                draggedItemId === item.id ? "opacity-20 scale-95" : "hover:scale-[1.03] hover:-translate-y-2"
                                            )}
                                        >
                                            <div className={cn("relative", viewMode === 'grid' ? "flex-1 flex items-center justify-center w-full" : "shrink-0 mr-8")}>
                                                {item.type === 'folder' ? (
                                                    <div className="relative">
                                                        <Folder size={viewMode === 'grid' ? 100 : 40} className={cn("fill-current opacity-80", item.color || "text-indigo-400")} />
                                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white/20 blur-xl rounded-full" />
                                                    </div>
                                                ) : (
                                                    <div className="relative">
                                                        <div className="p-4 bg-white rounded-[2rem] shadow-lg group-hover:shadow-2xl transition-all">
                                                            <QRCode value={item.url || ''} size={viewMode === 'grid' ? 140 : 50} level="H" />
                                                        </div>
                                                        {item.status === 'assigned' && <div className="absolute -top-3 -right-3 bg-blue-600 p-2 rounded-full text-white shadow-xl ring-4 ring-white"><UserCheck size={14} /></div>}
                                                    </div>
                                                )}
                                            </div>
                                            <div className={cn("min-w-0 flex-1", viewMode === 'grid' ? "w-full mt-6" : "mr-auto")}>
                                                <h4 className="font-black text-xs uppercase tracking-tight text-slate-800 truncate px-4">{item.merchant_name || item.name}</h4>
                                                <div className="flex items-center justify-center gap-2 mt-2 opacity-40">
                                                    <Monitor size={10} />
                                                    <p className="font-mono text-[9px] font-black uppercase tracking-widest truncate">{item.type === 'folder' ? item.size : 'S-NODE: ' + item.url?.slice(-8)}</p>
                                                </div>
                                            </div>
                                            <div className={cn("absolute top-6 right-6 p-2 rounded-xl transition-all border-2", isSelected ? "bg-blue-600 border-blue-600 scale-100" : "bg-white border-slate-100 opacity-0 group-hover:opacity-100 scale-75")}>
                                                {isSelected ? <CheckCircle size={16} className="text-white" /> : <div className="w-4 h-4" />}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {filteredItems.length === 0 && !loading && (
                                <div className="flex flex-col items-center justify-center py-40 text-slate-300">
                                    <div className="p-12 bg-white rounded-full border-4 border-dashed border-slate-50 mb-8 animate-pulse"><SearchCode size={100} strokeWidth={0.5} className="opacity-10" /></div>
                                    <h3 className="font-black text-lg uppercase tracking-[0.5em] opacity-20">No matching assets</h3>
                                    <Button onClick={() => { setSearchTerm(''); setFilterStatus('all'); }} className="mt-8 bg-slate-900 text-white rounded-2xl px-8 h-12 shadow-xl">Clear Deployment Filter</Button>
                                </div>
                            )}

                            {/* Pagination Bar */}
                            {totalPages > 1 && (
                                <div className="mt-20 flex justify-center items-center gap-4 no-print">
                                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center border border-slate-100 hover:bg-slate-50 disabled:opacity-30 shadow-xl transition-all"><ChevronLeft size={24} /></button>
                                    <div className="flex bg-white p-2 rounded-[2rem] border border-slate-100 shadow-2xl gap-2">
                                        {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                                            let pageNum = totalPages > 5 && currentPage > 3 ? currentPage - 2 + i : i + 1;
                                            if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                                            return <button key={pageNum} onClick={() => setCurrentPage(pageNum)} className={cn("w-12 h-12 rounded-xl font-black text-sm transition-all", currentPage === pageNum ? "bg-indigo-600 text-white shadow-xl scale-110" : "text-slate-400 hover:bg-slate-50")}>{pageNum}</button>;
                                        })}
                                        {totalPages > 5 && currentPage < totalPages - 2 && <div className="w-12 h-12 flex items-center justify-center text-slate-300 font-black">...</div>}
                                    </div>
                                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center border border-slate-100 hover:bg-slate-50 disabled:opacity-30 shadow-xl transition-all"><ChevronRight size={24} /></button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Context Menu */}
            {contextMenu && (
                <div className="fixed z-[300] bg-slate-900 rounded-[2rem] shadow-2xl py-4 w-72 border border-slate-800 animate-in fade-in zoom-in-95" style={{ top: contextMenu.y, left: contextMenu.x }} onClick={e => e.stopPropagation()}>
                    <div className="px-8 py-3 border-b border-slate-800 mb-2"><p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Asset Options</p></div>
                    <button onClick={() => handleContextAction('open')} className="w-full flex items-center gap-4 px-8 py-4 text-xs font-black uppercase tracking-widest text-slate-300 hover:bg-indigo-600 hover:text-white transition-all group"><Monitor size={18} /> Primary Action</button>
                    <button onClick={() => handleContextAction('move')} className="w-full flex items-center gap-4 px-8 py-4 text-xs font-black uppercase tracking-widest text-slate-300 hover:bg-blue-600 hover:text-white transition-all group"><Move size={18} /> Re-Batch Assets</button>
                    <div className="h-px bg-slate-800 my-2 mx-8" />
                    <button onClick={() => handleContextAction('delete')} className="w-full flex items-center gap-4 px-8 py-4 text-xs font-black uppercase tracking-widest text-rose-500 hover:bg-rose-600 hover:text-white transition-all group"><Trash2 size={18} /> Decommission</button>
                </div>
            )}

            {/* Move Modal */}
            <Dialog open={isMoveModalOpen} onOpenChange={setIsMoveModalOpen}>
                <DialogContent className="sm:max-w-xl bg-white border-none rounded-[4rem] p-12 shadow-2xl ring-1 ring-slate-100">
                    <DialogHeader><DialogTitle className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-4"><div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600"><Move size={28} /></div>Asset Migration Center</DialogTitle></DialogHeader>
                    <div className="space-y-10 pt-10">
                        <div className="flex items-center gap-6 p-6 bg-slate-50 rounded-[2rem] border border-slate-100"><div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-2xl font-black shadow-sm ring-1 ring-slate-100">{selectedIds.size}</div><div><p className="text-xs font-black uppercase text-slate-400 tracking-widest">Selected Inventory</p><p className="text-sm font-bold text-slate-600 mt-1">Ready for re-batching and cluster updates.</p></div></div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[350px] overflow-y-auto p-2 no-scrollbar">
                            {fileSystem.filter(i => i.parentId === 'f_batches').map(folder => (
                                <button key={folder.id} onClick={() => setTargetBatchId(folder.id)} className={cn("flex items-center gap-5 p-6 rounded-[2.5rem] border-2 transition-all group", targetBatchId === folder.id ? "bg-indigo-600 border-indigo-600 text-white shadow-2xl scale-[1.03]" : "bg-white border-slate-50 hover:border-indigo-100 text-slate-600")}>
                                    <div className={cn("p-4 rounded-2xl transition-all", targetBatchId === folder.id ? "bg-white/10" : "bg-slate-50")}><Folder size={24} className={targetBatchId === folder.id ? "text-white" : "text-amber-400 fill-current opacity-60"} /></div>
                                    <div className="text-left min-w-0 flex-1"><span className="text-xs font-black uppercase tracking-widest truncate block">{folder.name}</span><span className={cn("text-[9px] font-mono font-bold block mt-1", targetBatchId === folder.id ? "text-indigo-200" : "text-slate-300")}>{folder.size}</span></div>
                                </button>
                            ))}
                        </div>
                        <Button className="h-20 w-full bg-slate-900 hover:bg-indigo-600 text-white rounded-[2.5rem] font-black uppercase tracking-[0.3em] shadow-2xl transition-all flex items-center justify-center gap-4 text-sm" onClick={() => handleMoveToFolder()} disabled={!targetBatchId || loading}><CheckCircle size={24} /> Confirm Migration</Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* QR Preview Modal */}
            <Dialog open={!!previewQr} onOpenChange={(open) => !open && setPreviewQr(null)}>
                <DialogContent className="sm:max-w-lg bg-white border-none rounded-[5rem] p-12 shadow-2xl overflow-hidden ring-1 ring-slate-100 no-print">
                    <div className="flex flex-col items-center">
                        <div className="p-8 bg-white rounded-[3.5rem] shadow-2xl border-2 border-slate-50 mb-10 group relative"><div className="absolute -inset-4 bg-indigo-500/5 blur-3xl rounded-full group-hover:bg-indigo-500/10 transition-all" /><QRCode value={previewQr?.url || ''} size={280} level="H" /></div>
                        <div className="w-full space-y-10 text-center">
                            <div><div className={cn("px-8 py-2.5 rounded-full text-xs font-black uppercase tracking-[0.3em] inline-block mb-4", previewQr?.status === 'assigned' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700')}>{previewQr?.status || 'Active Node'}</div><h3 className="text-2xl font-black text-slate-800 tracking-tight block truncate max-w-full px-4">{previewQr?.merchant_name || 'Velyx Asset'}</h3><p className="mt-2 text-[11px] font-mono font-black text-slate-300 break-all bg-slate-50 p-4 rounded-3xl border border-slate-100">{previewQr?.url}</p></div>
                            <div className="flex gap-4 p-2"><button onClick={handlePrint} className="flex-1 py-7 bg-slate-900 text-white rounded-[2.5rem] font-black uppercase tracking-[0.3em] hover:bg-indigo-600 transition-all shadow-2xl flex items-center justify-center gap-4 text-sm"><Printer size={22} /> Print Asset</button><button onClick={handleDeleteMultiple} disabled={previewQr?.status === 'assigned'} className="w-24 py-7 bg-rose-50 text-rose-500 rounded-[2.5rem] flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all disabled:opacity-20 shadow-xl border border-rose-100"><Trash2 size={28} /></button></div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Loader Overlay */}
            {loading && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl z-[1000] flex items-center justify-center animate-in fade-in duration-300">
                    <div className="flex flex-col items-center gap-10">
                        <div className="relative"><div className="w-24 h-24 border-8 border-white/20 border-t-white rounded-full animate-spin shadow-2xl" /><div className="absolute inset-0 flex items-center justify-center"><QrCode className="text-white animate-pulse" size={32} /></div></div>
                        <div className="text-center"><h2 className="text-white font-black text-xl uppercase tracking-[0.5em] mb-2">Syncing Data</h2><p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Global Infrastructure Update Progress</p></div>
                    </div>
                </div>
            )}

            {/* Branded Print View - Generator Style */}
            {isPreparingPrint && printableAssets.length > 0 && (
                <div className="print-view-container fixed inset-0 z-[-1] bg-white print:static print:z-auto">
                    {Array.from({ length: Math.ceil(printableAssets.length / 3) }).map((_, pageIndex) => (
                        <div key={pageIndex} className="print-page flex items-center justify-center gap-4 p-4">
                            {printableAssets.slice(pageIndex * 3, pageIndex * 3 + 3).map((item) => (
                                <div key={item.id} className="qr-card-branded flex-1">
                                    <div className="qr-brand-top">
                                        <div className="msme">MSME SHAKTI</div>
                                        <div className="openscore">OPEN SCORE</div>
                                        <div className="tagline">Unlock Cashback Rewards!</div>
                                    </div>

                                    <div className="qr-ring-container">
                                        <div className="qr-ring"></div>
                                        <div className="qr-box">
                                            <QRCode value={item.url || ''} size={220} level="H" />
                                            <div className="check-badge">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                    <path d="M20 6L9 17l-5-5" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="qr-bottom">
                                        <div className="scan-pay">SCAN & PAY</div>
                                        <div className="cashback-text">Get <span>Instant Cashback</span> on Every Transaction!</div>
                                        <div className="for-text">For Businesses & Customers</div>
                                    </div>

                                    <div className="qr-footer">
                                        <div className="powered">
                                            <div className="icon"></div>
                                            <span>Powered by MSME Shakti</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            )}
        </AdminLayout>
    );
}