import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

/**
 * Middleware to enforce onboarding completion before accessing chat
 *
 * This middleware:
 * 1. Allows public routes (login, signup, onboarding, etc.)
 * 2. For authenticated users, checks if they have completed onboarding
 * 3. Redirects to onboarding if not completed
 * 4. Allows access to chat only after onboarding is complete
 */

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/login',
  '/signup',
  '/onboarding',
  '/api/webhook',
]);

// Define routes that require onboarding completion
const isChatRoute = createRouteMatcher([
  '/chat(.*)',
]);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { pathname } = req.nextUrl;

  // Allow public routes without any checks
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // For chat routes, check if onboarding is completed
  if (isChatRoute(req)) {
    // Get the auth object
    const authObj = await auth();

    // If not authenticated, let them through (Clerk will handle redirect)
    if (!authObj.userId) {
      return NextResponse.next();
    }

    // Check onboarding status from cookie
    const onboardingStatus = req.cookies.get('onboarding_status')?.value;

    if (onboardingStatus !== 'completed') {
      // Redirect to root page which will check and redirect to onboarding if needed
      const response = NextResponse.redirect(new URL('/', req.url));
      response.cookies.set('redirect_after_onboarding', pathname, {
        maxAge: 60 * 5, // 5 minutes
        path: '/',
      });
      return response;
    }
  }

  return NextResponse.next();
});

export const config = {
  // Match all routes except static files and API routes
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)',
  ],
};
