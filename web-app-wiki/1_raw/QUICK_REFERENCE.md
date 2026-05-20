# QSMS System - Quick Reference Guide

## 🔑 Login Credentials
- **Username**: admin
- **Password**: admin123

---

## 📝 Input Format Guide

### ItemNumber (Item Number)
- **Format**: 8 digits
- **Example**: `60001234`
- **Purpose**: Unique identifier for product

### ItemCode (Item Code)
- **Format**: 8 digits
- **Example**: `40001234`
- **Purpose**: Internal tracking code

### ItemName (Item Name)
- **Example**: "Bottle Plastic 250ml"
- **Auto-fill**: Automatically filled when ItemNumber exists in master
- **Auto-save**: New items are automatically added to ItemMaster

---

## ⚡ Performance Tips

### Slow Operations
1. **Loading cases**: 2-4 seconds (normal)
   - First time: Reads from Google Sheets
   - Cached: Uses browser cache on refresh

2. **Saving case**: 4-8 seconds (includes images)
   - Data entry: Validates fields
   - Image compression: If uploading photos
   - Sheet update: Appends to database
   - Backup: Creates daily backup

3. **Image upload**: 3-5 seconds per image
   - Compression happens automatically
   - Max 5 images per item
   - Stored in Google Drive

### Speed Up
- Use quick ItemNumber lookup (typed items auto-fill)
- Pre-fill ItemName by entering ItemNumber
- Upload images one at a time
- Keep image file sizes under 3MB

---

## 🎨 Date Format

### Display Format
- **Old**: `2026-04-27T01:59:09.000Z`
- **New**: `27 เมษายน 2569, 08:59`

### What Changed?
- Time now shows in 24-hour Thai format
- Year is in Buddhist Era (ค.ศ. + 543)
- More readable for Thai users
- Shows in UpdateModal when viewing cases

---

## 🔄 Workflow Examples

### Scenario 1: Adding New Product
```
1. Click "เพิ่มงานใหม่" (Add Case)
2. Enter ItemNumber: 60001234
   → ItemName auto-fills (if exists in master)
   → Or system saves it automatically
3. Enter ItemCode: 40001234
4. Fill remaining fields
5. Click "บันทึก" (Save)
   → Takes 4-8 seconds
   → Case appears in "ภาพรวม" tab
```

### Scenario 2: Updating Case Status
```
1. Click on case in list
2. Modal opens showing:
   - Case ID
   - Date (in Thai format)
   - Item details
   - Current status
3. Select new status:
   - "รอดำเนินการ" (Pending)
   - "กำลังดำเนินการ" (In-Progress)
   - "เสร็จสิ้น" (Completed)
4. Click "บันทึกการเปลี่ยนแปลง" (Save changes)
```

### Scenario 3: Troubleshooting Slow Save
```
If saving takes > 15 seconds:
1. Check internet connection
2. Check file sizes (images < 3MB each)
3. Wait for backup to complete
4. Retry if connection drops
5. Check error message in modal
```

---

## 🛡️ Security Tips

### For Users
- ✅ Log out when leaving workstation
- ✅ Never share your username/password
- ✅ Use strong password (when migrated to production)
- ❌ Don't save password in browser
- ❌ Don't access from public WiFi (future: use VPN)

### For Admins
- Set up proper backup schedule
- Monitor error logs daily
- Review user activity logs
- Update credentials regularly
- Test disaster recovery

---

## 📊 Dashboard Statistics

### Overall Tab
Shows:
- **Total Cases**: All cases in system
- **Pending**: Not started
- **In-Progress**: Currently working on
- **Completed**: Finished cases

### Dashboard Tab
Shows:
- Status distribution (pie chart)
- Timeline view
- Case reason breakdown
- Source workload distribution

---

## ⚠️ Common Issues & Fixes

### Issue: Login Failed
```
❌ "Invalid username or password"
✅ Check caps lock
✅ Verify you have network
✅ Try clearing browser cache
```

### Issue: Slow to Load Cases
```
❌ "Loading cases..." stuck
✅ Wait 5 seconds (normal)
✅ Check internet speed
✅ Refresh page (F5)
```

