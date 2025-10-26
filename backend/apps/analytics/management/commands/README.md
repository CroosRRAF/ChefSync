# Analytics Data Seeding Command

## Overview
This management command seeds your database with sample analytics data for testing and development purposes.

## Usage

```bash
python manage.py seed_analytics_data [options]
```

## Options

- `--days`: Number of days of historical data to generate (default: 90)
- `--orders-per-day`: Average number of orders per day (default: 15)

## Examples

```bash
# Generate 90 days of data with 15 orders per day (default)
python manage.py seed_analytics_data

# Generate 30 days of data with 20 orders per day
python manage.py seed_analytics_data --days 30 --orders-per-day 20

# Generate 180 days of data with 25 orders per day
python manage.py seed_analytics_data --days 180 --orders-per-day 25
```

## What Gets Created

The command creates:

1. **Sample Users**:
   - 10 customers with varied join dates
   - 3 cooks (chefs) assigned to food items

2. **Cuisines & Categories**:
   - 3 cuisines (Sri Lankan, Chinese, Indian)
   - 6 food categories

3. **Food Items**:
   - 10 sample food items with prices
   - Each food has approved status and is available
   - FoodPrice objects are created for each food item

4. **Historical Orders**:
   - Orders distributed over the specified number of days
   - Realistic status distribution (60% completed, 15% confirmed, 10% pending, 10% preparing, 5% cancelled)
   - Payment status distribution (mostly paid for completed orders)
   - Varied order sizes (1-4 items per order)
   - Higher order volume on weekends
   - Time-stamped throughout the day (8 AM - 10 PM)

## Data Summary

After running the default command, you'll have approximately:
- **Total Orders**: ~1,500 orders
- **Paid Orders**: ~1,000 orders  
- **Total Revenue**: ~LKR 500,000
- **Customers**: 10 active customers
- **Cooks**: 3 active cooks
- **Food Items**: 10 items with prices

## Notes

- Orders are created with timestamps in the past to simulate historical data
- The command is idempotent for users and food items (won't create duplicates)
- Order status distribution is weighted to simulate realistic scenarios
- Weekend days generate ~50% more orders than weekdays
- All food items are automatically approved for immediate use

## Cleaning Up

To remove seeded data, you can:

1. Delete specific orders:
```bash
python manage.py shell
>>> from apps.orders.models import Order
>>> Order.objects.filter(order_number__startswith="ORD-").delete()
```

2. Or reset the entire database (⚠️ WARNING: This deletes ALL data):
```bash
python manage.py flush
python manage.py migrate
```

## Troubleshooting

**Issue**: Command fails with "No cooks found"  
**Solution**: Ensure you have users with role="cook" in your database

**Issue**: Command fails with "No customers found"  
**Solution**: Ensure you have users with role="customer" in your database

**Issue**: Analytics Hub still shows zero data  
**Solution**: 
1. Check that orders have `payment_status='paid'`
2. Refresh your browser (Ctrl+F5)
3. Check browser console for errors
4. Verify the API endpoints are accessible

## After Seeding

1. **Refresh your browser** to see the new data in the Analytics Hub
2. Navigate to the **Analytics Hub** page
3. You should see:
   - Revenue trends over time
   - Order distribution charts
   - Customer analytics
   - Growth metrics

## Customization

To customize the seeded data, edit the following in `seed_analytics_data.py`:

- `customer_data`: Add more customer profiles
- `cook_data`: Add more chef profiles
- `food_items`: Add more food items with prices
- `statuses` and `payment_statuses`: Adjust distribution weights
- Price ranges and delivery fees

