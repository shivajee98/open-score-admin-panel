'use client';

import React from 'react';
import AdminLayout from '@/components/AdminLayout';
import ButtonForm from '@/components/dynamic-buttons/ButtonForm';

export default function CreateButtonPage() {
    return (
        <AdminLayout title="Create Dynamic Button">
            <ButtonForm />
        </AdminLayout>
    );
}
