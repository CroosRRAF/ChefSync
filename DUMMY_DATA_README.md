# ChefSync-Kitchen Dummy Data Generator

This Django management command generates comprehensive dummy data for testing the ChefSync-Kitchen admin management system. It creates realistic data across all models with proper relationships and historical data spanning multiple time periods.

## Overview

The dummy data generator creates:
- **Users**: Admins, customers, cooks, and delivery agents with realistic profiles
- **Food Catalog**: Complete cuisine categories, food items with detailed attributes
- **Orders & Payments**: Comprehensive order history with payment processing and refunds
- **Admin Data**: Activity logs, system metrics, notifications, dashboard widgets, settings, and backups

## Features

### Realistic Data Generation
- **Time-spanning data**: Generate data for configurable months (default: 12 months)
- **Weighted distributions**: Realistic status distributions (e.g., 60% delivered orders)
- **Proper relationships**: All foreign key relationships maintained
- **Varied data**: Random but realistic values for all fields

### Comprehensive Coverage
- **500 orders** with complete lifecycle tracking
- **1000+ admin activity logs** across the time period
- **360 daily system health metrics** (for 12 months)
- **200 admin notifications** with various types and priorities
- **Complete user ecosystem** with all role types
- **Full food catalog** with 8 cuisines and 32+ food items

## Usage

### Basic Usage
```bash
python manage.py populate_dummy_data
```

### Advanced Options
```bash
# Generate 6 months of data
python manage.py populate_dummy_data --data-months 6

# Clear existing data before generating new data
python manage.py populate_dummy_data --clear-existing

# Combine options
python manage.py populate_dummy_data --clear-existing --data-months 24
```

### Command Options
- `--clear-existing`: Remove all existing data before generating new data
- `--data-months`: Number of months of historical data to generate (default: 12)

## Generated Data Structure

### Users (37 total)
- **3 Admin Users**: System administrators with full access
- **20 Customer Users**: End users placing orders
- **8 Cook Users**: Kitchen staff with specialties and ratings
- **6 Delivery Agents**: Drivers with vehicle information

### Food Catalog
- **8 Cuisines**: Italian, Chinese, Indian, Mexican, Thai, Japanese, French, Mediterranean
- **32+ Categories**: Appetizers, Main Courses, Desserts, etc.
- **32+ Food Items**: Popular dishes with pricing, ratings, and nutritional info

### Orders & Payments (500 orders)
- **Order Status Distribution**:
  - Delivered: 60%
  - Confirmed: 15%
  - Preparing: 10%
  - Out for Delivery: 8%
  - Ready: 5%
  - Cancelled: 2%
- **Payment Methods**: Card, Online, Cash
- **Complete Order Lifecycle**: Status history tracking
- **Refunds**: For cancelled/refunded orders

### Admin Management Data

#### Activity Logs (1000+ entries)
- User actions: Login/logout, CRUD operations
- System actions: Settings updates, backups, reports
- Security tracking: IP addresses, user agents
- Time distribution: Spread across the specified period

#### System Health Metrics (360+ daily entries)
- CPU usage: 10-90%
- Memory usage: 20-95%
- Disk usage: 15-85%
- Response time: 50-500ms
- Error rate: 0-5%
- Active users: 5-200

#### Admin Notifications (200 entries)
- Types: System alerts, order notifications, security alerts
- Priorities: Low, medium, high, urgent
- Read status: 33% read, 67% unread
- Categories: Security, performance, orders, users

#### Dashboard Widgets (6 widgets)
- Total Orders: Order count metric
- Total Revenue: Revenue metric
- Active Users: User count metric
- System Health: Performance chart
- Recent Orders: Data table
- Popular Foods: Analytics chart

#### Quick Actions (5 actions)
- Create New Order
- Process Refund
- Send Notification
- Generate Report
- Update System Settings

#### System Settings (10 settings)
- General: Site name, description
- Contact: Email, phone
- Delivery: Radius, fees
- Payment: Tax rate, currency
- System: Maintenance mode, limits

#### Backup Logs (30 entries)
- Types: Full, incremental, differential
- Status: 75% success, 25% failed
- File sizes: 100MB - 2GB
- Monthly backups across the time period

