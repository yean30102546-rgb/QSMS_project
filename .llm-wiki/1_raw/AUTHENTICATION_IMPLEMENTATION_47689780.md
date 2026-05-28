# Authentication & Security Implementation Guide

## 🎯 Overview

This guide covers the new **Google OAuth + Role-Based Access Control (RBAC)** authentication system for QSMS Rework Management System.

### What Changed:
- ❌ Removed hardcoded credentials (`admin/admin123`)
- ✅ Added Google OAuth integration (recommended)
- ✅ Added Email/Password authentication (fallback)
- ✅ Implemented Role-Based Access Control (RBAC)
- ✅ Added Token-based authentication (JWT)
- ✅ Added User Management system
- ✅ Secured API calls with token validation

---

## 📋 Implementation Steps

### Step 1: Setup Firebase (Recommended for Small Organizations)

**Why Firebase?** 
- Free tier supports up to 20 users
- Easy Google OAuth integration
- Built-in authentication management
- No backend server needed

**Setup Process:**

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add Project"
3. Enter project name (e.g., "QSMS Rework")
4. Click "Create Project"
5. Click "Add App" → Select "Web"
6. Copy the Firebase config:
   ```javascript
   {
     apiKey: "...",
     authDomain: "...",
     projectId: "...",
     storageBucket: "...",
     messagingSenderId: "...",
     appId: "..."
   }
   ```
7. Paste these values into `.env` file:
   ```env
   REACT_APP_FIREBASE_API_KEY=your_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=your_project_id
   # ... etc
   ```

### Step 2: Setup Google OAuth

**Option A: Using Firebase Authentication (Easiest)**

1. In Firebase Console → Authentication → Sign-in method
2. Enable "Google" provider
3. Configure OAuth consent screen
4. Add authorized redirect URIs (your app URL)

**Option B: Using Google Cloud Console (Advanced)**

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing
3. Enable "Google+ API"
4. Create OAuth 2.0 credentials (Web application)
5. Add authorized redirect URIs
6. Copy Client ID to `.env`:
   ```env
   REACT_APP_GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
   ```

### Step 3: Install Dependencies

```bash
npm install @react-oauth/google firebase react-firebase-hooks
```

### Step 4: Configure GAS Backend

1. Open your Google Apps Script project
2. Replace `SHEET_ID` with your actual Google Sheet ID
3. Set `REQUIRE_TOKEN_VALIDATION = false` for now (development)
4. Deploy as Web App:
   - Click "Deploy" → "New Deployment"
   - Type: Web app
   - Execute as: Your Google Account
   - Who has access: Anyone
5. Copy deployment URL to `.env`:
   ```env
   REACT_APP_GAS_WEB_APP_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
   ```

### Step 5: Update App.tsx

Wrap your app with Firebase and Google OAuth providers:

```tsx
import { GoogleOAuthProvider } from '@react-oauth/google';
import { FirebaseProvider } from './providers/FirebaseProvider';

function App() {
  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID || ''}>
      <FirebaseProvider>
        {/* Your app content */}
      </FirebaseProvider>
    </GoogleOAuthProvider>
  );
}
```

### Step 6: Create Environment File

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Then edit `.env` with your actual configuration.

---

## 🔐 User Roles & Permissions

### Available Roles:

| Role | Permissions | Use Case |
|------|------------|----------|
| **Admin** | All permissions | System administrator, IT staff |
| **Supervisor** | Create, Edit, Approve, Export, Manage Users | Managers, Team leads |
| **Operator** | Create, Edit, View cases | Factory workers, data entry |
| **Viewer** | View only | Auditors, read-only access |

### Permissions Table:

| Permission | Admin | Supervisor | Operator | Viewer |
|------------|-------|-----------|----------|--------|
| create_case | ✅ | ✅ | ✅ | ❌ |
| edit_case | ✅ | ✅ | ✅ | ❌ |
| delete_case | ✅ | ❌ | ❌ | ❌ |
| approve_case | ✅ | ✅ | ❌ | ❌ |
| view_dashboard | ✅ | ✅ | ✅ | ✅ |
| export_data | ✅ | ✅ | ❌ | ❌ |
| manage_users | ✅ | ❌ | ❌ | ❌ |
| view_reports | ✅ | ✅ | ✅ | ✅ |

---

## 🛠️ API Usage

### Login with Google (Recommended)

```tsx
import { loginWithGoogle } from './services/auth';

const handleGoogleLogin = async (googleResponse) => {
  const result = await loginWithGoogle(googleResponse);
  if (result.success) {
    // Redirect to dashboard
  }
};
```

### Login with Email/Password

```tsx
import { loginWithEmail } from './services/auth';

const handleEmailLogin = async (email, password) => {
  const result = await loginWithEmail(email, password);
  if (result.success) {
    // Redirect to dashboard
  }
};
```

