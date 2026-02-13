# Astro Shiva Chat

A ChatGPT-like AI-powered Vedic astrology chat application built with Next.js 14, Clerk authentication, and the Astro Shiva API.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **UI**: shadcn/ui (Radix UI primitives), Tailwind CSS
- **Authentication**: Clerk
- **Backend**: Astro Shiva API (https://astro-shiva-app.vercel.app)

## Features

- ✅ Secure authentication with Clerk
- ✅ Mandatory onboarding flow for personalized readings
- ✅ Real-time streaming responses from AI
- ✅ Chat history with session persistence (via Astro Shiva API)
- ✅ Responsive design (mobile & desktop)
- ✅ Dark mode support

## Quick Start

### Prerequisites

- Node.js 18+
- npm, pnpm, or yarn
- Clerk account (sign up at clerk.com)

### Setup

#### 1. Environment Variables

Copy the example environment file and fill in your actual values:

```bash
cp .env.local.example .env.local
```

Required variables:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_JWT_ISSUER_DOMAIN=https://your-domain.clerk.accounts.dev

# Astro Shiva API
NEXT_PUBLIC_ASTRO_API_URL=https://astro-shiva-app.vercel.app
```

#### 2. Clerk Setup

1. Sign up at [clerk.com](https://clerk.com/sign-up)
2. Create a new application
3. Navigate to **JWT Templates**
4. Create a new template named `convex`
5. Copy the **Issuer URL** (e.g., `https://verb-noun-00.clerk.accounts.dev`)
6. Add to `.env.local` as `CLERK_JWT_ISSUER_DOMAIN`
7. Get your **Publishable Key** and **Secret Key** from API Keys section

#### 3. Install Dependencies

```bash
npm install
```

#### 4. Run Development Server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## Project Structure

```
astro-shiva-chat/
├── .env.local                 # Environment variables (create from .env.local.example)
├── app/                       # Next.js App Router
│   ├── layout.tsx           # Root layout with providers
│   ├── middleware.ts         # Clerk authentication middleware
│   ├── (auth)/              # Auth route group
│   │   └── login/
│   │       └── page.tsx   # Sign-in page
│   ├── (chat)/             # Chat route group
│   │   ├── layout.tsx       # Desktop sidebar layout
│   │   ├── chat/
│   │   │   ├── page.tsx   # New chat page
│   │   │   └── [id]/
│   │   │       └── page.tsx   # Existing chat page
│   │   └── onboarding/
│   │       └── page.tsx   # Mandatory onboarding
│   ├── page.tsx           # Home page with auth check
│   ├── globals.css         # Global styles
│   └── favicon.ico
├── components/                # React components
│   ├── Sidebar.tsx              # Chat history sidebar
│   └── ui/                    # shadcn/ui components
├── lib/
│   ├── api-client.ts            # Astro Shiva API client
│   └── utils.ts                # Utility functions
└── public/                    # Static assets
```

## API Integration

### Astro Shiva API

This application uses the Astro Shiva API for:
- User onboarding (birth details)
- Profile management
- Chat streaming (SSE)
- Session history
- Message retrieval

**Base URL**: Configurable via `NEXT_PUBLIC_ASTRO_API_URL`

**Data storage**: All user data is stored by the Astro Shiva backend (Convex-managed). The frontend does not access any database directly.

## Authentication Flow

1. User clicks sign-in
2. Clerk authenticates user
3. Clerk issues JWT token (template: `convex`)
4. Frontend calls Astro Shiva API with the JWT
5. User redirected to appropriate page:
   - `/onboarding` if not onboarded
   - `/chat` if onboarded

## Session Lifecycle

1. User opens `/chat` (new chat)
2. Types message and sends
3. Client streams response from Astro Shiva API via SSE
4. On first message, Astro API creates a session
5. Client fetches latest sessions from the API
6. Client redirects to `/chat/{sessionId}`
7. Subsequent messages use existing `sessionId`
8. Chat history loaded from Astro Shiva API when reopening session

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `CLERK_JWT_ISSUER_DOMAIN`
4. Deploy

### Environment Variables for Production

```bash
# Clerk (Production keys)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
CLERK_JWT_ISSUER_DOMAIN=https://clerk.your-domain.com

# Astro Shiva API (same URL)
NEXT_PUBLIC_ASTRO_API_URL=https://astro-shiva-app.vercel.app
```

## Common Issues

### Clerk Authentication

**Issue**: "Not authenticated" error
**Solution**: Ensure Clerk is properly configured with the `convex` JWT template

### API Authentication

**Issue**: "Authentication required" error
**Solution**:
1. Ensure the Clerk JWT template named `convex` exists
2. Verify `CLERK_JWT_ISSUER_DOMAIN` matches the template issuer
3. Confirm the user is signed in before calling protected endpoints

### Onboarding

**Issue**: "User not found" error after onboarding
**Solution**: 
1. Wait for polling to complete (up to 60 seconds)
2. Check profile status returns `"completed"`
3. If still fails, clear cache and retry

### Chat Streaming

**Issue**: No response from AI
**Solution**:
1. Check browser console for errors
2. Verify `NEXT_PUBLIC_ASTRO_API_URL` is correct
3. Check network connection to astro-shiva-app.vercel.app
4. Try refreshing the page

## License

MIT License - feel free to use this project for your own purposes.

## Support

For issues or questions:
- Check out [Astro Shiva API Documentation](../API_DOCUMENTATION.md)
- Contact the Astro Shiva API team
- Open an issue on GitHub
