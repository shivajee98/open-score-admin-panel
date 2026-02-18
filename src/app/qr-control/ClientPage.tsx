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
    Zap
} from 'lucide-react';

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
}

export default function QRControlClient() {
    // --- State ---
    const [fileSystem, setFileSystem] = useState<FileItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // QR Preview Modal
    const [previewQr, setPreviewQr] = useState<{ name: string, data: string } | null>(null);

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
        } else if (item.url) {
            // View QR Modal
            setPreviewQr({ name: item.name, data: item.url });
        }
    };

    const handleUp = () => {
        if (!currentFolderId) return;
        const currentFolder = fileSystem.find(i => i.id === currentFolderId);
        setCurrentFolderId(currentFolder?.parentId || null);
        setSelectedIds(new Set());
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

    // Context Menu Actions
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
                    if (confirm(`Delete ${item.name}?`)) {
                        try {
                            await apiFetch(`/admin/qr/${item.id}`, { method: 'DELETE' });
                            toast.success("Item deleted");
                            fetchData();
                        } catch (e: any) {
                            toast.error(e.message || "Failed to delete");
                        }
                    }
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
    const [searchTerm, setSearchTerm] = useState('');

    const filteredItems = currentItems.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.size && item.size.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
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
            <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black tracking-tight text-slate-800 uppercase">QR Manager</h2>
                    <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest text-indigo-500">Live File System</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search QR File..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-indigo-100 transition-all w-64 shadow-sm"
                        />
                    </div>
                    <div className="flex items-center bg-slate-100 rounded-2xl p-1 border border-slate-200">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-1.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Grid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-1.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <ListIcon className="w-4 h-4" />
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

            {/* Path Bar */}
            <div className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm text-sm text-slate-600 overflow-x-auto">
                <button
                    onClick={(e) => { e.stopPropagation(); setCurrentFolderId(null); setSelectedIds(new Set()); }}
                    className={`flex items-center gap-1 font-black uppercase tracking-wider transition-colors hover:text-indigo-600 ${!currentFolderId ? 'text-indigo-600' : ''}`}
                >
                    <Home className="w-4 h-4" /> Root
                </button>

                {crumbs.map((folder, idx) => (
                    <div key={folder.id} className="flex items-center gap-2">
                        <ChevronRight className="w-4 h-4 text-slate-300" />
                        <button
                            onClick={(e) => { e.stopPropagation(); setCurrentFolderId(folder.id); setSelectedIds(new Set()); }}
                            className={`font-bold transition-colors whitespace-nowrap hover:text-indigo-600 ${idx === crumbs.length - 1 ? 'text-indigo-600' : 'text-slate-400'}`}
                        >
                            {folder.name}
                        </button>
                    </div>
                ))}
            </div>

            {/* File Area */}
            <div className="bg-slate-50/50 rounded-[2.5rem] border border-slate-200/60 p-6 min-h-[400px]">
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
                        ? "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-6"
                        : "flex flex-col gap-3"
                }>
                    {filteredItems.map((item) => {
                        const isSelected = selectedIds.has(item.id);
                        const isDragOver = dragOverFolderId === item.id;

                        return (
                            <div
                                key={item.id}
                                draggable
                                onDragStart={(e) => onDragStart(e, item)}
                                onDragOver={(e) => onDragOver(e, item)}
                                onDrop={(e) => onDrop(e, item.id)} // Drop ONTO this item (if it's a folder)
                                onClick={(e) => handleSelect(e, item.id)}
                                onDoubleClick={(e) => { e.stopPropagation(); handleNavigate(item); }}
                                onContextMenu={(e) => handleContextMenu(e, item.id)}
                                className={`
                                    group relative transition-all cursor-pointer select-none
                                    ${viewMode === 'grid'
                                        ? 'flex flex-col items-center p-4 rounded-xl border aspect-square justify-between'
                                        : 'flex items-center p-3 rounded-lg border gap-4'
                                    }
                                    ${isSelected
                                        ? 'bg-indigo-50 border-indigo-500 shadow-sm ring-1 ring-indigo-500'
                                        : 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50 hover:shadow-sm'
                                    }
                                    ${isDragOver ? 'bg-indigo-100 border-indigo-500 scale-105 ring-2 ring-indigo-500 z-10' : ''}
                                    ${draggedItemId === item.id ? 'opacity-50 grayscale' : ''}
                                `}
                            >
                                {/* Icon */}
                                <div className={viewMode === 'grid' ? "flex-1 flex items-center justify-center w-full" : "shrink-0"}>
                                    {item.type === 'folder' ? (
                                        <Folder className={`${viewMode === 'grid' ? 'w-16 h-16' : 'w-8 h-8'} ${item.color || 'text-indigo-400'} fill-current opacity-90 transition-transform group-hover:scale-105`} />
                                    ) : (
                                        <div className="relative">
                                            <FileText className={`${viewMode === 'grid' ? 'w-14 h-14' : 'w-8 h-8'} text-slate-400`} />
                                            <div className={`absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm ${viewMode === 'list' ? 'scale-75' : ''}`}>
                                                <QrCode className="w-4 h-4 text-indigo-600" />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Name & Meta */}
                                <div className={`${viewMode === 'grid' ? 'w-full text-center mt-3' : 'flex-1 min-w-0'}`}>
                                    <p className={`font-medium text-slate-700 truncate ${viewMode === 'grid' ? 'text-sm w-full px-1' : 'text-base'}`} title={item.name}>
                                        {item.name}
                                    </p>
                                    <p className={`text-slate-400 ${viewMode === 'grid' ? 'text-[10px] mt-1' : 'text-xs'}`}>
                                        {item.size} • {item.date}
                                    </p>
                                </div>

                                {/* List View Extra Actions */}
                                {viewMode === 'list' && (
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-700">
                                        <MoreVertical className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                        );
                    })}

                    {currentItems.length === 0 && (
                        <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-300">
                            <div className="bg-slate-50 p-6 rounded-full border-2 border-dashed border-slate-200 mb-4">
                                <Upload className="w-10 h-10 text-slate-200" />
                            </div>
                            <p className="text-slate-400 font-medium">Drag files here or start uploading</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Context Menu Overlay */}
            {contextMenu && (
                <div
                    className="fixed z-50 bg-white shadow-xl border border-slate-200 rounded-lg py-1 w-48 animate-in fade-in zoom-in-95 duration-100"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button onClick={() => handleContextAction('open')} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 flex items-center gap-2">
                        <Move className="w-4 h-4" /> Open
                    </button>
                    <button onClick={() => handleContextAction('rename')} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 flex items-center gap-2">
                        <Edit2 className="w-4 h-4" /> Rename
                    </button>
                    <div className="h-px bg-slate-100 my-1" />
                    <button onClick={() => handleContextAction('delete')} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                        <Trash2 className="w-4 h-4" /> Delete
                    </button>
                </div>
            )}

            {/* QR Preview Dialog */}
            <Dialog open={!!previewQr} onOpenChange={(open) => !open && setPreviewQr(null)}>
                <DialogContent className="sm:max-w-md bg-white border-none rounded-[2.5rem] p-8 shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight text-center">
                            QR File Preview
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col items-center justify-center p-6 space-y-6">
                        <div className="p-4 bg-white rounded-3xl shadow-lg border border-slate-100">
                            {previewQr && <QRCode value={previewQr.data} size={256} level="H" />}
                        </div>
                        <div className="text-center">
                            <h3 className="text-lg font-bold text-slate-800">{previewQr?.name}</h3>
                            <p className="text-sm text-slate-400 font-mono mt-1">{previewQr?.data}</p>
                        </div>
                        <Button
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl h-14 font-black text-sm uppercase tracking-widest"
                            onClick={() => window.print()}
                        >
                            Print QR Code
                        </Button>
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
    );
}
