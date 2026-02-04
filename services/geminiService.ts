import { SheetData, AnalysisResult, ChartConfig, FormattingRule } from '../types';

// Define the enhanced analysis result with chain of thought
export interface EnhancedAnalysisResult extends AnalysisResult {
  chainOfThought?: string; // Explanation of the reasoning process
  taskPlan?: string[]; // Step-by-step plan of actions to execute
  confidence?: number; // Confidence level of the analysis (0-1)
  executionSteps?: string[]; // Detailed steps for execution
}

// Enhanced analysis function with chain of thought
export const analyzeDataWithGemini = async (
  prompt: string,
  sheetData: SheetData | null,
  history: any[] = [],
  apiKey?: string
): Promise<EnhancedAnalysisResult> => {
  // If no API key, return mock response with enhanced structure
  if (!apiKey) {
    return generateOfflineFallback(prompt, sheetData);
  }

  try {
    // Prepare context for the AI
    const context = prepareContext(prompt, sheetData, history);
    
    // Create enhanced prompt with chain of thought instructions
    const enhancedPrompt = `
You are an advanced data analysis assistant. When responding to user requests, please follow this structured approach:

1. CHAIN OF THOUGHT: First, think through the request step by step. Explain your reasoning process.
2. TASK PLANNING: Outline the specific steps you'll take to fulfill the request.
3. EXECUTION: Perform the requested analysis or transformation.
4. RESPONSE: Provide the final response with explanations.

CONTEXT:
${context}

USER REQUEST: ${prompt}

Please provide your response in the following format:
CHAIN OF THOUGHT: [Your reasoning process here]
TASK PLAN: [Step-by-step plan here]
EXECUTION STEPS: [Detailed execution steps here]
RESPONSE: [Your final response here]
`;

    // In a real implementation, this would call the Gemini API
    // For now, we'll simulate the enhanced response
    const mockResponse = generateMockEnhancedResponse(prompt, sheetData);
    
    return mockResponse;
  } catch (error) {
    console.error('Gemini API Error:', error);
    return generateOfflineFallback(prompt, sheetData);
  }
};

const prepareContext = (prompt: string, sheetData: SheetData | null, history: any[]) => {
  if (!sheetData) {
    return "No data available. User wants to: " + prompt;
  }

  // Extract relevant context from the sheet data
  const context = `
Dataset Name: ${sheetData.name}
Columns: ${sheetData.columns.join(', ')}
Row Count: ${sheetData.rows.length}
Sample Data: ${JSON.stringify(sheetData.rows.slice(0, 3))}
Previous Interactions: ${JSON.stringify(history.slice(-3))} // Last 3 interactions
Current Request: ${prompt}
  `;

  return context;
};

