import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { Power, PowerOff, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginAccessControl() {
    const [disabled, setDisabled] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await apiFetch('/admin/login-status');
                setDisabled(res.login_disabled);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);

                
            }
        };
        fetchStatus();
    }, []);

    const toggleStatus = async () => {
        if (!confirm(`Are you sure you want to ${disabled ? 'ENABLE' : 'DISABLE'} all logins and new onboarding?`)) return;
        
        setLoading(true);
        try {
            const res = await apiFetch('/admin/login-status', {
                method: 'POST',
                body: JSON.stringify({ login_disabled: !disabled })
            });
            setDisabled(res.login_disabled);
            toast.success(res.login_disabled ? 'Login and onboarding disabled globally' : 'Login and onboarding enabled globally');
        } catch (e: any) {
            toast.error(e.message || 'Failed to update login status');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="animate-pulse w-48 h-10 bg-slate-100 rounded-xl"></div>
        );
    }

    return (
        <button
            onClick={toggleStatus}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                disabled 
                ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100' 
                : 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100'
            }`}
        >
            {disabled ? <ShieldAlert className="w-4 h-4" /> : <Power className="w-4 h-4" />}
            {disabled ? 'Login Disabled' : 'Login Enabled'}
        </button>
    );
}
