/**
 * AI Content Generation API Endpoint
 * Secure serverless function for AI content generation
 * 
 * Usage: POST /api/ai/generate
 * Body: { prompt: string, format?: 'text' | 'list' | 'table', context?: string }
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const checkRateLimit = (ip: string): boolean => {
  const now = Date.now();
  const limit = rateLimitMap.get(ip);
  
  if (!limit || now > limit.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + 60000 });
    return true;
  }
  
  if (limit.count >= 10) {
    return false;
  }
  
  limit.count++;
  return true;
};

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  // Set CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.setHeader(key, value);
  });

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const ip = (request.headers['x-forwarded-for'] as string) || request.socket.remoteAddress || 'unknown';
  if (!checkRateLimit(ip)) {
    return response.status(429).json({ 
      error: 'Rate limit exceeded',
      message: 'Too many requests. Please try again later.'
    });
  }

  try {
    const { prompt, format = 'text', context } = request.body;

    if (!prompt || typeof prompt !== 'string') {
      return response.status(400).json({ 
        error: 'Invalid input',
        message: 'Prompt is required'
      });
    }

    const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return response.status(500).json({ 
        error: 'Configuration error',
        message: 'AI service not configured'
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const formatInstruction = format === 'list' 
      ? 'Provide the response as a numbered list.'
      : format === 'table'
      ? 'Provide the response as a markdown table.'
      : 'Provide a clear, concise response.';

    const fullPrompt = `
${context ? `Context: ${context}\n\n` : ''}
Request: ${prompt}

${formatInstruction}
`;

    const result = await model.generateContent(fullPrompt);
    const aiResponse = await result.response;
    const generatedContent = aiResponse.text().trim();

    return response.status(200).json({
      success: true,
      content: generatedContent,
      format,
      prompt
    });

  } catch (error: any) {
    console.error('Content Generation Error:', error);
    
    return response.status(500).json({
      success: false,
      error: 'Content generation failed',
      message: error.message || 'An unexpected error occurred'
    });
  }
}
