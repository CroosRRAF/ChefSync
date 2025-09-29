# Admin System API Documentation

## 🔌 **API Reference Guide**

**Version**: 2.0
**Base URL**: `/api/admin`
**Authentication**: Bearer Token Required
**Content-Type**: `application/json`

---

## 🔐 **Authentication**

### **Headers Required**

```http
Authorization: Bearer {your_jwt_token}
Content-Type: application/json
```

### **Authentication Endpoints**

```typescript
// Login
POST /auth/login
{
  "email": "admin@example.com",
  "password": "password123"
}

// Response
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "admin@example.com",
    "role": "admin",
    "permissions": ["read", "write", "delete"]
  }
}

// Refresh Token
POST /auth/refresh
{
  "refreshToken": "refresh_token_here"
}
```

---

## 👥 **User Management API**

### **Get Users**

```http
GET /admin/users?page=1&limit=10&search=john&role=admin&status=active

Response:
{
  "users": [
    {
      "id": "user_123",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "admin",
      "status": "active",
      "avatar": "https://avatar.url",
      "createdAt": "2025-09-29T10:00:00Z",
      "lastLogin": "2025-09-29T09:00:00Z",
      "permissions": ["read", "write"]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "totalPages": 15,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### **Create User**

```http
POST /admin/users
{
  "email": "newuser@example.com",
  "firstName": "New",
  "lastName": "User",
  "password": "securePassword123",
  "role": "user",
  "permissions": ["read"]
}

Response:
{
  "success": true,
  "message": "User created successfully",
  "user": {
    "id": "user_456",
    "email": "newuser@example.com",
    "firstName": "New",
    "lastName": "User",
    "role": "user",
    "status": "active",
    "createdAt": "2025-09-29T10:30:00Z"
  }
}
```

### **Update User**

```http
PUT /admin/users/{userId}
{
  "firstName": "Updated",
  "lastName": "Name",
  "role": "moderator",
  "status": "active",
  "permissions": ["read", "write"]
}

Response:
{
  "success": true,
  "message": "User updated successfully",
  "user": {updated_user_object}
}
```

### **Delete User**

```http
DELETE /admin/users/{userId}

Response:
{
  "success": true,
  "message": "User deleted successfully"
}
```

### **Bulk Operations**

```http
POST /admin/users/bulk
{
  "action": "delete", // or "update", "export"
  "userIds": ["user_123", "user_456"],
  "updateData": { // only for update action
    "status": "inactive"
  }
}

Response:
{
  "success": true,
  "message": "Bulk operation completed",
  "processed": 2,
  "failed": 0,
  "results": [
    {
      "userId": "user_123",
      "status": "success"
    }
  ]
}
```

---

## 🍽️ **Food Menu Management API**

### **Get Menu Items**

```http
GET /admin/food?page=1&limit=20&category=pizza&available=true&featured=false

Response:
{
  "items": [
    {
      "id": "item_123",
      "name": "Margherita Pizza",
      "description": "Classic tomato and mozzarella",
      "price": 12.99,
      "category": "pizza",
      "image": "https://image.url",
      "available": true,
      "featured": false,
      "ingredients": ["tomato", "mozzarella", "basil"],
      "allergens": ["gluten", "dairy"],
      "preparationTime": 15,
      "calories": 450,
      "createdAt": "2025-09-29T10:00:00Z",
      "updatedAt": "2025-09-29T10:00:00Z"
    }
  ],
  "pagination": {pagination_object},
  "categories": ["pizza", "burgers", "salads", "pasta"],
  "totalItems": 150,
  "availableItems": 130
}
```

### **Create Menu Item**

```http
POST /admin/food
{
  "name": "Pepperoni Pizza",
  "description": "Classic pepperoni with cheese",
  "price": 14.99,
  "category": "pizza",
  "image": "base64_image_or_url",
  "available": true,
  "featured": true,
  "ingredients": ["tomato", "mozzarella", "pepperoni"],
  "allergens": ["gluten", "dairy"],
  "preparationTime": 18,
  "calories": 520
}

