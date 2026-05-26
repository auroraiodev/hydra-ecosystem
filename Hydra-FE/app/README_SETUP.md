# Hydra Frontend Setup Guide

## Environment Variables

Create a `.env.local` file in the `hydra-fe` directory with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:3002
```

## Supabase Configuration

1. Go to your Supabase Dashboard
2. Navigate to Authentication > URL Configuration
3. Add the following redirect URL:
   - `http://localhost:3000/api/auth/oauth/callback` (for local development)
   - Add your production URL when deploying

## Installation

```bash
cd hydra-fe
pnpm install
```

## Running the Application

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`

## Backend Requirements

Make sure the backend is running on `http://localhost:3002` (or update `NEXT_PUBLIC_API_URL` accordingly).

The backend should have:

- `/api/health` endpoint for health checks
- `/api/auth/oauth/supabase` endpoint for OAuth authentication

## Testing OAuth Flow

1. Start the backend: `cd hydra-be && pnpm start:dev`
2. Start the frontend: `cd hydra-fe && pnpm dev`
3. Navigate to `/login` or `/signup`
4. Click "Continue with Google"
5. Complete the OAuth flow
6. You should be redirected back to the home page with authentication
