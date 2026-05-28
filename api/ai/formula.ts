/**
 * AI Formula Suggestion API Endpoint
 * Secure serverless function for AI formula generation
 * 
 * Usage: POST /api/ai/formula
 * Body: { description: string, data?: SheetData }
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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

  try {
    const { description, data } = request.body;

    if (!description || typeof description !== 'string') {
      return response.status(400).json({ 
        error: 'Invalid input',
        message: 'Description is required'
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

    const context = data ? `
Spreadsheet Context:
- Columns: ${data.columns?.join(', ')}
- Sample Data: ${JSON.stringify(data.rows?.slice(0, 2))}
` : '';

    const prompt = `
${context}

Generate an Excel/Google Sheets formula for: "${description}"

Respond with ONLY the formula starting with =, no explanation.
If multiple formulas are needed, provide them as a JSON array.

Example responses:
- "=SUM(A1:A10)"
- "=IF(A1>10, "Yes", "No")"
- "=XLOOKUP(A1, B:B, C:C, "Not found")"
`;

    const result = await model.generateContent(prompt);
    const aiResponse = await result.response;
    let formula = aiResponse.text().trim();

    // Clean up response
    formula = formula.replace(/^["']|["']$/g, '').trim();
    
    // Remove markdown code blocks if present
    formula = formula.replace(/```(?:excel)?\n?/g, '').trim();

    return response.status(200).json({
      success: true,
      formula,
      description
    });

  } catch (error: any) {
    console.error('Formula Generation Error:', error);
    
    return response.status(500).json({
      success: false,
      error: 'Formula generation failed',
      message: error.message || 'An unexpected error occurred'
    });
  }
}