## Data Relationships

### Order Flow
```
Customer → Places Order → Cook → Prepares → Delivery Agent → Delivers
                     ↓
                Payment → Transaction Records
                     ↓
                Refund (if applicable)
```

### Admin Ecosystem
```
Admin Users → Activity Logs → Target Models
           → Notifications → Target Users
           → System Settings → Configuration
           → Backup Logs → System Backups
```

### Food Catalog Hierarchy
```
Cuisine → Categories → Food Items → Order Items
    ↓         ↓            ↓
  Reviews   Images     Ingredients
```

## Testing Scenarios Covered

### Admin Dashboard Testing
- **Metrics Display**: Total orders, revenue, user counts
- **Charts**: System health trends over time
- **Tables**: Recent orders, popular foods
- **Real-time Updates**: Active user counts

### Order Management Testing
- **Status Workflows**: Complete order lifecycle
- **Payment Processing**: Various payment methods and statuses
- **Refund Handling**: Different refund scenarios
- **Historical Data**: Orders across multiple months

### User Management Testing
- **Role-based Access**: Different user types and permissions
- **Profile Management**: User details and preferences
- **Authentication**: Login/logout tracking

### System Monitoring Testing
- **Performance Metrics**: CPU, memory, disk usage
- **Error Tracking**: Error rates and response times
- **Activity Logging**: Admin actions and system events
- **Notification System**: Alert management

## Database Performance

### Optimized Generation
- **Bulk Operations**: Efficient database insertions
- **Transaction Management**: Atomic operations for data integrity
- **Memory Management**: Streaming data generation
- **Index Utilization**: Proper use of database indexes

### Data Volume Estimates
- **Small Dataset** (6 months): ~2,000 records
- **Medium Dataset** (12 months): ~4,000 records
- **Large Dataset** (24 months): ~8,000 records

## Validation & Testing

### Data Integrity
- **Foreign Key Constraints**: All relationships validated
- **Required Fields**: All mandatory fields populated
- **Data Types**: Proper type conversion and validation
- **Unique Constraints**: Unique fields properly handled

### API Endpoint Testing
After generating data, test these admin endpoints:
- `/api/admin/dashboard/` - Dashboard overview
- `/api/admin/recent-activities/` - Activity logs
- `/api/admin/system-health/` - Health metrics
- `/api/admin/notifications/` - Notification management
- `/api/admin/orders/` - Order management
- `/api/admin/users/` - User management

## Troubleshooting

### Common Issues
1. **Foreign Key Errors**: Ensure data generation order is correct
2. **Memory Issues**: Reduce `--data-months` for large datasets
3. **Duplicate Data**: Use `--clear-existing` to remove old data
4. **Performance**: Generate data in smaller batches if needed

### Data Verification
```python
# Check generated data counts
from apps.admin_management.models import AdminActivityLog
from apps.orders.models import Order

print(f"Activity logs: {AdminActivityLog.objects.count()}")
print(f"Orders: {Order.objects.count()}")
```

## Customization

### Modifying Data Volume
Edit the constants in the management command:
```python
total_orders = 500  # Change order count
activity_logs_count = 1000  # Change activity log count
```

### Adding New Data Types
Extend the generation methods:
```python
def generate_custom_data(self):
    # Add your custom data generation logic
    pass
```

## Best Practices

### Development Testing
1. Use `--clear-existing` for clean test environments
2. Generate smaller datasets for faster testing
3. Test with different time periods to validate historical data

### Production Considerations
1. Never run on production databases
2. Use separate test databases
3. Backup production data before testing
4. Monitor database performance during generation

### Data Quality
1. Validate generated data against business rules
2. Test edge cases and boundary conditions
3. Ensure realistic data distributions
4. Verify all relationships are properly established

## Support

For issues with the dummy data generator:
1. Check the Django logs for error messages
2. Verify database connections and permissions
3. Ensure all required packages are installed
4. Test with smaller datasets first

## Version History

- **v1.0**: Initial comprehensive dummy data generator
- Features: Complete admin system coverage, time-spanning data, realistic distributions
- Models: All admin management, user, order, payment, and food models
- Testing: Full admin dashboard and API endpoint coverage