Response:
{
  "success": true,
  "message": "Menu item created successfully",
  "item": {created_item_object}
}
```

### **Update Menu Item**

```http
PUT /admin/food/{itemId}
{
  "price": 15.99,
  "available": false,
  "featured": true
}

Response:
{
  "success": true,
  "message": "Menu item updated successfully",
  "item": {updated_item_object}
}
```

### **Menu Categories**

```http
GET /admin/food/categories

Response:
{
  "categories": [
    {
      "id": "cat_123",
      "name": "Pizza",
      "slug": "pizza",
      "description": "Delicious pizzas",
      "itemCount": 15,
      "featured": true,
      "sortOrder": 1
    }
  ]
}

POST /admin/food/categories
{
  "name": "Desserts",
  "description": "Sweet treats",
  "featured": false,
  "sortOrder": 5
}
```

---

## 📊 **Analytics API**

### **Dashboard Metrics**

```http
GET /admin/analytics/dashboard?period=30d&timezone=UTC

Response:
{
  "revenue": {
    "total": 125000.50,
    "thisMonth": 45000.25,
    "lastMonth": 38000.75,
    "growth": 18.5,
    "currency": "USD"
  },
  "orders": {
    "total": 2150,
    "thisWeek": 185,
    "lastWeek": 165,
    "growth": 12.1,
    "averageValue": 58.14
  },
  "customers": {
    "total": 1250,
    "new": 85,
    "returning": 165,
    "growth": 8.3,
    "retentionRate": 68.5
  },
  "popularItems": [
    {
      "id": "item_123",
      "name": "Margherita Pizza",
      "orderCount": 245,
      "revenue": 3067.55
    }
  ]
}
```

### **Revenue Analytics**

```http
GET /admin/analytics/revenue?startDate=2025-09-01&endDate=2025-09-29&groupBy=day

Response:
{
  "chartData": [
    {
      "date": "2025-09-01",
      "revenue": 1250.50,
      "orders": 25,
      "averageOrderValue": 50.02
    }
  ],
  "summary": {
    "totalRevenue": 125000.50,
    "averageDaily": 4310.36,
    "peakDay": "2025-09-15",
    "peakRevenue": 6250.75
  },
  "trends": {
    "growth": 15.2,
    "seasonality": "increasing",
    "forecast": 135000.0
  }
}
```

### **User Analytics**

```http
GET /admin/analytics/users?period=30d

Response:
{
  "userGrowth": [
    {
      "date": "2025-09-01",
      "newUsers": 15,
      "totalUsers": 1150
    }
  ],
  "demographics": {
    "ageGroups": [
      { "range": "18-25", "count": 245, "percentage": 19.6 },
      { "range": "26-35", "count": 420, "percentage": 33.6 }
    ],
    "locations": [
      { "city": "New York", "count": 350, "percentage": 28.0 },
      { "city": "Los Angeles", "count": 280, "percentage": 22.4 }
    ]
  },
  "behavior": {
    "averageSessionTime": "12:45",
    "averageOrdersPerUser": 3.2,
    "topDevices": ["mobile", "desktop", "tablet"]
  }
}
```

---

## 📝 **Orders Management API**

### **Get Orders**

```http
GET /admin/orders?page=1&limit=20&status=pending&customer=john&startDate=2025-09-01

Response:
{
  "orders": [
    {
      "id": "order_123",
      "orderNumber": "ORD-2025-001234",
      "customerId": "user_456",
      "customerName": "John Doe",
      "customerEmail": "john@example.com",
      "status": "pending",
      "totalAmount": 65.50,
      "items": [
        {
          "id": "item_123",
          "name": "Margherita Pizza",
          "quantity": 2,
          "price": 12.99,
          "subtotal": 25.98,
          "customizations": ["extra cheese"]
        }
      ],
      "deliveryAddress": {
        "street": "123 Main St",
        "city": "New York",
        "zipCode": "10001",
        "coordinates": {
          "lat": 40.7128,
          "lng": -74.0060
        }
      },
      "paymentMethod": "credit_card",
      "paymentStatus": "paid",
      "createdAt": "2025-09-29T10:00:00Z",
      "estimatedDelivery": "2025-09-29T10:45:00Z",
      "actualDelivery": null,
      "notes": "Ring doorbell twice"
    }
  ],
  "pagination": {pagination_object},
  "summary": {
    "totalOrders": 2150,
    "pendingOrders": 45,
    "completedOrders": 2050,
    "cancelledOrders": 55,
    "totalRevenue": 125000.50
  }
}
```

### **Update Order Status**

```http
PUT /admin/orders/{orderId}/status
{
  "status": "preparing", // pending, preparing, ready, delivered, cancelled
  "notes": "Started preparation at 10:15 AM",
  "estimatedDelivery": "2025-09-29T10:45:00Z"
}

