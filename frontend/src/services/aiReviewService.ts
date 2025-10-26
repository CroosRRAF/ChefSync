import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GOOGLE_AI_API_KEY;

// Initialize Gemini AI
let genAI: GoogleGenerativeAI | null = null;

if (API_KEY && API_KEY !== 'your-google-ai-api-key') {
  genAI = new GoogleGenerativeAI(API_KEY);
}

export interface ContentModerationResult {
  isAppropriate: boolean;
  hasBadWords: boolean;
  issues: string[];
  suggestion?: string;
  filteredContent?: string;
}

export interface ReviewSuggestion {
  suggestions: string[];
  tone: 'positive' | 'neutral' | 'negative';
  sentiment: number; // -1 to 1
}

export interface ReviewEnhancement {
  enhancedText: string;
  improvements: string[];
}

/**
 * Check if content contains inappropriate language or bad words
 */
export const moderateContent = async (content: string): Promise<ContentModerationResult> => {
  if (!genAI || !content.trim()) {
    return {
      isAppropriate: true,
      hasBadWords: false,
      issues: [],
    };
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `
Analyze the following review comment for inappropriate content:

"${content}"

Check for:
1. Profanity or vulgar language
2. Hate speech or discriminatory content
3. Personal attacks or harassment
4. Spam or promotional content
5. Threats or violent content

Respond ONLY in this exact JSON format (no markdown, no extra text):
{
  "isAppropriate": true/false,
  "hasBadWords": true/false,
  "issues": ["list of specific issues found"],
  "suggestion": "suggestion for improvement if needed",
  "filteredContent": "cleaned version if inappropriate"
}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse JSON from response
    let jsonText = text.trim();
    // Remove markdown code blocks if present
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    const moderation = JSON.parse(jsonText);
    
    return {
      isAppropriate: moderation.isAppropriate ?? true,
      hasBadWords: moderation.hasBadWords ?? false,
      issues: moderation.issues ?? [],
      suggestion: moderation.suggestion,
      filteredContent: moderation.filteredContent,
    };
  } catch (error) {
    console.error('Content moderation error:', error);
    // Fail open - allow content if AI check fails
    return {
      isAppropriate: true,
      hasBadWords: false,
      issues: ['AI moderation unavailable'],
    };
  }
};

/**
 * Get AI-powered suggestions for review based on rating
 */
export const getReviewSuggestions = async (
  rating: number,
  category: 'food' | 'delivery'
): Promise<ReviewSuggestion> => {
  if (!genAI || rating === 0) {
    return {
      suggestions: [],
      tone: 'neutral',
      sentiment: 0,
    };
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const categoryContext = category === 'food' 
      ? 'food quality, taste, presentation, and value'
      : 'delivery speed, professionalism, and communication';

    const prompt = `
Generate 3 helpful suggestions for a ${rating}-star review about ${categoryContext}.

The suggestions should be:
- Constructive and specific
- Appropriate tone for ${rating} stars
- Help the reviewer provide useful feedback
- 1-2 sentences each

Respond ONLY in this exact JSON format:
{
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"],
  "tone": "positive/neutral/negative",
  "sentiment": ${(rating - 3) / 2}
}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    let jsonText = text.trim();
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    const suggestions = JSON.parse(jsonText);
    
    return {
      suggestions: suggestions.suggestions ?? [],
      tone: suggestions.tone ?? 'neutral',
      sentiment: suggestions.sentiment ?? 0,
    };
  } catch (error) {
    console.error('Suggestion generation error:', error);
    return {
      suggestions: [],
      tone: 'neutral',
      sentiment: 0,
    };
  }
};

/**
 * Enhance review text with AI improvements
 */
export const enhanceReview = async (text: string, rating: number): Promise<ReviewEnhancement> => {
  if (!genAI || !text.trim()) {
    return {
      enhancedText: text,
      improvements: [],
    };
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `
Improve the following ${rating}-star review while maintaining the original meaning and sentiment:

"${text}"

Make it:
- More clear and well-structured
- Grammatically correct
- Professional but friendly
- Keep the same length (±20%)
- Maintain the reviewer's voice

Respond ONLY in this exact JSON format:
{
  "enhancedText": "improved version",
  "improvements": ["list of improvements made"]
}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();
    
    let jsonText = responseText.trim();
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    const enhancement = JSON.parse(jsonText);
    
    return {
      enhancedText: enhancement.enhancedText ?? text,
      improvements: enhancement.improvements ?? [],
    };
  } catch (error) {
    console.error('Review enhancement error:', error);
    return {
      enhancedText: text,
      improvements: [],
    };
  }
};

/**
 * Analyze sentiment of review text
 */
export const analyzeSentiment = async (text: string): Promise<{
  score: number;
  label: 'very_positive' | 'positive' | 'neutral' | 'negative' | 'very_negative';
  confidence: number;
}> => {
  if (!genAI || !text.trim()) {
    return {
      score: 0,
      label: 'neutral',
      confidence: 0,
    };
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `
Analyze the sentiment of this review:

"${text}"

Respond ONLY in this exact JSON format:
{
  "score": -1 to 1 (negative to positive),
  "label": "very_positive/positive/neutral/negative/very_negative",
  "confidence": 0 to 1
}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();
    
    let jsonText = responseText.trim();
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    const sentiment = JSON.parse(jsonText);
    
    return {
      score: sentiment.score ?? 0,
      label: sentiment.label ?? 'neutral',
      confidence: sentiment.confidence ?? 0,
    };
  } catch (error) {
    console.error('Sentiment analysis error:', error);
    return {
      score: 0,
      label: 'neutral',
      confidence: 0,
    };
  }
};

/**
 * Generate review template based on rating
 */
export const generateReviewTemplate = async (
  rating: number,
  category: 'food' | 'delivery'
): Promise<string> => {
  if (!genAI || rating === 0) {
    return '';
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const categoryContext = category === 'food'
      ? 'food, cooking quality, and taste'
      : 'delivery service and professionalism';

    const prompt = `
Generate a helpful review template for a ${rating}-star review about ${categoryContext}.

The template should:
- Be 2-3 sentences
- Match the rating level
- Be specific and constructive
- Leave room for personalization
- Use friendly, natural language

Return ONLY the template text, no quotes or formatting.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('Template generation error:', error);
    return '';
  }
};

/**
 * Check if AI service is available
 */
export const isAIAvailable = (): boolean => {
  return genAI !== null;
};

export default {
  moderateContent,
  getReviewSuggestions,
  enhanceReview,
  analyzeSentiment,
  generateReviewTemplate,
  isAIAvailable,
};

