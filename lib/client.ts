import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
    baseURL: process.env.BETTER_AUTH_URL,
});

export const { signIn, signUp, signOut, useSession, changeEmail, updateUser, changePassword } = authClient;
/**
 * Type for the session data
 */
export type BetterSessionClient = ReturnType<typeof useSession>;
