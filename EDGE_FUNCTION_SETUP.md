# Email Independence - Edge Function Setup

## ✅ What Changed

The mobile app now sends credentials emails **independently** using Supabase Edge Functions. No web app dependency!

## 🚀 Setup Instructions

### Step 1: Deploy the Edge Function

The Edge Function code is in `supabase/functions/send-credentials/`

**Quick Deploy (Windows - using npx, no installation needed):**

```powershell
# Login (no installation needed with npx)
npx supabase login

# Link to your project (get project ref from Supabase dashboard URL)
# Example: https://xxxxx.supabase.co -> project ref is "xxxxx"
npx supabase link --project-ref your-project-ref

# Navigate to project root (where supabase folder is)
cd D:\MarketplaceProject

# Set email service (choose one):

# Option A: Resend (Recommended)
# Sign up at https://resend.com and get API key
npx supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxx

# Option B: Gmail SMTP
npx supabase secrets set GMAIL_USER=your-email@gmail.com
npx supabase secrets set GMAIL_APP_PASSWORD=your-app-password

# Deploy
npx supabase functions deploy send-credentials
```

**Alternative: Install Supabase CLI** (see `supabase/functions/send-credentials/WINDOWS_INSTALL_GUIDE.md`):
- Using Scoop: `scoop install supabase`
- Using winget: `winget install --id=Supabase.CLI`

### Step 2: Get Resend API Key (Recommended)

1. Sign up at https://resend.com (free tier available)
2. Go to API Keys → Create API Key
3. Copy the key (starts with `re_`)
4. Set it as secret: `supabase secrets set RESEND_API_KEY=re_xxxxx`

### Step 3: Verify Deployment

Check if function is deployed:

```bash
supabase functions list
```

You should see `send-credentials` in the list.

## 📱 Mobile App Changes

The mobile app has been updated to:
- ✅ Call Supabase Edge Function instead of web app API
- ✅ No longer requires `EXPO_PUBLIC_WEB_APP_URL`
- ✅ Fully independent email sending

## 🔧 Environment Variables

**Mobile App** (`.env.local`):
- `EXPO_PUBLIC_SUPABASE_URL` - Already configured
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Already configured
- ~~`EXPO_PUBLIC_WEB_APP_URL`~~ - **No longer needed!**

**Edge Function Secrets** (set via `supabase secrets set`):
- `RESEND_API_KEY` - Resend API key (recommended)
- OR `GMAIL_USER` + `GMAIL_APP_PASSWORD` - Gmail credentials

## ✅ Testing

After deployment, test by:

1. Open mobile app
2. Go to Students → Add New Student
3. Create a student
4. Click "Send Credentials"
5. Check student's email inbox

## 🐛 Troubleshooting

### "Email service not configured"
- Make sure you've set `RESEND_API_KEY` or Gmail credentials
- Check: `npx supabase secrets list`

### "Function not found"
- Deploy the function: `npx supabase functions deploy send-credentials`
- Make sure you're in the project root directory (where `supabase` folder is)
- Check project ref is correct: `npx supabase projects list`

### Email not received
- Check spam folder
- Verify email address is correct
- Check Resend dashboard for delivery status (if using Resend)

## 📚 Additional Resources

- Supabase Edge Functions Docs: https://supabase.com/docs/guides/functions
- Resend Docs: https://resend.com/docs
- Function code: `supabase/functions/send-credentials/index.ts`