Response:
{
  "success": true,
  "message": "Order status updated successfully",
  "order": {updated_order_object},
  "notification": {
    "sent": true,
    "method": "email",
    "customerId": "user_456"
  }
}
```

### **Order Analytics**

```http
GET /admin/orders/analytics?period=7d

Response:
{
  "orderTrends": [
    {
      "date": "2025-09-29",
      "orders": 85,
      "revenue": 4250.50,
      "avgOrderValue": 50.00
    }
  ],
  "statusDistribution": {
    "pending": 12,
    "preparing": 25,
    "ready": 8,
    "delivered": 150,
    "cancelled": 5
  },
  "peakHours": [
    { "hour": 12, "orders": 45 },
    { "hour": 19, "orders": 52 }
  ]
}
```

---

## 💬 **Communication API**

### **Notifications**

```http
GET /admin/notifications?type=email&status=sent&page=1

Response:
{
  "notifications": [
    {
      "id": "notif_123",
      "type": "email",
      "template": "order_confirmation",
      "recipient": "customer@example.com",
      "subject": "Order Confirmation #ORD-123",
      "status": "sent",
      "sentAt": "2025-09-29T10:00:00Z",
      "openedAt": "2025-09-29T10:05:00Z",
      "clickedAt": null,
      "bounced": false,
      "data": {
        "orderId": "order_123",
        "customerName": "John Doe"
      }
    }
  ],
  "stats": {
    "totalSent": 1250,
    "delivered": 1200,
    "opened": 850,
    "clicked": 320,
    "bounced": 15,
    "openRate": 70.8,
    "clickRate": 37.6
  }
}
```

### **Send Notification**

```http
POST /admin/notifications/send
{
  "type": "email", // email, sms, push
  "template": "promotion",
  "recipients": ["user_123", "user_456"], // or "all", "active_users"
  "subject": "Special Offer - 20% Off!",
  "data": {
    "discount": "20%",
    "expiryDate": "2025-10-31"
  },
  "schedule": "2025-09-30T09:00:00Z" // optional
}

Response:
{
  "success": true,
  "message": "Notification scheduled successfully",
  "campaign": {
    "id": "campaign_123",
    "recipients": 1250,
    "estimatedSend": "2025-09-30T09:00:00Z",
    "cost": 12.50
  }
}
```

### **Email Templates**

```http
GET /admin/notifications/templates

Response:
{
  "templates": [
    {
      "id": "template_123",
      "name": "Order Confirmation",
      "type": "email",
      "subject": "Order Confirmation #{{orderNumber}}",
      "content": "Dear {{customerName}}, your order...",
      "variables": ["orderNumber", "customerName", "items"],
      "active": true,
      "createdAt": "2025-09-29T10:00:00Z"
    }
  ]
}

POST /admin/notifications/templates
{
  "name": "Welcome Email",
  "type": "email",
  "subject": "Welcome to our platform!",
  "content": "Dear {{firstName}}, welcome...",
  "variables": ["firstName", "lastName"]
}
```

---

## 📋 **Feedback Management API**

### **Get Feedback**

```http
GET /admin/feedback?type=complaint&status=new&priority=high&page=1

