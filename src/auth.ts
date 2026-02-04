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
                    return null;
                }

                try {
                    const endpoint = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api';
                    const baseUrl = endpoint.startsWith('http') ? endpoint : `http://localhost:8001${endpoint}`;

                    const isSubUser = credentials.role === 'SUB_USER';
                    const url = isSubUser ? `${baseUrl}/auth/sub-user/login` : `${baseUrl}/auth/verify`;
                    const body = isSubUser
                        ? { mobile_number: credentials.mobile, otp: credentials.otp }
                        : { mobile_number: credentials.mobile, otp: credentials.otp, role: 'ADMIN' };

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
                    console.log(`[NextAuth] Data received:`, { ...data, access_token: '***' });

                    if (isSubUser && data.access_token && data.sub_user) {
                        return {
                            ...data.sub_user,
                            role: 'SUB_USER',
                            accessToken: data.access_token
                        };
                    }

                    if (data.access_token && data.user && data.user.role === 'ADMIN') {
                        return {
                            ...data.user,
                            accessToken: data.access_token
                        };
                    }

                    return null;
                } catch (e) {
                    console.error("Auth error:", e);
                    return null;
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.accessToken = (user as any).accessToken;
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
        signIn: '/login', // Admin custom login page
    },
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    secret: process.env.AUTH_SECRET,
});