### Issue: Can't Upload Image
```
❌ "Upload failed"
✅ Check file size (< 5MB)
✅ Check file format (JPG/PNG)
✅ Check Drive permissions
```

### Issue: ItemName Not Auto-Filling
```
❌ ItemName stays blank
✅ Verify ItemNumber is in master
✅ Check spelling/format
✅ System will auto-save new items
```

---

## 🔔 Status Indicators

### Case Status Colors
| Status | Color | Meaning |
|--------|-------|---------|
| Pending | 🟨 Yellow | Not yet started |
| In-Progress | ⚪ Gray | Currently working |
| Completed | 🟩 Green | Done and verified |

### Deadline Warnings
- 🟠 **Orange**: Over 7 days old
- 🔴 **Red**: Over 30 days old
- Action required for aged cases

---

## 📱 Mobile Access

✅ **Fully responsive** - Works on tablets and phones
- Portrait mode optimized
- Touch-friendly buttons
- Responsive layout

⚠️ **Image upload** - Best on desktop
- Smaller screen = harder to preview
- Consider using desktop for photos

---

## 🚀 New Features

### Auto-Save ItemMaster
- ✨ New in this update
- When you enter ItemNumber not in master
- System automatically saves it
- No extra steps needed!

### Modern Login
- ✨ New in this update  
- Pastel blue/purple design
- Password visibility toggle
- Show/hide eye icon

### Thai Date Format
- ✨ New in this update
- Shows in update modal
- Format: "27 เมษายน 2569, 08:59"
- Easier for Thai users

---

## 📞 Getting Help

### Check Documentation
1. Read PERFORMANCE_GUIDE.md (why it's slow)
2. Read IMPLEMENTATION_SUMMARY.md (what changed)
3. Check browser console (F12) for errors

### Contact Support
- Check error message in modal
- Screenshot the error
- Note the time it occurred
- Provide case ID if applicable

### Self-Help
1. Clear browser cache: Ctrl+Shift+Delete
2. Try incognito window: Ctrl+Shift+N
3. Refresh page: F5 or Ctrl+R
4. Restart browser completely

---

## 🎓 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `F12` | Open developer console (for debugging) |
| `Tab` | Move to next field |
| `Shift+Tab` | Move to previous field |
| `Enter` | Submit form |
| `Esc` | Close modal |

---

## 💾 Data Storage

### Local Storage
- ItemMaster cache (on first load)
- Authentication session
- User preferences

### Google Sheets
- All case data
- Item master list
- Daily backups (automatic)

### Google Drive
- Case images
- Organized by case ID
- Auto-cleanup: Old images stay

---

## 🔄 Updates & Maintenance

### Automatic
- ✅ Backups (daily)
- ✅ Data sync (real-time)
- ✅ Auto-save items (on add)

### Manual (IT Required)
- 🔧 Password reset
- 🔧 System upgrades
- 🔧 Database maintenance
- 🔧 Backup recovery

---

## 📈 Performance Expectations

### Typical Timings
| Operation | Time | Status |
|-----------|------|--------|
| Load dashboard | 2-4s | ✅ Normal |
| Fetch cases | 2-4s | ✅ Normal |
| Add new case | 4-8s | ✅ Normal |
| Upload 3 images | 9-15s | ✅ Normal |
| Auto-save item | 0.5-1s | ✅ Fast |

### If Slower
- Check internet speed (speedtest.net)
- Check browser: Chrome > Firefox > Safari
- Close other tabs/apps
- Restart browser

---

## 🎯 Best Practices

### Data Entry
1. ✅ Verify ItemNumber before saving
2. ✅ Use dropdown for common values
3. ✅ Include photos when possible
4. ✅ Add details for clarity

### Image Upload
1. ✅ Compress if > 3MB
2. ✅ Use JPG format (smaller file)
3. ✅ Take clear, well-lit photos
4. ✅ Upload max 5 per item

### Status Updates
1. ✅ Update daily
2. ✅ Add notes when status changes
3. ✅ Mark completed when verified
4. ✅ Escalate if over deadline

---

**Last Updated**: April 27, 2026  
**Quick Reference v1.0**