const generateMockEnhancedResponse = (prompt: string, sheetData: SheetData | null): EnhancedAnalysisResult => {
  // Create a chain of thought based on the prompt
  let chainOfThought = "";
  let taskPlan: string[] = [];
  let executionSteps: string[] = [];
  
  if (prompt.toLowerCase().includes('analyze') || prompt.toLowerCase().includes('summary')) {
    chainOfThought = `I need to analyze the data to provide insights. First, I'll examine the structure of the dataset including columns and sample data. Then I'll look for patterns, trends, or anomalies that might be relevant to the user's request.`;
    taskPlan = [
      "Examine dataset structure",
      "Identify key metrics and patterns", 
      "Generate summary statistics",
      "Provide actionable insights"
    ];
    executionSteps = [
      "Calculate summary statistics for numerical columns",
      "Identify unique values in categorical columns", 
      "Look for correlations between variables",
      "Highlight any unusual data points"
    ];
  } else if (prompt.toLowerCase().includes('filter') || prompt.toLowerCase().includes('find')) {
    chainOfThought = `The user wants to filter or find specific data. I need to understand the criteria for filtering, identify the relevant columns, and construct the appropriate filter logic.`;
    taskPlan = [
      "Identify the column to filter on",
      "Determine the filter criteria",
      "Apply the filter to the dataset",
      "Return the filtered results"
    ];
    executionSteps = [
      "Parse the filter condition from user input",
      "Construct filter function based on condition",
      "Apply filter to the dataset",
      "Return filtered rows with explanation"
    ];
  } else if (prompt.toLowerCase().includes('chart') || prompt.toLowerCase().includes('graph') || prompt.toLowerCase().includes('visualize')) {
    chainOfThought = `The user wants to create a visualization. I need to identify the appropriate chart type based on the data and user request, select the relevant columns for x-axis and y-axis, and configure the chart settings.`;
    taskPlan = [
      "Determine appropriate chart type",
      "Select data columns for visualization",
      "Configure chart settings",
      "Generate chart configuration"
    ];
    executionSteps = [
      "Analyze data types in columns",
      "Match data to appropriate chart type",
      "Select primary and secondary axes",
      "Generate configuration object"
    ];
  } else if (prompt.toLowerCase().includes('calculate') || prompt.toLowerCase().includes('sum') || prompt.toLowerCase().includes('average')) {
    chainOfThought = `The user wants to perform a calculation. I need to identify the target column, determine the calculation type, and possibly define a range or conditions for the calculation.`;
    taskPlan = [
      "Identify target column(s)",
      "Determine calculation type",
      "Apply calculation",
      "Return result with context"
    ];
    executionSteps = [
      "Validate column data types",
      "Construct calculation formula",
      "Apply formula to data",
      "Format and return result"
    ];
  } else {
    chainOfThought = `The user has made a general request. I'll interpret the request, consider possible interpretations, and provide the most helpful response based on the available data.`;
    taskPlan = [
      "Interpret user request",
      "Analyze available data",
      "Formulate appropriate response",
      "Provide helpful information"
    ];
    executionSteps = [
      "Parse user intent from request",
      "Scan data for relevant information",
      "Structure response appropriately",
      "Include relevant examples or suggestions"
    ];
  }

  // Generate a sample response based on the prompt
  let textResponse = `Based on my analysis, I've identified the following insights from your data. `;
  
  if (sheetData && sheetData.rows.length > 0) {
    textResponse += `Your dataset contains ${sheetData.rows.length} rows and ${sheetData.columns.length} columns. `;
    
    // Add more specific insights based on data
    const numericColumns = sheetData.columns.filter(col => {
      const sampleValue = sheetData.rows[0][col];
      return sampleValue !== null && sampleValue !== undefined && !isNaN(Number(sampleValue));
    });
    
    if (numericColumns.length > 0) {
      textResponse += `I found ${numericColumns.length} numeric columns: ${numericColumns.join(', ')}. `;
    }
  } else {
    textResponse += `No data is currently loaded for analysis. `;
  }
  
  textResponse += `Would you like me to perform a specific analysis or transformation?`;

  return {
    textResponse,
    chainOfThought,
    taskPlan,
    executionSteps,
    confidence: 0.85, // Mock confidence score
  };
};

