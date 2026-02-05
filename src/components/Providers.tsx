'use client';

import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider
            refetchInterval={5 * 60} // Refetch session every 5 minutes instead of constantly
            refetchOnWindowFocus={false} // Don't refetch on window focus
        >
            {children}
        </SessionProvider>
    );
}
