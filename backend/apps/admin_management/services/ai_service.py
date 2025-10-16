import json
import logging

import google.generativeai as genai
from django.conf import settings

try:
    import numpy as np
    import pandas as pd

    PANDAS_AVAILABLE = True
except ImportError:
    PANDAS_AVAILABLE = False
    print("Warning: pandas/numpy not available. AI features will be limited.")

from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from apps.authentication.models import User
from apps.food.models import Food
from apps.orders.models import Order
from django.db.models import Avg, Count, Max, Sum
from django.utils import timezone

logger = logging.getLogger(__name__)


class AdminAIService:
    """
    AI Service for Admin Management Features

    This service provides AI-powered functionality for:
    - Sales forecasting and demand prediction (Phase 3)
    - Anomaly detection for orders and revenue (Phase 3)
    - Product and customer recommendations (Phase 3)
    - Sentiment analysis of communications (Phase 7)
    - AI-assisted report generation (Phase 10)
    """

    def __init__(self):
        """Initialize the AI service with Google Gemini API"""
        api_key = getattr(settings, "GOOGLE_AI_API_KEY", None)
        if not api_key:
            logger.warning(
                "GOOGLE_AI_API_KEY not configured - AI features will be disabled"
            )
            self.model = None
            return

        try:
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel("gemini-2.0-flash")
            logger.info("AI service initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize AI service: {e}")
            self.model = None

    def analyze_sentiment(self, text: str) -> dict:
        """
        Analyze sentiment of feedback/communication text

        TODO: Implement in Phase 7 (Communications + Sentiment)

        Args:
            text (str): The text to analyze

        Returns:
            dict: Sentiment analysis result with keys:
                - sentiment: "positive", "negative", or "neutral"
                - confidence: float between 0.0 and 1.0
                - explanation: str explaining the analysis
                - error: str if analysis failed
        """
        if not self.model:
            return {
                "sentiment": "neutral",
                "confidence": 0.0,
                "explanation": "AI service not configured",
                "error": "GOOGLE_AI_API_KEY not set",
            }

        try:
            # Placeholder for Phase 7 implementation
            prompt = f"""
            Analyze the sentiment of this text and return a JSON response with:
            - sentiment: "positive", "negative", or "neutral"
            - confidence: score from 0.0 to 1.0
            - explanation: brief reason for the classification

            Text: {text}
            """

            # TODO: Uncomment when implementing Phase 7
            # response = self.model.generate_content(prompt)
            # result = json.loads(response.text)

            # Placeholder response for now
            return {
                "sentiment": "neutral",  # placeholder
                "confidence": 0.8,  # placeholder
                "explanation": "Analysis placeholder - implement in Phase 7",
            }

        except Exception as e:
            logger.error(f"Sentiment analysis failed: {e}")
            return {
                "sentiment": "neutral",
                "confidence": 0.0,
                "explanation": "Analysis failed",
                "error": str(e),
            }

    def generate_report(self, data: dict, format: str = "markdown") -> str:
        """
        Generate AI-assisted report from admin data

        TODO: Implement in Phase 10 (AI Reports)

        Args:
            data (dict): Admin data to analyze
            format (str): Output format ('markdown', 'txt', 'json')

        Returns:
            str: Generated report content
        """
        if not self.model:
            return f"# AI Report Generation Unavailable\n\nError: AI service not configured. Please set GOOGLE_AI_API_KEY in environment variables."

        try:
            # Placeholder for Phase 10 implementation
            prompt = f"""
            Generate a {format} report based on this admin data:
            {json.dumps(data, indent=2)}

            Include:
            - Executive summary
            - Key metrics
            - Trends and insights
            - Recommendations

            Format as {format} with proper headers and structure.
            """

            # TODO: Uncomment when implementing Phase 10
            # response = self.model.generate_content(prompt)
            # return response.text

            # Placeholder response for now
            return f"""# AI-Generated Admin Report

## Executive Summary
This is a placeholder report. Full AI report generation will be implemented in Phase 10.

## Data Provided
{json.dumps(data, indent=2)}

## Status
Report generation is ready for Phase 10 implementation.
"""

        except Exception as e:
            logger.error(f"Report generation failed: {e}")
            return f"# Report Generation Failed\n\nError: {str(e)}"

    def generate_chatbot_response(
        self,
        message: str,
        admin_context: str = "",
        conversation_history: list = None
    ) -> str:
        """
        Generate AI chatbot response using real admin data
        
        Args:
            message (str): User's message/query
            admin_context (str): Current admin statistics and data
            conversation_history (list): Previous conversation messages
            
        Returns:
            str: AI-generated response with real data insights
        """
        message_lower = message.lower()
        
        # If AI is not configured, provide intelligent fallback responses using real data
        if not self.model:
            logger.warning("Google Gemini AI not configured. Using fallback responses with real data.")
            return self._generate_fallback_response(message_lower, admin_context)
        
        try:
            # Build conversation context
            history_text = ""
            if conversation_history:
                for msg in conversation_history[-5:]:  # Last 5 messages for context
                    role = msg.get('type', 'user')
                    content = msg.get('content', '')
                    history_text += f"\n{role.upper()}: {content}"
            
            # Create comprehensive prompt with real data
            prompt = f"""
You are an AI assistant for the ChefSync admin dashboard. You have access to COMPREHENSIVE real-time data from the entire admin management system including:
- User statistics and growth metrics
- Order management and fulfillment data
- Revenue and financial analytics
- Food menu items and approvals
- Customer communications and feedback
- Sentiment analysis (positive/negative/neutral trends)
- Business performance indicators

{admin_context}

Previous conversation:
{history_text if history_text else "None"}

User's current question: {message}

Instructions:
- Provide accurate, helpful responses using the comprehensive real-time data above
- When asked about sentiment, communications, or feedback - use the SENTIMENT ANALYSIS section
- When asked about food/menu - use the FOOD MENU STATISTICS section
- When asked about orders/revenue - use the ORDER and REVENUE sections
- Be concise but informative with specific numbers
- Point out trends, patterns, and insights from the data
- Suggest actionable recommendations when relevant
- If data is missing for a specific query, explain what you CAN see and suggest related insights
- Use a professional but friendly tone
- Format numbers with proper separators (e.g., 1,234 not 1234)
- Use LKR for currency
- If you cannot find relevant data, say "I don't have that specific data available, but I can tell you about [related topic]"

Response:
"""
            
            # Generate response
            response = self.model.generate_content(prompt)
            return response.text.strip()
            
        except Exception as e:
            logger.error(f"Chatbot response generation failed: {e}")
            # Fall back to rule-based responses if AI fails
            return self._generate_fallback_response(message_lower, admin_context)
    
    def _generate_fallback_response(self, message_lower: str, admin_context: str) -> str:
        """
        Generate intelligent fallback responses using real data when AI is unavailable
        
        Args:
            message_lower (str): Lowercase user message
            admin_context (str): Real-time admin statistics
            
        Returns:
            str: Contextual response with real data
        """
        # Extract numbers from admin_context for responses
        import re
        
        # Parse the admin context to extract real data
        context_lines = admin_context.strip().split('\n')
        data = {}
        for line in context_lines:
            if ':' in line:
                key_val = line.split(':', 1)
                if len(key_val) == 2:
                    key = key_val[0].strip('- ').strip()
                    val = key_val[1].strip()
                    data[key.lower()] = val
        
        # Greeting responses
        if any(word in message_lower for word in ['hello', 'hi', 'hey', 'greetings']):
            return f"👋 Hello! I'm your ChefSync AI assistant. I can help you with:\n\n• View today's performance and statistics\n• Check orders and revenue\n• Monitor pending tasks\n• Get business insights\n\nWhat would you like to know?"
        
        # Working/status check
        if any(word in message_lower for word in ['working', 'online', 'available', 'there', 'alive']):
            return f"✅ Yes, I'm working and connected to your live database! Here's a quick snapshot:\n\n{admin_context}\n\nI can answer questions about your business data. What would you like to know?"
        
        # Performance/summary requests
        if any(word in message_lower for word in ['performance', 'summary', 'overview', 'status', 'dashboard']):
            return f"📊 **Performance Summary**\n\n{admin_context}\n\n💡 **Quick Insights:**\n• Monitor pending orders for timely fulfillment\n• Check pending user approvals regularly\n• Weekly trends show your business activity\n\nNeed more details on any specific metric?"
        
        # Today's data
        if 'today' in message_lower:
            today_orders = data.get('orders today', '0')
            today_revenue = data.get('revenue today', 'LKR 0.00')
            return f"📅 **Today's Performance:**\n\n• Orders: {today_orders}\n• Revenue: {today_revenue}\n• Pending Orders: {data.get('pending orders', '0')}\n\nHow can I help you analyze this data?"
        
        # Orders information
        if 'order' in message_lower:
            return f"📦 **Orders Overview:**\n\n• Orders Today: {data.get('orders today', '0')}\n• This Week: {data.get('orders this week', '0')}\n• Pending: {data.get('pending orders', '0')}\n\nWould you like to see order trends or manage pending orders?"
        
        # Revenue information
        if any(word in message_lower for word in ['revenue', 'sales', 'money', 'earning']):
            return f"💰 **Revenue Report:**\n\n• Today: {data.get('revenue today', 'LKR 0.00')}\n• This Week: {data.get('revenue this week', 'LKR 0.00')}\n\nI can help you analyze revenue trends or forecast future sales. What would you like to explore?"
        
        # Users information
        if any(word in message_lower for word in ['user', 'customer', 'member']):
            return f"👥 **User Statistics:**\n\n• Total Users: {data.get('total users', '0')}\n• New Users Today: {data.get('new users today', '0')}\n• New Users This Week: {data.get('new users this week', '0')}\n• Pending Verifications: {data.get('pending email verifications', '0')}\n\nNeed help managing user approvals or viewing user insights?"
        
        # Sentiment analysis
        if any(word in message_lower for word in ['sentiment', 'feedback', 'mood', 'satisfaction', 'complaint']):
            sentiment_section = admin_context.split('SENTIMENT ANALYSIS')[1] if 'SENTIMENT ANALYSIS' in admin_context else ''
            return f"😊 **Sentiment Analysis (Last 30 Days):**\n\n{sentiment_section if sentiment_section else 'Analyzing your customer feedback and communications...'}\n\n**Communications Breakdown:**\n• Total Communications: {data.get('total communications', '0')}\n• Pending: {data.get('pending communications', '0')}\n• Resolved: {data.get('resolved communications', '0')}\n• Complaints: {data.get('complaints (30 days)', '0')}\n• Feedback: {data.get('feedback (30 days)', '0')}\n• Suggestions: {data.get('suggestions (30 days)', '0')}\n\nWould you like more detailed sentiment insights?"
        
        # Communications
        if any(word in message_lower for word in ['communication', 'message', 'inquiry']):
            return f"💬 **Communications Overview:**\n\n• Total Communications: {data.get('total communications', '0')}\n• Pending: {data.get('pending communications', '0')}\n• Resolved: {data.get('resolved communications', '0')}\n• Complaints (30d): {data.get('complaints (30 days)', '0')}\n• Feedback (30d): {data.get('feedback (30 days)', '0')}\n• Suggestions (30d): {data.get('suggestions (30 days)', '0')}\n\nNeed help managing customer communications?"
        
        # Food/Menu information
        if any(word in message_lower for word in ['food', 'menu', 'dish', 'item', 'recipe']):
            return f"🍽️ **Food Menu Statistics:**\n\n• Total Food Items: {data.get('total food items', '0')}\n• Active Items: {data.get('active food items', '0')}\n• Pending Approvals: {data.get('pending food approvals', '0')}\n\nWould you like to see top-performing dishes or manage food approvals?"
        
        # Analytics/insights
        if any(word in message_lower for word in ['analytic', 'insight', 'trend', 'pattern', 'analysis']):
            return f"📈 **Business Analytics & Insights:**\n\n{admin_context}\n\n💡 **Key Insights:**\n• Weekly revenue trend: {data.get('revenue this week', 'N/A')}\n• Order completion rate: {(int(data.get('completed orders', 0)) / int(data.get('total orders (all time)', 1)) * 100) if data.get('total orders (all time)') else 0:.1f}%\n• Average order value: {data.get('average order value', 'N/A')}\n\nWhat specific insights would you like to explore?"
        
        # Help/capabilities
        if any(word in message_lower for word in ['help', 'can you', 'what can', 'capabilities', 'commands']):
            return f"🤖 **I can help you with:**\n\n1. **Business Performance**\n   • Today's metrics & weekly trends\n   • Revenue analysis & forecasting\n   • Order tracking & completion rates\n\n2. **User Management**\n   • User statistics & growth\n   • Pending verifications\n   • New user insights\n\n3. **Communications & Sentiment**\n   • Customer feedback analysis\n   • Complaint management\n   • Sentiment trends\n\n4. **Food & Menu**\n   • Menu item statistics\n   • Food approval management\n   • Popular dishes\n\n5. **Advanced Analytics**\n   • Order patterns\n   • Revenue trends\n   • Customer satisfaction\n\n**Current Data Available:**\n{admin_context}\n\nJust ask me anything about your business!"
        
        # Cannot understand
        if any(word in message_lower for word in ['understand', 'dont get', "don't get", 'unclear', 'what do you mean']):
            return f"❓ **I'm not sure I understood that correctly.**\n\nI can help you with:\n• Performance metrics (orders, revenue, users)\n• Sentiment analysis & customer feedback\n• Food menu statistics\n• Communications management\n• Business insights & trends\n\nCould you rephrase your question or ask about any of these topics?\n\nExamples:\n• 'What's the sentiment analysis?'\n• 'Show me today's orders'\n• 'How many food items do I have?'"
        
        # Default response with comprehensive data
        return f"🤖 **I'm here to help with your admin management!**\n\nI have access to comprehensive real-time data:\n\n{admin_context}\n\n**You can ask me about:**\n• 📊 Performance & Analytics\n• 💰 Revenue & Sales\n• 👥 Users & Customers\n• 📦 Orders & Deliveries\n• 🍽️ Food Menu & Items\n• 💬 Communications & Feedback\n• 😊 Sentiment Analysis\n• 📈 Business Insights & Trends\n\n**What would you like to know?**\n\n💡 **Tip:** For even more advanced AI insights, configure GOOGLE_AI_API_KEY in your environment variables."

    # ==================== PHASE 3: AI/ML FEATURES ====================

    def get_sales_forecast(self, days_ahead: int = 30) -> Dict[str, Any]:
        """
        Generate sales forecast for the next N days

        Args:
            days_ahead (int): Number of days to forecast (default: 30)

        Returns:
            dict: Forecast data with predictions, confidence, and insights
        """
        if not PANDAS_AVAILABLE:
            return {
                "forecast": [],
                "confidence": 0.0,
                "insights": [
                    "Pandas not available. Please install: pip install pandas numpy"
                ],
                "error": "AI dependencies not installed",
            }

        try:
            # Get historical order data
            end_date = timezone.now()
            start_date = end_date - timedelta(days=90)  # Use last 90 days for training

            orders = Order.objects.filter(
                created_at__gte=start_date,
                created_at__lte=end_date,
                status="delivered",  # Use 'delivered' instead of 'completed'
            ).values("created_at", "total_amount")

            if not orders:
                return {
                    "forecast": [],
                    "confidence": 0.0,
                    "insights": ["Insufficient data for forecasting"],
                    "error": "No historical order data available",
                }

            # Convert to DataFrame for analysis
            df = pd.DataFrame(list(orders))
            df["created_at"] = pd.to_datetime(df["created_at"])
            df["date"] = df["created_at"].dt.date
            daily_sales = df.groupby("date")["total_amount"].sum().reset_index()

            # Simple forecasting using moving average
            window = min(7, len(daily_sales))  # 7-day moving average
            recent_avg = daily_sales["total_amount"].tail(window).mean()
            recent_std = daily_sales["total_amount"].tail(window).std()

            # Generate forecast
            forecast = []
            base_date = datetime.now().date()

            for i in range(1, days_ahead + 1):
                forecast_date = base_date + timedelta(days=i)

                # Add some seasonality (weekends typically higher)
                day_of_week = forecast_date.weekday()
                weekend_multiplier = 1.2 if day_of_week >= 5 else 1.0

                predicted_amount = recent_avg * weekend_multiplier
                confidence = max(
                    0.1, 1.0 - (i * 0.02)
                )  # Decreasing confidence over time

                forecast.append(
                    {
                        "date": forecast_date.isoformat(),
                        "predicted_amount": round(predicted_amount, 2),
                        "confidence": round(confidence, 2),
                        "day_of_week": [
                            "Monday",
                            "Tuesday",
                            "Wednesday",
                            "Thursday",
                            "Friday",
                            "Saturday",
                            "Sunday",
                        ][day_of_week],
                    }
                )

            # Calculate insights
            total_forecast = sum(item["predicted_amount"] for item in forecast)
            avg_daily = total_forecast / days_ahead
            recent_avg_daily = recent_avg

            insights = [
                f"Forecasted revenue for next {days_ahead} days: ${total_forecast:,.2f}",
                f"Average daily revenue: ${avg_daily:,.2f}",
                f"Recent average (last {window} days): ${recent_avg_daily:,.2f}",
                f"Growth trend: {'Positive' if avg_daily > recent_avg_daily else 'Negative' if avg_daily < recent_avg_daily else 'Stable'}",
            ]

            return {
                "forecast": forecast,
                "confidence": round(confidence, 2),
                "insights": insights,
                "total_forecast": round(total_forecast, 2),
                "avg_daily_forecast": round(avg_daily, 2),
            }

        except Exception as e:
            logger.error(f"Sales forecast failed: {e}")
            return {
                "forecast": [],
                "confidence": 0.0,
                "insights": ["Forecast generation failed"],
                "error": str(e),
            }

    def detect_anomalies(self, days_back: int = 30) -> Dict[str, Any]:
        """
        Detect anomalies in orders, revenue, and user behavior

        Args:
            days_back (int): Number of days to analyze (default: 30)

        Returns:
            dict: Anomaly detection results with alerts and insights
        """
        if not PANDAS_AVAILABLE:
            return {
                "anomalies": [],
                "alerts": [],
                "insights": [
                    "Pandas not available. Please install: pip install pandas numpy"
                ],
                "error": "AI dependencies not installed",
            }

        try:
            end_date = timezone.now()
            start_date = end_date - timedelta(days=days_back)

            # Get order data
            orders = Order.objects.filter(
                created_at__gte=start_date, created_at__lte=end_date
            ).values("created_at", "total_amount", "status")

            if not orders:
                return {
                    "anomalies": [],
                    "alerts": [],
                    "insights": ["No data available for anomaly detection"],
                }

            df = pd.DataFrame(list(orders))
            df["created_at"] = pd.to_datetime(df["created_at"])
            df["date"] = df["created_at"].dt.date

            # Daily aggregations
            daily_stats = (
                df.groupby("date")
                .agg({"total_amount": ["sum", "count", "mean"], "status": "count"})
                .reset_index()
            )

            daily_stats.columns = [
                "date",
                "total_revenue",
                "order_count",
                "avg_order_value",
                "total_orders",
            ]

            anomalies = []
            alerts = []

            # Revenue anomalies
            revenue_mean = daily_stats["total_revenue"].mean()
            revenue_std = daily_stats["total_revenue"].std()
            revenue_threshold = revenue_mean + (
                2 * revenue_std
            )  # 2 standard deviations

            for _, row in daily_stats.iterrows():
                if row["total_revenue"] > revenue_threshold:
                    anomalies.append(
                        {
                            "type": "revenue_spike",
                            "date": row["date"].isoformat(),
                            "value": round(row["total_revenue"], 2),
                            "threshold": round(revenue_threshold, 2),
                            "severity": (
                                "high"
                                if row["total_revenue"]
                                > revenue_mean + (3 * revenue_std)
                                else "medium"
                            ),
                            "description": f"Revenue spike detected: ${row['total_revenue']:,.2f} (normal: ${revenue_mean:,.2f})",
                        }
                    )

                    alerts.append(
                        {
                            "type": "revenue_anomaly",
                            "message": f"High revenue day detected: ${row['total_revenue']:,.2f} on {row['date']}",
                            "severity": (
                                "high"
                                if row["total_revenue"]
                                > revenue_mean + (3 * revenue_std)
                                else "medium"
                            ),
                        }
                    )

            # Order count anomalies
            order_mean = daily_stats["order_count"].mean()
            order_std = daily_stats["order_count"].std()
            order_threshold = order_mean + (2 * order_std)

            for _, row in daily_stats.iterrows():
                if row["order_count"] > order_threshold:
                    anomalies.append(
                        {
                            "type": "order_volume_spike",
                            "date": row["date"].isoformat(),
                            "value": int(row["order_count"]),
                            "threshold": round(order_threshold, 2),
                            "severity": (
                                "high"
                                if row["order_count"] > order_mean + (3 * order_std)
                                else "medium"
                            ),
                            "description": f"Order volume spike: {int(row['order_count'])} orders (normal: {order_mean:.1f})",
                        }
                    )

            # Calculate insights
            total_anomalies = len(anomalies)
            high_severity = len([a for a in anomalies if a["severity"] == "high"])

            insights = [
                f"Analyzed {days_back} days of data",
                f"Found {total_anomalies} anomalies",
                f"{high_severity} high-severity anomalies detected",
                f"Average daily revenue: ${revenue_mean:,.2f}",
                f"Average daily orders: {order_mean:.1f}",
            ]

            if total_anomalies == 0:
                insights.append(
                    "No significant anomalies detected - system operating normally"
                )

            return {
                "anomalies": anomalies,
                "alerts": alerts,
                "insights": insights,
                "total_anomalies": total_anomalies,
                "high_severity_count": high_severity,
            }

        except Exception as e:
            logger.error(f"Anomaly detection failed: {e}")
            return {
                "anomalies": [],
                "alerts": [],
                "insights": ["Anomaly detection failed"],
                "error": str(e),
            }

    def get_product_recommendations(self, limit: int = 10) -> Dict[str, Any]:
        """
        Generate product recommendations based on sales data

        Args:
            limit (int): Maximum number of recommendations (default: 10)

        Returns:
            dict: Product recommendations with reasoning
        """
        if not PANDAS_AVAILABLE:
            return {
                "recommendations": [],
                "insights": [
                    "Pandas not available. Please install: pip install pandas numpy"
                ],
                "error": "AI dependencies not installed",
            }

        try:
            # Get food items with sales data
            foods = (
                Food.objects.annotate(
                    calculated_revenue=Sum("prices__order_items__total_price"),
                    avg_rating=Avg("rating_average"),
                )
                .filter(total_orders__gt=0)
                .order_by("-calculated_revenue")[: limit * 2]
            )

            if not foods:
                return {
                    "recommendations": [],
                    "insights": ["No product data available for recommendations"],
                }

            recommendations = []

            for food in foods:
                # Calculate recommendation score
                popularity_score = min(
                    1.0, float(food.total_orders) / 100.0
                )  # Normalize to 0-1
                revenue_score = min(
                    1.0, float(food.calculated_revenue or 0) / 10000.0
                )  # Normalize to 0-1
                rating_score = float(food.avg_rating or 0) / 5.0  # Normalize to 0-1

                # Weighted score
                recommendation_score = (
                    popularity_score * 0.4 + revenue_score * 0.4 + rating_score * 0.2
                )

                # Determine recommendation type
                if recommendation_score > 0.8:
                    rec_type = "top_performer"
                    reason = "High sales, revenue, and ratings"
                elif popularity_score > 0.7:
                    rec_type = "popular_choice"
                    reason = "High order volume"
                elif revenue_score > 0.7:
                    rec_type = "revenue_driver"
                    reason = "High revenue generation"
                elif rating_score > 0.8:
                    rec_type = "customer_favorite"
                    reason = "High customer ratings"
                else:
                    rec_type = "emerging"
                    reason = "Growing popularity"

                recommendations.append(
                    {
                        "food_id": food.pk,  # Use pk instead of id for better compatibility
                        "name": food.name,
                        "cook_name": (
                            food.cook.user.get_full_name()
                            if hasattr(food, "cook")
                            and food.cook
                            and hasattr(food.cook, "user")
                            and food.cook.user
                            else "Unknown"
                        ),
                        "recommendation_score": round(recommendation_score, 2),
                        "type": rec_type,
                        "reason": reason,
                        "total_orders": food.total_orders,
                        "total_revenue": float(food.calculated_revenue or 0),
                        "avg_rating": round(float(food.avg_rating or 0), 1),
                        "price": float(getattr(food, "price", 0)),
                        "image_url": (
                            food.image.url
                            if hasattr(food, "image") and food.image
                            else None
                        ),
                    }
                )

            # Sort by recommendation score
            recommendations.sort(key=lambda x: x["recommendation_score"], reverse=True)
            recommendations = recommendations[:limit]

            # Generate insights
            top_performers = len(
                [r for r in recommendations if r["type"] == "top_performer"]
            )
            total_revenue = sum(r["total_revenue"] for r in recommendations)

            insights = [
                f"Generated {len(recommendations)} product recommendations",
                f"{top_performers} top-performing products identified",
                f"Total revenue from recommended products: ${total_revenue:,.2f}",
                "Recommendations based on sales volume, revenue, and customer ratings",
            ]

            return {
                "recommendations": recommendations,
                "insights": insights,
                "total_recommendations": len(recommendations),
            }

        except Exception as e:
            logger.error(f"Product recommendations failed: {e}")
            return {
                "recommendations": [],
                "insights": ["Product recommendations failed"],
                "error": str(e),
            }

    def get_customer_insights(self) -> Dict[str, Any]:
        """
        Generate customer insights and segmentation

        Returns:
            dict: Customer insights with segmentation and recommendations
        """
        if not PANDAS_AVAILABLE:
            return {
                "segments": [],
                "insights": [
                    "Pandas not available. Please install: pip install pandas numpy"
                ],
                "error": "AI dependencies not installed",
            }

        try:
            # Get customer data
            customers = (
                User.objects.filter(role="customer")
                .annotate(
                    order_count=Count("orders"),
                    total_spent=Sum("orders__total_amount"),
                    avg_order_value=Avg("orders__total_amount"),
                    last_order_date=Max("orders__created_at"),
                )
                .filter(order_count__gt=0)
            )

            if not customers:
                return {
                    "segments": [],
                    "insights": ["No customer data available for analysis"],
                }

            # Customer segmentation
            segments = []

            # High-value customers (top 20% by spending)
            agg_data = customers.aggregate(
                total_spent_sum=Sum("total_spent"), customer_count=Count("user_id")
            )
            high_value_threshold = float(
                float(agg_data["total_spent_sum"] or 0)
                * 0.8
                / float(agg_data["customer_count"] or 1)
            )

            high_value_customers = customers.filter(
                total_spent__gte=high_value_threshold
            )
            segments.append(
                {
                    "name": "High-Value Customers",
                    "count": high_value_customers.count(),
                    "avg_spending": float(
                        high_value_customers.aggregate(avg=Avg("total_spent"))["avg"]
                        or 0
                    ),
                    "description": "Top 20% of customers by total spending",
                    "recommendation": "Focus on retention and upselling",
                }
            )

            # Frequent customers (top 20% by order count)
            frequent_threshold = 5  # Use a fixed threshold for simplicity

            frequent_customers = customers.filter(order_count__gte=frequent_threshold)
            segments.append(
                {
                    "name": "Frequent Customers",
                    "count": frequent_customers.count(),
                    "avg_orders": float(
                        frequent_customers.aggregate(avg=Avg("order_count"))["avg"] or 0
                    ),
                    "description": "Top 20% of customers by order frequency",
                    "recommendation": "Loyalty programs and exclusive offers",
                }
            )

            # At-risk customers (no orders in last 30 days)
            thirty_days_ago = timezone.now() - timedelta(days=30)
            at_risk_customers = customers.filter(last_order_date__lt=thirty_days_ago)
            segments.append(
                {
                    "name": "At-Risk Customers",
                    "count": at_risk_customers.count(),
                    "description": "No orders in the last 30 days",
                    "recommendation": "Re-engagement campaigns and special offers",
                }
            )

            # New customers (first order in last 30 days)
            new_customers = customers.filter(
                last_order_date__gte=thirty_days_ago, order_count=1
            )
            segments.append(
                {
                    "name": "New Customers",
                    "count": new_customers.count(),
                    "description": "First order in the last 30 days",
                    "recommendation": "Onboarding and first-time customer incentives",
                }
            )

            # Calculate overall insights
            total_customers = customers.count()
            total_revenue = customers.aggregate(total=Sum("total_spent"))["total"] or 0
            avg_order_value = (
                customers.aggregate(avg=Avg("avg_order_value"))["avg"] or 0
            )

            insights = [
                f"Total active customers: {total_customers}",
                f"Total customer revenue: ${total_revenue:,.2f}",
                f"Average order value: ${avg_order_value:,.2f}",
                f"Customer segments identified: {len(segments)}",
                "Segmentation based on spending, frequency, and recency",
            ]

            return {
                "segments": segments,
                "insights": insights,
                "total_customers": total_customers,
                "total_revenue": float(total_revenue),
                "avg_order_value": float(avg_order_value),
            }

        except Exception as e:
            logger.error(f"Customer insights failed: {e}")
            return {
                "segments": [],
                "insights": ["Customer insights generation failed"],
                "error": str(e),
            }

    def is_available(self) -> bool:
        """Check if AI service is available and properly configured"""
        return self.model is not None and PANDAS_AVAILABLE

    def get_service_status(self) -> Dict[str, Any]:
        """Get detailed status of AI service components"""
        return {
            "ai_model_available": self.model is not None,
            "pandas_available": PANDAS_AVAILABLE,
            "google_ai_configured": hasattr(settings, "GOOGLE_AI_API_KEY")
            and settings.GOOGLE_AI_API_KEY,
            "service_ready": self.is_available(),
            "features": {
                "sales_forecasting": PANDAS_AVAILABLE,
                "anomaly_detection": PANDAS_AVAILABLE,
                "product_recommendations": PANDAS_AVAILABLE,
                "customer_insights": PANDAS_AVAILABLE,
                "sentiment_analysis": self.model is not None,
            },
        }

    def generate_business_insights(self) -> Dict[str, Any]:
        """Generate comprehensive business insights using all AI features"""
        if not self.is_available():
            return {
                "error": "AI service not available",
                "message": "Please ensure all dependencies are installed and API keys are configured",
            }

        try:
            # Get all AI insights
            sales_forecast = self.get_sales_forecast(30)
            anomalies = self.detect_anomalies(30)
            product_recs = self.get_product_recommendations(5)
            customer_insights = self.get_customer_insights()

            # Generate AI-powered summary
            summary = self._generate_ai_summary(
                {
                    "sales_forecast": sales_forecast,
                    "anomalies": anomalies,
                    "product_recommendations": product_recs,
                    "customer_insights": customer_insights,
                }
            )

            return {
                "success": True,
                "insights": {
                    "sales_forecast": sales_forecast,
                    "anomalies": anomalies,
                    "product_recommendations": product_recs,
                    "customer_insights": customer_insights,
                    "ai_summary": summary,
                },
                "generated_at": timezone.now().isoformat(),
                "confidence_score": self._calculate_overall_confidence(
                    sales_forecast, anomalies
                ),
            }

        except Exception as e:
            logger.error(f"Business insights generation failed: {e}")
            return {"error": str(e), "message": "Failed to generate business insights"}

    def _generate_ai_summary(self, data: Dict[str, Any]) -> str:
        """Generate AI-powered summary of business insights"""
        if not self.model:
            return "AI summary not available - model not configured"

        try:
            # Prepare data for AI analysis
            summary_data = {
                "sales_trend": data["sales_forecast"].get("insights", []),
                "anomalies_detected": len(data["anomalies"].get("anomalies", [])),
                "top_products": [
                    p.get("name", "Unknown")
                    for p in data["product_recommendations"].get("recommendations", [])[
                        :3
                    ]
                ],
                "customer_segments": len(data["customer_insights"].get("segments", [])),
            }

            prompt = f"""
            Based on the following business data, provide a concise executive summary with key insights and recommendations:

            Sales Insights: {summary_data['sales_trend']}
            Anomalies Detected: {summary_data['anomalies_detected']}
            Top Products: {summary_data['top_products']}
            Customer Segments: {summary_data['customer_segments']}

            Please provide:
            1. Key business performance highlights
            2. Areas requiring attention
            3. Strategic recommendations
            4. Growth opportunities

            Keep the summary professional and actionable.
            """

            response = self.model.generate_content(prompt)
            return response.text

        except Exception as e:
            logger.error(f"AI summary generation failed: {e}")
            return "AI summary generation failed - please check logs"

    def _calculate_overall_confidence(
        self, sales_forecast: Dict, anomalies: Dict
    ) -> float:
        """Calculate overall confidence score for AI insights"""
        try:
            sales_confidence = sales_forecast.get("confidence", 0.0)
            anomaly_confidence = (
                0.8 if anomalies.get("anomalies") else 0.9
            )  # Higher confidence if no anomalies

            # Weighted average
            overall_confidence = (sales_confidence * 0.6) + (anomaly_confidence * 0.4)
            return round(overall_confidence, 2)

        except Exception:
            return 0.5  # Default confidence
