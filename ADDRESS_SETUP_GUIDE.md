# Address System Setup Guide

## Overview

ChefSync uses an advanced address management system with Google Maps integration for accurate delivery address selection. This guide will help you set up and use the address features properly.

## Features

✅ **Google Maps Integration** - Visual address selection with autocomplete  
✅ **Current Location Detection** - Automatic GPS location detection  
✅ **Saved Addresses** - Save multiple delivery addresses (Home, Work, etc.)  
✅ **Automatic Distance Calculation** - Calculate delivery distance and fees  
✅ **Smart Address Parser** - Automatically extracts city, state, and postal code  
✅ **Backward Compatible** - Supports both old and new address systems  

---

## Setup Instructions

### 1. Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - **Maps JavaScript API**
   - **Places API**
   - **Geocoding API**
4. Create credentials:
   - Go to "Credentials" → "Create Credentials" → "API Key"
   - Copy your API key
5. (Recommended) Restrict your API key:
   - Application restrictions: HTTP referrers
   - Add your domain (e.g., `localhost:5173/*`, `yourdomain.com/*`)
   - API restrictions: Select only the 3 APIs mentioned above

### 2. Configure Frontend

1. Create a `.env` file in the `frontend/` directory:
   ```bash
   cp frontend/.env.example frontend/.env
   ```

2. Add your Google Maps API key to `.env`:
   ```env
   VITE_GOOGLE_MAPS_API_KEY=YOUR_API_KEY_HERE
   VITE_API_BASE_URL=http://localhost:8000/api
   ```

3. Restart your development server:
   ```bash
   cd frontend
   npm run dev
   ```

### 3. Backend Configuration

The backend is already configured to support both old and new address systems. No additional setup required!

---

## How the Address System Works

### User Flow

```
1. User goes to Checkout
   ↓
2. Clicks "Change Address" or "Add Delivery Address"
   ↓
3. Address Picker Modal Opens with 3 tabs:
   ├── Saved Addresses (select from existing)
   ├── Map Search (search & click on map)
   └── Current Location (GPS detection)
   ↓
4. User selects/creates address
   ↓
5. Address is saved to database
   ↓
6. System calculates delivery distance & fee
   ↓
7. User completes order
```

### Address Selection Options

#### Option 1: Saved Addresses
- View all previously saved addresses
- Click to select
- Edit or delete existing addresses
- Set default address

#### Option 2: Map Search
- Search for any address using Google autocomplete
- Click anywhere on the map to pin exact location
- Automatically extracts:
  - Address Line 1
  - City
  - State/Province
  - Postal Code
  - GPS Coordinates (Latitude & Longitude)

#### Option 3: Current Location
- Click "Use Current Location" button
- Browser requests location permission
- Automatically fills in your current GPS position
- Reverse geocodes to get human-readable address

---

## Technical Architecture

### Frontend Components

1. **AddressService** (`frontend/src/services/addressService.ts`)
   - Manages API calls for addresses
   - Supports both `/users/addresses/` (new) and `/orders/addresses/` (old)
   - Handles address CRUD operations

2. **GoogleMapsAddressPicker** (`frontend/src/components/checkout/GoogleMapsAddressPicker.tsx`)
   - Main address selection modal
   - Integrates Google Maps API
   - Handles address search and selection

3. **CheckoutPage** (`frontend/src/pages/CheckoutPage.tsx`)
   - Displays selected address
   - Calculates delivery fee based on distance
   - Shows delivery time estimate

### Backend Models

1. **New System** (`backend/apps/users/models.py`)
   ```python
   class Address(models.Model):
       user = ForeignKey(User)
       address_type = CharField(choices=['customer', 'kitchen', 'delivery_agent'])
       label = CharField()  # Home, Work, etc.
       address_line1 = CharField()
       city = CharField()
       state = CharField()
       pincode = CharField()
       latitude = DecimalField()
       longitude = DecimalField()
       is_default = BooleanField()
   ```

2. **Old System** (`backend/apps/orders/models.py`)
   ```python
   class UserAddress(models.Model):
       # Legacy model - still supported for backward compatibility
   ```

3. **Order Model** (`backend/apps/orders/models.py`)
   ```python
   class Order(models.Model):
       # Supports both systems
       delivery_address_ref = ForeignKey(UserAddress)  # Old
       delivery_address_new_id = BigIntegerField()     # New
       delivery_latitude = DecimalField()
       delivery_longitude = DecimalField()
       distance_km = DecimalField()
   ```

### API Endpoints

#### New Address System (Recommended)
- `GET /api/users/addresses/by_type/?type=customer` - List customer addresses
- `GET /api/users/addresses/default/?type=customer` - Get default address
- `POST /api/users/customer-addresses/quick_create/` - Quick address creation
- `POST /api/users/addresses/{id}/set_default/` - Set default address
- `PUT /api/users/addresses/{id}/` - Update address
- `DELETE /api/users/addresses/{id}/` - Delete address

