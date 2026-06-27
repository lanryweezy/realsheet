/**
 * API Client for AI Services
 * Secure client-side interface for serverless AI functions
 */

const API_BASE = '/api/ai';

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
 * Helper to fetch with exponential backoff for transient errors
 */
const fetchWithRetry = async (
  url: string,
  options: RequestInit,
  maxRetries = 3,
  baseDelay = 1000
): Promise<Response> => {
  let lastError: Error | null = null;
  let response: Response | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      response = await fetch(url, options);

      // Stop retrying if request was successful
      if (response.ok) {
        return response;
      }

      // Retry on 429 (Rate Limit) or 5xx (Server Errors)
      if (response.status !== 429 && !(response.status >= 500 && response.status < 600)) {
        return response;
      }

    } catch (error: any) {
      lastError = error;
    }

    // If we've hit max retries, don't wait
    if (attempt === maxRetries) {
      break;
    }

    // Exponential backoff
    const delay = baseDelay * Math.pow(2, attempt);
    // Add jitter
    const jitter = Math.random() * 200;
    await new Promise(resolve => setTimeout(resolve, delay + jitter));
  }

  if (response) {
    return response;
  }

  throw lastError || new Error('Request failed after retries');
};

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
