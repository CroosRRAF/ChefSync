# ChefSync Cloudinary Integration - Complete Setup Guide

## 🎯 Overview

This implementation provides a complete Cloudinary integration for ChefSync that:
- **Migrates existing blob/base64 images** to Cloudinary URLs
- **Handles new uploads** directly to Cloudinary
- **Provides optimized image delivery** with automatic format/quality optimization
- **Supports thumbnails** and multiple image sizes
- **Maintains backward compatibility** with existing blob data

## 📁 Files Added/Modified

### New Files Created:
- `backend/apps/food/cloudinary_utils.py` - Core Cloudinary utilities
- `backend/apps/food/cloudinary_fields.py` - Custom Django fields for Cloudinary
- `backend/apps/food/management/commands/migrate_images_to_cloudinary.py` - Migration command
- `backend/apps/food/management/__init__.py`
- `backend/apps/food/management/commands/__init__.py`
- `backend/test_cloudinary.py` - Testing script

### Files Modified:
- `backend/apps/food/serializers.py` - Updated with Cloudinary URL handling and thumbnails
- `backend/apps/food/views.py` - Added image upload endpoint
- `backend/apps/food/urls.py` - Added upload route
- `backend/apps/food/utils.py` - Enhanced image conversion with Cloudinary support

## 🚀 Setup Instructions

### 1. Environment Configuration
Your `.env` file already has Cloudinary config:
```bash
CLOUDINARY_CLOUD_NAME=durdb7hxw
CLOUDINARY_API_KEY=647168559376263
CLOUDINARY_API_SECRET=6SRLFCnJzUmcxEkYBs28njXmyhM
```

### 2. Test Cloudinary Connection
```bash
cd backend
python test_cloudinary.py
```

### 3. Migrate Existing Images (IMPORTANT!)

**Step 1: Dry Run (Check what will be migrated)**
```bash
python manage.py migrate_images_to_cloudinary --dry-run
```

**Step 2: Run Migration (if dry-run looks good)**
```bash
# Migrate all models
python manage.py migrate_images_to_cloudinary

# Or migrate specific model
python manage.py migrate_images_to_cloudinary --model=food
python manage.py migrate_images_to_cloudinary --model=cuisine
```

**Step 3: Migration Options**
```bash
# Batch size (default 10)
python manage.py migrate_images_to_cloudinary --batch-size=5

# Specific model only
python manage.py migrate_images_to_cloudinary --model=foodimage
```

## 📡 API Endpoints

### 1. Upload Image Endpoint
```http
POST /api/food/upload-image/
Authorization: Bearer <token>
Content-Type: multipart/form-data

Body:
- image: <file>
- folder: <optional_folder_name>
```

**Response:**
```json
{
  "url": "https://res.cloudinary.com/durdb7hxw/image/upload/v123456789/uploads/image_abc123.jpg",
  "public_id": "uploads/image_abc123",
  "width": 800,
  "height": 600,
  "format": "jpg"
}
```

### 2. Enhanced API Responses

All existing endpoints now return enhanced image data:

**Food List Response:**
```json
{
  "food_id": 1,
  "name": "Chicken Curry",
  "image_url": "https://res.cloudinary.com/durdb7hxw/image/upload/q_auto,f_auto,w_800,h_600/food/chicken_curry.jpg",
  "thumbnail_url": "https://res.cloudinary.com/durdb7hxw/image/upload/q_auto,f_auto,w_300,h_300/food/chicken_curry.jpg",
  "primary_image": "https://res.cloudinary.com/durdb7hxw/image/upload/q_auto,f_auto/food/chicken_curry.jpg"
}
```

## 🔧 Image Processing Features

### 1. Automatic Optimization
- **Quality:** Auto-optimized based on content
- **Format:** Auto-converted to best format (WebP when supported)
- **Size:** Responsive sizing based on request

### 2. Thumbnail Generation
- **Cuisine images:** 200x200px thumbnails
- **Food images:** 300x300px thumbnails  
- **Food gallery:** 150x150px thumbnails

### 3. Migration Safety
- **Batch processing:** Processes images in configurable batches
- **Rate limiting:** Built-in delays to respect Cloudinary limits
- **Error handling:** Continues on individual failures
- **Rollback support:** Original blob data preserved until confirmed success

## 🎨 Frontend Integration

### JavaScript Example - Upload Image
```javascript
// Upload image to Cloudinary
async function uploadImage(file, folder = 'uploads') {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('folder', folder);
  
  const response = await fetch('/api/food/upload-image/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  
  const result = await response.json();
  return result.url; // Cloudinary URL
}

// Use in form submission
const handleImageUpload = async (event) => {
  const file = event.target.files[0];
  if (file) {
    try {
      const imageUrl = await uploadImage(file, 'food_items');
      // Use imageUrl in your form data
      setFormData(prev => ({
        ...prev,
        image: imageUrl
      }));
    } catch (error) {
      console.error('Upload failed:', error);
    }
  }
};
```

### React Component Example
```jsx
import React, { useState } from 'react';

const ImageUploader = ({ onUpload, folder = 'uploads' }) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('folder', folder);

      const response = await fetch('/api/food/upload-image/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const result = await response.json();
      
      if (result.url) {
        setPreview(result.url);
        onUpload(result.url);
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input 
        type="file" 
        accept="image/*" 
        onChange={handleUpload}
        disabled={uploading}
      />
      {uploading && <p>Uploading...</p>}
      {preview && (
        <img 
          src={preview} 
          alt="Preview" 
          style={{ width: '200px', height: '200px', objectFit: 'cover' }}
        />
      )}
    </div>
  );
};
```

## 🔍 Monitoring & Maintenance

### Check Migration Status
```bash
# See what still needs migration
python manage.py migrate_images_to_cloudinary --dry-run --model=all
```

### Cloudinary Dashboard
- Monitor usage at: https://cloudinary.com/console
- View uploaded images and transformations
- Check bandwidth and storage usage

## 🚨 Important Notes

1. **Backup First:** Ensure database backup before running migration
2. **Rate Limits:** Cloudinary free tier has limits - monitor usage  
3. **Original Data:** Blob data remains in database until confirmed migration success
4. **Testing:** Test thoroughly in development before production migration

## 🎉 Benefits

✅ **Performance:** CDN delivery worldwide  
✅ **Optimization:** Automatic format/quality optimization  
✅ **Scalability:** Handles any image volume  
✅ **Thumbnails:** Auto-generated responsive images  
✅ **Compatibility:** Works with existing blob data  
✅ **Security:** Secure URLs with transformation protection  

## 🔧 Next Steps

1. Run the test script to verify connection
2. Execute migration with dry-run first  
3. Migrate images in production
4. Update frontend to use upload endpoint
5. Monitor Cloudinary usage and optimize as needed

This implementation provides a robust, scalable image handling solution for ChefSync! 🚀