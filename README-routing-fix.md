# Public routing fix

This patch changes the app from login-first routing to a public SaaS structure:

- `/` → public landing page
- `/login` → login
- `/signup` → signup
- `/app/*` → protected app area

## Files included
- `src/App.tsx`
- `src/main.tsx`
- `src/components/layout/AppShell.tsx`
- `src/components/layout/PublicShell.tsx`
- `src/modules/auth/ProtectedRoute.tsx`
- `src/pages/public/HomePage.tsx`
- `src/pages/auth/LoginPage.tsx`
- `src/pages/auth/SignupPage.tsx`
