'use client';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import UserDetailsPage from './ClientPage';

function UserDetailContent() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    if (!id) return <div className="p-8 text-center text-red-500">No user ID provided</div>;
    return <UserDetailsPage />;
}

export default function UserDetailPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
            <UserDetailContent />
        </Suspense>
    );
}
