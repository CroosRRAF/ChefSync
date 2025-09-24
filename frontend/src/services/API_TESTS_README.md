# Admin Dashboard API Tests

This directory contains testing utilities for the Admin Dashboard API endpoints that were added to support the enhanced dashboard features.

## Overview

The dashboard now includes three new API endpoints that provide analytics data:

1. **Orders Trend** - Shows order trends over the last 30 days
2. **Top Performing Chefs** - Lists the top 10 performing chefs by orders and revenue
3. **Top Performing Food Items** - Lists the top 10 performing food items by orders and revenue

## API Endpoints

### 1. Orders Trend

```
GET /api/admin/dashboard/orders_trend/?days=30
```

**Response Structure:**

```json
{
  "chart_type": "line",
  "title": "Orders Trend",
  "data": {
    "labels": ["Day 1", "Day 2", ..., "Day 30"],
    "datasets": [{
      "label": "Orders",
      "data": [12, 15, 8, ...],
      "backgroundColor": "rgba(54, 162, 235, 0.2)",
      "borderColor": "rgba(54, 162, 235, 1)",
      "borderWidth": 2
    }]
  },
  "total_orders": 650
}
```

### 2. Top Performing Chefs

```
GET /api/admin/dashboard/top_performing_chefs/?limit=10
```

**Response Structure:**

```json
{
  "chefs": [
    {
      "id": 1,
      "name": "Chef Maria Rodriguez",
      "email": "maria.rodriguez@chefsync.com",
      "total_orders": 145,
      "total_revenue": 8750.5,
      "rating": 4.8,
      "status": "active"
    }
    // ... more chefs
  ]
}
```

### 3. Top Performing Food Items

```
GET /api/admin/dashboard/top_performing_food_items/?limit=10
```

**Response Structure:**

```json
{
  "food_items": [
    {
      "id": 1,
      "name": "Margherita Pizza",
      "category": "Italian",
      "total_orders": 89,
      "total_revenue": 2670.0,
      "rating": 4.7,
      "status": "active"
    }
    // ... more food items
  ]
}
```

## Testing

### Run API Tests

```bash
npm run test:api
```

This will test all three endpoints and show whether they're responding correctly or falling back to mock data.

### Test Results

- **✅ PASS**: API endpoint is responding correctly
- **❌ FAIL (mock data)**: API endpoint is not available, using mock data fallback

## Files

- `dashboardAPITests.ts` - Comprehensive test utilities with Jest integration
- `simpleAPITest.js` - Simple Node.js test runner for quick validation
- `runDashboardTests.js` - ES module test runner (requires compilation)

## Mock Data

When the backend API is not available, the frontend automatically falls back to realistic mock data that includes:

- **Orders Trend**: 30 days of order data with realistic fluctuations
- **Top Chefs**: 10 chefs with varied performance metrics
- **Top Foods**: 10 food items across different categories

## Integration

The API responses are automatically integrated into the Dashboard component:

- Orders trend data feeds the "Orders Trends" chart
- Top chefs data populates the "Top Performing Chefs" table
- Top foods data populates the "Top Performing Food Items" table

## Backend Implementation Notes

When implementing these endpoints on the backend:

1. **Authentication**: Ensure endpoints require admin authentication
2. **Caching**: Consider caching expensive analytics queries
3. **Date Ranges**: Support flexible date ranges beyond 30 days
4. **Pagination**: Add pagination support for larger result sets
5. **Filtering**: Allow filtering by date ranges, categories, etc.

## Postman Collection

The endpoints correspond to the Postman collection items:

1. Orders Trend (Last 30 Days)
2. Top Performing Chefs
3. Top Performing Food Items

Use the collection to test the endpoints directly against your backend API.
