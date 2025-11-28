# Mess Management Mobile App

Mobile application for mess management system built with Expo, React Native, and React Native Paper.

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI (installed globally or via npx)
- Supabase account and project (same as web app)

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

1. Copy `ENV_TEMPLATE.md` as reference
2. Create `.env.local` file in the root directory
3. Add your Supabase credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Important:** Use the SAME Supabase project as your web app!

### 3. Run the App

```bash
# Start Expo development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on Web
npm run web
```

## 📱 Features

### ✅ Implemented

- Admin login (Email + Password)
- Session management
- Basic admin dashboard
- Navigation structure

### 🚧 Coming Soon

- Student management
- Attendance tracking
- QR code scanner
- Payment management
- Bills management
- Student login
- And more...

## 🏗️ Project Structure

```
mess-management-mobile/
├── src/
│   ├── app/              # Expo Router screens
│   │   ├── (auth)/       # Authentication screens
│   │   └── (admin)/      # Admin screens
│   ├── components/       # Reusable components
│   ├── context/          # React contexts
│   ├── lib/              # Utilities & services
│   ├── hooks/            # Custom hooks
│   └── types/            # TypeScript types
├── app.json              # Expo configuration
├── package.json
└── tsconfig.json
```

## 🔐 Authentication

### Admin Login

- Uses Supabase Auth (email + password)
- Same credentials as web app
- Session persists across app restarts

## 🛠️ Tech Stack

- **Expo** - React Native framework
- **React Native Paper** - Material Design components
- **Expo Router** - File-based routing
- **Supabase** - Backend (Database & Auth)
- **TypeScript** - Type safety
- **React Query** - Data fetching & caching

## 📝 Development

### Current Status

✅ **Phase 1 Complete:**
- Project setup
- Admin authentication
- Basic navigation
- Dashboard placeholder

### Next Steps

1. Student management screens
2. Attendance management
3. QR code scanner
4. Payment management

## 🔗 Related Projects

- **Web App**: `mess-management-app/` (Next.js)
- **Database**: Shared Supabase project

## 📞 Support

For issues or questions, check the main project documentation.

---

**Status**: 🚧 In Development - Admin Login Complete ✅


