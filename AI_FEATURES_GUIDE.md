# 🤖 ChefSync AI-Powered Bulk Order Filtering Guide

## Overview

ChefSync now includes advanced AI-powered filtering for bulk orders using Google's Gemini AI. This enables customers to find the perfect catering menu using natural language queries instead of traditional keyword searches.

## 🚀 Features

### 1. **Natural Language Search**
Search for menus using conversational queries like:
- "healthy vegetarian food for corporate event"
- "spicy Indian food for wedding with 100 guests"
- "breakfast options for a morning meeting"
- "vegan dinner menu for birthday party"

### 2. **AI Menu Analysis**
- Automatic cuisine type detection
- Dietary tag extraction (vegetarian, vegan, gluten-free, etc.)
- Spice level assessment
- Occasion suitability matching
- Health score rating
- Flavor profile analysis

### 3. **Smart Recommendations**
AI considers:
- User dietary preferences
- Event type and size
- Meal timing
- Previous order history (future enhancement)

## 📋 Setup Instructions

### Backend Setup

1. **Get Google AI API Key**
   ```bash
   # Visit: https://makersuite.google.com/app/apikey
   # Create a new API key for Gemini
   ```

2. **Configure Environment Variables**
   ```bash
   # In backend/.env file
   GOOGLE_AI_API_KEY=your_api_key_here
   ```

3. **Verify Installation**
   ```bash
   cd backend
   pip install google-generativeai==0.8.3
   python manage.py shell
   ```
   
   ```python
   from apps.food.ai_service import ai_service
   print(ai_service.is_available())  # Should return True
   ```

### Frontend Setup

The frontend AI features are already integrated in the CustomerBulkOrderDashboard component.

## 🎯 API Endpoints

### 1. AI Search
**Endpoint:** `POST /api/orders/customer-bulk-orders/ai-search/`

**Request:**
```json
{
  "query": "healthy vegetarian food for corporate event",
  "meal_type": "lunch"  // optional
}
```

**Response:**
```json
{
  "query": "healthy vegetarian food for corporate event",
  "total_results": 15,
  "ai_powered": true,
  "menus": [
    {
      "id": 1,
      "menu_name": "Executive Vegetarian Lunch",
      "description": "Healthy vegetarian options...",
      "base_price_per_person": 250.00,
      "menu_items_summary": {
        "mandatory_items": ["Salad", "Main Course", "Dessert"],
        "optional_items": ["Extra Beverages"]
      }
    }
  ]
}
```

### 2. AI Menu Analysis
**Endpoint:** `GET /api/orders/customer-bulk-orders/{menu_id}/ai-analyze/`

**Response:**
```json
{
  "menu_id": 1,
  "menu_name": "Spicy Indian Feast",
  "analysis": {
    "ai_generated": true,
    "cuisine_type": "Indian",
    "dietary_tags": ["vegetarian", "gluten-free-options"],
    "spice_level": "spicy",
    "occasion_suitability": ["wedding", "celebration", "party"],
    "flavor_profile": ["spicy", "savory", "aromatic"],
    "health_score": 7,
    "popular_items": ["Paneer Tikka", "Biryani", "Naan"],
    "search_keywords": ["indian", "spicy", "vegetarian", "paneer", "curry"]
  }
}
```

### 3. AI Recommendations
**Endpoint:** `GET /api/orders/customer-bulk-orders/ai-recommendations/`

**Query Parameters:**
- `dietary_preference` - vegetarian, vegan, etc.
- `occasion` - corporate_event, wedding, etc.
- `guest_count` - number of guests
- `meal_type` - breakfast, lunch, dinner

**Response:**
```json
{
  "preferences": {
    "dietary_preference": "vegetarian",
    "occasion": "corporate_event",
    "guest_count": "50"
  },
  "recommendations": [
    {
      "id": 1,
      "menu_name": "Corporate Veg Platter",
      "ai_recommendation_reason": "Perfect vegetarian options for your corporate event with healthy choices"
    }
  ],
  "ai_powered": true
}
```

