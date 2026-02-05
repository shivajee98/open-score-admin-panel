import { auth } from "@/auth"

export default auth((req) => {
    const isAuth = !!req.auth;
    const isLoginPage = req.nextUrl.pathname.startsWith("/login");
    const isApi = req.nextUrl.pathname.startsWith("/api");
    const isStatic = req.nextUrl.pathname.startsWith("/_next") ||
        req.nextUrl.pathname.includes('.') || // Any file with extension
        req.nextUrl.pathname === '/favicon.ico';

    // Allow public routes and static files without auth check
    if (isLoginPage || isApi || isStatic) {
        return;
    }

    // Redirect unauthenticated users to login
    if (!isAuth) {
        return Response.redirect(new URL("/login", req.nextUrl));
    }

    // Redirect authenticated users away from login page
    if (isAuth && isLoginPage) {
        const userRole = (req.auth as any)?.user?.role;
        const redirectUrl = userRole === 'SUB_USER' ? '/sub-user-dashboard' : '/';
        return Response.redirect(new URL(redirectUrl, req.nextUrl));
    }
})

export const config = {
    matcher: [
        /*
         * Match all request paths except for:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico, icon.*, manifest.*
         * - Files with extensions (images, fonts, etc.)
         */
        "/((?!api|_next/static|_next/image|favicon.ico|icon|.*\\..*).*)"
    ],
}
