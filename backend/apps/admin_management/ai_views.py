"""
AI/ML API Views for Admin Management
Phase 3: Advanced AI Features
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from django.http import JsonResponse
from django.utils import timezone
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


@api_view(['GET'])
@permission_classes([IsAdminUser])
def communication_ai_insights(request):
    """
    Get AI-powered insights for communication management
    
    Query Parameters:
        period (str): Time period for analysis (default: '30d')
        type (str): Communication type filter (optional)
    """
    try:
        from apps.communications.services.ai_sentiment_service import AISentimentService
        from apps.communications.models import Communication
        from datetime import timedelta
        from django.utils import timezone
        
        # Get parameters
        period = request.GET.get('period', '30d')
        comm_type = request.GET.get('type')
        
        # Calculate date range
        days = int(period.replace('d', '')) if period != 'all' else None
        if days:
            start_date = timezone.now() - timedelta(days=days)
            queryset = Communication.objects.filter(created_at__gte=start_date)
        else:
            queryset = Communication.objects.all()
        
        # Filter by type if specified
        if comm_type:
            queryset = queryset.filter(communication_type=comm_type)
        
        # Initialize AI service
        ai_service = AISentimentService()
        
        # Get comprehensive AI insights
        insights = {
            'overview': {
                'total_communications': queryset.count(),
                'period': period,
                'type_filter': comm_type,
                'analysis_timestamp': timezone.now().isoformat()
            },
            'sentiment_analysis': ai_service.analyze_communications_sentiment(queryset),
            'trending_topics': ai_service.extract_trending_topics(queryset),
            'sentiment_trends': ai_service.get_sentiment_trends(queryset, days or 30),
            'type_breakdown': {},
            'recommendations': []
        }
        
        # Get type-specific insights
        for comm_type_choice, type_label in Communication.COMMUNICATION_TYPE:
            type_queryset = queryset.filter(communication_type=comm_type_choice)
            if type_queryset.exists():
                type_sentiment = ai_service.analyze_communications_sentiment(type_queryset)
                type_topics = ai_service.extract_trending_topics(type_queryset)
                
                insights['type_breakdown'][comm_type_choice] = {
                    'label': type_label,
                    'count': type_queryset.count(),
                    'sentiment': type_sentiment,
                    'trending_topics': type_topics
                }
        
        # Generate AI recommendations
        insights['recommendations'] = _generate_communication_recommendations(insights)
        
        return Response({
            'success': True,
            'data': insights,
            'message': 'Communication AI insights generated successfully'
        })
        
    except Exception as e:
        logger.error(f"Communication AI insights error: {e}")
        return Response({
            'success': False,
            'error': str(e),
            'message': 'Failed to generate communication AI insights'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def _generate_communication_recommendations(insights):
    """Generate AI-powered recommendations based on communication insights"""
    recommendations = []
    
    try:
        # Analyze sentiment patterns
        sentiment_data = insights.get('sentiment_analysis', {})
        negative_percentage = sentiment_data.get('negative_percentage', 0)
        positive_percentage = sentiment_data.get('positive_percentage', 0)
        
        # Generate recommendations based on sentiment
        if negative_percentage > 30:
            recommendations.append({
                'type': 'urgent',
                'title': 'High Negative Sentiment Detected',
                'description': f'{negative_percentage}% of communications show negative sentiment',
                'action': 'Review recent complaints and implement immediate response strategy',
                'priority': 'high'
            })
        
        if positive_percentage > 70:
            recommendations.append({
                'type': 'positive',
                'title': 'Excellent Customer Satisfaction',
                'description': f'{positive_percentage}% of communications show positive sentiment',
                'action': 'Consider sharing positive feedback with team and customers',
                'priority': 'medium'
            })
        
        # Analyze trending topics
        trending_topics = insights.get('trending_topics', [])
        for topic in trending_topics[:3]:  # Top 3 topics
            if topic.get('sentiment') == 'negative':
                recommendations.append({
                    'type': 'topic_focus',
                    'title': f'Focus on {topic.get("topic", "Unknown")}',
                    'description': f'High frequency of negative feedback about {topic.get("topic")}',
                    'action': f'Investigate and improve {topic.get("topic")} processes',
                    'priority': 'high'
                })
        
        # Analyze response times
        type_breakdown = insights.get('type_breakdown', {})
        for comm_type, data in type_breakdown.items():
            if data.get('count', 0) > 10:  # Only for types with significant volume
                recommendations.append({
                    'type': 'process_improvement',
                    'title': f'Optimize {data.get("label")} Process',
                    'description': f'{data.get("count")} {data.get("label").lower()} received',
                    'action': f'Review and streamline {data.get("label").lower()} handling process',
                    'priority': 'medium'
                })
        
        # Add general recommendations
        recommendations.append({
            'type': 'general',
            'title': 'Regular Communication Review',
            'description': 'Schedule weekly reviews of communication trends',
            'action': 'Set up automated reports for communication analytics',
            'priority': 'low'
        })
        
    except Exception as e:
        logger.error(f"Recommendation generation failed: {e}")
        recommendations.append({
            'type': 'error',
            'title': 'Analysis Error',
            'description': 'Unable to generate recommendations',
            'action': 'Check system logs and try again',
            'priority': 'low'
        })
    
    return recommendations


@api_view(['GET'])
@permission_classes([IsAdminUser])
def ai_service_status(request):
    """
    Get detailed status of AI service components
    """
    try:
        status_data = ai_service.get_service_status()
        
        return Response({
            'success': True,
            'data': status_data,
            'message': 'AI service status retrieved successfully'
        })
        
    except Exception as e:
        logger.error(f"AI service status error: {e}")
        return Response({
            'success': False,
            'error': str(e),
            'message': 'Failed to get AI service status'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def business_insights(request):
    """
    Get comprehensive business insights using all AI features
    
    Query Parameters:
        include_forecast (bool): Include sales forecasting (default: true)
        include_anomalies (bool): Include anomaly detection (default: true)
        include_products (bool): Include product recommendations (default: true)
        include_customers (bool): Include customer insights (default: true)
    """
    try:
        # Get parameters
        include_forecast = request.GET.get('include_forecast', 'true').lower() == 'true'
        include_anomalies = request.GET.get('include_anomalies', 'true').lower() == 'true'
        include_products = request.GET.get('include_products', 'true').lower() == 'true'
        include_customers = request.GET.get('include_customers', 'true').lower() == 'true'
        
        # Check if AI service is available - return graceful fallback with 200
        if not ai_service.is_available():
            return Response({
                'success': True,
                'data': {
                    'insights': {
                        'sales_forecast': {'message': 'Forecast unavailable'},
                        'anomalies': {'message': 'Anomaly detection unavailable'},
                        'product_recommendations': {'message': 'Recommendations unavailable'},
                        'customer_insights': {'message': 'Customer insights unavailable'},
                        'ai_summary': 'AI service not configured; showing placeholder insights.'
                    },
                    'generated_at': timezone.now().isoformat(),
                    'confidence_score': 0,
                    'included_features': {
                        'sales_forecast': False,
                        'anomaly_detection': False,
                        'product_recommendations': False,
                        'customer_insights': False
                    }
                }
            }, status=status.HTTP_200_OK)
        
        # Generate comprehensive insights
        insights_data = ai_service.generate_business_insights()
        
        if 'error' in insights_data:
            # Return graceful fallback instead of error
            return Response({
                'success': True,
                'data': {
                    'insights': {
                        'sales_forecast': {'message': 'Forecast unavailable'},
                        'anomalies': {'message': 'Anomaly detection unavailable'},
                        'product_recommendations': {'message': 'Recommendations unavailable'},
                        'customer_insights': {'message': 'Customer insights unavailable'},
                        'ai_summary': 'AI insights temporarily unavailable.'
                    },
                    'generated_at': timezone.now().isoformat(),
                    'confidence_score': 0,
                    'included_features': {
                        'sales_forecast': include_forecast,
                        'anomaly_detection': include_anomalies,
                        'product_recommendations': include_products,
                        'customer_insights': include_customers
                    }
                }
            }, status=status.HTTP_200_OK)
        
        # Filter insights based on parameters
        filtered_insights = {}
        if include_forecast:
            filtered_insights['sales_forecast'] = insights_data['insights']['sales_forecast']
        if include_anomalies:
            filtered_insights['anomalies'] = insights_data['insights']['anomalies']
        if include_products:
            filtered_insights['product_recommendations'] = insights_data['insights']['product_recommendations']
        if include_customers:
            filtered_insights['customer_insights'] = insights_data['insights']['customer_insights']
        
        # Always include AI summary
        filtered_insights['ai_summary'] = insights_data['insights']['ai_summary']
        
        return Response({
            'success': True,
            'data': {
                'insights': filtered_insights,
                'generated_at': insights_data['generated_at'],
                'confidence_score': insights_data['confidence_score'],
                'included_features': {
                    'sales_forecast': include_forecast,
                    'anomaly_detection': include_anomalies,
                    'product_recommendations': include_products,
                    'customer_insights': include_customers
                }
            },
            'message': 'Business insights generated successfully'
        })
        
    except Exception as e:
        logger.error(f"Business insights error: {e}")
        # Return graceful fallback instead of 500
        return Response({
            'success': True,
            'data': {
                'insights': {
                    'sales_forecast': {'message': 'Forecast unavailable'},
                    'anomalies': {'message': 'Anomaly detection unavailable'},
                    'product_recommendations': {'message': 'Recommendations unavailable'},
                    'customer_insights': {'message': 'Customer insights unavailable'},
                    'ai_summary': f'AI error: {str(e)}'
                },
                'generated_at': timezone.now().isoformat(),
                'confidence_score': 0,
                'included_features': {
                    'sales_forecast': False,
                    'anomaly_detection': False,
                    'product_recommendations': False,
                    'customer_insights': False
                }
            }
        }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def ai_recommendations(request):
    """
    Get AI-powered recommendations for business improvement
    
    Query Parameters:
        category (str): Category of recommendations (all, sales, operations, customer)
        priority (str): Priority level (all, high, medium, low)
    """
    try:
        category = request.GET.get('category', 'all')
        priority = request.GET.get('priority', 'all')
        
        # Get all AI insights
        sales_forecast = ai_service.get_sales_forecast(30)
        anomalies = ai_service.detect_anomalies(30)
        product_recs = ai_service.get_product_recommendations(10)
        customer_insights = ai_service.get_customer_insights()
        
        # Generate recommendations
        recommendations = []
        
        # Sales recommendations
        if category in ['all', 'sales']:
            if sales_forecast.get('confidence', 0) > 0.7:
                recommendations.append({
                    'category': 'sales',
                    'priority': 'high',
                    'title': 'Optimize Sales Strategy',
                    'description': f"High confidence forecast available ({sales_forecast.get('confidence', 0):.1%})",
                    'action': 'Use sales forecast to plan inventory and marketing campaigns',
                    'impact': 'high'
                })
        
        # Anomaly recommendations
        if category in ['all', 'operations']:
            anomalies_detected = len(anomalies.get('anomalies', []))
            if anomalies_detected > 0:
                recommendations.append({
                    'category': 'operations',
                    'priority': 'high' if anomalies_detected > 3 else 'medium',
                    'title': 'Address Detected Anomalies',
                    'description': f"{anomalies_detected} anomalies detected in recent data",
                    'action': 'Review anomaly details and investigate root causes',
                    'impact': 'high'
                })
        
        # Product recommendations
        if category in ['all', 'sales']:
            top_products = product_recs.get('recommendations', [])[:3]
            if top_products:
                recommendations.append({
                    'category': 'sales',
                    'priority': 'medium',
                    'title': 'Promote Top Performing Products',
                    'description': f"AI identified {len(top_products)} high-potential products",
                    'action': 'Increase marketing focus on top-performing products',
                    'impact': 'medium'
                })
        
        # Customer recommendations
        if category in ['all', 'customer']:
            segments = customer_insights.get('segments', [])
            if len(segments) > 2:
                recommendations.append({
                    'category': 'customer',
                    'priority': 'medium',
                    'title': 'Implement Customer Segmentation',
                    'description': f"AI identified {len(segments)} distinct customer segments",
                    'action': 'Develop targeted marketing strategies for each segment',
                    'impact': 'medium'
                })
        
        # Filter by priority
        if priority != 'all':
            recommendations = [r for r in recommendations if r['priority'] == priority]
        
        return Response({
            'success': True,
            'data': {
                'recommendations': recommendations,
                'total_count': len(recommendations),
                'filters': {
                    'category': category,
                    'priority': priority
                },
                'generated_at': timezone.now().isoformat()
            },
            'message': 'AI recommendations generated successfully'
        })
        
    except Exception as e:
        logger.error(f"AI recommendations error: {e}")
        return Response({
            'success': False,
            'error': str(e),
            'message': 'Failed to generate AI recommendations'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
