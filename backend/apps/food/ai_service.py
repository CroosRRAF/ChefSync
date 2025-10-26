"""
AI-powered service for intelligent menu analysis and filtering using Google Gemini
"""

import google.generativeai as genai
from django.conf import settings
import json
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)


class BulkMenuAIService:
    """Service for AI-powered bulk menu analysis and filtering"""
    
    def __init__(self):
        """Initialize Gemini AI with API key"""
        api_key = settings.GOOGLE_AI_API_KEY
        if not api_key:
            logger.warning("GOOGLE_AI_API_KEY not configured. AI features will be disabled.")
            self.model = None
        else:
            try:
                genai.configure(api_key=api_key)
                self.model = genai.GenerativeModel('gemini-pro')
                logger.info("Gemini AI initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize Gemini AI: {e}")
                self.model = None
    
    def is_available(self) -> bool:
        """Check if AI service is available"""
        return self.model is not None
    
    def analyze_menu_categories(self, menu_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze a menu and extract intelligent categories and characteristics
        
        Args:
            menu_data: Dictionary containing menu information
        
        Returns:
            Dictionary with AI-generated categories and tags
        """
        if not self.is_available():
            return self._fallback_categorization(menu_data)
        
        try:
            prompt = f"""
            Analyze this bulk catering menu and provide detailed categorization:
            
            Menu Name: {menu_data.get('menu_name', 'Unknown')}
            Description: {menu_data.get('description', 'No description')}
            Meal Type: {menu_data.get('meal_type', 'Unknown')}
            Items: {', '.join(menu_data.get('items', []))}
            
            Please provide a JSON response with:
            1. cuisine_type: Primary cuisine (e.g., Indian, Chinese, Italian, Fusion, etc.)
            2. dietary_tags: List of dietary attributes (e.g., vegetarian, vegan, gluten-free, halal, etc.)
            3. spice_level: Spice intensity (mild, medium, spicy, very_spicy)
            4. occasion_suitability: Best suited occasions (e.g., corporate_event, wedding, birthday, casual_gathering)
            5. flavor_profile: Main flavors (e.g., savory, sweet, tangy, spicy, mild)
            6. health_score: Health rating from 1-10
            7. popular_items: Top 3 most appealing items
            8. search_keywords: List of searchable keywords for this menu
            
            Return ONLY valid JSON, no extra text.
            """
            
            response = self.model.generate_content(prompt)
            result = json.loads(response.text)
            
            return {
                'ai_generated': True,
                'cuisine_type': result.get('cuisine_type', 'General'),
                'dietary_tags': result.get('dietary_tags', []),
                'spice_level': result.get('spice_level', 'medium'),
                'occasion_suitability': result.get('occasion_suitability', []),
                'flavor_profile': result.get('flavor_profile', []),
                'health_score': result.get('health_score', 5),
                'popular_items': result.get('popular_items', []),
                'search_keywords': result.get('search_keywords', [])
            }
            
        except Exception as e:
            logger.error(f"AI menu analysis failed: {e}")
            return self._fallback_categorization(menu_data)
    
    def filter_menus_by_query(self, query: str, menus: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Use AI to understand natural language queries and filter menus accordingly
        
        Args:
            query: Natural language search query
            menus: List of menu dictionaries
        
        Returns:
            Filtered and ranked list of menus
        """
        if not self.is_available() or not query or not menus:
            return menus
        
        try:
            # Create a simplified menu list for AI
            menu_summaries = []
            for idx, menu in enumerate(menus):
                menu_summaries.append({
                    'index': idx,
                    'name': menu.get('menu_name', ''),
                    'description': menu.get('description', ''),
                    'meal_type': menu.get('meal_type', ''),
                    'items': menu.get('menu_items_summary', {}).get('mandatory_items', [])[:5]  # First 5 items
                })
            
            prompt = f"""
            User query: "{query}"
            
            Available menus:
            {json.dumps(menu_summaries, indent=2)}
            
            Analyze the user's intent and return a JSON array of menu indices that match the query, ranked by relevance.
            Consider:
            - Cuisine preferences (e.g., "Indian food", "Italian", "Asian")
            - Dietary requirements (e.g., "vegetarian", "vegan", "healthy", "low-carb")
            - Meal context (e.g., "breakfast", "dinner", "party food")
            - Flavor preferences (e.g., "spicy", "sweet", "mild")
            - Occasion (e.g., "corporate event", "wedding", "casual")
            
            Return ONLY a JSON array of indices sorted by relevance (most relevant first).
            Example: [2, 5, 1, 8]
            
            If no menus match well, return an empty array: []
            """
            
            response = self.model.generate_content(prompt)
            
            # Extract JSON array from response
            response_text = response.text.strip()
            # Remove markdown code blocks if present
            if '```json' in response_text:
                response_text = response_text.split('```json')[1].split('```')[0].strip()
            elif '```' in response_text:
                response_text = response_text.split('```')[1].split('```')[0].strip()
            
            relevant_indices = json.loads(response_text)
            
            # Return menus in AI-determined order
            filtered_menus = []
            for idx in relevant_indices:
                if 0 <= idx < len(menus):
                    filtered_menus.append(menus[idx])
            
            # Add remaining menus if any
            remaining = [m for i, m in enumerate(menus) if i not in relevant_indices]
            
            return filtered_menus + remaining
            
        except Exception as e:
            logger.error(f"AI query filtering failed: {e}")
            # Fallback to basic keyword search
            return self._fallback_search(query, menus)
    
    def get_smart_recommendations(self, user_preferences: Dict[str, Any], menus: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Get AI-powered menu recommendations based on user preferences
        
        Args:
            user_preferences: User's dietary preferences, past orders, etc.
            menus: Available menus
        
        Returns:
            Recommended menus with reasoning
        """
        if not self.is_available():
            return menus[:5]  # Return first 5 as fallback
        
        try:
            prompt = f"""
            User preferences: {json.dumps(user_preferences)}
            
            Available menus: {json.dumps([{
                'index': i,
                'name': m.get('menu_name'),
                'meal_type': m.get('meal_type'),
                'description': m.get('description', '')[:100]
            } for i, m in enumerate(menus)], indent=2)}
            
            Based on the user's preferences, recommend the top 5 menus.
            Return a JSON array of objects with:
            - index: menu index
            - reason: Brief reason for recommendation (1 sentence)
            
            Example: [{"index": 3, "reason": "Perfect vegetarian options for your dietary preference"}]
            """
            
            response = self.model.generate_content(prompt)
            recommendations = json.loads(response.text)
            
            result = []
            for rec in recommendations:
                idx = rec.get('index')
                if 0 <= idx < len(menus):
                    menu = menus[idx].copy()
                    menu['ai_recommendation_reason'] = rec.get('reason', '')
                    result.append(menu)
            
            return result
            
        except Exception as e:
            logger.error(f"AI recommendations failed: {e}")
            return menus[:5]
    
    def _fallback_categorization(self, menu_data: Dict[str, Any]) -> Dict[str, Any]:
        """Fallback categorization when AI is not available"""
        meal_type = menu_data.get('meal_type', '').lower()
        items = [item.lower() for item in menu_data.get('items', [])]
        
        # Basic keyword detection
        is_vegetarian = any(keyword in ' '.join(items) for keyword in ['veg', 'vegetarian', 'paneer', 'tofu'])
        is_spicy = any(keyword in ' '.join(items) for keyword in ['spicy', 'hot', 'chili', 'curry'])
        
        return {
            'ai_generated': False,
            'cuisine_type': 'General',
            'dietary_tags': ['vegetarian'] if is_vegetarian else [],
            'spice_level': 'spicy' if is_spicy else 'medium',
            'occasion_suitability': ['general'],
            'flavor_profile': [],
            'health_score': 5,
            'popular_items': items[:3] if items else [],
            'search_keywords': items[:10]
        }
    
    def _fallback_search(self, query: str, menus: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Fallback keyword-based search when AI is not available"""
        query_lower = query.lower()
        
        # Score each menu based on keyword matches
        scored_menus = []
        for menu in menus:
            score = 0
            searchable_text = ' '.join([
                menu.get('menu_name', ''),
                menu.get('description', ''),
                menu.get('meal_type', ''),
                ' '.join(menu.get('menu_items_summary', {}).get('mandatory_items', []))
            ]).lower()
            
            # Simple scoring based on keyword presence
            for word in query_lower.split():
                if word in searchable_text:
                    score += searchable_text.count(word)
            
            scored_menus.append((score, menu))
        
        # Sort by score (highest first)
        scored_menus.sort(key=lambda x: x[0], reverse=True)
        
        # Return menus with score > 0, then remaining menus
        return [menu for score, menu in scored_menus if score > 0] + \
               [menu for score, menu in scored_menus if score == 0]


# Singleton instance
ai_service = BulkMenuAIService()

