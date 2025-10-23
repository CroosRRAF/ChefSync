# 📊 Chef Profile Data Storage - Table Mapping

## When Chef Profile is Updated, Data Goes to These Tables:

### 1. **User Table** (`authentication_user`)
**Fields updated in User model:**
- `name` - Chef's full name
- `phone_no` - Chef's phone number (mapped from frontend 'phone')
- `username` - Chef's username
- `address` - Chef's address/bio

**Database Table:** `authentication_user`
**Updated by:** Line 380-382 in serializers.py
```python
# Update User fields
for attr, value in validated_data.items():
    setattr(instance, attr, value)
instance.save()
```

---

### 2. **Cook Table** (`Cook`)
**Fields updated in Cook model:**
- `specialty` - Chef's specialty cuisine (mapped from frontend 'specialty_cuisine')
- `availability_hours` - Chef's available hours
- `kitchen_location` - Kitchen address string
- `experience_years` - Converted from experience_level enum
- `kitchen_latitude` - Kitchen coordinates (latitude)
- `kitchen_longitude` - Kitchen coordinates (longitude)

**NEW LOCATION FIELDS** (added in our implementation):
- `current_latitude` - Real-time location (latitude)
- `current_longitude` - Real-time location (longitude)
- `location_accuracy` - GPS accuracy in meters
- `last_location_update` - Timestamp of last location update
- `is_location_tracking_enabled` - Tracking status

**Database Table:** `Cook`
**Updated by:** Line 384-388 in serializers.py
```python
# Update or create Cook profile
cook_profile, created = Cook.objects.get_or_create(user=instance)
for attr, value in cook_data.items():
    setattr(cook_profile, attr, value)
cook_profile.save()
```

---

### 3. **ChefProfile Table** (`chef_profiles`) 
**Fields that may exist:**
- `rating_average` - Chef's average rating (READ ONLY from frontend)
- `total_reviews` - Number of reviews (READ ONLY from frontend)
- `specialty_cuisines` - JSON field with cuisine types
- `bio` - Chef's biography
- `approval_status` - Admin approval status

**Database Table:** `chef_profiles`
**Note:** This table is used for ratings/reviews but NOT directly updated by profile changes

---

## 🔄 **Data Flow Summary**

### **Profile Update Request:**
```json
{
  "name": "Chef John",
  "phone": "+94771234567", 
  "specialty_cuisine": "Italian",
  "experience_level": "intermediate",
  "kitchen_location": {
    "latitude": 6.9271,
    "longitude": 79.8612,
    "address_line1": "123 Main St",
    "city": "Colombo"
  }
}
```

### **Database Updates:**

#### **User Table Updates:**
| Field | Value | Table Column |
|-------|-------|--------------|
| name | "Chef John" | `authentication_user.name` |
| phone | "+94771234567" | `authentication_user.phone_no` |

#### **Cook Table Updates:**
| Field | Value | Table Column |
|-------|-------|--------------|
| specialty_cuisine | "Italian" | `Cook.specialty` |
| experience_level → years | "intermediate" → 2 | `Cook.experience_years` |
| kitchen_location.latitude | 6.9271 | `Cook.kitchen_latitude` |
| kitchen_location.longitude | 79.8612 | `Cook.kitchen_longitude` |
| kitchen_location.address | "123 Main St, Colombo" | `Cook.kitchen_location` |

---

## 🎯 **Real-Time Location Updates**

### **When using Location Tracker:**
**API Endpoint:** `PUT /auth/chef/location/`
**Request:**
```json
{
  "latitude": 6.9271,
  "longitude": 79.8612,
  "accuracy": 10.5
}
```

**Cook Table Updates:**
| Field | Value | Table Column |
|-------|-------|--------------|
| latitude | 6.9271 | `Cook.current_latitude` |
| longitude | 79.8612 | `Cook.current_longitude` |
| accuracy | 10.5 | `Cook.location_accuracy` |
| timestamp | NOW() | `Cook.last_location_update` |

---

## 📋 **Complete Table Structure**

### **User Table Fields Used:**
```sql
-- Basic profile info
name VARCHAR(100)
phone_no VARCHAR(20)
username VARCHAR(150)
address TEXT
email VARCHAR(254) -- READ ONLY
```

### **Cook Table Fields Used:**
```sql
-- Profile details
specialty VARCHAR(100)
availability_hours VARCHAR(50)
experience_years INTEGER

-- Kitchen location (static)
kitchen_location VARCHAR(255) 
kitchen_latitude DECIMAL(9,6)
kitchen_longitude DECIMAL(9,6)

-- Real-time location (dynamic)
current_latitude DECIMAL(9,6)
current_longitude DECIMAL(9,6)
location_accuracy FLOAT
last_location_update DATETIME
is_location_tracking_enabled BOOLEAN
```

### **ChefProfile Table (Read Only for Profile):**
```sql
-- Ratings and reviews (not updated by profile)
rating_average DECIMAL(3,2)
total_reviews INTEGER
specialty_cuisines JSON
bio TEXT
approval_status VARCHAR(20)
```

---

## ✅ **Summary**

**When chef updates profile:**
1. **Primary data** → `authentication_user` table (name, phone, etc.)
2. **Cook-specific data** → `Cook` table (specialty, location, experience)
3. **Location coordinates** → `Cook` table (kitchen_latitude, kitchen_longitude)

**When chef shares real-time location:**
1. **Live coordinates** → `Cook` table (current_latitude, current_longitude)
2. **Tracking metadata** → `Cook` table (accuracy, timestamp, status)

**Read-only data from:**
1. **Rating/reviews** → `chef_profiles` table (displayed but not editable)