Response:
{
  "feedback": [
    {
      "id": "feedback_123",
      "customerId": "user_456",
      "customerName": "John Doe",
      "customerEmail": "john@example.com",
      "type": "complaint", // complaint, suggestion, compliment, issue
      "category": "food-quality",
      "priority": "high", // low, medium, high, urgent
      "status": "new", // new, in-progress, resolved, closed
      "subject": "Cold food delivery",
      "message": "My pizza arrived cold and the delivery was late...",
      "rating": 2,
      "orderId": "order_789",
      "images": ["image1.jpg", "image2.jpg"],
      "createdAt": "2025-09-29T10:00:00Z",
      "updatedAt": "2025-09-29T10:00:00Z",
      "assignedTo": "admin_123",
      "responses": [
        {
          "id": "response_123",
          "adminId": "admin_123",
          "adminName": "Admin User",
          "message": "We apologize for the inconvenience...",
          "createdAt": "2025-09-29T11:00:00Z"
        }
      ]
    }
  ],
  "summary": {
    "total": 150,
    "new": 25,
    "inProgress": 30,
    "resolved": 85,
    "closed": 10,
    "averageRating": 4.2,
    "averageResponseTime": "2:15:00"
  }
}
```

### **Respond to Feedback**

```http
POST /admin/feedback/{feedbackId}/respond
{
  "message": "Thank you for your feedback. We have investigated the issue...",
  "status": "resolved", // optional status update
  "privateNotes": "Issued refund and sent voucher",
  "followUpRequired": false
}

Response:
{
  "success": true,
  "message": "Response sent successfully",
  "feedback": {updated_feedback_object},
  "notificationSent": true
}
```

### **Feedback Analytics**

```http
GET /admin/feedback/analytics?period=30d

Response:
{
  "trends": [
    {
      "date": "2025-09-29",
      "complaints": 5,
      "suggestions": 3,
      "compliments": 12,
      "averageRating": 4.3
    }
  ],
  "categoryBreakdown": [
    { "category": "food-quality", "count": 45, "percentage": 30.0 },
    { "category": "delivery", "count": 35, "percentage": 23.3 }
  ],
  "sentimentAnalysis": {
    "positive": 65.5,
    "neutral": 20.2,
    "negative": 14.3
  },
  "responseMetrics": {
    "averageResponseTime": "2:15:00",
    "responseRate": 98.5,
    "resolutionRate": 92.3
  }
}
```

---

## 📊 **Reports API**

### **Generate Report**

```http
POST /admin/reports/generate
{
  "type": "revenue", // revenue, users, orders, inventory, feedback
  "period": {
    "startDate": "2025-09-01",
    "endDate": "2025-09-29"
  },
  "format": "pdf", // pdf, excel, csv, json
  "filters": {
    "category": "pizza",
    "status": "completed",
    "minAmount": 50
  },
  "groupBy": "day", // day, week, month
  "includeCharts": true,
  "scheduled": false
}

Response:
{
  "success": true,
  "message": "Report generated successfully",
  "report": {
    "id": "report_123",
    "type": "revenue",
    "status": "completed",
    "downloadUrl": "https://api.example.com/reports/download/report_123",
    "expiresAt": "2025-10-29T10:00:00Z",
    "fileSize": "2.5MB",
    "recordCount": 1250
  }
}
```

### **Scheduled Reports**

```http
GET /admin/reports/scheduled

Response:
{
  "schedules": [
    {
      "id": "schedule_123",
      "name": "Weekly Revenue Report",
      "type": "revenue",
      "format": "pdf",
      "frequency": "weekly", // daily, weekly, monthly
      "recipients": ["admin@example.com", "manager@example.com"],
      "lastRun": "2025-09-22T09:00:00Z",
      "nextRun": "2025-09-29T09:00:00Z",
      "active": true
    }
  ]
}

POST /admin/reports/schedule
{
  "name": "Monthly User Report",
  "type": "users",
  "format": "excel",
  "frequency": "monthly",
  "dayOfWeek": 1, // for weekly reports
  "dayOfMonth": 1, // for monthly reports
  "time": "09:00",
  "timezone": "UTC",
  "recipients": ["admin@example.com"],
  "filters": {
    "active": true
  }
}
```

---

## ⚙️ **Settings API**

### **Get Settings**

```http
GET /admin/settings?category=general

