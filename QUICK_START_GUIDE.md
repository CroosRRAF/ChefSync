# 🚀 Quick Start Guide - Address System

## Setup (5 minutes)

### 1. Get Google Maps API Key
1. Visit https://console.cloud.google.com/
2. Create/select project
3. Enable these 3 APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API
4. Create API key
5. Copy the key

### 2. Add to Environment
```bash
cd frontend
echo "VITE_GOOGLE_MAPS_API_KEY=your_key_here" >> .env
echo "VITE_API_BASE_URL=http://localhost:8000/api" >> .env
```

### 3. Start Servers
```bash
# Terminal 1 - Backend
cd backend
python manage.py runserver

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

### 4. Open Browser
```
http://localhost:5173/menu
```

---

## How to Use

### On Menu Page

**Step 1**: See address banner at top
```
┌─────────────────────────────────────────────┐
│ 📍 Deliver to                               │
│ Home - Colombo                              │
│ 123 Main Street, Colombo Fort              │
│                                  🚚 ⌄      │
└─────────────────────────────────────────────┘
```

**Step 2**: Click banner to change address

**Step 3**: Select from saved OR click "Add New Address"

---

### Adding New Address

**Method 1: Search** 🔍
1. Type address in search box
2. Select from dropdown
3. All fields auto-fill
4. Click "Save Address"

**Method 2: Click on Map** 🗺️
1. Click anywhere on map
2. See marker drop
3. See toast: "Location set on map!"
4. Address auto-fills
5. Review details
6. Click "Save Address"

**Method 3: Current Location** 📡
1. Click "Use Current Location"
2. Allow browser permission
3. Wait for GPS detection
4. Address auto-fills
5. Click "Save Address"

---

### What Auto-Fills?

When you click on map or use location:

✅ **Address**: Full formatted address  
✅ **City**: Extracted from location  
✅ **State**: Administrative area  
✅ **Postal Code**: If available  
✅ **Coordinates**: Exact lat/lng  

You just need to:
- Select label (Home/Work/Other)
- Verify details
- Click Save

---

### On Checkout Page

**What happens automatically:**
1. Default address loads on page open
2. Distance calculates from chef to you
3. Delivery fee shows (LKR 50 + distance)
4. Estimated time displays

**To change address:**
1. Click "Change" button
2. Select different address
3. Delivery fee recalculates instantly
4. Complete order

---

## Console Logs (for debugging)

Open browser console (F12) to see:

```javascript
// When loading addresses
✅ Loaded addresses from new system: 3
// OR
✅ Loaded addresses from old system: 2

// When clicking map
📍 Location updated: { lat: 6.9271, lng: 79.8612 }

// When address is parsed
📍 Address parsed: {
  fullAddress: "123 Main St, Colombo Fort",
  city: "Colombo",
  state: "Western Province",
  pincode: "00100"
}

// When saving
💾 Saving address: { label: 'Home', city: 'Colombo', ... }
✅ Address created in old system

// When loading default
✅ Default address found: Home
```

---

## Common Scenarios

### Scenario 1: New User (No Addresses)

**Menu Page**: Shows "Click to add your address"

**Checkout**: Shows "Add Delivery Address" button

**Action**: Click button → Add first address → Done!

---

### Scenario 2: Existing User

**Menu Page**: Shows "Deliver to: Home - Colombo"

**Checkout**: Address pre-loaded with delivery fee

**Action**: Browse menu, add items, checkout smoothly!

---

### Scenario 3: Multiple Addresses

**Menu Page**: Click banner to see all

**Checkout**: Click "Change" to switch

**Action**: One click to change delivery location!

---

## Troubleshooting

### Map Doesn't Show
❌ **Issue**: Gray box instead of map

✅ **Fix**:
1. Check `.env` file exists in `frontend/`
2. Verify `VITE_GOOGLE_MAPS_API_KEY=...` is set
3. Restart dev server: `npm run dev`
4. Hard refresh browser: `Ctrl+Shift+R`

### Address Fields Empty After Map Click
❌ **Issue**: Only coordinates set, no city/address

✅ **Fix**:
1. Click on actual buildings/streets (not empty areas)
2. Use search bar for better accuracy
3. Or manually type city after clicking

### "No Addresses Found"
❌ **Issue**: Despite having data in database

✅ **Fix**:
1. Check backend is running: `python manage.py runserver`
2. Check you're logged in
3. Look at console logs:
   - Should see "✅ Loaded addresses from..."
   - If errors, check API endpoints

### Save Button Greyed Out
❌ **Issue**: Can't click Save

✅ **Fix**:
- Click on map to set location
- Ensure address field is filled
- Check city is populated
- Verify coordinates shown at bottom

---

## Quick Test

### 1-Minute Test
1. Open menu page
2. Click address banner
3. Click "Add New Address"
4. Click anywhere on map in Sri Lanka
5. Wait 1 second
6. Check if address fields filled
7. Click "Save Address"
8. See success toast ✅

### What You Should See
```
Step 1: Address banner appears
Step 2: Modal opens
Step 3: Form view shows
Step 4: Marker drops on map
Step 5: "Location set on map!" toast
Step 6: Address, city, postal code filled
Step 7: "Address saved successfully!" toast
Step 8: Modal closes, address selected
```

---

## Tips & Tricks

### Best Practices
- **Use map click** for exact coordinates
- **Save multiple addresses** for convenience
- **Set default** for your main location
- **Check delivery fee** before ordering

### For Accurate Results
- Click on buildings, not empty areas
- Use search for well-known places
- Zoom in before clicking
- Verify city name is correct

### Mobile Users
- Allow location permission for GPS
- Use "Current Location" button
- Tap map once to set pin
- Pinch to zoom

---

## Success Checklist

After setup, verify:

- [ ] Menu page loads with address banner
- [ ] Can click banner to open picker
- [ ] Can see saved addresses
- [ ] Can add new address
- [ ] Map loads within 3 seconds
- [ ] Clicking map sets marker
- [ ] Address auto-fills after click
- [ ] City and postal code populate
- [ ] Save button works
- [ ] Success toast shows
- [ ] Checkout loads default address
- [ ] Delivery fee calculates
- [ ] Can change address easily
- [ ] Console shows success logs

---

## Next Steps

1. ✅ **Test the system** - Add a few addresses
2. ✅ **Browse menu** - See address at top
3. ✅ **Try checkout** - Watch fee calculate
4. ✅ **Switch addresses** - Change delivery location
5. ✅ **Complete order** - End-to-end test

---

## Need Help?

**Check these files**:
- `ADDRESS_LOADING_FIXES.md` - Technical fixes
- `COMPLETE_FIX_SUMMARY.md` - Full overview
- `ENVIRONMENT_SETUP.md` - Detailed setup

**Common questions**:
- Q: Where's my Google Maps API key?
- A: In `.env` file as `VITE_GOOGLE_MAPS_API_KEY=...`

- Q: Why aren't my addresses loading?
- A: Check console logs, verify backend running

- Q: Map click doesn't work?
- A: Click on streets/buildings, zoom in first

**Still stuck?**
1. Check browser console (F12)
2. Look for red error messages
3. Verify all servers running
4. Try hard refresh (Ctrl+Shift+R)

---

## 🎊 You're All Set!

Your address system is ready to use!

**Features you now have**:
✨ Address banner on menu page  
✨ Auto-loading default address  
✨ Map-based address selection  
✨ Automatic detail filling  
✨ Delivery fee calculation  
✨ Mobile-optimized design  
✨ Modern, clean UI  

**Enjoy your enhanced food delivery app! 🍕🚀**

