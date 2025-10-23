# Google Maps Address Picker - Setup Guide

## ✅ What Was Fixed

The Google Maps address picker has been completely redesigned and fixed to resolve the "Map element not found" errors. Here's what was improved:

### 1. **Simplified Component Architecture**
   - Removed complex tab navigation system
   - Cleaner, more intuitive UI with two main views: Address List and Add/Edit Form
   - Better state management and timing for map initialization

### 2. **Fixed Map Loading Issues**
   - Proper initialization timing using refs and useEffect
   - Map now loads AFTER the dialog is fully rendered
   - Retry mechanism removed (no longer needed)
   - Uses `mapContainerRef` to ensure DOM element exists before initialization

### 3. **Enhanced Address Management**
   - **Add New Address**: Clean button to open the address picker popup
   - **Edit Existing**: Click edit icon on any saved address
   - **Delete Address**: Remove addresses you no longer need
   - **Set Default**: Mark your most-used address as default
   - **Auto-select**: New addresses are automatically selected after creation

### 4. **Improved Checkout Page**
   - When address is selected: Shows address details + "Change" button + "Add New Address" button
   - When no address: Shows prominent "Add Delivery Address" button
   - Better visual hierarchy and user feedback

### 5. **Smart Auto-Fill Features**
   - **Search Location**: Type an address and select from autocomplete suggestions
   - **Use Current Location**: Click button to detect your current location automatically
   - **Click on Map**: Click anywhere on the map to select that location
   - **Auto-fill Details**: All fields (address, city, postal code) are automatically filled based on selected location

## 🚀 Quick Setup

### Step 1: Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - **Maps JavaScript API**
   - **Places API**
   - **Geocoding API**
4. Create credentials → API Key
5. Copy your API key

### Step 2: Configure Environment Variables

Create a `.env` file in the `frontend` directory:

```bash
# Google Maps API Key (Required for address picker)
VITE_GOOGLE_MAPS_API_KEY=your_actual_api_key_here

# Backend API URL
VITE_API_BASE_URL=http://localhost:8000/api
```

**Important**: Replace `your_actual_api_key_here` with your actual Google Maps API key.

### Step 3: Restart Development Server

```bash
cd frontend
npm run dev
```

The address picker will now work correctly!

## 📱 How to Use

### For Customers (Checkout Page)

1. **No Address Set**:
   - Click "Add Delivery Address" button
   - Popup opens with address form and map

2. **Address Already Set**:
   - See your current address displayed
   - Click "Change" to select a different saved address
   - Click "Add New Address or Select Another" to manage addresses

3. **Adding New Address**:
   - **Option 1**: Click "Use Current Location" (requires browser location permission)
   - **Option 2**: Type address in search box and select from suggestions
   - **Option 3**: Click anywhere on the map to select location
   - Fill in label (e.g., "Home", "Work", "Office")
   - Review auto-filled address details
   - Click "Save Address"

4. **Editing Address**:
   - Click edit icon (✏️) on any saved address
   - Update location on map or change details
   - Click "Update Address"

## 🎯 Features

### ✅ What Works Now

- **Map Loading**: Proper timing ensures map loads correctly every time
- **Search**: Type any address in Sri Lanka to find and select it
- **Current Location**: Detect user's GPS location with one click
- **Map Click**: Click anywhere on map to select that location
- **Auto-fill**: Address details automatically populated from coordinates
- **Reverse Geocoding**: Convert GPS coordinates to readable address
- **Multiple Addresses**: Save and manage multiple delivery addresses
- **Default Address**: Mark one address as default for faster checkout
- **Edit & Delete**: Full CRUD operations on addresses
- **Delivery Fee Calculation**: Automatic calculation based on distance

### 🔧 Technical Improvements

- **Proper Refs**: Uses `mapContainerRef` to ensure DOM element exists
- **Lazy Initialization**: Map initializes only when form is shown
- **Script Loading**: Smart detection of already-loaded Google Maps script
- **Error Handling**: Graceful fallbacks and user-friendly error messages
- **Performance**: Map instance reused, no unnecessary re-renders

## 🐛 Troubleshooting

### Map not loading?

1. **Check API Key**: Ensure `VITE_GOOGLE_MAPS_API_KEY` is set in `.env`
2. **Restart Server**: After adding `.env`, restart the development server
3. **Browser Console**: Check for any error messages
4. **API Enabled**: Verify all three APIs are enabled in Google Cloud Console

### "Location access denied" error?

- Grant browser permission for location access
- Alternative: Use search or click on map instead

### Address not auto-filling?

- The location must be in Sri Lanka (current restriction)
- Try clicking on the map if search doesn't work
- Manually enter details if auto-fill fails

### Delivery fee not calculating?

- Ensure address has valid GPS coordinates (latitude/longitude)
- Check that chef's kitchen location is properly set in the database
- Both coordinates are required for distance calculation

## 📊 Component Structure

```
CheckoutPage.tsx
├── Delivery Address Section
│   ├── Address Display (if selected)
│   ├── "Change" button
│   ├── "Add New Address" button
│   └── "Add Delivery Address" button (if none selected)
└── GoogleMapsAddressPicker Component
    ├── Saved Addresses List View
    │   ├── List of all saved addresses
    │   ├── Edit, Delete, Set Default actions
    │   └── "Add New Address" button
    └── Add/Edit Form View
        ├── Map Section
        │   ├── Search input with autocomplete
        │   ├── "Use Current Location" button
        │   └── Interactive map (click to select)
        └── Form Section
            ├── Label input
            ├── Address Line 1 (auto-filled)
            ├── Address Line 2 (optional)
            ├── City (auto-filled)
            ├── Postal Code (auto-filled)
            └── Save/Update button
```

## 🎨 UI/UX Highlights

- **Clean Design**: Modern gradient backgrounds and smooth transitions
- **Visual Feedback**: Color-coded states (green for selected, orange for actions)
- **Loading States**: Spinners and disabled states for better UX
- **Toast Notifications**: Success/error messages for all actions
- **Responsive Layout**: Works on desktop and mobile screens
- **Dark Mode Support**: Full dark mode compatibility

## 🔐 Security Notes

- **API Key Restrictions**: In production, restrict your API key to your domain
- **Environment Variables**: Never commit `.env` file to version control
- **HTTPS Required**: Geolocation only works on HTTPS or localhost

## 📝 Example `.env` File

```env
# Google Maps Configuration
VITE_GOOGLE_MAPS_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# API Configuration  
VITE_API_BASE_URL=http://localhost:8000/api

# Optional: Other configurations
VITE_APP_NAME=ChefSync
VITE_APP_ENV=development
```

## 🚀 Next Steps

1. **Set up API Key**: Follow Step 1 above
2. **Create `.env` file**: Follow Step 2 above
3. **Restart server**: Run `npm run dev` in frontend directory
4. **Test it out**: Navigate to checkout page and try adding an address

---

## ✨ Summary

The address picker is now:
- ✅ **Working**: No more "Map element not found" errors
- ✅ **Simple**: Clean, intuitive interface
- ✅ **Smart**: Auto-fills all address details
- ✅ **Complete**: Full CRUD operations on addresses
- ✅ **Fast**: Optimized loading and rendering
- ✅ **Beautiful**: Modern UI with great UX

Just add your Google Maps API key and you're ready to go! 🎉