### Check Permissions

```tsx
import { hasPermission, getCurrentUser } from './services/auth';

// Check if user has permission
const canDelete = hasPermission('delete_case').hasPermission;

// Get current user
const user = getCurrentUser();
```

### Make Authenticated API Calls

```tsx
import { getAuthHeaders } from './services/auth';

const headers = getAuthHeaders(); // Includes token
const response = await fetch('/api/endpoint', {
  method: 'POST',
  headers,
  body: JSON.stringify(data),
});
```

---

## 🔑 Environment Variables

Create `.env` file with these variables:

```env
# Firebase
REACT_APP_FIREBASE_API_KEY=xxx
REACT_APP_FIREBASE_AUTH_DOMAIN=xxx.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=xxx
REACT_APP_FIREBASE_STORAGE_BUCKET=xxx.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=xxx
REACT_APP_FIREBASE_APP_ID=xxx

# Google OAuth
REACT_APP_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com

# Google Apps Script
REACT_APP_GAS_WEB_APP_URL=https://script.google.com/macros/s/xxx/exec

# Auth Settings
REACT_APP_TOKEN_EXPIRY_HOURS=8
REACT_APP_SESSION_TIMEOUT_MINUTES=480
```

---

## 🔒 Security Best Practices

### ✅ DO:
- Always use HTTPS in production
- Enable HSTS headers
- Set `HttpOnly` flag on auth cookies
- Implement CSRF protection
- Validate tokens on backend
- Use strong password requirements
- Implement rate limiting on login attempts
- Log authentication events for audit

### ❌ DON'T:
- Store passwords in plain text
- Use hardcoded credentials
- Send tokens in URL
- Store sensitive data in localStorage
- Allow cross-origin requests without validation
- Use weak password hashing
- Skip token validation
- Trust client-side permission checks alone

---

## 🚀 Production Checklist

Before deploying to production:

- [ ] Replace demo credentials
- [ ] Enable token validation in GAS (`REQUIRE_TOKEN_VALIDATION = true`)
- [ ] Implement proper JWT verification on backend
- [ ] Setup HTTPS/SSL certificates
- [ ] Configure CORS properly
- [ ] Enable audit logging
- [ ] Setup error tracking (Sentry)
- [ ] Test with 20+ concurrent users
- [ ] Setup monitoring and alerting
- [ ] Create user documentation
- [ ] Train users on password security
- [ ] Implement backup and recovery plan

---

## 🧪 Testing

### Test Login Flow:

```bash
# Using demo credentials
Email: admin@company.com
Password: password123
```

### Test Permissions:

```tsx
import { hasPermission } from './services/auth';

// Should return true for admin
const canDelete = hasPermission('delete_case');
console.log(canDelete.hasPermission); // true
```

### Test Token Expiry:

Tokens expire after `REACT_APP_TOKEN_EXPIRY_HOURS` (default: 8 hours)

---

## 📞 Support & Troubleshooting

### "Authentication failed"
- Check Firebase credentials in `.env`
- Verify Google OAuth client ID
- Check browser console for errors

### "Session expired"
- Token validity might have expired
- Refresh the page and login again
- Check `REACT_APP_TOKEN_EXPIRY_HOURS` setting

### "Unauthorized"
- User might not have required permissions
- Check user role assignment
- Verify RBAC configuration

### GAS Returns 401
- Verify token is being sent
- Check `REQUIRE_TOKEN_VALIDATION` setting in GAS
- Ensure token validation logic is correct

---

## 📚 Related Files

- Configuration: [src/config/auth.config.ts](src/config/auth.config.ts)
- Authentication Service: [src/services/auth.ts](src/services/auth.ts)
- User Management: [src/services/userManagement.ts](src/services/userManagement.ts)
- Login Component: [src/components/Login.tsx](src/components/Login.tsx)
- API Service: [src/services/api.ts](src/services/api.ts)
- GAS Backend: [gas/Code.gs](gas/Code.gs)
- Environment Example: [.env.example](.env.example)

---

## 🔄 Migration from Old System

If you have existing users:

1. Export user data from old system
2. Create user accounts in new system
3. Assign appropriate roles based on old permissions
4. Send password reset links to all users
5. Require password change on first login
6. Monitor for migration issues

---

## 📝 Notes for 20-User Organization

For a small organization with up to 20 users:

- **Simple Approach**: Google OAuth only (no password management)
- **Flexible Approach**: Google OAuth + Email/Password (allow both)
- **Secure Approach**: Email/Password with bcrypt hashing + 2FA

**Recommended**: Use Google OAuth for simplicity and security

---

Last Updated: 2026-04-29
