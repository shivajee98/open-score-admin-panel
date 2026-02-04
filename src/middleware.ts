import { auth } from "@/auth"

export default auth((req) => {
    const isAuth = !!req.auth;
    const isLoginPage = req.nextUrl.pathname.startsWith("/login");
    const isApi = req.nextUrl.pathname.startsWith("/api");
    const isStatic = req.nextUrl.pathname.startsWith("/_next");

    console.log('[Middleware]', {
        path: req.nextUrl.pathname,
        isAuth,
        hasAuthData: !!req.auth,
        userRole: (req.auth as any)?.user?.role || 'none'
    });

    // Allow public routes
    if (isLoginPage || isApi || isStatic) {
        return;
    }

    // Redirect unauthenticated users to login
    if (!isAuth) {
        console.log('[Middleware] Redirecting to login - not authenticated');
        return Response.redirect(new URL("/login", req.nextUrl));
    }

    // Redirect authenticated users away from login page
    if (isAuth && isLoginPage) {
        const userRole = (req.auth as any)?.user?.role;
        const redirectUrl = userRole === 'SUB_USER' ? '/sub-user-dashboard' : '/';
        console.log('[Middleware] Redirecting authenticated user from login to:', redirectUrl);
        return Response.redirect(new URL(redirectUrl, req.nextUrl));
    }
})

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
