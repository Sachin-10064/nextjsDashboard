import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    pages: {
        signIn: '/login',
    },
    callbacks: {
        async authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
            if (isOnDashboard) {
                if (isLoggedIn) return true;
                return false; // Redirect unauthenticated users to login page
            } else if (isLoggedIn) {
                return Response.redirect(new URL('/dashboard', nextUrl));
            }
            return true;
        },
        async redirect({ url, baseUrl }) {
            // If user tries to access a protected route (e.g., dashboard), redirect them there after login
            if (url.startsWith('/dashboard')) {
                return url;
            }
            return baseUrl; // Default redirect to base URL
        },
    },
    providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;