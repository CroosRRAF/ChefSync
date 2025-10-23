# Address Loading & Auto-Fill Fixes

## 🔧 Issues Fixed

### 1. **Map Click Not Auto-Filling Details**
**Problem**: When clicking on map, only coordinates were set but city, state, and postal code were not filling automatically.

**Solution**: Enhanced address parsing in `SimpleAddressPicker.tsx`:
- Improved extraction of address components from Google Maps API
- Added support for `sublocality`, `locality`, and `administrative_area` levels
- Better fallback logic when some components are missing
- Added console logging to debug address parsing

**What auto-fills now**:
- ✅ Full formatted address
- ✅ City (from locality or sublocality)
- ✅ State (from administrative_area_level_1)
- ✅ Postal code (if available)
- ✅ Latitude & Longitude (from click position)

### 2. **Addresses Not Loading from Database**
**Problem**: Both menu and checkout pages showed "No delivery address selected" even when addresses existed in `user_address` table.

**Solution**: Implemented dual-system support in `addressService.ts`:
- **Tries new system first**: `/users/addresses/by_type/?type=customer`
- **Falls back to old system**: `/orders/addresses/`
- Supports both `addresses` table and `user_addresses` table
- Console logs show which system loaded the addresses

**Benefits**:
- ✅ Works with existing `user_address` table data
- ✅ Compatible with new `addresses` table
- ✅ Automatic fallback if one system fails
- ✅ No data migration required

### 3. **Address Creation Failures**
**Problem**: Creating new addresses failed silently or showed confusing errors.

**Solution**: Enhanced error handling and dual-system create:
- Tries new system endpoint first (`/users/customer-addresses/quick_create/`)
- Falls back to old system (`/orders/addresses/`)
- Better validation messages before save attempt
- Detailed error logging with status codes

**New Validations**:
- ✅ Label required
- ✅ Address line 1 required  
- ✅ City required
- ✅ Coordinates must be non-zero
- ✅ Clear error messages for each validation

---

## 📋 Technical Changes

### File: `frontend/src/services/addressService.ts`

#### `getAddresses()` Method
```typescript
// BEFORE: Only tried new system
async getAddresses() {
  const response = await apiClient.get(`${this.baseUrl}by_type/?type=customer`);
  return response.data;
}

// AFTER: Tries both systems with fallback
async getAddresses() {
  try {
    // Try new system first
    const response = await apiClient.get(`${this.baseUrl}by_type/?type=customer`);
    if (addresses.length > 0) return addresses;
  } catch {
    // Fallback to old system
    const response = await apiClient.get('/orders/addresses/');
    return response.data;
  }
}
```

#### `createAddress()` Method
```typescript
// BEFORE: Only used quick_create endpoint
async createAddress(data) {
  return await apiClient.post(this.quickCreateUrl, data);
}

// AFTER: Tries both systems
async createAddress(data) {
  try {
    return await apiClient.post(this.quickCreateUrl, data);
  } catch {
    return await apiClient.post('/orders/addresses/', data);
  }
}
```

#### `getDefaultAddress()` Method
```typescript
// BEFORE: Only tried new system
async getDefaultAddress() {
  const response = await apiClient.get(`${this.baseUrl}default/?type=customer`);
  return response.data[0];
}

// AFTER: Tries endpoint, then searches list
async getDefaultAddress() {
  try {
    const response = await apiClient.get(`${this.baseUrl}default/?type=customer`);
    if (response.data.length > 0) return response.data[0];
  } catch {}
  
  const addresses = await this.getAddresses();
  return addresses.find(addr => addr.is_default) || addresses[0] || null;
}
```

### File: `frontend/src/components/address/SimpleAddressPicker.tsx`

#### Enhanced Address Parsing
```typescript
// BEFORE: Basic parsing
parsePlace(place) {
  let city = '';
  components.forEach(comp => {
    if (comp.types.includes('locality')) {
      city = comp.long_name;
    }
  });
}

// AFTER: Comprehensive parsing
parsePlace(place) {
  let streetAddress = '';
  let city = '';
  let state = '';
  let pincode = '';
  let sublocality = '';
  
  components.forEach(comp => {
    if (comp.types.includes('street_number')) streetAddress = ...
    if (comp.types.includes('route')) streetAddress += ...
    if (comp.types.includes('sublocality')) sublocality = ...
    if (comp.types.includes('locality')) city = ...
    if (comp.types.includes('administrative_area_level_1')) state = ...
    if (comp.types.includes('postal_code')) pincode = ...
  });
  
  // Smart fallbacks
  setFormData({
    city: city || sublocality,
    state: state || city,
    ...
  });
}
```

#### Better User Feedback
```typescript
// Added visual feedback
updateMapLocation(lat, lng) {
  // ... set marker ...
  toast.success('Location set on map!', { duration: 2000 });
  console.log('📍 Location updated:', { lat, lng });
}

// Enhanced save validation
handleSaveAddress() {
  if (!formData.city) {
    toast.error('City is required. Please select location on map.');
    return;
  }
  
  console.log('💾 Saving address:', formData);
  // ... save logic ...
}
```

---

## 🧪 Testing

