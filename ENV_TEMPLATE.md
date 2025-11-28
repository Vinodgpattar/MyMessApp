# Environment Variables Template

Copy this to `.env.local` and fill in your values:

```env
# Supabase Configuration
# Get these from your Supabase project dashboard: Settings → API
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## How to Get Supabase Credentials

1. Go to your Supabase project dashboard
2. Navigate to Settings → API
3. Copy:
   - **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
   - **Anon/Public Key** → `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## Important Notes

- Use the SAME Supabase project as your web app
- The `.env.local` file is gitignored (not committed)
- Restart the Expo dev server after changing environment variables


