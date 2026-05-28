# QSMS Rework Management System - Performance & Architecture Guide

## 📊 System Performance Analysis

### Load Time Breakdown

#### 1. **Initial Data Load (fetchAllCases)** - Typical: 2-4 seconds
- **Cause**: Google Sheets API read operation through GAS
- **Why it takes time**:
  - GAS web app startup time: ~500ms
  - Sheet data serialization: ~1000-2000ms (depends on row count)
  - Network latency: ~500-1000ms
  
**Optimization**:
```typescript
// Currently: Loads ALL cases on mount
// Recommended: Implement pagination
const CASES_PER_PAGE = 50;
await fetchCases(pageNumber, CASES_PER_PAGE);
```

#### 2. **Item Master Lookup (fetchItemMaster)** - Typical: 1-2 seconds
- **Cause**: Searching through entire ItemMaster sheet
- **Solution**: Implement client-side caching
```typescript
// Cache ItemMaster in localStorage after first load
const cachedMaster = localStorage.getItem('itemMaster');
if (cachedMaster) {
  setItemMaster(new Map(JSON.parse(cachedMaster)));
} else {
  const data = await fetchItemMaster();
  localStorage.setItem('itemMaster', JSON.stringify(Array.from(data)));
}
```

#### 3. **Image Upload Processing** - Typical: 3-5 seconds per image
- **Cause**: Base64 encoding + Drive upload
- **Why it's slow**:
  - File to Base64 conversion: JavaScript string encoding
  - Network upload: File size dependent
  - Drive API integration: GAS Drive.Files.create()
  
**Optimization**:
```typescript
// Compress images before upload
const compressImage = (file: File): Promise<Blob> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 1024;
        let width = img.width, height = img.height;
        if (width > height) {
          height = (height * maxDim) / width;
          width = maxDim;
        } else {
          width = (width * maxDim) / height;
          height = maxDim;
        }
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d')?.drawImage(img, 0, 0, width, height);
        canvas.toBlob(resolve, 'image/jpeg', 0.8);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};
```

#### 4. **Case Insert (Save)** - Typical: 4-8 seconds
- **Sequential operations**:
  1. Image compression & upload (per image): 1-2s each
  2. Data append to Sheet: 1-2s
  3. Backup creation: 1-2s
  4. ItemMaster auto-save: 0.5s

---

## 🔒 Authentication & Security

### Current Implementation
- **Method**: Session-based (sessionStorage)
- **Demo credentials**: admin / admin123
- **Session persistence**: Browser tab only (cleared on close)

### Production Upgrade Path
```typescript
// 1. Replace with token-based auth
const authenticateUser = async (username: string, password: string) => {
  const response = await fetch('https://your-backend.com/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const { token, expiresIn } = await response.json();
  
  // Store JWT token
  localStorage.setItem('auth_token', token);
  localStorage.setItem('token_expiry', new Date().getTime() + expiresIn);
};

// 2. Add request interceptor to auto-refresh token
const postToGas = async (payload: object) => {
  const token = localStorage.getItem('auth_token');
  return fetch(GAS_WEB_APP_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
};
```

### Credential Security
- Never store passwords in localStorage
- Use secure HTTP-only cookies for tokens (backend)
- Implement token expiration (suggested: 8 hours)
- Add rate limiting on auth endpoint

---

## 📈 Error Handling & Monitoring

### Current Error Types & Handlers

#### 1. Network Errors
```typescript
// API service catches network failures
catch (error) {
  console.error('Network error:', error);
  return { success: false, error: 'Failed to fetch' };
}
```

**Better approach**:
```typescript
const handleNetworkError = (error: Error) => {
  if (!navigator.onLine) {
    return 'No internet connection. Check your network.';
  }
  if (error.message.includes('timeout')) {
    return 'Request timed out. Please try again.';
  }
  return 'Network error. Please refresh and try again.';
};
```

#### 2. Validation Errors
- Currently: Toast message disappears after 5 seconds
- **Issue**: User might not see important validation errors

**Improvement**:
```typescript
// Keep error visible until user acknowledges
const [errors, setErrors] = useState<Record<string, string>>({});

// Display field-level errors
<InputField
  error={errors.itemNumber}
  {...props}
/>
```

