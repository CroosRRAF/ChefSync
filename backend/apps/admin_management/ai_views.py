"""
AI/ML API Views for Admin Management
Phase 3: Advanced AI Features
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from django.http import JsonResponse
import logging

from .services.ai_service import AdminAIService

logger = logging.getLogger(__name__)

# Initialize AI service
ai_service = AdminAIService()


@api_view(['GET'])
@permission_classes([IsAdminUser])
def sales_forecast(request):
    """
    Get sales forecast for the next N days
    
    Query Parameters:
        days_ahead (int): Number of days to forecast (default: 30)
    """
    try:
        days_ahead = int(request.GET.get('days_ahead', 30))
        
        if days_ahead < 1 or days_ahead > 365:
            return Response({
                'error': 'days_ahead must be between 1 and 365'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        forecast_data = ai_service.get_sales_forecast(days_ahead)
        
        return Response({
            'success': True,
            'data': forecast_data,
            'message': f'Sales forecast generated for next {days_ahead} days'
        })
        
    except ValueError:
        return Response({
            'error': 'Invalid days_ahead parameter'
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f"Sales forecast API error: {e}")
        return Response({
            'error': 'Failed to generate sales forecast',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def anomaly_detection(request):
    """
    Detect anomalies in orders, revenue, and user behavior
    
    Query Parameters:
        days_back (int): Number of days to analyze (default: 30)
    """
    try:
        days_back = int(request.GET.get('days_back', 30))
        
        if days_back < 1 or days_back > 365:
            return Response({
                'error': 'days_back must be between 1 and 365'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        anomaly_data = ai_service.detect_anomalies(days_back)
        
        return Response({
            'success': True,
            'data': anomaly_data,
            'message': f'Anomaly detection completed for last {days_back} days'
        })
        
    except ValueError:
        return Response({
            'error': 'Invalid days_back parameter'
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f"Anomaly detection API error: {e}")
        return Response({
            'error': 'Failed to detect anomalies',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def product_recommendations(request):
    """
    Get product recommendations based on sales data
    
    Query Parameters:
        limit (int): Maximum number of recommendations (default: 10)
    """
    try:
        limit = int(request.GET.get('limit', 10))
        
        if limit < 1 or limit > 50:
            return Response({
                'error': 'limit must be between 1 and 50'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        recommendations_data = ai_service.get_product_recommendations(limit)
        
        return Response({
            'success': True,
            'data': recommendations_data,
            'message': f'Generated {recommendations_data.get("total_recommendations", 0)} product recommendations'
        })
        
    except ValueError:
        return Response({
            'error': 'Invalid limit parameter'
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f"Product recommendations API error: {e}")
        return Response({
            'error': 'Failed to generate product recommendations',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def customer_insights(request):
    """
    Get customer insights and segmentation
    """
    try:
        insights_data = ai_service.get_customer_insights()
        
        return Response({
            'success': True,
            'data': insights_data,
            'message': 'Customer insights generated successfully'
        })
        
    except Exception as e:
        logger.error(f"Customer insights API error: {e}")
        return Response({
            'error': 'Failed to generate customer insights',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def ai_status(request):
    """
    Check AI service status and availability
    """
    try:
        is_available = ai_service.is_available()
        
        return Response({
            'success': True,
            'data': {
                'ai_service_available': is_available,
                'features': {
                    'sales_forecast': True,
                    'anomaly_detection': True,
                    'product_recommendations': True,
                    'customer_insights': True,
                    'sentiment_analysis': is_available,  # Requires Google AI API
                    'report_generation': is_available   # Requires Google AI API
                }
            },
            'message': 'AI service status retrieved successfully'
        })
        
    except Exception as e:
        logger.error(f"AI status API error: {e}")
        return Response({
            'error': 'Failed to get AI service status',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def ai_dashboard_summary(request):
    """
    Get comprehensive AI dashboard summary with all key metrics
    """
    try:
        # Get all AI insights
        forecast_data = ai_service.get_sales_forecast(7)  # Next 7 days
        anomaly_data = ai_service.detect_anomalies(7)     # Last 7 days
        recommendations_data = ai_service.get_product_recommendations(5)  # Top 5
        customer_data = ai_service.get_customer_insights()
        
        # Create summary
        summary = {
            'sales_forecast': {
                'next_7_days_revenue': forecast_data.get('total_forecast', 0),
                'avg_daily_forecast': forecast_data.get('avg_daily_forecast', 0),
                'confidence': forecast_data.get('confidence', 0)
            },
            'anomaly_detection': {
                'total_anomalies': anomaly_data.get('total_anomalies', 0),
                'high_severity_count': anomaly_data.get('high_severity_count', 0),
                'alerts': anomaly_data.get('alerts', [])
            },
            'product_recommendations': {
                'total_recommendations': recommendations_data.get('total_recommendations', 0),
                'top_products': recommendations_data.get('recommendations', [])[:3]  # Top 3
            },
            'customer_insights': {
                'total_customers': customer_data.get('total_customers', 0),
                'total_revenue': customer_data.get('total_revenue', 0),
                'avg_order_value': customer_data.get('avg_order_value', 0),
                'segments': customer_data.get('segments', [])
            },
            'ai_service_status': ai_service.is_available()
        }
        
        return Response({
            'success': True,
            'data': summary,
            'message': 'AI dashboard summary generated successfully'
        })
        
    except Exception as e:
        logger.error(f"AI dashboard summary API error: {e}")
        return Response({
            'error': 'Failed to generate AI dashboard summary',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
