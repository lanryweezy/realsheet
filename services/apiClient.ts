/**
 * API Client for AI Services
 * Secure client-side interface for serverless AI functions
 */

const API_BASE = '/api/ai';

/**
 * AI Quality: Resilience & Reliability
 * Helper function to perform fetch with exponential backoff retry for transient errors
 * (429 Too Many Requests, 5xx Server Errors, and Network Errors)
 */
const fetchWithRetry = async (url: string, options: RequestInit, retries = 3, backoff = 1000): Promise<Response> => {
  try {
    const response = await fetch(url, options);

    // Retry on 429 Too Many Requests or 5xx Server Errors
    if (!response.ok && (response.status === 429 || response.status >= 500) && retries > 0) {
      console.warn(`API ${response.status} Error. Retrying in ${backoff}ms... (${retries} retries left)`);
      await new Promise((resolve) => setTimeout(resolve, backoff));
      return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }

    return response;
  } catch (error) {
    // Retry on network errors (fetch throws TypeError on network failure)
    if (retries > 0) {
      console.warn(`API Network Error: ${error}. Retrying in ${backoff}ms... (${retries} retries left)`);
      await new Promise((resolve) => setTimeout(resolve, backoff));
      return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }
    throw error;
  }
};


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