#### Old Address System (Legacy)
- `GET /api/orders/addresses/` - List addresses
- `POST /api/orders/addresses/` - Create address
- Still functional for backward compatibility

---

## Delivery Fee Calculation

The system automatically calculates delivery fees based on distance:

```
Base Fee: LKR 50
Free Delivery Distance: First 5 km
Extra Distance Fee: LKR 15 per km

Example Calculations:
- 3 km → LKR 50 (base fee only)
- 7 km → LKR 50 + (2 km × LKR 15) = LKR 80
- 12 km → LKR 50 + (7 km × LKR 15) = LKR 155
```

Distance is calculated using the Haversine formula:
```javascript
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
```

---

## Troubleshooting

### Google Maps Not Loading

**Problem:** Map shows "Loading..." indefinitely

**Solutions:**
1. Check if API key is set in `.env` file
2. Verify API key is valid in Google Cloud Console
3. Check browser console for errors
4. Ensure these APIs are enabled:
   - Maps JavaScript API
   - Places API
   - Geocoding API

### Location Permission Denied

**Problem:** "Location access denied" error

**Solutions:**
1. Check browser location permissions
2. Ensure site is running on HTTPS (or localhost)
3. User must click "Allow" when prompted

### Address Not Saving

**Problem:** Address doesn't save after clicking "Save"

**Solutions:**
1. Check browser console for API errors
2. Ensure all required fields are filled:
   - Label (Home, Work, etc.)
   - Address Line 1
   - City
   - Coordinates (selected on map)
3. Check backend logs for validation errors

### Distance Calculation Issues

**Problem:** Delivery fee shows as LKR 0 or incorrect

**Solutions:**
1. Ensure address has latitude and longitude
2. Check that chef's kitchen location is set
3. Verify coordinates are valid numbers

---

## Best Practices

### For Users

1. **Use Map Selection** - More accurate than typing address
2. **Save Multiple Addresses** - For frequently used locations
3. **Set Default** - Your most common delivery address
4. **Verify Location** - Zoom in on map to confirm exact position

### For Developers

1. **Always Include State** - Required by backend, defaults to city if not found
2. **Validate Coordinates** - Check latitude/longitude are not 0
3. **Handle Errors Gracefully** - Show user-friendly messages
4. **Test Without GPS** - Not all devices support geolocation

---

## Example Usage

### Create Address via API

```javascript
const addressData = {
  label: 'Home',
  address_line1: '123 Main Street',
  address_line2: 'Apt 4B',
  city: 'Colombo',
  state: 'Western Province',
  pincode: '00100',
  latitude: 6.9271,
  longitude: 79.8612,
  is_default: true
};

const newAddress = await addressService.createAddress(addressData);
```

### Get All Addresses

```javascript
const addresses = await addressService.getAddresses();
console.log(addresses);
// [
//   { id: 1, label: 'Home', city: 'Colombo', is_default: true },
//   { id: 2, label: 'Work', city: 'Kandy', is_default: false }
// ]
```

### Calculate Delivery Fee

```javascript
// Chef location
const chefLat = 6.9271;
const chefLng = 79.8612;

// Customer address
const customerLat = 6.9344;
const customerLng = 79.8428;

// Calculate distance
const distance = addressService.calculateDistance(
  chefLat, chefLng, 
  customerLat, customerLng
);

// Calculate fee
const baseFee = 50;
const freeKm = 5;
const perKmFee = 15;

const deliveryFee = distance > freeKm 
  ? baseFee + Math.ceil(distance - freeKm) * perKmFee
  : baseFee;

console.log(`Distance: ${distance.toFixed(2)} km`);
console.log(`Delivery Fee: LKR ${deliveryFee}`);
```

---

## Security Considerations

1. **API Key Restrictions** - Always restrict your Google Maps API key
2. **HTTPS** - Use HTTPS in production for geolocation
3. **Rate Limiting** - Google Maps has usage quotas
4. **Data Validation** - Always validate coordinates on backend
5. **User Privacy** - Don't store precise coordinates unless necessary

---

## Support

For issues or questions:
- Check browser console for errors
- Review backend logs (`python manage.py runserver`)
- Ensure all migrations are applied (`python manage.py migrate`)
- Verify environment variables are set correctly

---

## Migration from Old to New System

The system supports both old and new addresses simultaneously. No migration required!

When a user creates a new address:
- It's saved to the new `Address` model
- Order references it via `delivery_address_new_id`

Existing orders with old addresses:
- Continue to work via `delivery_address_ref`
- No data loss or breaking changes

---

## Summary

✅ Google Maps API key configured  
✅ Address selection works (saved, map, GPS)  
✅ Distance calculation accurate  
✅ Delivery fees calculated correctly  
✅ Backend supports both old and new systems  
✅ User experience matches Uber Eats/DoorDash  

Your address system is now fully functional! 🎉

