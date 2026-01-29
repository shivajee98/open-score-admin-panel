import { auth } from "@/auth"

export default auth((req) => {
    const isAuth = !!req.auth;
    // Protect everything except login and public assets
    const isLoginPage = req.nextUrl.pathname.startsWith("/login");
    const isApi = req.nextUrl.pathname.startsWith("/api");
    const isStatic = req.nextUrl.pathname.startsWith("/_next");

    if (!isAuth && !isLoginPage && !isApi && !isStatic) {
        return Response.redirect(new URL("/login", req.nextUrl));
    }

    // Redirect logged in users doing to /login -> /admin (or /)
    if (isAuth && isLoginPage) {
        return Response.redirect(new URL("/", req.nextUrl));
    }
})

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
