/**
 * AI-Powered Formula Functions
 * Inspired by Numerous.ai, Julius AI, and other AI spreadsheet tools
 */

import { generateContent as generateContentViaAPI } from './apiClient';
import { SheetData, Row } from '../types';

/**
 * =AI(prompt, [context])
 * General purpose AI function for any query
 * Example: =AI("What is the capital of France?")
 * Example: =AI("Summarize this text", A1)
 */
export const evaluateAI = async (prompt: string, context?: string): Promise<string> => {
  try {
    const response = await generateContentViaAPI({
      prompt,
      context,
      format: 'text',
    });

    if (response.success && response.content) {
      return response.content;
    }
    
    return '#AI_ERROR!';
  } catch (error) {
    console.error('AI function error:', error);
    return '#AI_ERROR!';
  }
};

/**
 * =INFER(data_range, target_column, prediction_row)
 * Predict values based on patterns in data
 * Example: =INFER(A1:C10, "Sales", A11)
 */
export const evaluateINFER = async (
  dataRange: any[][],
  targetColumn: string,
  predictionData: any[]
): Promise<number | string> => {
  try {
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `Given this data:
${JSON.stringify(dataRange, null, 2)}

Predict the value for column "${targetColumn}" given this input:
${JSON.stringify(predictionData)}

Respond with ONLY the predicted value, no explanation.`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    
    // Try to parse as number
    const num = parseFloat(text);
    return isNaN(num) ? text : num;
  } catch (error) {
    console.error('INFER function error:', error);
    return '#INFER_ERROR!';
  }
};

/**
 * =CLASSIFY(text, categories)
 * Classify text into predefined categories
 * Example: =CLASSIFY(A1, "Positive, Negative, Neutral")
 */
export const evaluateCLASSIFY = async (text: string, categories: string): Promise<string> => {
  try {
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `Classify the following text into one of these categories: ${categories}

Text: "${text}"

Respond with ONLY the category name, nothing else.`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('CLASSIFY function error:', error);
    return '#CLASSIFY_ERROR!';
  }
};

/**
 * =SENTIMENT(text)
 * Analyze sentiment of text
 * Returns: Positive, Negative, or Neutral with confidence score
 * Example: =SENTIMENT(A1)
 */
export const evaluateSENTIMENT = async (text: string): Promise<string> => {
  try {
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `Analyze the sentiment of this text and respond with ONLY one word: Positive, Negative, or Neutral

Text: "${text}"`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('SENTIMENT function error:', error);
    return '#SENTIMENT_ERROR!';
  }
};

/**
 * =EXTRACT(text, what_to_extract)
 * Extract specific information from text
 * Example: =EXTRACT(A1, "email address")
 * Example: =EXTRACT(A1, "phone number")
 */
export const evaluateEXTRACT = async (text: string, whatToExtract: string): Promise<string> => {
  try {
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `Extract the ${whatToExtract} from this text. If not found, return "Not found".

Text: "${text}"

Respond with ONLY the extracted value, nothing else.`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('EXTRACT function error:', error);
    return '#EXTRACT_ERROR!';
  }
};

/**
 * =TRANSLATE(text, target_language)
 * Translate text to target language
 * Example: =TRANSLATE(A1, "Spanish")
 * Example: =TRANSLATE(A1, "French")
 */
export const evaluateTRANSLATE = async (text: string, targetLanguage: string): Promise<string> => {
  try {
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `Translate this text to ${targetLanguage}. Respond with ONLY the translation, no explanation.

Text: "${text}"`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('TRANSLATE function error:', error);
    return '#TRANSLATE_ERROR!';
  }
};

/**
 * =SUMMARIZE(text, [max_words])
 * Summarize text to specified length
 * Example: =SUMMARIZE(A1, 50)
 */
export const evaluateSUMMARIZE = async (text: string, maxWords: number = 50): Promise<string> => {
  try {
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `Summarize this text in ${maxWords} words or less:

"${text}"

Respond with ONLY the summary, no preamble.`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('SUMMARIZE function error:', error);
    return '#SUMMARIZE_ERROR!';
  }
};

/**
 * =GENERATE(prompt, [format])
 * Generate content based on prompt
 * Example: =GENERATE("Write a product description for a blue t-shirt")
 * Example: =GENERATE("Create 5 marketing slogans", "list")
 */
export const evaluateGENERATE = async (prompt: string, format: string = 'text'): Promise<string> => {
  try {
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const fullPrompt = format === 'list'
      ? `${prompt}\n\nProvide the response as a numbered list.`
      : prompt;
    
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('GENERATE function error:', error);
    return '#GENERATE_ERROR!';
  }
};

/**
 * =ANALYZE(data_range, analysis_type)
 * Perform statistical analysis on data
 * Example: =ANALYZE(A1:A100, "outliers")
 * Example: =ANALYZE(A1:B100, "correlation")
 */
