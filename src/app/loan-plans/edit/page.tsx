'use client';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import EditLoanPlanClient from './ClientPage';

function EditPageContent() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');

    if (!id) {
        return <div className="p-8 text-center text-red-500">No plan ID provided</div>;
    }

    return <EditLoanPlanClient />;
}

export default function EditPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
            <EditPageContent />
        </Suspense>
    );
}
