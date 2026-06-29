/**
 * API Client for AI Services
 * Secure client-side interface for serverless AI functions
 */

const API_BASE = '/api/ai';

/**
 * Helper to fetch with exponential backoff for transient errors (429, 5xx)
 */
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const response = await fetch(url, options);

      // If successful or client error (except 429), return immediately
      if (response.ok || (response.status >= 400 && response.status < 500 && response.status !== 429)) {
        return response;
      }

      // If we're out of retries, return the failed response
      if (attempt === maxRetries - 1) {
        return response;
      }

      // Calculate backoff: 1s, 2s, 4s...
      const backoffMs = Math.pow(2, attempt) * 1000;
      // Add jitter to prevent thundering herd
      const jitterMs = Math.random() * 500;

      await new Promise(resolve => setTimeout(resolve, backoffMs + jitterMs));
      attempt++;
    } catch (error) {
      // Network errors (e.g. failed to fetch)
      if (attempt === maxRetries - 1) {
        throw error;
      }

      const backoffMs = Math.pow(2, attempt) * 1000;
      const jitterMs = Math.random() * 500;
      await new Promise(resolve => setTimeout(resolve, backoffMs + jitterMs));
      attempt++;
    }
  }

  throw new Error('Maximum retries exceeded');
}

export interface AIAnalysisRequest {
  prompt: string;
  data?: any;
  history?: any[];
}

export interface AIAnalysisResponse {
  success: boolean;
  data?: {
    textResponse: string;
    chartConfig?: any;
    transformationCode?: string;
    confidence?: number;
  };
  error?: string;
  message?: string;
}

export interface AIFormulaRequest {
  description: string;
  data?: any;
}

export interface AIFormulaResponse {
  success: boolean;
  formula?: string;
  description?: string;
  error?: string;
  message?: string;
}

export interface AIGenerateRequest {
  prompt: string;
  format?: 'text' | 'list' | 'table';
  context?: string;
}

export interface AIGenerateResponse {
  success: boolean;
  content?: string;
  format?: string;
  prompt?: string;
  error?: string;
  message?: string;
}

/**
 * Call AI analysis endpoint
 */
export const analyzeData = async (
  request: AIAnalysisRequest
): Promise<AIAnalysisResponse> => {
  try {
    const response = await fetchWithRetry(`${API_BASE}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Analysis failed');
    }

    return result;
  } catch (error: any) {
    console.error('AI Analysis Error:', error);
    return {
      success: false,
      error: 'Analysis failed',
      message: error.message || 'An unexpected error occurred',
    };
  }
};

/**
 * Get AI formula suggestion
 */
export const suggestFormula = async (
  request: AIFormulaRequest
): Promise<AIFormulaResponse> => {
  try {
    const response = await fetchWithRetry(`${API_BASE}/formula`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Formula generation failed');
    }

    return result;
  } catch (error: any) {
    console.error('Formula Generation Error:', error);
    return {
      success: false,
      error: 'Formula generation failed',
      message: error.message || 'An unexpected error occurred',
    };
  }
};

/**
 * Generate content with AI
 */
export interface AITransformRequest {
  code: string;
  data: any[];
}

export interface AITransformResponse {
  success: boolean;
  data?: any[];
  rowCount?: number;
  error?: string;
  message?: string;
}

/**
 * Execute safe code transformation
 */
export const transformData = async (
  request: AITransformRequest
): Promise<AITransformResponse> => {
  try {
    const response = await fetchWithRetry(`${API_BASE}/transform`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Transformation failed');
    }

    return result;
  } catch (error: any) {
    console.error('AI Transformation Error:', error);
    return {
      success: false,
      error: 'Transformation failed',
      message: error.message || 'An unexpected error occurred',
    };
  }
};

export const generateContent = async (
  request: AIGenerateRequest
): Promise<AIGenerateResponse> => {
  try {
    const response = await fetchWithRetry(`${API_BASE}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Content generation failed');
    }

    return result;
  } catch (error: any) {
    console.error('Content Generation Error:', error);
    return {
      success: false,
      error: 'Content generation failed',
      message: error.message || 'An unexpected error occurred',
    };
  }
};

/**
 * Health check for AI services
 */
export const checkAIServiceHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE}/health`, {
      method: 'OPTIONS',
    });
    return response.ok;
  } catch {
    return false;
  }
};

export default {
  analyzeData,
  suggestFormula,
  transformData,
  generateContent,
  checkAIServiceHealth,
};
