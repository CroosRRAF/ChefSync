import google.generativeai as genai
from django.conf import settings
import logging
import json
try:
    import pandas as pd
    import numpy as np
    PANDAS_AVAILABLE = True
except ImportError:
    PANDAS_AVAILABLE = False
    print("Warning: pandas/numpy not available. AI features will be limited.")

from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from django.db.models import Sum, Count, Avg, Max
from apps.orders.models import Order
from apps.food.models import Food
from apps.authentication.models import User

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
        api_key = getattr(settings, 'GOOGLE_AI_API_KEY', None)
        if not api_key:
            logger.warning("GOOGLE_AI_API_KEY not configured - AI features will be disabled")
            self.model = None
            return

        try:
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel('gemini-1.5-flash')
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
                'sentiment': 'neutral',
                'confidence': 0.0,
                'explanation': 'AI service not configured',
                'error': 'GOOGLE_AI_API_KEY not set'
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
                'sentiment': 'neutral',  # placeholder
                'confidence': 0.8,  # placeholder
                'explanation': 'Analysis placeholder - implement in Phase 7'
            }

        except Exception as e:
            logger.error(f"Sentiment analysis failed: {e}")
            return {
                'sentiment': 'neutral',
                'confidence': 0.0,
                'explanation': 'Analysis failed',
                'error': str(e)
            }

    def generate_report(self, data: dict, format: str = 'markdown') -> str:
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

    def is_available(self) -> bool:
        """
        Check if AI service is available and configured

        Returns:
            bool: True if AI service is ready to use
        """
        return self.model is not None

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
                'forecast': [],
                'confidence': 0.0,
                'insights': ['Pandas not available. Please install: pip install pandas numpy'],
                'error': 'AI dependencies not installed'
            }
            
        try:
            # Get historical order data
            end_date = datetime.now()
            start_date = end_date - timedelta(days=90)  # Use last 90 days for training
            
            orders = Order.objects.filter(
                created_at__gte=start_date,
                created_at__lte=end_date,
                status='completed'
            ).values('created_at', 'total_amount')
            
            if not orders:
                return {
                    'forecast': [],
                    'confidence': 0.0,
                    'insights': ['Insufficient data for forecasting'],
                    'error': 'No historical order data available'
                }
            
            # Convert to DataFrame for analysis
            df = pd.DataFrame(list(orders))
            df['created_at'] = pd.to_datetime(df['created_at'])
            df['date'] = df['created_at'].dt.date
            daily_sales = df.groupby('date')['total_amount'].sum().reset_index()
            
            # Simple forecasting using moving average
            window = min(7, len(daily_sales))  # 7-day moving average
            recent_avg = daily_sales['total_amount'].tail(window).mean()
            recent_std = daily_sales['total_amount'].tail(window).std()
            
            # Generate forecast
            forecast = []
            base_date = datetime.now().date()
            
            for i in range(1, days_ahead + 1):
                forecast_date = base_date + timedelta(days=i)
                
                # Add some seasonality (weekends typically higher)
                day_of_week = forecast_date.weekday()
                weekend_multiplier = 1.2 if day_of_week >= 5 else 1.0
                
                predicted_amount = recent_avg * weekend_multiplier
                confidence = max(0.1, 1.0 - (i * 0.02))  # Decreasing confidence over time
                
                forecast.append({
                    'date': forecast_date.isoformat(),
                    'predicted_amount': round(predicted_amount, 2),
                    'confidence': round(confidence, 2),
                    'day_of_week': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][day_of_week]
                })
            
            # Calculate insights
            total_forecast = sum(item['predicted_amount'] for item in forecast)
            avg_daily = total_forecast / days_ahead
            recent_avg_daily = recent_avg
            
            insights = [
                f"Forecasted revenue for next {days_ahead} days: ${total_forecast:,.2f}",
                f"Average daily revenue: ${avg_daily:,.2f}",
                f"Recent average (last {window} days): ${recent_avg_daily:,.2f}",
                f"Growth trend: {'Positive' if avg_daily > recent_avg_daily else 'Negative' if avg_daily < recent_avg_daily else 'Stable'}"
            ]
            
            return {
                'forecast': forecast,
                'confidence': round(confidence, 2),
                'insights': insights,
                'total_forecast': round(total_forecast, 2),
                'avg_daily_forecast': round(avg_daily, 2)
            }
            
        except Exception as e:
            logger.error(f"Sales forecast failed: {e}")
            return {
                'forecast': [],
                'confidence': 0.0,
                'insights': ['Forecast generation failed'],
                'error': str(e)
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
                'anomalies': [],
                'alerts': [],
                'insights': ['Pandas not available. Please install: pip install pandas numpy'],
                'error': 'AI dependencies not installed'
            }
            
        try:
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days_back)
            
            # Get order data
            orders = Order.objects.filter(
                created_at__gte=start_date,
                created_at__lte=end_date
            ).values('created_at', 'total_amount', 'status')
            
            if not orders:
                return {
                    'anomalies': [],
                    'alerts': [],
                    'insights': ['No data available for anomaly detection']
                }
            
            df = pd.DataFrame(list(orders))
            df['created_at'] = pd.to_datetime(df['created_at'])
            df['date'] = df['created_at'].dt.date
            
            # Daily aggregations
            daily_stats = df.groupby('date').agg({
                'total_amount': ['sum', 'count', 'mean'],
                'status': 'count'
            }).reset_index()
            
            daily_stats.columns = ['date', 'total_revenue', 'order_count', 'avg_order_value', 'total_orders']
            
            anomalies = []
            alerts = []
            
            # Revenue anomalies
            revenue_mean = daily_stats['total_revenue'].mean()
            revenue_std = daily_stats['total_revenue'].std()
            revenue_threshold = revenue_mean + (2 * revenue_std)  # 2 standard deviations
            
            for _, row in daily_stats.iterrows():
                if row['total_revenue'] > revenue_threshold:
                    anomalies.append({
                        'type': 'revenue_spike',
                        'date': row['date'].isoformat(),
                        'value': round(row['total_revenue'], 2),
                        'threshold': round(revenue_threshold, 2),
                        'severity': 'high' if row['total_revenue'] > revenue_mean + (3 * revenue_std) else 'medium',
                        'description': f"Revenue spike detected: ${row['total_revenue']:,.2f} (normal: ${revenue_mean:,.2f})"
                    })
                    
                    alerts.append({
                        'type': 'revenue_anomaly',
                        'message': f"High revenue day detected: ${row['total_revenue']:,.2f} on {row['date']}",
                        'severity': 'high' if row['total_revenue'] > revenue_mean + (3 * revenue_std) else 'medium'
                    })
            
            # Order count anomalies
            order_mean = daily_stats['order_count'].mean()
            order_std = daily_stats['order_count'].std()
            order_threshold = order_mean + (2 * order_std)
            
            for _, row in daily_stats.iterrows():
                if row['order_count'] > order_threshold:
                    anomalies.append({
                        'type': 'order_volume_spike',
                        'date': row['date'].isoformat(),
                        'value': int(row['order_count']),
                        'threshold': round(order_threshold, 2),
                        'severity': 'high' if row['order_count'] > order_mean + (3 * order_std) else 'medium',
                        'description': f"Order volume spike: {int(row['order_count'])} orders (normal: {order_mean:.1f})"
                    })
            
            # Calculate insights
            total_anomalies = len(anomalies)
            high_severity = len([a for a in anomalies if a['severity'] == 'high'])
            
            insights = [
                f"Analyzed {days_back} days of data",
                f"Found {total_anomalies} anomalies",
                f"{high_severity} high-severity anomalies detected",
                f"Average daily revenue: ${revenue_mean:,.2f}",
                f"Average daily orders: {order_mean:.1f}"
            ]
            
            if total_anomalies == 0:
                insights.append("No significant anomalies detected - system operating normally")
            
            return {
                'anomalies': anomalies,
                'alerts': alerts,
                'insights': insights,
                'total_anomalies': total_anomalies,
                'high_severity_count': high_severity
            }
            
        except Exception as e:
            logger.error(f"Anomaly detection failed: {e}")
            return {
                'anomalies': [],
                'alerts': [],
                'insights': ['Anomaly detection failed'],
                'error': str(e)
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
                'recommendations': [],
                'insights': ['Pandas not available. Please install: pip install pandas numpy'],
                'error': 'AI dependencies not installed'
            }
            
        try:
            # Get food items with sales data
            foods = Food.objects.annotate(
                total_orders=Count('orderitem'),
                total_revenue=Sum('orderitem__total_price'),
                avg_rating=Avg('rating')
            ).filter(total_orders__gt=0).order_by('-total_revenue')[:limit * 2]
            
            if not foods:
                return {
                    'recommendations': [],
                    'insights': ['No product data available for recommendations']
                }
            
            recommendations = []
            
            for food in foods:
                # Calculate recommendation score
                popularity_score = min(1.0, food.total_orders / 100)  # Normalize to 0-1
                revenue_score = min(1.0, food.total_revenue / 10000)  # Normalize to 0-1
                rating_score = (food.avg_rating or 0) / 5.0  # Normalize to 0-1
                
                # Weighted score
                recommendation_score = (
                    popularity_score * 0.4 +
                    revenue_score * 0.4 +
                    rating_score * 0.2
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
                
                recommendations.append({
                    'food_id': food.id,
                    'name': food.name,
                    'cook_name': food.cook.user.get_full_name() if food.cook and food.cook.user else 'Unknown',
                    'recommendation_score': round(recommendation_score, 2),
                    'type': rec_type,
                    'reason': reason,
                    'total_orders': food.total_orders,
                    'total_revenue': float(food.total_revenue or 0),
                    'avg_rating': round(food.avg_rating or 0, 1),
                    'price': float(food.price),
                    'image_url': food.image.url if food.image else None
                })
            
            # Sort by recommendation score
            recommendations.sort(key=lambda x: x['recommendation_score'], reverse=True)
            recommendations = recommendations[:limit]
            
            # Generate insights
            top_performers = len([r for r in recommendations if r['type'] == 'top_performer'])
            total_revenue = sum(r['total_revenue'] for r in recommendations)
            
            insights = [
                f"Generated {len(recommendations)} product recommendations",
                f"{top_performers} top-performing products identified",
                f"Total revenue from recommended products: ${total_revenue:,.2f}",
                "Recommendations based on sales volume, revenue, and customer ratings"
            ]
            
            return {
                'recommendations': recommendations,
                'insights': insights,
                'total_recommendations': len(recommendations)
            }
            
        except Exception as e:
            logger.error(f"Product recommendations failed: {e}")
            return {
                'recommendations': [],
                'insights': ['Product recommendations failed'],
                'error': str(e)
            }

    def get_customer_insights(self) -> Dict[str, Any]:
        """
        Generate customer insights and segmentation
        
        Returns:
            dict: Customer insights with segmentation and recommendations
        """
        if not PANDAS_AVAILABLE:
            return {
                'segments': [],
                'insights': ['Pandas not available. Please install: pip install pandas numpy'],
                'error': 'AI dependencies not installed'
            }
            
        try:
            # Get customer data
            customers = User.objects.filter(role='customer').annotate(
                total_orders=Count('order'),
                total_spent=Sum('order__total_amount'),
                avg_order_value=Avg('order__total_amount'),
                last_order_date=Max('order__created_at')
            ).filter(total_orders__gt=0)
            
            if not customers:
                return {
                    'segments': [],
                    'insights': ['No customer data available for analysis']
                }
            
            # Customer segmentation
            segments = []
            
            # High-value customers (top 20% by spending)
            high_value_threshold = customers.aggregate(
                threshold=Sum('total_spent') * 0.8 / Count('total_spent')
            )['threshold'] or 0
            
            high_value_customers = customers.filter(total_spent__gte=high_value_threshold)
            segments.append({
                'name': 'High-Value Customers',
                'count': high_value_customers.count(),
                'avg_spending': float(high_value_customers.aggregate(avg=Avg('total_spent'))['avg'] or 0),
                'description': 'Top 20% of customers by total spending',
                'recommendation': 'Focus on retention and upselling'
            })
            
            # Frequent customers (top 20% by order count)
            frequent_threshold = customers.aggregate(
                threshold=Count('total_orders') * 0.8 / Count('total_orders')
            )['threshold'] or 0
            
            frequent_customers = customers.filter(total_orders__gte=frequent_threshold)
            segments.append({
                'name': 'Frequent Customers',
                'count': frequent_customers.count(),
                'avg_orders': float(frequent_customers.aggregate(avg=Avg('total_orders'))['avg'] or 0),
                'description': 'Top 20% of customers by order frequency',
                'recommendation': 'Loyalty programs and exclusive offers'
            })
            
            # At-risk customers (no orders in last 30 days)
            thirty_days_ago = datetime.now() - timedelta(days=30)
            at_risk_customers = customers.filter(last_order_date__lt=thirty_days_ago)
            segments.append({
                'name': 'At-Risk Customers',
                'count': at_risk_customers.count(),
                'description': 'No orders in the last 30 days',
                'recommendation': 'Re-engagement campaigns and special offers'
            })
            
            # New customers (first order in last 30 days)
            new_customers = customers.filter(
                last_order_date__gte=thirty_days_ago,
                total_orders=1
            )
            segments.append({
                'name': 'New Customers',
                'count': new_customers.count(),
                'description': 'First order in the last 30 days',
                'recommendation': 'Onboarding and first-time customer incentives'
            })
            
            # Calculate overall insights
            total_customers = customers.count()
            total_revenue = customers.aggregate(total=Sum('total_spent'))['total'] or 0
            avg_order_value = customers.aggregate(avg=Avg('avg_order_value'))['avg'] or 0
            
            insights = [
                f"Total active customers: {total_customers}",
                f"Total customer revenue: ${total_revenue:,.2f}",
                f"Average order value: ${avg_order_value:,.2f}",
                f"Customer segments identified: {len(segments)}",
                "Segmentation based on spending, frequency, and recency"
            ]
            
            return {
                'segments': segments,
                'insights': insights,
                'total_customers': total_customers,
                'total_revenue': float(total_revenue),
                'avg_order_value': float(avg_order_value)
            }
            
        except Exception as e:
            logger.error(f"Customer insights failed: {e}")
            return {
                'segments': [],
                'insights': ['Customer insights generation failed'],
                'error': str(e)
            }
