# Firebase Provider Setup & Usage Guide

## Overview

The Firebase Provider is a React context that manages Firebase authentication and provides authentication state throughout your application.

## Architecture

```
App (wrapped with providers)
├── GoogleOAuthProvider (handles Google OAuth)
└── FirebaseProvider (manages Firebase auth state)
    └── AppContent (main app logic using useFirebase hook)
```

## Files Created

| File | Purpose |
|------|---------|
| `src/firebase/config.ts` | Firebase initialization and configuration |
| `src/providers/FirebaseProvider.tsx` | Firebase context provider and hooks |
| `src/providers/GoogleOAuthProvider.tsx` | Google OAuth wrapper |
| `src/components/LoadingOverlay.tsx` | Loading spinner component |

## How to Use

### 1. Basic Setup (Already Done)

Your `App.tsx` is now wrapped with providers:

```tsx
export default function App() {
  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
      <FirebaseProvider>
        <AppContent />
      </FirebaseProvider>
    </GoogleOAuthProvider>
  );
}
```

### 2. Using Authentication in Components

#### Get Firebase Context

```tsx
import { useFirebase } from '../providers/FirebaseProvider';

function MyComponent() {
  const { 
    auth,                 // Firebase Auth instance
    firebaseUser,        // Current Firebase user
    appUser,             // Application user with roles
    isLoading,           // Is Firebase initializing?
    isAuthenticated,     // Is user logged in?
    logout,              // Logout function
    error                // Any errors
  } = useFirebase();

  if (isLoading) {
    return <LoadingOverlay />;
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return <div>User: {appUser?.email}</div>;
}
```

#### Use Specific Hooks

```tsx
import { 
  useFirebaseAuth,
  useFirebaseUser, 
  useAppUser,
  useIsAuthenticated,
  useAuthLoading 
} from '../providers/FirebaseProvider';

function MyComponent() {
  const auth = useFirebaseAuth();           // Firebase Auth instance
  const firebaseUser = useFirebaseUser();   // Firebase user
  const appUser = useAppUser();             // App user with roles
  const isAuthenticated = useIsAuthenticated(); // Boolean
  const isLoading = useAuthLoading();       // Boolean

  return <div>{appUser?.name}</div>;
}
```

### 3. Logout

```tsx
const { logout } = useFirebase();

const handleLogout = async () => {
  try {
    await logout();
    // User will be redirected to login
  } catch (error) {
    console.error('Logout failed:', error);
  }
};
```

## Environment Variables

Make sure these are set in your `.env` file:

```env
REACT_APP_FIREBASE_API_KEY=xxx
REACT_APP_FIREBASE_AUTH_DOMAIN=xxx.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=xxx
REACT_APP_FIREBASE_STORAGE_BUCKET=xxx.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=xxx
REACT_APP_FIREBASE_APP_ID=xxx
REACT_APP_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
```

## Authentication Flow

### On App Load

1. Firebase initializes
2. `FirebaseProvider` listens to auth state changes
3. If user is logged in, `firebaseUser` is populated
4. App user is retrieved from `sessionStorage` or created from Firebase user
5. `isLoading` becomes `false`
6. Components can now use `useFirebase()` hook

### On Login

1. User fills login form (email + password OR Google OAuth)
2. Firebase authenticates user
3. Auth state changes trigger
4. `firebaseUser` is populated
5. User info is stored in `sessionStorage`
6. `isAuthenticated` becomes `true`
7. App content renders

### On Logout

1. User clicks logout
2. Firebase `signOut()` is called
3. Auth state changes trigger
4. `firebaseUser` is set to `null`
5. `sessionStorage` is cleared
6. App redirects to login

## Features

✅ **Persistent Authentication** - User stays logged in on page refresh
✅ **Error Handling** - Catches and displays auth errors
✅ **Loading States** - Shows spinner while initializing
✅ **User Roles** - Supports RBAC via `appUser.role`
✅ **Logout** - Clear session and Firebase auth

## Common Patterns

### Protect Components (Require Auth)

```tsx
function ProtectedComponent() {
  const { isLoading, isAuthenticated } = useFirebase();

  if (isLoading) return <LoadingOverlay />;
  if (!isAuthenticated) return <Navigate to="/login" />;

  return <Dashboard />;
}
```

### Get Current User Info

```tsx
function UserProfile() {
  const appUser = useAppUser();
  
  return (
    <div>
      <h1>{appUser?.name}</h1>
      <p>{appUser?.email}</p>
      <p>Role: {appUser?.role}</p>
    </div>
  );
}
```

### Check Permissions

```tsx
import { hasPermission } from '../services/auth';

function DeleteButton() {
  const { hasPermission: canDelete } = hasPermission('delete_case');
  
  if (!canDelete) return null;
  
  return <button>Delete Case</button>;
}
```

### Handle Auth Errors

```tsx
function LoginForm() {
  const { error } = useFirebase();

  return (
    <form>
      {error && (
        <div className="text-red-600">
          ❌ {error}
        </div>
      )}
      {/* form inputs */}
    </form>
  );
}
```

## Troubleshooting

### "Firebase not initialized"

**Problem**: Getting error "Firebase configuration is missing"

**Solution**: 
- Check `.env` file has all Firebase env vars
- Verify `REACT_APP_FIREBASE_API_KEY` etc. are correct
- Restart dev server after updating `.env`

### "useFirebase must be used within a FirebaseProvider"

**Problem**: Using `useFirebase()` in component not wrapped with provider

**Solution**:
- Make sure component is inside `<FirebaseProvider>`
- `<FirebaseProvider>` is already wrapping your app in `App.tsx`
- If creating sub-apps, wrap them too

### User stays logged in but won't authenticate

**Problem**: `firebaseUser` is set but `isAuthenticated` is false

**Solution**:
- Check `sessionStorage` for `qsms_user` key
- Ensure login sets both Firebase user AND sessionStorage
- Check browser console for errors

### "Auth state listener error"

**Problem**: Auth listener throws error

**Solution**:
- Check Firebase credentials are correct
- Check Firebase project settings
- Verify `.env` variables are loaded
- Check browser console for details

## Next Steps

1. **Test Login**: Try logging in with Google OAuth
2. **Test Permissions**: Create admin vs operator accounts and test permissions
3. **Test Logout**: Verify logout clears all data
4. **Add User Management**: Create user admin panel
5. **Setup Session Timeout**: Add auto-logout after inactivity

## API Reference

### FirebaseContextType

```typescript
interface FirebaseContextType {
  auth: Auth | null;
  firebaseUser: FirebaseUser | null;
  appUser: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  error: string | null;
}
```

### Hooks

| Hook | Returns | Description |
|------|---------|-------------|
| `useFirebase()` | `FirebaseContextType` | Get full context |
| `useFirebaseAuth()` | `Auth` | Get Firebase Auth instance |
| `useFirebaseUser()` | `FirebaseUser \| null` | Get Firebase user |
| `useAppUser()` | `User \| null` | Get app user with roles |
| `useIsAuthenticated()` | `boolean` | Check if authenticated |
| `useAuthLoading()` | `boolean` | Check if loading |

## Security Notes

⚠️ **Important**:
- Never commit `.env` file to version control
- Use environment variables for all secrets
- Enable HTTPS in production
- Setup proper Firebase security rules
- Implement rate limiting on login
- Monitor login attempts
- Use strong passwords (require in Firebase settings)

---

Last Updated: 2026-04-29
