/**
 * AI Components Index
 *
 * This directory contains AI-powered components for the admin dashboard.
 * Components are organized by functionality and provide real-time insights.
 */

// Export AI-powered widgets
export { default as AIInsightsWidget } from './AIInsightsWidget';
export { default as AIAlertsWidget } from './AIAlertsWidget';
export { default as PredictiveAnalyticsWidget } from './PredictiveAnalyticsWidget';

// Export types for TypeScript support
export type { AIInsight } from './AIInsightsWidget';
export type { AIAlert } from './AIAlertsWidget';

// For future AI components, add exports here:
// export { default as AIRecommendationsWidget } from './AIRecommendationsWidget';
// export { default as AISentimentWidget } from './AISentimentWidget';
// export { default as AITrendAnalysisWidget } from './AITrendAnalysisWidget';

// Placeholder for future AI components
export const AIComponents = {
  AIInsightsWidget,
  AIAlertsWidget,
  PredictiveAnalyticsWidget,
};
