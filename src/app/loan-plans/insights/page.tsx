'use client';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import LoanPlanInsights from './ClientPage';

function InsightsPageContent() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    if (!id) return <div className="p-8 text-center text-red-500">No plan ID provided</div>;
    return <LoanPlanInsights />;
}

export default function InsightsPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
            <InsightsPageContent />
        </Suspense>
    );
}
