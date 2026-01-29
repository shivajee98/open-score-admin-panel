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

                    const res = await fetch(`${baseUrl}/auth/verify`, {
                        method: 'POST',
                        body: JSON.stringify({
                            mobile_number: credentials.mobile,
                            otp: credentials.otp,
                            role: 'ADMIN' // Force role to ADMIN for admin panel
                        }),
                        headers: { "Content-Type": "application/json" }
                    });

                    if (!res.ok) {
                        return null;
                    }

                    const data = await res.json();

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
});
