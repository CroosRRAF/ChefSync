"""
AI Sentiment Analysis Service for Communications
Uses Google Gemini AI for advanced sentiment analysis
"""

import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any
from django.utils import timezone
from django.db.models import Count, Q
from django.conf import settings

try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    logging.warning("Google Gemini AI not available. Using fallback sentiment analysis.")

logger = logging.getLogger(__name__)


class AISentimentService:
    """Service for AI-powered sentiment analysis of communications"""
    
    def __init__(self):
        self.ai_enabled = False
        self.model = None
        
        if GEMINI_AVAILABLE:
            try:
                api_key = getattr(settings, 'GOOGLE_AI_API_KEY', None)
                if api_key:
                    genai.configure(api_key=api_key)
                    self.model = genai.GenerativeModel('gemini-2.0-flash')
                    self.ai_enabled = True
                    logger.info("AI Sentiment Service initialized successfully")
                else:
                    logger.warning("GOOGLE_AI_API_KEY not configured - AI features disabled")
            except Exception as e:
                logger.warning(f"Failed to initialize Gemini AI: {e}")
                self.ai_enabled = False
        else:
            logger.warning("Google Gemini AI not available - using fallback analysis")
    
    def analyze_communications_sentiment(self, queryset) -> Dict[str, Any]:
        """Analyze sentiment of communications using AI"""
        if not self.ai_enabled:
            return self._fallback_sentiment_analysis(queryset)
        
        try:
            # Get recent communications for analysis
            communications = list(queryset.order_by('-created_at')[:50])
            
            if not communications:
                return self._get_empty_sentiment_data()
            
            # Prepare text for AI analysis
            texts_to_analyze = []
            for comm in communications:
                text = f"Subject: {comm.subject}\nMessage: {comm.message}"
                if comm.communication_type:
                    text = f"Type: {comm.communication_type}\n{text}"
                texts_to_analyze.append(text)
            
            # Analyze with AI
            ai_results = self._analyze_with_ai(texts_to_analyze)
            
            # Combine with basic metrics
            basic_metrics = self._get_basic_sentiment_metrics(queryset)
            
            return {
                **basic_metrics,
                'ai_analysis': ai_results,
                'confidence_score': ai_results.get('confidence', 0.8),
                'analysis_method': 'ai_powered'
            }
            
        except Exception as e:
            logger.error(f"AI sentiment analysis failed: {e}")
            return self._fallback_sentiment_analysis(queryset)
    
    def _analyze_with_ai(self, texts: List[str]) -> Dict[str, Any]:
        """Analyze texts using Google Gemini AI"""
        try:
            # Combine texts for analysis
            combined_text = "\n\n---\n\n".join(texts[:10])  # Limit to 10 for API limits
            
            prompt = f"""
            Analyze the sentiment of these customer communications and provide insights:
            
            {combined_text}
            
            Please provide:
            1. Overall sentiment (positive, negative, neutral) with confidence score
            2. Key emotions detected (frustrated, satisfied, confused, etc.)
            3. Main topics/themes mentioned
            4. Urgency level (high, medium, low)
            5. Action items or recommendations
            
            Respond in JSON format:
            {{
                "overall_sentiment": "positive/negative/neutral",
                "confidence": 0.85,
                "emotions": ["satisfied", "grateful"],
                "topics": ["food quality", "delivery time"],
                "urgency": "medium",
                "recommendations": ["Follow up on delivery issues", "Thank satisfied customers"]
            }}
            """
            
            response = self.model.generate_content(prompt)
            
            # Parse AI response
            try:
                # Extract JSON from response
                response_text = response.text
                if "```json" in response_text:
                    json_start = response_text.find("```json") + 7
                    json_end = response_text.find("```", json_start)
                    json_text = response_text[json_start:json_end].strip()
                elif "{" in response_text and "}" in response_text:
                    json_start = response_text.find("{")
                    json_end = response_text.rfind("}") + 1
                    json_text = response_text[json_start:json_end]
                else:
                    json_text = response_text
                
                ai_result = json.loads(json_text)
                return ai_result
                
            except json.JSONDecodeError:
                # Fallback parsing
                return {
                    "overall_sentiment": "neutral",
                    "confidence": 0.5,
                    "emotions": [],
                    "topics": [],
                    "urgency": "medium",
                    "recommendations": ["Manual review recommended"]
                }
                
        except Exception as e:
            logger.error(f"AI analysis failed: {e}")
            return {
                "overall_sentiment": "neutral",
                "confidence": 0.3,
                "emotions": [],
                "topics": [],
                "urgency": "medium",
                "recommendations": ["AI analysis unavailable"]
            }
    
    def _fallback_sentiment_analysis(self, queryset) -> Dict[str, Any]:
        """Fallback sentiment analysis using basic rules"""
        total = queryset.count()
        
        if total == 0:
            return self._get_empty_sentiment_data()
        
        # Basic sentiment based on ratings and keywords
        positive_count = queryset.filter(
            Q(rating__gte=4) |
            Q(message__icontains="thank") |
            Q(message__icontains="great") |
            Q(message__icontains="excellent") |
            Q(message__icontains="love") |
            Q(message__icontains="amazing")
        ).distinct().count()
        
        negative_count = queryset.filter(
            Q(rating__lte=2) |
            Q(communication_type="complaint") |
            Q(message__icontains="terrible") |
            Q(message__icontains="awful") |
            Q(message__icontains="disappointed") |
            Q(message__icontains="angry") |
            Q(message__icontains="frustrated")
        ).distinct().count()
        
        neutral_count = max(0, total - positive_count - negative_count)
        
        return {
            "positive": positive_count,
            "negative": negative_count,
            "neutral": neutral_count,
            "total": total,
            "positive_percentage": round((positive_count / total) * 100, 1) if total > 0 else 0,
            "negative_percentage": round((negative_count / total) * 100, 1) if total > 0 else 0,
            "neutral_percentage": round((neutral_count / total) * 100, 1) if total > 0 else 0,
            "analysis_method": "rule_based"
        }
    
    def _get_basic_sentiment_metrics(self, queryset) -> Dict[str, Any]:
        """Get basic sentiment metrics from database"""
        total = queryset.count()
        
        if total == 0:
            return self._get_empty_sentiment_data()
        
        # Count by communication type
        type_counts = queryset.values('communication_type').annotate(count=Count('id'))
        
        # Count by status
        status_counts = queryset.values('status').annotate(count=Count('id'))
        
        # Count by priority
        priority_counts = queryset.values('priority').annotate(count=Count('id'))
        
        return {
            "total": total,
            "type_breakdown": {item['communication_type']: item['count'] for item in type_counts},
            "status_breakdown": {item['status']: item['count'] for item in status_counts},
            "priority_breakdown": {item['priority']: item['count'] for item in priority_counts}
        }
    
    def _get_empty_sentiment_data(self) -> Dict[str, Any]:
        """Return empty sentiment data structure"""
        return {
            "positive": 0,
            "negative": 0,
            "neutral": 0,
            "total": 0,
            "positive_percentage": 0,
            "negative_percentage": 0,
            "neutral_percentage": 0,
            "type_breakdown": {},
            "status_breakdown": {},
            "priority_breakdown": {},
            "analysis_method": "no_data"
        }
    
    def extract_trending_topics(self, queryset) -> List[Dict[str, Any]]:
        """Extract trending topics from communications"""
        try:
            # Get subjects and messages for topic extraction
            subjects = list(queryset.exclude(subject__isnull=True)
                          .exclude(subject="")
                          .values_list('subject', flat=True)[:20])
            
            if not subjects:
                return []
            
            if self.ai_enabled:
                return self._extract_topics_with_ai(subjects)
            else:
                return self._extract_topics_fallback(subjects)
                
        except Exception as e:
            logger.error(f"Topic extraction failed: {e}")
            return []
    
    def _extract_topics_with_ai(self, subjects: List[str]) -> List[Dict[str, Any]]:
        """Extract topics using AI"""
        try:
            combined_subjects = "\n".join(subjects[:10])
            
            prompt = f"""
            Analyze these communication subjects and extract the main topics/themes:
            
            {combined_subjects}
            
            Return a JSON array of topics with frequency:
            [
                {{"topic": "food quality", "frequency": 5, "sentiment": "mixed"}},
                {{"topic": "delivery issues", "frequency": 3, "sentiment": "negative"}}
            ]
            """
            
            response = self.model.generate_content(prompt)
            
            # Parse response
            response_text = response.text
            if "[" in response_text and "]" in response_text:
                json_start = response_text.find("[")
                json_end = response_text.rfind("]") + 1
                json_text = response_text[json_start:json_end]
                
                topics = json.loads(json_text)
                return topics[:5]  # Return top 5 topics
                
        except Exception as e:
            logger.error(f"AI topic extraction failed: {e}")
        
        return self._extract_topics_fallback(subjects)
    
    def _extract_topics_fallback(self, subjects: List[str]) -> List[Dict[str, Any]]:
        """Fallback topic extraction using keyword matching"""
        # Simple keyword-based topic extraction
        topic_keywords = {
            "food quality": ["food", "taste", "quality", "delicious", "bad", "good"],
            "delivery": ["delivery", "late", "time", "driver", "arrived"],
            "service": ["service", "staff", "customer", "help", "support"],
            "pricing": ["price", "cost", "expensive", "cheap", "money"],
            "app issues": ["app", "website", "login", "error", "bug"]
        }
        
        topic_counts = {}
        for subject in subjects:
            subject_lower = subject.lower()
            for topic, keywords in topic_keywords.items():
                if any(keyword in subject_lower for keyword in keywords):
                    topic_counts[topic] = topic_counts.get(topic, 0) + 1
        
        # Convert to list format
        topics = []
        for topic, count in sorted(topic_counts.items(), key=lambda x: x[1], reverse=True):
            topics.append({
                "topic": topic,
                "frequency": count,
                "sentiment": "neutral"  # Default sentiment
            })
        
        return topics[:5]
    
    def get_sentiment_trends(self, queryset, days: int) -> List[Dict[str, Any]]:
        """Get sentiment trends over time"""
        try:
            # Group by date and calculate daily sentiment
            trends = []
            
            for i in range(days):
                date = timezone.now().date() - timedelta(days=i)
                day_queryset = queryset.filter(created_at__date=date)
                
                if day_queryset.exists():
                    day_sentiment = self.analyze_communications_sentiment(day_queryset)
                    trends.append({
                        "date": date.isoformat(),
                        "total": day_sentiment.get("total", 0),
                        "positive": day_sentiment.get("positive", 0),
                        "negative": day_sentiment.get("negative", 0),
                        "neutral": day_sentiment.get("neutral", 0)
                    })
            
            return list(reversed(trends))  # Return in chronological order
            
        except Exception as e:
            logger.error(f"Sentiment trends failed: {e}")
            return []