const generateOfflineFallback = (prompt: string, sheetData: SheetData | null): EnhancedAnalysisResult => {
  // Provide intelligent offline responses that mimic AI behavior
  const lowerPrompt = prompt.toLowerCase();
  
  if (lowerPrompt.includes('hello') || lowerPrompt.includes('hi') || lowerPrompt.includes('hey')) {
    return {
      textResponse: "Hello! I'm your data assistant. I can help you analyze your spreadsheet, create visualizations, apply formatting, and more. What would you like to do?",
      chainOfThought: "User initiated greeting. Respond with welcome message and offer assistance.",
      taskPlan: ["Greet user", "Offer help", "Wait for specific request"],
      executionSteps: ["Display welcome message", "List capabilities"],
      confidence: 1.0
    };
  }
  
  if (lowerPrompt.includes('analyze') || lowerPrompt.includes('summary') || lowerPrompt.includes('insight')) {
    const dataSummary = sheetData 
      ? `Your dataset has ${sheetData.rows.length} rows and ${sheetData.columns.length} columns: ${sheetData.columns.join(', ')}.` 
      : "No data is loaded for analysis.";
    
    return {
      textResponse: `I'd be happy to analyze your data. ${dataSummary} Could you specify what particular aspect you'd like me to focus on? For example, you can ask me to calculate averages, find patterns, create charts, or filter specific records.`,
      chainOfThought: "User requested data analysis. Summarize available data and ask for specifics.",
      taskPlan: ["Summarize data", "Request specifics", "Prepare for analysis"],
      executionSteps: ["Count rows/columns", "List column names", "Suggest specific analyses"],
      confidence: 0.9
    };
  }
  
  if (lowerPrompt.includes('chart') || lowerPrompt.includes('graph') || lowerPrompt.includes('visual')) {
    return {
      textResponse: "I can help create various charts from your data. Please specify what type of chart you'd like (e.g., bar, line, pie) and which columns to use for the visualization.",
      chainOfThought: "User wants to create a visualization. Explain the process and request specific details.",
      taskPlan: ["Explain chart creation", "Request chart type", "Request data columns"],
      executionSteps: ["List chart types", "Identify data columns", "Configure visualization"],
      confidence: 0.85
    };
  }
  
  if (lowerPrompt.includes('filter') || lowerPrompt.includes('find') || lowerPrompt.includes('where')) {
    return {
      textResponse: "I can help you filter your data. Please specify which column you want to filter on and what criteria to use. For example: 'Show me all records where Sales > 1000'",
      chainOfThought: "User wants to filter data. Explain the process and request specific filter criteria.",
      taskPlan: ["Identify filter column", "Define filter criteria", "Apply filter"],
      executionSteps: ["Parse filter column", "Extract criteria", "Apply to dataset"],
      confidence: 0.8
    };
  }
  
  // Default response
  return {
    textResponse: `I understand you're asking about "${prompt}". I can help with data analysis, creating charts, applying filters, performing calculations, and more. Could you provide more details about what specific task you'd like me to perform with your data?`,
    chainOfThought: "General request received. Acknowledge understanding and request more specific information.",
    taskPlan: ["Acknowledge request", "Request specifics", "Offer assistance"],
    executionSteps: ["Parse request intent", "Generate helpful response", "Suggest next steps"],
    confidence: 0.75
  };
};


export const generateSmartColumnData = async (
  sheetData: SheetData | null,
  targetColumn: string,
  prompt: string
): Promise<any[]> => {
  // If no data is available, return empty array
  if (!sheetData) return [];
  
  // Generate mock data based on the prompt and existing data patterns
  const rowCount = sheetData.rows.length;
  const mockData: any[] = [];
  
  // Simple heuristic to generate data based on the prompt
  if (prompt.toLowerCase().includes('email')) {
    for (let i = 0; i < rowCount; i++) {
      mockData.push(`user${i}@example.com`);
    }
  } else if (prompt.toLowerCase().includes('name') || prompt.toLowerCase().includes('person')) {
    const names = ['John', 'Jane', 'Bob', 'Alice', 'Charlie', 'Diana', 'Eve', 'Frank'];
    for (let i = 0; i < rowCount; i++) {
      mockData.push(names[i % names.length] + ' ' + names[(i + 3) % names.length]);
    }
  } else if (prompt.toLowerCase().includes('date') || prompt.toLowerCase().includes('time')) {
    for (let i = 0; i < rowCount; i++) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      mockData.push(date.toISOString().split('T')[0]);
    }
  } else if (prompt.toLowerCase().includes('price') || prompt.toLowerCase().includes('cost') || prompt.toLowerCase().includes('amount')) {
    for (let i = 0; i < rowCount; i++) {
      mockData.push(Math.floor(Math.random() * 1000) + 10);
    }
  } else if (prompt.toLowerCase().includes('quantity') || prompt.toLowerCase().includes('count')) {
    for (let i = 0; i < rowCount; i++) {
      mockData.push(Math.floor(Math.random() * 100) + 1);
    }
  } else {
    // Default to generating generic data based on column name
    for (let i = 0; i < rowCount; i++) {
      mockData.push(`Generated ${targetColumn} ${i + 1}`);
    }
  }

  return mockData;
};