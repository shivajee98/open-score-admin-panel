'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import { Settings, Save, AlertTriangle, Palette, Type, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function MaintenanceSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        is_active: false,
        message: 'System is under maintenance. Please check back later.',
        textColor: '#ffffff',
        backgroundColor: '#0f172a',
        fontFamily: 'sans-serif',
        end_time: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const data = await apiFetch('/maintenance');
            // Format end_time for datetime-local input
            if (data.end_time) {
                const date = new Date(data.end_time);
                data.end_time = date.toISOString().slice(0, 16);
            }
            setSettings({
                is_active: data.is_active || false,
                message: data.message || 'System is under maintenance. Please check back later.',
                textColor: data.textColor || '#ffffff',
                backgroundColor: data.backgroundColor || '#0f172a',
                fontFamily: data.fontFamily || 'sans-serif',
                end_time: data.end_time || ''
            });
        } catch (error) {
            console.error('Failed to fetch data:', error);
            toast.error('Failed to load maintenance settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await apiFetch('/admin/maintenance', {
                method: 'POST',
                body: JSON.stringify(settings)
            });
            toast.success('Maintenance status updated successfully!');
        } catch (error) {
            console.error('Failed to save settings:', error);
            toast.error('Failed to update maintenance status');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <AdminLayout title="Maintenance Mode">
            <title>Maintenance Mode | OpenScore</title>
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-start gap-4">
                    <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-amber-900">Important Notice</h2>
                        <p className="text-amber-700 text-sm">
                            Enabling Maintenance Mode will immediately block access for all users across the Frontend, Sub-user panel, and Support Dashboard. 
                            The Admin Panel will remain accessible to you.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Controls */}
                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                                <Settings className="w-5 h-5 text-slate-600" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900">Control Switch</h3>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <div>
                                <p className="font-bold text-slate-900">Maintenance Status</p>
                                <p className="text-xs text-slate-500">{settings.is_active ? 'Currently ON - Public access blocked' : 'Currently OFF - Public access enabled'}</p>
                            </div>
                            <button
                                onClick={() => setSettings({ ...settings, is_active: !settings.is_active })}
                                className={`w-14 h-8 rounded-full p-1 transition-colors ${settings.is_active ? 'bg-rose-500' : 'bg-slate-300'}`}
                            >
                                <div className={`w-6 h-6 bg-white rounded-full transition-transform ${settings.is_active ? 'translate-x-6' : ''}`}></div>
                            </button>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Announcement Message</label>
                            <textarea
                                value={settings.message}
                                onChange={(e) => setSettings({ ...settings, message: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-blue-500 min-h-[120px]"
                                placeholder="Enter text to show on maintenance screen..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                                <Clock className="w-4 h-4" /> Estimated Completion Time
                            </label>
                            <input
                                type="datetime-local"
                                value={settings.end_time}
                                onChange={(e) => setSettings({ ...settings, end_time: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-blue-500"
                            />
                            <p className="text-xs text-slate-500 mt-2">A countdown timer will be shown to users based on this time.</p>
                        </div>
                    </div>

                    {/* Design Controls */}
                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                                <Palette className="w-5 h-5 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900">Design Settings</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2 font-mono">Background</label>
                                <div className="flex items-center gap-2 bg-slate-50 p-2 border border-slate-200 rounded-xl">
                                    <input
                                        type="color"
                                        value={settings.backgroundColor}
                                        onChange={(e) => setSettings({ ...settings, backgroundColor: e.target.value })}
                                        className="w-10 h-10 rounded-lg cursor-pointer border-0"
                                    />
                                    <span className="text-sm font-bold uppercase">{settings.backgroundColor}</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2 font-mono">Text Color</label>
                                <div className="flex items-center gap-2 bg-slate-50 p-2 border border-slate-200 rounded-xl">
                                    <input
                                        type="color"
                                        value={settings.textColor}
                                        onChange={(e) => setSettings({ ...settings, textColor: e.target.value })}
                                        className="w-10 h-10 rounded-lg cursor-pointer border-0"
                                    />
                                    <span className="text-sm font-bold uppercase">{settings.textColor}</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                                <Type className="w-4 h-4" /> Font Family
                            </label>
                            <select
                                value={settings.fontFamily}
                                onChange={(e) => setSettings({ ...settings, fontFamily: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500 appearance-none"
                            >
                                <option value="sans-serif">Modern Sans (Default)</option>
                                <option value="serif">Classic Serif</option>
                                <option value="monospace">System Mono</option>
                                <option value="'Inter', sans-serif">Inter</option>
                                <option value="'Outfit', sans-serif">Outfit</option>
                                <option value="'Poppins', sans-serif">Poppins</option>
                            </select>
                        </div>

                        {/* Live Preview */}
                        <div className="mt-4">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Live Preview Snippet</p>
                            <div 
                                className="w-full p-6 rounded-2xl border border-slate-200 flex flex-col items-center justify-center text-center gap-3 transition-colors duration-500"
                                style={{ 
                                    backgroundColor: settings.backgroundColor, 
                                    color: settings.textColor,
                                    fontFamily: settings.fontFamily 
                                }}
                            >
                                <h4 className="font-black text-lg">System Maintenance</h4>
                                <p className="text-sm opacity-80 max-w-xs">{settings.message}</p>
                                <div className="text-2xl font-black mt-2 tabular-nums">00:45:12</div>
                                <p className="text-[10px] uppercase tracking-tighter opacity-60">Estimated Remaining Time</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl shadow-slate-900/20 active:scale-95"
                    >
                        {saving ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <Save className="w-6 h-6 text-white" />
                                <span className="text-lg">Apply Maintenance Mode</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </AdminLayout>
    );
}
