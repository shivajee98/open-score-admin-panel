'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
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
    CornerUpLeft
} from 'lucide-react';
import { toast } from 'sonner';

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

// --- Mock Initial Data ---
const MOCK_DB: FileItem[] = [
    { id: 'f1', name: 'Merchant QRs', type: 'folder', size: '12 items', date: '2024-01-15', color: 'text-blue-500', parentId: null },
    { id: 'f2', name: 'Agent QRs', type: 'folder', size: '5 items', date: '2024-02-10', color: 'text-purple-500', parentId: null },
    { id: 'f3', name: 'System QRs', type: 'folder', size: '3 items', date: '2024-02-01', color: 'text-slate-500', parentId: null },
    { id: 'file1', name: 'Default_Payment.png', type: 'file', size: '156 KB', date: '2024-02-20', url: '/placeholder-qr.png', parentId: null },

    // Inside f1
    { id: 'm1', name: 'Shop_A_QR.png', type: 'file', size: '200 KB', date: '2024-01-15', parentId: 'f1' },
    { id: 'm2', name: 'Shop_B_QR.png', type: 'file', size: '210 KB', date: '2024-01-16', parentId: 'f1' },

    // Inside f2
    { id: 'a1', name: 'Agent_007.png', type: 'file', size: '180 KB', date: '2024-02-10', parentId: 'f2' },

    // Inside f3
    { id: 's1', name: 'Main_UPI.png', type: 'file', size: '120 KB', date: '2024-02-01', parentId: 'f3' }
];

export default function QRControlClient() {
    // --- State ---
    const [fileSystem, setFileSystem] = useState<FileItem[]>(MOCK_DB);
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Drag & Drop State
    const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
    const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);

    // Context Menu State
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, itemId: string | null } | null>(null);

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
        } else {
            toast.info(`Opening file: ${item.name}`);
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
        // Create ghost image if needed, default usually works
    };

    const onDragOver = (e: React.DragEvent, item: FileItem | null) => {
        e.preventDefault(); // Necessary to allow dropping
        if (item && item.type === 'folder' && item.id !== draggedItemId) {
            setDragOverFolderId(item.id);
        } else {
            setDragOverFolderId(null);
        }
    };

    const onDrop = (e: React.DragEvent, targetFolderId: string | null) => {
        e.preventDefault();
        setDragOverFolderId(null);

        if (!draggedItemId) return;
        if (targetFolderId === draggedItemId) return; // Can't drop on self

        // Update File System
        const itemToMove = fileSystem.find(i => i.id === draggedItemId);
        if (!itemToMove) return;

        // Prevent circular moves (folder into its child) - simplified check since we only go 1 level deep mock
        // Real implementation needs recursive check

        setFileSystem(prev => prev.map(item => {
            if (item.id === draggedItemId) {
                return { ...item, parentId: targetFolderId };
            }
            return item;
        }));

        const targetName = targetFolderId
            ? fileSystem.find(i => i.id === targetFolderId)?.name
            : 'Root';

        toast.success(`Moved "${itemToMove.name}" to "${targetName}"`);
        setDraggedItemId(null);
    };

    // --- Context Menu ---
    const handleContextMenu = (e: React.MouseEvent, itemId: string) => {
        e.preventDefault();
        e.stopPropagation();
        setSelectedIds(new Set([itemId])); // Select item logic
        setContextMenu({ x: e.clientX, y: e.clientY, itemId });
    };

    // Context Menu Actions
    const handleContextAction = (action: string) => {
        if (!contextMenu?.itemId) return;
        const item = fileSystem.find(i => i.id === contextMenu.itemId);
        if (!item) return;

        switch (action) {
            case 'open':
                handleNavigate(item);
                break;
            case 'rename':
                toast.info("Rename feature coming soon!");
                break;
            case 'delete':
                if (confirm(`Delete ${item.name}?`)) {
                    setFileSystem(prev => prev.filter(i => i.id !== item.id));
                    toast.success("Item deleted");
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
        <div
            className="space-y-6 min-h-[500px]"
            onClick={handleBackgroundClick}
            onDragOver={(e) => {
                e.preventDefault();
                // Allow dropping on empty space to move to current folder? No, usually drop ON a folder.
                // But if we dragged from outside... complex.
                // For now, drop targets are only Folders.
            }}
        >
            {/* Header / Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-800">QR Manager</h2>
                    <p className="text-muted-foreground text-sm">File System Mode</p>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Grid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <ListIcon className="w-4 h-4" />
                        </button>
                    </div>
                    <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                        <Upload className="w-4 h-4" /> Upload
                    </Button>
                </div>
            </div>

            {/* Path Bar */}
            <div className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm text-sm text-slate-600 overflow-x-auto">
                <button
                    onClick={(e) => { e.stopPropagation(); setCurrentFolderId(null); setSelectedIds(new Set()); }}
                    className={`flex items-center gap-1 font-medium transition-colors hover:text-indigo-600 ${!currentFolderId ? 'text-indigo-600 font-bold' : ''}`}
                >
                    <Home className="w-4 h-4" /> Root
                </button>

                {crumbs.map((folder, idx) => (
                    <div key={folder.id} className="flex items-center gap-2">
                        <ChevronRight className="w-4 h-4 text-slate-300" />
                        <button
                            onClick={(e) => { e.stopPropagation(); setCurrentFolderId(folder.id); setSelectedIds(new Set()); }}
                            className={`font-medium transition-colors whitespace-nowrap hover:text-indigo-600 ${idx === crumbs.length - 1 ? 'text-indigo-600 font-bold' : ''}`}
                        >
                            {folder.name}
                        </button>
                    </div>
                ))}
            </div>

            {/* File Area */}
            <div className="bg-slate-50/50 rounded-2xl border border-slate-200/60 p-6 min-h-[400px]">
                {/* Back Button if not root */}
                {currentFolderId && (
                    <div
                        className="mb-4 inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 cursor-pointer font-medium text-sm transition-colors py-1 px-2 rounded-lg hover:bg-indigo-50"
                        onClick={(e) => { e.stopPropagation(); handleUp(); }}
                    >
                        <CornerUpLeft className="w-4 h-4" /> Back to parent
                    </div>
                )}

                <div className={
                    viewMode === 'grid'
                        ? "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4"
                        : "flex flex-col gap-2"
                }>
                    {currentItems.map((item) => {
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
        </div>
    );
}
