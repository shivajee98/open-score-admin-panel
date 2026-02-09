"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("token");
        // Remove trailing slash for comparison
        const normalizedPathname = pathname?.replace(/\/$/, '') || "";
        // With basePath: '/admin', pathname is relative to /admin
        // So /admin/login is just /login
        const isAuthRoute = normalizedPathname === "/login";

        // Allow static assets and public routes
        if (!pathname || pathname.startsWith("/_next")) {
            setAuthorized(true);
            return;
        }

        if (token) {
            // User is logged in
            if (isAuthRoute) {
                // Determine role from local storage
                const userStr = localStorage.getItem("user");
                let user: any = {};
                try {
                    user = userStr ? JSON.parse(userStr) : {};
                } catch (e) {
                    localStorage.removeItem("user");
                    localStorage.removeItem("token");
                    router.push('/login/');
                    return;
                }

                const target = user.role === 'SUB_USER' ? '/sub-user-dashboard/' : '/';
                router.push(target);
            } else {
                setAuthorized(true);
            }
        } else {
            // User is NOT logged in
            if (!isAuthRoute) {
                // Redirect protected routes to login
                router.push('/login/');
            } else {
                setAuthorized(true);
            }
        }
    }, [pathname, router]);

    // Prevent flashing of protected content
    if (!authorized) {
        return <div className="min-h-screen flex items-center justify-center bg-[#020617]">
            <div className="w-10 h-10 border-4 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
        </div>;
    }

    return <>{children}</>;
}
