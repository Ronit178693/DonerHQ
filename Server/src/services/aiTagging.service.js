import { GoogleGenAI } from '@google/genai';

let aiInstance = null;

const getAiClient = () => {
    if (!aiInstance) {
        const apiKey = process.env.API_KEY 
        if (apiKey) {
            aiInstance = new GoogleGenAI({ apiKey });
        }
    }
    return aiInstance;
};

/**
 * Sanitizes tag strings: converts to lowercase, removes special chars, replaces spaces with hyphens
 */
const sanitizeTag = (str) => {
    return String(str)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-');
};

/**
 * Dynamically generates open-domain categories and tags from a text description using Gemini AI.
 * Does NOT rely on or force any hardcoded categories.
 * 
 * @param {string} description - The text content or caption to analyze
 * @returns {Promise<{categories: string[], tags: string[]}>}
 */
export const generateAiTags = async (description) => {
    // Return empty result if text is missing or blank
    if (!description || !description.trim()) {
        return { categories: [], tags: [] };
    }

    const ai = getAiClient();
    // Return empty result gracefully if no API key is set
    if (!ai) {
        console.warn('⚠️ GEMINI_API_KEY / API_KEY is not set. Skipping AI tagging.');
        return { categories: [], tags: [] };
    }

    try {
        const prompt = `
You are an AI classifier for a social impact and fundraising platform.
Analyze the following description text and extract relevant categories and tags based purely on its content.

RULES:
1. Do NOT restrict yourself to any hardcoded or predefined category list.
2. Extract 1 to 3 broad, context-aware categories (e.g., "disaster-relief", "clean-water", "youth-tech", "animal-welfare").
3. Extract 3 to 6 specific search tags or keywords (e.g., "flood-relief", "emergency-shelter", "community").
4. Return ONLY a JSON object in this exact schema:
{
  "categories": ["category1", "category2"],
  "tags": ["tag1", "tag2", "tag3"]
}

Text to analyze: "${description}"
`;

        const response = await ai.models.generateContent({
            model: 'gemini-3.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json'
            }
        });

        // Parse JSON output from Gemini
        const rawData = JSON.parse(response.text);

        // Sanitize categories and tags
        const categories = Array.isArray(rawData.categories)
            ? rawData.categories.map(sanitizeTag).filter(Boolean)
            : [];
        const tags = Array.isArray(rawData.tags)
            ? rawData.tags.map(sanitizeTag).filter(Boolean)
            : [];

        return { categories, tags };
    } catch (error) {
        console.error('❌ Error in generateAiTags service:', error.message);
        // Fail safely without crashing the server
        return { categories: [], tags: [] };
    }
};
