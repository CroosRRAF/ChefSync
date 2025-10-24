# 🚀 Bulk Menu Quick Start Guide

## ✅ What Was Added

**12 Realistic Bulk Menus** with **104 Menu Items** across **7 Existing Chefs**

### Menus Added:

1. 🌶️ **Traditional Jaffna Feast** - LKR 450/person (Lunch)
2. 💒 **Jaffna Wedding Special** - LKR 650/person (Dinner)
3. ☕ **South Indian Breakfast Bonanza** - LKR 200/person (Breakfast)
4. 🍱 **Evening Snacks Platter** - LKR 150/person (Snacks)
5. 💼 **Corporate Executive Lunch** - LKR 350/person (Lunch)
6. 👔 **Premium North Indian Spread** - LKR 550/person (Dinner)
7. 🥗 **Healthy Vegetarian Feast** - LKR 300/person (Lunch)
8. 🍜 **Pan-Asian Delight** - LKR 480/person (Dinner)
9. 🍛 **Sri Lankan Rice & Curry** - LKR 320/person (Lunch)
10. 🥐 **Continental Breakfast Buffet** - LKR 280/person (Breakfast)
11. 🧀 **International Finger Food** - LKR 250/person (Snacks)
12. 🍖 **BBQ & Grill Party Pack** - LKR 580/person (Dinner)

---

## 🎯 How to Access

### Admin Panel
```
URL: http://localhost:8000/admin/food/bulkmenu/
- View all menus
- Edit menu details
- Approve/Reject menus
- Manage items
```

### API Endpoints
```bash
# Get all bulk menus
GET /api/food/bulk-menus/

# AI-powered search
POST /api/orders/customer-bulk-orders/ai-search/
Body: {"query": "healthy vegetarian lunch"}

# Analyze menu
GET /api/orders/customer-bulk-orders/{id}/ai-analyze/

# Get recommendations
GET /api/orders/customer-bulk-orders/ai-recommendations/?dietary_preference=vegetarian
```

### Customer Dashboard
```
URL: http://localhost:5173/customer/bulk-orders
- Browse menus
- Use AI search
- Filter by meal type
- Place orders
```

---

## 🤖 Test AI Search

Try these queries in the customer dashboard:

```
1. "healthy vegetarian food for corporate event"
2. "spicy dinner for wedding with 200 guests"
3. "breakfast options for morning meeting"
4. "seafood feast for celebration"
5. "BBQ for outdoor party"
6. "snacks for tea party"
7. "North Indian dinner buffet"
8. "rice and curry Sri Lankan style"
```

---

## 📊 Verify Data

### Check in Django Shell
```python
python manage.py shell

from apps.food.models import BulkMenu, BulkMenuItem

# Count menus
print(f"Total Menus: {BulkMenu.objects.count()}")

# List all menus
for menu in BulkMenu.objects.all():
    print(f"{menu.menu_name} - {menu.chef.name} - LKR {menu.base_price_per_person}")

# Check items for a menu
menu = BulkMenu.objects.first()
print(f"\nItems in {menu.menu_name}:")
for item in menu.items.all():
    optional = " (Optional)" if item.is_optional else ""
    print(f"  - {item.item_name}{optional}")
```

### Check via API
```bash
curl http://localhost:8000/api/food/bulk-menus/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🎨 Features Included

✅ **Diverse Cuisines**: Jaffna, South Indian, North Indian, Sri Lankan, Asian, Continental, BBQ
✅ **All Meal Types**: Breakfast, Lunch, Dinner, Snacks
✅ **Dietary Options**: Vegetarian, Vegan, Gluten-free marked
✅ **Spice Levels**: Mild to Very Hot
✅ **Price Range**: LKR 150 - 650 per person
✅ **Capacity Range**: 15 - 1000 persons
✅ **Professional Images**: High-quality food photography
✅ **Optional Items**: Premium add-ons available
✅ **Pre-Approved**: Ready for immediate orders
✅ **AI-Ready**: Optimized for AI search

---

## 🔧 Troubleshooting

### Menus Not Showing?
```python
# Check approval status
from apps.food.models import BulkMenu
menus = BulkMenu.objects.all()
print(f"Total: {menus.count()}")
print(f"Approved: {menus.filter(approval_status='approved').count()}")
print(f"Available: {menus.filter(availability_status=True).count()}")
```

### AI Search Not Working?
```bash
# Check if API key is set
echo $GOOGLE_AI_API_KEY

# Verify in Django
python manage.py shell -c "from apps.food.ai_service import ai_service; print(ai_service.is_available())"
```

### Images Not Loading?
- Images use Unsplash URLs (external)
- For production, upload to Cloudinary
- Check network connectivity

---

## 📝 Database Schema

### BulkMenu Fields
- chef (Foreign Key to User)
- meal_type (breakfast/lunch/dinner/snacks)
- menu_name (string)
- description (text)
- base_price_per_person (decimal)
- min_persons / max_persons (int)
- advance_notice_hours (int)
- availability_status (boolean)
- approval_status (pending/approved/rejected)
- image (CloudinaryField)

### BulkMenuItem Fields
- bulk_menu (Foreign Key)
- item_name (string)
- description (text)
- is_optional (boolean)
- extra_cost (decimal)
- is_vegetarian (boolean)
- spice_level (mild/medium/hot/very_hot)
- allergens (JSON)
- sort_order (int)

---

## 🎓 Chef Information

All 7 chefs from Jaffna region:

1. **Chef Nilanthi Tharmalingam** (2 menus)
   - Jaffna Traditional & Wedding Specialist

2. **Chef Sutharsiny Kanagarajah** (2 menus)
   - South Indian Breakfast & Snacks

3. **Chef Aravinth Yogarajah** (2 menus)
   - Corporate & North Indian Cuisine

4. **Chef Dharshan Rajadurai** (2 menus)
   - Healthy Vegetarian & Pan-Asian

5. **Chef Poornachandran Sivakumar** (1 menu)
   - Authentic Sri Lankan Rice & Curry

6. **Chef Tharsheni Balasingam** (2 menus)
   - Continental & International Cuisine

7. **Chef Jeyachandran** (1 menu)
   - BBQ & Grill Specialist

---

## 🎯 Next Actions

1. **Test in Browser**: http://localhost:5173/customer/bulk-orders
2. **Try AI Search**: Use natural language queries
3. **Place Test Order**: Complete full ordering flow
4. **Admin Review**: Check menu management
5. **Add More**: Create additional menus as needed

---

## 📞 Support

For issues or questions:
- Check Django logs: `python manage.py runserver`
- Review API responses in browser DevTools
- Verify database with Django shell commands
- Check AI_FEATURES_GUIDE.md for AI setup

---

**Status**: ✅ **READY FOR USE**
**Last Updated**: Just now
**Total Setup Time**: ~2 minutes
**Quality**: Production-ready with realistic data