export const evaluateANALYZE = async (dataRange: any[][], analysisType: string): Promise<string> => {
  try {
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `Perform ${analysisType} analysis on this data and provide key insights:

${JSON.stringify(dataRange, null, 2)}

Provide a concise summary of findings.`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('ANALYZE function error:', error);
    return '#ANALYZE_ERROR!';
  }
};

/**
 * =FORECAST(historical_data, periods_ahead)
 * Forecast future values based on historical data
 * Example: =FORECAST(A1:A12, 3)
 */
export const evaluateFORECAST = async (historicalData: number[], periodsAhead: number): Promise<string> => {
  try {
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `Given this historical data: ${historicalData.join(', ')}

Forecast the next ${periodsAhead} values. Respond with ONLY the forecasted values separated by commas, no explanation.`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('FORECAST function error:', error);
    return '#FORECAST_ERROR!';
  }
};

/**
 * =EXPLAIN(formula)
 * Explain what a formula does in plain English
 * Example: =EXPLAIN("=VLOOKUP(A1, B:C, 2, FALSE)")
 */
export const evaluateEXPLAIN = async (formula: string): Promise<string> => {
  try {
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `Explain this spreadsheet formula in simple terms:

${formula}

Provide a clear, concise explanation that a non-technical person can understand.`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('EXPLAIN function error:', error);
    return '#EXPLAIN_ERROR!';
  }
};

/**
 * =SUGGEST_FORMULA(description, sample_data)
 * Suggest a formula based on description
 * Example: =SUGGEST_FORMULA("sum all values greater than 100", A1:A10)
 */
export const evaluateSUGGEST_FORMULA = async (description: string, sampleData?: string): Promise<string> => {
  try {
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `Suggest an Excel/Google Sheets formula for this task: "${description}"
${sampleData ? `\nSample data range: ${sampleData}` : ''}

Respond with ONLY the formula, starting with =, no explanation.`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('SUGGEST_FORMULA function error:', error);
    return '#SUGGEST_ERROR!';
  }
};

/**
 * =FIX_FORMULA(broken_formula, error_message)
 * Fix a broken formula
 * Example: =FIX_FORMULA("=SUM(A1:A10", "#ERROR!")
 */
export const evaluateFIX_FORMULA = async (brokenFormula: string, errorMessage: string): Promise<string> => {
  try {
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `Fix this broken formula:

Formula: ${brokenFormula}
Error: ${errorMessage}

Respond with ONLY the corrected formula, starting with =, no explanation.`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('FIX_FORMULA function error:', error);
    return '#FIX_ERROR!';
  }
};

/**
 * Helper function to evaluate AI formulas from cell values
 */
export const evaluateAIFormula = async (
  formula: string,
  sheetData: SheetData,
  currentRow: number
): Promise<any> => {
  const upperFormula = formula.toUpperCase();
  
  try {
    // Extract function name and arguments
    const match = formula.match(/^=([A-Z_]+)\((.*)\)$/i);
    if (!match) return '#ERROR!';
    
    const funcName = match[1].toUpperCase();
    const argsStr = match[2];
    
    // Parse arguments (simplified - doesn't handle nested functions)
    const args = argsStr.split(',').map(arg => arg.trim().replace(/^["']|["']$/g, ''));
    
    switch (funcName) {
      case 'AI':
        return await evaluateAI(args[0], args[1]);
      
      case 'CLASSIFY':
        return await evaluateCLASSIFY(args[0], args[1]);
      
      case 'SENTIMENT':
        return await evaluateSENTIMENT(args[0]);
      
      case 'EXTRACT':
        return await evaluateEXTRACT(args[0], args[1]);
      
      case 'TRANSLATE':
        return await evaluateTRANSLATE(args[0], args[1]);
      
      case 'SUMMARIZE':
        const maxWords = args[1] ? parseInt(args[1]) : 50;
        return await evaluateSUMMARIZE(args[0], maxWords);
      
      case 'GENERATE':
        return await evaluateGENERATE(args[0], args[1]);
      
      case 'EXPLAIN':
        return await evaluateEXPLAIN(args[0]);
      
      case 'SUGGEST_FORMULA':
        return await evaluateSUGGEST_FORMULA(args[0], args[1]);
      
      case 'FIX_FORMULA':
        return await evaluateFIX_FORMULA(args[0], args[1]);
      
      default:
        return '#UNKNOWN_AI_FUNCTION!';
    }
  } catch (error) {
    console.error('AI formula evaluation error:', error);
    return '#AI_ERROR!';
  }
};

/**
 * Check if a formula is an AI formula
 */
export const isAIFormula = (formula: string): boolean => {
  const aiFormulas = [
    'AI', 'INFER', 'CLASSIFY', 'SENTIMENT', 'EXTRACT',
    'TRANSLATE', 'SUMMARIZE', 'GENERATE', 'ANALYZE',
    'FORECAST', 'EXPLAIN', 'SUGGEST_FORMULA', 'FIX_FORMULA'
  ];
  
  const upperFormula = formula.toUpperCase();
  return aiFormulas.some(func => upperFormula.startsWith(`=${func}(`));
};