#### 3. GAS Integration Errors
```typescript
// Add retry logic with exponential backoff
const postToGasWithRetry = async (
  payload: object,
  maxRetries = 3
): Promise<ApiResponse> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await postToGas(payload);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      const delay = Math.pow(2, i) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};
```

---

## 💾 Backup & Recovery

### Current Backup System
- **Trigger**: After each insertCase operation
- **Method**: Creates "Backup" sheet copy
- **Frequency**: Real-time

### Recommended Enhancements
```typescript
// 1. Automated daily snapshots
function setupDailyBackup() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('dailyBackup')
    .timeBased()
    .atHour(1)
    .everyDays(1)
    .create();
}

// 2. Version control
const createBackupWithVersion = () => {
  const now = new Date();
  const version = `Backup_${now.getFullYear()}_${now.getMonth()}_${now.getDate()}`;
  // Create sheet with version name
};

// 3. Recovery procedure
const restoreFromBackup = (backupSheetName: string) => {
  const backup = SpreadsheetApp.getSheetByName(backupSheetName);
  const main = SpreadsheetApp.getSheetByName(SHEET_NAME);
  const data = backup.getDataRange().getValues();
  main.clearContents();
  main.getRange(1, 1, data.length, data[0].length).setValues(data);
};
```

---

## 📊 Monitoring & Logging

### Key Metrics to Track

#### 1. **API Response Times**
```typescript
const trackApiPerformance = async (action: string) => {
  const start = performance.now();
  const result = await postToGas({ action });
  const duration = performance.now() - start;
  
  // Log to analytics
  logEvent('api_call', {
    action,
    duration,
    success: result.success,
    timestamp: new Date().toISOString(),
  });
  
  return result;
};
```

#### 2. **Error Tracking**
```typescript
const logError = (error: Error, context: string) => {
  const errorLog = {
    message: error.message,
    stack: error.stack,
    context,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString(),
  };
  
  // Send to logging service (e.g., Sentry, LogRocket)
  fetch('https://logs.example.com/error', {
    method: 'POST',
    body: JSON.stringify(errorLog),
  });
};
```

#### 3. **User Activity Monitoring**
```typescript
const logUserAction = (action: string, details?: Record<string, any>) => {
  const log = {
    user: sessionStorage.getItem('qsms_user'),
    action,
    details,
    timestamp: new Date().toISOString(),
  };
  
  // Store in Firestore or analytics DB
  logEvent('user_action', log);
};
```

---

## 🚀 Performance Optimization Roadmap

### Phase 1 (Current)
- ✅ Basic CRUD operations
- ✅ Image upload support
- ✅ Simple authentication

### Phase 2 (Recommended)
- [ ] Client-side caching layer (ServiceWorker)
- [ ] Image compression before upload
- [ ] Pagination for case list
- [ ] IndexedDB for offline support

### Phase 3 (Advanced)
- [ ] GraphQL for flexible data queries
- [ ] Real-time sync (WebSocket)
- [ ] Advanced analytics dashboard
- [ ] ML-based anomaly detection

---

## 📋 Deployment Checklist

### Before Going to Production
- [ ] Replace demo credentials with real auth system
- [ ] Enable HTTPS only
- [ ] Set up error tracking (Sentry/LogRocket)
- [ ] Configure backup strategy
- [ ] Implement rate limiting on GAS
- [ ] Add CORS headers properly
- [ ] Set up database transaction logging
- [ ] Create monitoring dashboard
- [ ] Document rollback procedures

---

## 🆘 Troubleshooting Guide

### Issue: "Failed to fetch cases"
1. Check network connectivity
2. Verify GAS web app URL is correct
3. Check GAS daily quota (50,000 executions/day)
4. Look at GAS error logs

### Issue: Image uploads are very slow
1. Check file size (compress before upload)
2. Verify Drive folder permissions
3. Check network speed
4. Consider batch uploads

### Issue: App crashes on large datasets
1. Implement pagination (load 50 cases at a time)
2. Use lazy loading for item details
3. Move heavy computations to web workers

---

## 📞 Support & Escalation

For performance issues:
1. Check browser console for errors (F12)
2. Monitor network tab in DevTools
3. Check GAS execution logs
4. Review error tracking dashboard
5. Contact system administrator

---

**Last Updated**: April 27, 2026
**Version**: 1.0
