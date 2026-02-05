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
                    console.log(`[NextAuth] Data received:`, {
                        ...data,
                        access_token: data.access_token ? '***' : undefined
                    });

                    // For Sub-Users (Agents)
                    if (isSubUser && data.access_token && data.sub_user) {
                        const user = {
                            id: String(data.sub_user.id), // NextAuth requires string ID
                            name: data.sub_user.name,
                            email: data.sub_user.email || data.sub_user.mobile_number + '@agent.local',
                            mobile_number: data.sub_user.mobile_number,
                            role: 'SUB_USER',
                            referral_code: data.sub_user.referral_code,
                            credit_balance: data.sub_user.credit_balance,
                            credit_limit: data.sub_user.credit_limit,
                            default_signup_amount: data.sub_user.default_signup_amount,
                            is_active: data.sub_user.is_active,
                            accessToken: data.access_token
                        };
                        console.log('[NextAuth] Sub-User authorized:', user.name, user.role);
                        return user;
                    }

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
