import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Credentials({
            credentials: {
                mobile: { label: "Mobile Number", type: "text" },
                otp: { label: "OTP", type: "text" },
                role: { label: "Role", type: "text" }
            },
            authorize: async (credentials) => {
                if (!credentials?.mobile || !credentials?.otp) {
                    console.error('[NextAuth] Missing credentials');
                    return null;
                }

                try {
                    const endpoint = process.env.NEXT_PUBLIC_API_URL || 'https://api.msmeloan.sbs/api';
                    const baseUrl = endpoint.startsWith('http') ? endpoint : `https://api.msmeloan.sbs/api${endpoint}`;

                    const url = `${baseUrl}/auth/verify`;
                    const body = { mobile_number: credentials.mobile, otp: credentials.otp, role: 'ADMIN' };

                    console.log(`[NextAuth] Authorize attempt: ${url}`, body);

                    const res = await fetch(url, {
                        method: 'POST',
                        body: JSON.stringify(body),
                        headers: { "Content-Type": "application/json" }
                    });

                    console.log(`[NextAuth] Backend response: ${res.status}`);

                    if (!res.ok) {
                        const errText = await res.text();
                        console.error(`[NextAuth] Backend error: ${errText}`);
                        return null;
                    }

                    const data = await res.json();
                    console.log(`[NextAuth] Data received:`, {
                        ...data,
                        access_token: data.access_token ? '***' : undefined
                    });

                    // For Admins
                    if (data.access_token && data.user && data.user.role === 'ADMIN') {
                        const user = {
                            id: String(data.user.id), // NextAuth requires string ID
                            name: data.user.name,
                            email: data.user.email || data.user.mobile_number + '@admin.local',
                            mobile_number: data.user.mobile_number,
                            role: data.user.role,
                            accessToken: data.access_token
                        };
                        console.log('[NextAuth] Admin authorized:', user.name, user.role);
                        return user;
                    }

                    console.error('[NextAuth] No valid user data in response');
                    return null;
                } catch (e) {
                    console.error("[NextAuth] Auth error:", e);
                    return null;
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user, trigger }) {
            // Initial sign in
            if (user) {
                console.log('[NextAuth JWT] User signing in:', user.name, user.role);
                token.id = user.id;
                token.accessToken = (user as any).accessToken;
                token.role = (user as any).role;
                token.mobile_number = (user as any).mobile_number;
                token.user = user;
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                (session as any).accessToken = token.accessToken;
                (session as any).user = token.user;
            }
            return session;
        },
    },
    pages: {
        signIn: '/login',
    },
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    secret: process.env.AUTH_SECRET,
    debug: false, // Disabled in production for performance
    trustHost: true, // Required for localhost
});
