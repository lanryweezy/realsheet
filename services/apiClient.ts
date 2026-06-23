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
 * Call AI analysis endpoint
 */

/**
 * Enhanced fetch with retry logic for AI services.
 * Retries on transient errors (429, 5xx) with exponential backoff.
 */
const fetchWithRetry = async (
  url: string,
  options: RequestInit,
  retries = 3
): Promise<Response> => {
  let lastError: Error | null = null;
  let delay = 1000; // 1 second initial delay

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(url, options);

      // If successful, return the response
      if (response.ok) {
        return response;
      }

      // Check for transient errors (Rate limit or Server errors)
      if (response.status === 429 || response.status >= 500) {
        throw new Error(`Transient error: ${response.status}`);
      }

      // If it's a non-transient error (e.g. 400 Bad Request), return immediately without retrying
      return response;
    } catch (error: any) {
      lastError = error;
      console.warn(`AI API call failed (attempt ${attempt + 1}/${retries}):`, error.message);

      // Don't wait after the last attempt
      if (attempt < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff (1s, 2s, 4s...)
      }
    }
  }

  // If all retries fail, throw the last error
  throw lastError || new Error('API request failed after retries');
};

export const analyzeData = async (request: AIAnalysisRequest): Promise<AIAnalysisResponse> => {
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
export const suggestFormula = async (request: AIFormulaRequest): Promise<AIFormulaResponse> => {
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
export const transformData = async (request: AITransformRequest): Promise<AITransformResponse> => {
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

export const generateContent = async (request: AIGenerateRequest): Promise<AIGenerateResponse> => {
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
