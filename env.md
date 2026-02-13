# Astro Shiva Chat - Environment Variables
# Copy this file to .env.local and fill in your actual values

# ==========================================
# CLERK AUTHENTICATION (Required)
# ==========================================
# Get these from clerk.com after creating an app

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_c21hc2hpbmctd2hpcHBldC05NC5jbGVyay5hY2NvdW50cy5kZXYk
CLERK_SECRET_KEY=sk_test_od6xvQyqybwnvDgxW2Nu64fvI8AU7XoIURCU5Gkfnx
# JWT template issuer (create a template named "convex" in Clerk)
CLERK_JWT_ISSUER_DOMAIN=https://smashing-whippet-94.clerk.accounts.dev

# ==========================================
# ASTRO SHIVA API (Required)
# ==========================================
# Base URL for the Astro Shiva API
NEXT_PUBLIC_ASTRO_API_URL=https://astro-shiva-app.vercel.app
