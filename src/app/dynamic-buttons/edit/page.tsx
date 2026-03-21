'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import ButtonForm from '@/components/dynamic-buttons/ButtonForm';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';

function EditButtonContent() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    const [button, setButton] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) {
            setLoading(false);
            return;
        }
        const fetchButton = async () => {
            try {
                const data = await apiFetch(`/admin/dynamic-buttons/${id}`);
                setButton(data);
            } catch (error) {
                toast.error('Failed to fetch button details');
            } finally {
                setLoading(false);
            }
        };

        fetchButton();
    }, [id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" />
            </div>
        );
    }

    if (!button) {
        return (
            <div className="text-center py-12">
                <p className="text-slate-500 italic">Button not found.</p>
            </div>
        );
    }

    return (
        <ButtonForm initialData={button} isEdit={true} />
    );
}

export default function EditButtonPage() {
    return (
        <AdminLayout title="Edit Dynamic Button">
            <Suspense fallback={
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" />
                </div>
            }>
                <EditButtonContent />
            </Suspense>
        </AdminLayout>
    );
}