### Test Case 1: Click on Map
1. Open address picker
2. Click "Add New Address"
3. Click anywhere on map
4. ✅ Verify marker appears
5. ✅ Verify toast shows "Location set on map!"
6. ✅ Verify address field auto-fills
7. ✅ Verify city and postal code fill (if available)
8. ✅ Verify coordinates show at bottom

### Test Case 2: Search Address
1. Open address picker
2. Click "Add New Address"
3. Type "Colombo Fort" in search
4. Select from dropdown
5. ✅ Verify all fields auto-fill
6. ✅ Verify map centers on location

### Test Case 3: Current Location
1. Open address picker
2. Click "Add New Address"
3. Click "Use Current Location"
4. Allow browser permission
5. ✅ Verify GPS coordinates detected
6. ✅ Verify reverse geocoding fills address
7. ✅ Verify map shows current location

### Test Case 4: Load Existing Addresses
1. Have addresses in `user_address` table
2. Open menu page
3. ✅ Verify address banner loads
4. ✅ Verify default address shows
5. Open checkout page
6. ✅ Verify address loads automatically
7. Check browser console
8. ✅ Verify log shows which system loaded addresses

### Test Case 5: Save New Address
1. Fill in all fields via map click
2. Click "Save Address"
3. ✅ Verify success toast
4. ✅ Verify address appears in list
5. ✅ Verify can select the new address
6. Check database
7. ✅ Verify address saved to table

---

## 🐛 Troubleshooting

### Address Fields Not Auto-Filling

**Symptoms**: Click map but only coordinates fill, city/state blank

**Check**:
1. Open browser console (F12)
2. Click on map
3. Look for log: `📍 Address parsed:` with data
4. If data shows empty city/state, Google Maps couldn't find that info
5. Try clicking on a more specific location (near roads/buildings)

**Solution**:
- Click on actual streets/buildings, not empty areas
- Use search bar instead for better accuracy
- Manually type city if needed

### "No Addresses Found" Despite Having Data

**Symptoms**: Menu/checkout shows no address even though data exists

**Check Console Logs**:
```
✅ Loaded addresses from new system: 5
// OR
New address system not available, trying old system...
✅ Loaded addresses from old system: 5
```

**If you see**:
```
Failed to load from old system too: [error]
```

**Solutions**:
1. Check backend is running
2. Verify API endpoints exist:
   - `/api/users/addresses/by_type/?type=customer`
   - `/api/orders/addresses/`
3. Check user is logged in
4. Check network tab for 401/403 errors

### Save Button Doesn't Work

**Symptoms**: Click save but nothing happens

**Check Validations**:
- ✅ Label selected? (Home/Work/Other)
- ✅ Address filled?
- ✅ City filled?
- ✅ Coordinates not 0,0?

**Console should show**:
```
💾 Saving address: { label: 'Home', city: 'Colombo', lat: 6.9271, ... }
```

**If error shows**:
```
Failed to create address (status 400): { city: ['This field is required'] }
```
- Click on map again to set coordinates
- Use search to auto-fill missing fields

---

## 📊 Database Compatibility

### Old System (`user_addresses` table)
```sql
SELECT id, label, address_line1, city, pincode, latitude, longitude
FROM user_addresses
WHERE user_id = 1;
```

### New System (`addresses` table)
```sql
SELECT id, label, address_line1, city, state, pincode, latitude, longitude
FROM addresses  
WHERE user_id = 1 AND address_type = 'customer';
```

### Order References

**Old orders** use:
```sql
UPDATE orders SET delivery_address_ref_id = 42 WHERE id = 123;
```

**New orders** use:
```sql
UPDATE orders SET delivery_address_new_id = 42 WHERE id = 124;
```

**Both work!** No migration needed.

---

## ✅ Summary

### What's Fixed

1. ✅ **Map click auto-fills** city, state, postal code
2. ✅ **Addresses load** from both old and new tables
3. ✅ **Dual-system support** - seamless fallback
4. ✅ **Better validation** - clear error messages
5. ✅ **Visual feedback** - toast notifications
6. ✅ **Console logging** - easy debugging
7. ✅ **Default address** loads automatically
8. ✅ **Works with existing data** - no breaking changes

### User Experience

**Before**:
- Click map → Only coordinates set
- Empty address lists despite data in database
- Silent failures on save
- Confusing error messages

**After**:
- Click map → Full address auto-fills ✨
- Addresses load from any table 📍
- Clear success/error toasts 💬
- Helpful validation messages 📝
- Console logs for debugging 🔍

---

## 🚀 Ready to Test!

1. Start backend: `python manage.py runserver`
2. Start frontend: `npm run dev`
3. Open menu page: `http://localhost:5173/menu`
4. Open browser console: `F12`
5. Click address banner
6. Watch console logs for system detection
7. Try adding new address via map click
8. Verify all fields auto-fill

**Look for these console logs**:
```
📍 Loaded addresses: 3
✅ Default address found: Home
📍 Location updated: { lat: 6.9271, lng: 79.8612 }
📍 Address parsed: { fullAddress: '...', city: 'Colombo', state: 'Western Province' }
💾 Saving address: { ... }
✅ Address created in old system
```

Happy testing! 🎉

