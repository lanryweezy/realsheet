/**
 * AI Analysis API Endpoint
 * Secure serverless function for AI data analysis
 * 
 * Usage: POST /api/ai/analyze
 * Body: { prompt: string, data: SheetData, history?: any[] }
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Enable CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Rate limiting simple implementation
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const checkRateLimit = (ip: string): boolean => {
  const now = Date.now();
  const limit = rateLimitMap.get(ip);
  
  if (!limit || now > limit.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + 60000 }); // 1 minute window
    return true;
  }
  
  if (limit.count >= 10) { // 10 requests per minute
    return false;
  }
  
  limit.count++;
  return true;
};

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return response.status(200).headers(corsHeaders).send();
  }

  // Only allow POST
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting
  const ip = request.ip || request.socket.remoteAddress || 'unknown';
  if (!checkRateLimit(ip)) {
    return response.status(429).json({ 
      error: 'Rate limit exceeded',
      message: 'Too many requests. Please try again later.'
    });
  }

  try {
    const { prompt, data, history = [] } = request.body;

    // Validate input
    if (!prompt || typeof prompt !== 'string') {
      return response.status(400).json({ 
        error: 'Invalid input',
        message: 'Prompt is required and must be a string'
      });
    }

    // Get API key from environment (server-side, secure)
    const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error('Gemini API key not configured');
      return response.status(500).json({ 
        error: 'Configuration error',
        message: 'AI service not configured'
      });
    }

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Prepare context
    const context = data ? `
Data Context:
- Columns: ${data.columns?.join(', ') || 'N/A'}
- Rows: ${data.rows?.length || 0}
- Sample: ${JSON.stringify(data.rows?.slice(0, 3) || [])}
` : '';

    // Create enhanced prompt inspired by Spreadsheet-RL
    const enhancedPrompt = `
You are an advanced spreadsheet automation agent (NexAgent). Your goal is to edit workbooks to satisfy the user's request.

${context}

Role: Edit Excel workbooks to satisfy the user's requested end state. The workbook itself is the answer; do not answer conceptually.

Tool Router Rules:
- Inspection: Use find_cells to locate headers, anchors, or text. Use inspect_range to inspect small relevant ranges.
- Edits: Use fill_formula when target cells should contain formulas. Use clear_range when the desired end state is blank cells. Use delete_rows/delete_columns when the workbook should physically lose rows or columns.
- Verification and fallback: Use recalculate_and_read after formula edits to recalculate and read back specified ranges. Use code_interpreter for custom logic.

Tool Calling:
Write-related calls (fill_formula, clear_range, delete_rows, delete_columns) must be issued one at a time.

Workflow:
1. Inspect small relevant workbook ranges to understand context.
2. Plan the smallest necessary edit.
3. Modify the workbook.
4. Verify values, formulas, or formatting.
5. Fix iteratively if needed.

User Request: ${prompt}

Respond in strict JSON format:
{
  "chainOfThought": "Detailed explanation of your reasoning process",
  "taskPlan": ["Step 1", "Step 2", ...],
  "textResponse": "Your final response to the user",
  "toolCalls": [
    { "tool": "inspect_range", "parameters": { "range": "A1:B10" } },
    ...
  ] (optional),
  "chartConfig": { "type": "bar", "dataKey": "...", "xAxisKey": "...", "title": "...", "description": "..." } (optional),
  "transformationCode": "function(rows) { ... }" (optional),
  "confidence": 0.95
}

Note: For tool calls involving ranges, use A1 notation (e.g., "A1:C5"). For delete_rows, provide "startIndex" and "count". For delete_columns, provide an array of column headers in "columns".
`;

    // Generate response
    const result = await model.generateContent(enhancedPrompt);
    const aiResponse = await result.response;
    let responseText = aiResponse.text();

    // Try to parse as JSON
    let parsedResponse;
    try {
      // Extract JSON from response if it contains markdown
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        responseText = jsonMatch[0];
      }
      parsedResponse = JSON.parse(responseText);
    } catch {
      // If parsing fails, return as text response
      parsedResponse = {
        textResponse: responseText,
        confidence: 0.8
      };
    }

    // Return successful response
    return response.status(200).headers(corsHeaders).json({
      success: true,
      data: parsedResponse
    });

  } catch (error: any) {
    console.error('AI Analysis Error:', error);
    
    return response.status(500).headers(corsHeaders).json({
      success: false,
      error: 'Analysis failed',
      message: error.message || 'An unexpected error occurred'
    });
  }
}
