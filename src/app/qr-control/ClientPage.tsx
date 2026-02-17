'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Folder, FileText, ChevronRight, Home, Upload, MoreVertical, Trash2, Edit2, Download, QrCode } from 'lucide-react';
import { toast } from 'sonner';

// Mock Data Structure for File System
interface FileItem {
    id: string;
    name: string;
    type: 'folder' | 'file';
    size?: string; // e.g. "2 MB" or "4 items"
    date: string;
    color?: string; // tailwind color class for folders
    url?: string; // for files (QR image url)
    metadata?: any;
}

const INITIAL_DATA: FileItem[] = [
    { id: 'f1', name: 'Merchant QRs', type: 'folder', size: '12 items', date: '2024-01-15', color: 'text-blue-500' },
    { id: 'f2', name: 'Agent QRs', type: 'folder', size: '5 items', date: '2024-02-10', color: 'text-purple-500' },
    { id: 'f3', name: 'System QRs', type: 'folder', size: '3 items', date: '2024-02-01', color: 'text-slate-500' },
    { id: 'file1', name: 'Default_Payment.png', type: 'file', size: '156 KB', date: '2024-02-20', url: '/placeholder-qr.png' },
];

const FOLDER_CONTENTS: Record<string, FileItem[]> = {
    'f1': [
        { id: 'm1', name: 'Shop_A_QR.png', type: 'file', size: '200 KB', date: '2024-01-15' },
        { id: 'm2', name: 'Shop_B_QR.png', type: 'file', size: '210 KB', date: '2024-01-16' },
    ],
    'f2': [
        { id: 'a1', name: 'Agent_007.png', type: 'file', size: '180 KB', date: '2024-02-10' },
    ],
    'f3': [
        { id: 's1', name: 'Main_UPI.png', type: 'file', size: '120 KB', date: '2024-02-01' },
    ]
};

export default function QRControlClient() {
    // Navigation Stack
    const [path, setPath] = useState<FileItem[]>([]); // Empty = Root
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

    // Get current items
    const items = currentFolderId ? (FOLDER_CONTENTS[currentFolderId] || []) : INITIAL_DATA;

    const handleNavigate = (item: FileItem) => {
        if (item.type === 'folder') {
            setPath([...path, item]);
            setCurrentFolderId(item.id);
        } else {
            // Open File Preview
            toast.info(`Opening ${item.name}...`);
        }
    };

    const handleBreadcrumbClick = (index: number) => {
        if (index === -1) {
            setPath([]);
            setCurrentFolderId(null);
        } else {
            const newPath = path.slice(0, index + 1);
            setPath(newPath);
            setCurrentFolderId(newPath[newPath.length - 1].id);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">QR Manager</h2>
                    <p className="text-muted-foreground">Manage system and user QRs like a file system.</p>
                </div>
                <Button className="gap-2">
                    <Upload className="w-4 h-4" /> Upload New QR
                </Button>
            </div>

            {/* Breadcrumbs / Path Bar */}
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-lg text-sm text-slate-600 overflow-x-auto">
                <button
                    onClick={() => handleBreadcrumbClick(-1)}
                    className="hover:text-slate-900 flex items-center gap-1 font-medium transition-colors"
                >
                    <Home className="w-4 h-4" /> Root
                </button>
                {path.map((folder, idx) => (
                    <div key={folder.id} className="flex items-center gap-2">
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                        <button
                            onClick={() => handleBreadcrumbClick(idx)}
                            className="hover:text-slate-900 font-medium transition-colors whitespace-nowrap"
                        >
                            {folder.name}
                        </button>
                    </div>
                ))}
            </div>

            {/* File System Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                {items.map((item) => (
                    <div
                        key={item.id}
                        onDoubleClick={() => handleNavigate(item)}
                        onClick={() => handleNavigate(item)} // Single click for mobile/simplicity or select
                        className="group relative flex flex-col items-center p-4 bg-white rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/50 hover:shadow-md transition-all cursor-pointer aspect-square justify-between"
                    >
                        {/* Icon */}
                        <div className="flex-1 flex items-center justify-center w-full">
                            {item.type === 'folder' ? (
                                <Folder className={`w-16 h-16 ${item.color || 'text-indigo-400'} fill-current opacity-90`} />
                            ) : (
                                <div className="relative">
                                    <FileText className="w-14 h-14 text-slate-400" />
                                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                                        <QrCode className="w-5 h-5 text-indigo-600" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Name & Meta */}
                        <div className="w-full text-center mt-3">
                            <p className="text-sm font-medium text-slate-700 truncate w-full px-2" title={item.name}>
                                {item.name}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1">{item.size}</p>
                        </div>

                        {/* Actions (Hover) */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-slate-200">
                                <MoreVertical className="w-3 h-3" />
                            </Button>
                        </div>
                    </div>
                ))}

                {/* Empty State */}
                {items.length === 0 && (
                    <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-400">
                        <Folder className="w-12 h-12 mb-3 text-slate-200" />
                        <p>This folder is empty</p>
                    </div>
                )}
            </div>
        </div>
    );
}
