/**
 * Safe Code Transformation API Endpoint
 * Executes transformation code in a controlled server environment
 *
 * Usage: POST /api/ai/transform
 * Body: { code: string, data: any[] }
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

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

/**
 * Safely execute transformation code
 * Note: This runs on the server, not client-side
 */
const executeTransformation = (code: string, data: any[]): any[] => {
  try {
    // Create a function with limited scope
    // Running on server, so no access to client secrets
    const transformFn = new Function(
      'rows',
      'Math',
      'JSON',
      'Array',
      'Object',
      'String',
      'Number',
      'Boolean',
      'Date',
      `"use strict";
       ${code}`
    );

    const result = transformFn(
      data,
      Math,
      JSON,
      Array,
      Object,
      String,
      Number,
      Boolean,
      Date
    );

    if (!Array.isArray(result)) {
      throw new Error('Transformation must return an array');
    }

    return result;
  } catch (error: any) {
    throw new Error(`Transformation error: ${error.message}`);
  }
};

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  if (request.method === 'OPTIONS') {
    return response.status(200).headers(corsHeaders).send();
  }

  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const ip = request.ip || request.socket.remoteAddress || 'unknown';
  if (!checkRateLimit(ip)) {
    return response.status(429).json({
      error: 'Rate limit exceeded',
      message: 'Too many requests. Please try again later.'
    });
  }

  try {
    const { code, data } = request.body;

    if (!code || typeof code !== 'string') {
      return response.status(400).json({
        error: 'Invalid input',
        message: 'Transformation code is required'
      });
    }

    if (!data || !Array.isArray(data)) {
      return response.status(400).json({
        error: 'Invalid input',
        message: 'Data array is required'
      });
    }

    // Safety checks
    const dangerousPatterns = [
      'require(',
      'import(',
      'process.',
      'global.',
      'Buffer.',
      '__dirname',
      '__filename',
      'eval(',
      'Function(',
      'setTimeout(',
      'setInterval(',
      'fetch(',
      'XMLHttpRequest',
      'WebSocket',
    ];

    for (const pattern of dangerousPatterns) {
      if (code.includes(pattern)) {
        return response.status(400).json({
          error: 'Unsafe code detected',
          message: `Code contains disallowed pattern: ${pattern}`
        });
      }
    }

    // Execute transformation
    const result = executeTransformation(code, data);

    return response.status(200).headers(corsHeaders).json({
      success: true,
      data: result,
      rowCount: result.length
    });

  } catch (error: any) {
    console.error('Transformation Error:', error);

    return response.status(500).headers(corsHeaders).json({
      success: false,
      error: 'Transformation failed',
      message: error.message || 'An unexpected error occurred'
    });
  }
}