Response:
{
  "settings": {
    "general": {
      "siteName": "Food Delivery App",
      "siteUrl": "https://example.com",
      "contactEmail": "support@example.com",
      "timezone": "UTC",
      "currency": "USD",
      "language": "en"
    },
    "delivery": {
      "deliveryRadius": 10,
      "deliveryFee": 2.99,
      "freeDeliveryThreshold": 25.00,
      "estimatedDeliveryTime": 30
    },
    "notifications": {
      "emailNotifications": true,
      "smsNotifications": true,
      "pushNotifications": true,
      "marketingEmails": false
    },
    "integrations": {
      "googleMaps": {
        "enabled": true,
        "apiKey": "gm_api_key_****"
      },
      "stripe": {
        "enabled": true,
        "publicKey": "pk_****"
      }
    }
  }
}
```

### **Update Settings**

```http
PUT /admin/settings
{
  "general": {
    "siteName": "Updated Site Name",
    "contactEmail": "newcontact@example.com"
  },
  "delivery": {
    "deliveryFee": 3.99,
    "freeDeliveryThreshold": 30.00
  }
}

Response:
{
  "success": true,
  "message": "Settings updated successfully",
  "settings": {updated_settings_object}
}
```

---

## 🔍 **Search API**

### **Global Admin Search**

```http
GET /admin/search?q=john&types=users,orders&limit=10

Response:
{
  "results": [
    {
      "id": "user_123",
      "type": "user",
      "title": "John Doe",
      "description": "john@example.com - Admin",
      "url": "/admin/users/user_123",
      "avatar": "https://avatar.url",
      "relevance": 0.95
    },
    {
      "id": "order_456",
      "type": "order",
      "title": "Order #ORD-123",
      "description": "John Doe - $65.50 - Delivered",
      "url": "/admin/orders/order_456",
      "relevance": 0.87
    }
  ],
  "totalResults": 25,
  "searchTime": "0.05s",
  "suggestions": ["john doe", "john smith"]
}
```

---

## 📈 **Webhook API**

### **Webhook Configuration**

```http
GET /admin/webhooks

Response:
{
  "webhooks": [
    {
      "id": "webhook_123",
      "url": "https://external-app.com/webhooks/orders",
      "events": ["order.created", "order.updated", "order.cancelled"],
      "secret": "webhook_secret_****",
      "active": true,
      "lastTriggered": "2025-09-29T10:00:00Z",
      "failureCount": 0
    }
  ]
}

POST /admin/webhooks
{
  "url": "https://external-app.com/webhooks/users",
  "events": ["user.created", "user.updated", "user.deleted"],
  "secret": "your_webhook_secret",
  "active": true
}
```

---

## ❌ **Error Responses**

### **Standard Error Format**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ]
  },
  "timestamp": "2025-09-29T10:00:00Z",
  "requestId": "req_123456"
}
```

### **Common Error Codes**

- `UNAUTHORIZED` (401) - Invalid or missing authentication
- `FORBIDDEN` (403) - Insufficient permissions
- `NOT_FOUND` (404) - Resource not found
- `VALIDATION_ERROR` (422) - Request validation failed
- `RATE_LIMITED` (429) - Too many requests
- `INTERNAL_ERROR` (500) - Server error

---

## 📊 **Rate Limiting**

### **Rate Limits**

- **General API**: 1000 requests/hour per user
- **Search API**: 100 requests/minute per user
- **Bulk Operations**: 10 requests/minute per user
- **File Uploads**: 50 requests/hour per user

### **Rate Limit Headers**

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1695984000
```

---

## 🔧 **SDKs and Libraries**

### **JavaScript/TypeScript SDK**

```typescript
import { AdminAPI } from "@/services/adminService";

const api = new AdminAPI({
  baseURL: "https://api.example.com",
  token: "your_jwt_token",
});

// Usage examples
const users = await api.users.getAll({ page: 1, limit: 10 });
const user = await api.users.create(userData);
const orders = await api.orders.getAll({ status: "pending" });
```

---

**📝 Note**: This API documentation is comprehensive and covers all admin system endpoints. For additional examples and interactive testing, use the provided Postman collection or API playground.

**🔄 Last Updated**: September 29, 2025 - Phase 8.2 Complete