## 💡 Usage Examples

### Frontend Usage

```tsx
// The AI search is already integrated in the dashboard
// Users can simply type natural language queries

// Example queries that work well:
"Find me healthy food"
"Spicy Indian dinner for 100 people"
"Vegetarian breakfast options"
"Food for a wedding reception"
"Low-carb lunch for corporate meeting"
```

### Backend Service Usage

```python
from apps.food.ai_service import ai_service

# Check if AI is available
if ai_service.is_available():
    # Analyze a menu
    menu_data = {
        'menu_name': 'Royal Feast',
        'description': 'Luxury dining experience',
        'meal_type': 'Dinner',
        'items': ['Chicken Tikka', 'Biryani', 'Naan', 'Raita']
    }
    
    analysis = ai_service.analyze_menu_categories(menu_data)
    print(analysis)
    
    # Filter menus by query
    filtered = ai_service.filter_menus_by_query(
        "spicy vegetarian food",
        all_menus_list
    )
```

## 🎨 UI Features

### AI Search Card
- Prominent purple/blue gradient design
- Clear instructions with examples
- Real-time search status
- Active state indicator
- Easy clear/reset functionality

### Traditional Search Fallback
- Remains available for basic keyword searches
- Automatically disabled when AI search is active
- Seamless switch between search modes

## 🔧 Troubleshooting

### AI Not Working

1. **Check API Key**
   ```bash
   echo $GOOGLE_AI_API_KEY  # Linux/Mac
   echo %GOOGLE_AI_API_KEY%  # Windows
   ```

2. **Verify in Django Shell**
   ```python
   from apps.food.ai_service import ai_service
   print(ai_service.is_available())
   print(ai_service.model)
   ```

3. **Check Logs**
   ```bash
   # Backend logs will show:
   # "Gemini AI initialized successfully" - Success
   # "GOOGLE_AI_API_KEY not configured" - Missing key
   ```

### Fallback Behavior

If AI is unavailable, the system automatically falls back to:
- Basic keyword matching
- Simple categorization
- Traditional filtering

Users won't see error messages, but results will be marked as not AI-powered.

## 🚦 Rate Limits

Google Gemini API (Free Tier):
- 60 requests per minute
- 1,500 requests per day
- Upgrade for higher limits

## 🔐 Security Best Practices

1. Never commit API keys to version control
2. Use environment variables
3. Rotate keys regularly
4. Monitor API usage in Google Cloud Console
5. Set up billing alerts

## 📊 Performance Tips

1. **Caching** (Future Enhancement)
   - Cache AI analysis results for menus
   - Invalidate cache when menu is updated
   - Reduces API calls and costs

2. **Batch Processing**
   - Analyze menus in batches during off-peak hours
   - Store results in database
   - Serve cached results to users

3. **Optimization**
   - Use shorter descriptions for queries
   - Limit menu items to top 10 for analysis
   - Implement request debouncing on frontend

## 📈 Future Enhancements

1. **Personalization**
   - Learn from user's order history
   - Suggest based on previous preferences
   - Collaborative filtering

2. **Image Analysis**
   - Analyze food images
   - Extract visual characteristics
   - Suggest similar looking menus

3. **Multi-language Support**
   - Support queries in multiple languages
   - Translate menu descriptions
   - Cultural context awareness

4. **Voice Search**
   - Integrate voice input
   - Convert speech to text
   - Process voice queries

## 📞 Support

For issues or questions:
1. Check logs in backend console
2. Verify API key configuration
3. Test with simple queries first
4. Review Google AI API dashboard for quota/errors

## 🎓 Learning Resources

- [Google Gemini Documentation](https://ai.google.dev/docs)
- [API Reference](https://ai.google.dev/api/python/google/generativeai)
- [Best Practices](https://ai.google.dev/docs/safety_best_practices)
- [Prompt Engineering Guide](https://ai.google.dev/docs/prompt_best_practices)

---

**Made with ❤️ and 🤖 AI by ChefSync Team**

