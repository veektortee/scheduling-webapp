# State Persistence Test Guide

This guide helps test that state persistence works correctly across page refreshes for all tabs.

## 🔧 **ISSUE FOUND & FIXED**

**Problem**: The app was loading providers from `case_oct.json` file on every startup, which was overriding the saved localStorage state.

**Solution**: Modified the SchedulingContext to:
- Track when state is loaded from localStorage with `hasLoadedFromStorage` flag
- Ignore `LOAD_CASE` actions if state was already loaded from localStorage
- Only load the case file on first startup when no saved state exists

## 🧪 **Critical Test Procedure**

### **IMPORTANT: Clear localStorage first to test properly**
1. Open browser DevTools (F12)
2. Go to Application tab → Local Storage
3. Clear all `scheduling-*` and `calendarState` entries
4. OR run: `localStorage.clear()`

### 1. **Fresh Start Test** (No saved data)
1. Clear localStorage as above
2. Refresh the page
3. ✅ **Expected**: Should load default providers from `case_oct.json`
4. Navigate to Providers tab - you should see many providers (20+)

### 2. **Provider Persistence Test** (Main test)
1. In Providers tab, delete some providers (leave only 3-4)
2. Refresh the page (F5 or Ctrl+R)
3. ✅ **Expected**: Should show only the remaining providers you kept (NOT all original providers)
4. Add a new provider with custom name
5. Refresh again
6. ✅ **Expected**: Your new provider should still be there

### 3. **Shifts Tab Test**
1. Navigate to the Shifts tab
2. Add a new shift:
   - Select a date
   - Set type (e.g., "Day Shift")
   - Set start time (e.g., "08:00")
   - Set end time (e.g., "16:00")
   - Add to all days or specific date
3. Click "Add Shift"
4. Refresh the page (F5 or Ctrl+R)
5. ✅ **Expected**: The shift should still be visible after refresh

### 4. **Config Tab Test**
1. Navigate to the Config tab
2. Modify some solver settings:
   - Change "Max Time" value
   - Change "Phase 1 Fraction"
   - Or modify other configuration values
3. Apply changes
4. Refresh the page (F5 or Ctrl+R)
5. ✅ **Expected**: The configuration changes should be preserved after refresh

### 5. **Calendar Tab Test**  
1. Navigate to the Calendar tab
2. Add a new event:
   - Click on a date
   - Add event title
   - Set time and other details
3. Create the event
4. Refresh the page (F5 or Ctrl+R)
5. ✅ **Expected**: The calendar event should still be visible after refresh

## 📊 **Debug Tools**

### Browser Console Testing
Open DevTools console and run:
```javascript
// Load the test script
var script = document.createElement('script');
script.src = '/test-state-persistence.js';
document.head.appendChild(script);

// Then use these functions:
checkLocalStorage();  // View current state
checkStateAge();      // Check if data has expired
clearAllState();      // Clear everything for fresh test
```

### Manual LocalStorage Check
```javascript
// Check if providers are saved
const state = JSON.parse(localStorage.getItem('scheduling-state-v1') || '{}');
console.log('Saved providers:', state.case?.providers?.length);
console.log('Saved shifts:', state.case?.shifts?.length);
console.log('Last saved:', state.timestamp);
```

## 🔍 **What Was Fixed**

### Root Cause
The app was calling `LOAD_CASE` action every time on startup, which would load fresh data from `case_oct.json` and override any saved localStorage data.

### Technical Changes Made

1. **Added tracking flag**: `hasLoadedFromStorage` in SchedulingState
2. **Modified getInitialState()**: Sets flag to `true` when loading from localStorage
3. **Updated reducer**: Ignores `LOAD_CASE` if `hasLoadedFromStorage` is `true`
4. **Enhanced logging**: Console shows when LOAD_CASE is ignored

### Storage Details
- **Key**: `scheduling-state-v1`
- **Contains**: Scheduling case data, selected date/provider, timestamp
- **Expiry**: 7 days
- **Backup**: `scheduling-last-results-v1` (24 hours)
- **Calendar**: `calendarState` (persistent)

## ❌ **Troubleshooting**

### If persistence still isn't working:
1. **Check console errors**: Look for localStorage permission issues
2. **Verify storage**: Use DevTools → Application → Local Storage
3. **Check age**: Data expires after 7 days
4. **Clear and test**: `localStorage.clear()` then test fresh
5. **Browser compatibility**: Some private/incognito modes restrict localStorage

### Expected Console Messages:
- On first load: No special messages (loads from case file)
- On subsequent loads: "Ignoring LOAD_CASE because state was loaded from localStorage"

## ✅ **Success Criteria**

The fix is working correctly when:
- ✅ Fresh browser (cleared localStorage) loads all providers from case file
- ✅ Deleted providers stay deleted after refresh
- ✅ Added providers persist after refresh  
- ✅ Shifts, config, and calendar data also persist
- ✅ Console shows "Ignoring LOAD_CASE..." message after first load