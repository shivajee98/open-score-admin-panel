import { DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
    interface Session extends DefaultSession {
        accessToken?: string;
        user: {
            id: string;
            role: string;
            mobile_number?: string;
            referral_code?: string;
            credit_balance?: string;
            credit_limit?: string;
            default_signup_amount?: string;
            is_active?: boolean;
        } & DefaultSession["user"];
    }

    interface User extends DefaultUser {
        role: string;
        mobile_number?: string;
        referral_code?: string;
        credit_balance?: string;
        credit_limit?: string;
        default_signup_amount?: string;
        is_active?: boolean;
        accessToken?: string;
    }
}

declare module "next-auth/jwt" {
    interface JWT extends DefaultJWT {
        accessToken?: string;
        role?: string;
        mobile_number?: string;
        user?: any;
    }
}
