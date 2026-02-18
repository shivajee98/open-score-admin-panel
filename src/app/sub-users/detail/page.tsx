'use client';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import SubUserDetailPage from './ClientPage';

function SubUserDetailContent() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    if (!id) return <div className="p-8 text-center text-red-500">No agent ID provided</div>;
    return <SubUserDetailPage />;
}

export default function SubUserDetail() {
    return (
        <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
            <SubUserDetailContent />
        </Suspense>
    );
}
