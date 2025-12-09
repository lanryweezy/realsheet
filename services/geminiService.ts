import { GoogleGenAI, Type } from "@google/genai";
import { SheetData, ChartConfig, AnalysisResult } from "../types";

const MODEL_NAME = "gemini-2.5-flash";

// Helper to initialize Gemini safely
const getAiClient = () => {
  let apiKey: string | undefined;
  try {
    // Safely check for process.env to avoid ReferenceError in pure browser environments
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env) {
        // @ts-ignore
        apiKey = process.env.API_KEY;
    }
  } catch (e) {
    // Ignore error if process is not defined
  }

  // Prevent crash if key is missing during initial load/render
  if (!apiKey) {
    console.warn("Gemini API Key is missing. AI features will be disabled.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Sends a portion of the spreadsheet data to Gemini for analysis or chat.
 */
export const analyzeDataWithGemini = async (
  prompt: string,
  sheetData: SheetData | null,
  history: { role: string; parts: { text: string }[] }[] = []
): Promise<AnalysisResult> => {
  if (!sheetData) {
    throw new Error("No data available to analyze.");
  }

  const ai = getAiClient();
  if (!ai) {
    return {
      textResponse: "⚠️ API Key is missing or not configured. AI features are currently disabled. You can still use the spreadsheet features manually.",
      chartConfig: undefined,
      transformationCode: undefined
    };
  }

  // Optimize context: Send headers and top 50 rows to save tokens/bandwidth
  const dataPreview = sheetData.rows.slice(0, 50);
  const dataContext = `
    CURRENT SPREADSHEET DATA (First 50 rows):
    Columns: ${sheetData.columns.join(", ")}
    Data: ${JSON.stringify(dataPreview)}
    
    Total Rows in file: ${sheetData.rows.length}
    Current Formatting Rules: ${JSON.stringify(sheetData.formattingRules || [])}
    Current Filter: ${sheetData.filter ? sheetData.filter.description : "None"}
  `;

  const systemInstruction = `
    You are NexSheet Agent, an advanced AI data analyst embedded in a futuristic spreadsheet application.
    Your goal is to help users understand their data, find trends, visualize information, AND MODIFY/CLEAN data if requested.
    
    CAPABILITIES:
    1. **Answer questions** about the data provided.
    2. **Visualizations**: If the user asks for a chart/graph, return 'chartConfig'.
    3. **Transformations**: If the user asks to MODIFY, CLEAN, ADD COLUMNS, or use EXCEL FUNCTIONS, return 'transformationCode'.
    4. **Formatting**: If the user asks to highlight cells/rows, return 'formattingRules'.
    5. **Filtering**: If the user asks to "Show only...", "Filter for...", or "Find rows where...", return 'filterCode'.
    6. **Comments**: If the user asks to "Flag", "Mark", or "Comment on" specific cells (e.g., "Flag outliers"), return 'generatedComments'.
    
    CODE RULES:
    - 'transformationCode': JS code body. Input: 'rows'. Output: 'rows'.
    - 'filterCode': JS boolean expression. Input variable 'row'. Example: "Number(row['Sales']) > 500 && row['Region'] === 'North'".
    
    GENERATED COMMENTS:
    - Return an array of objects with { rowIndex, colIndex, text }.
    - Indices must be 0-based.
    - Example: Flagging row 0, col 1 (B2) -> { rowIndex: 0, colIndex: 1, text: "High variance" }
    
    FORMATTING:
    - Strictly use the JSON schema provided.
    - Be concise, professional, and helpful. 
  `;

  const contents = [
    { role: 'user', parts: [{ text: `Context: ${dataContext}` }] },
    ...history.map(h => ({
        role: h.role === 'model' ? 'model' : 'user',
        parts: h.parts
    })),
    { role: 'user', parts: [{ text: prompt }] }
  ];

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: contents as any,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            textResponse: {
              type: Type.STRING,
              description: "The conversational answer to the user."
            },
            chartConfig: {
              type: Type.OBJECT,
              description: "Optional configuration if a chart is appropriate.",
              properties: {
                type: { type: Type.STRING, enum: ["bar", "line", "area", "pie"] },
                dataKey: { type: Type.STRING, description: "The numeric key to plot (Y-axis)" },
                xAxisKey: { type: Type.STRING, description: "The category key to plot (X-axis)" },
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                colors: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              nullable: true
            },
            transformationCode: {
                type: Type.STRING,
                description: "JavaScript code body. Input variable: 'rows' (Array<Object>). Must return Array<Object>.",
                nullable: true
            },
            filterCode: {
                type: Type.STRING,
                description: "JavaScript boolean expression to filter rows. Input variable: 'row'. Returns boolean.",
                nullable: true
            },
            formattingRules: {
                type: Type.ARRAY,
                description: "Array of conditional formatting rules to apply.",
                nullable: true,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        id: { type: Type.STRING },
                        type: { type: Type.STRING, enum: ['greaterThan', 'lessThan', 'equals', 'containsText', 'colorScale', 'dataBar'] },
                        column: { type: Type.STRING },
                        value1: { type: Type.STRING }, 
                        style: {
                            type: Type.OBJECT,
                            properties: {
                                backgroundColor: { type: Type.STRING },
                                textColor: { type: Type.STRING }
                            }
                        },
                        scaleColors: { type: Type.ARRAY, items: { type: Type.STRING } },
                        barColor: { type: Type.STRING }
                    }
                }
            },
            generatedComments: {
                type: Type.ARRAY,
                description: "List of comments to attach to specific cells.",
                nullable: true,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        rowIndex: { type: Type.INTEGER },
                        colIndex: { type: Type.INTEGER },
                        text: { type: Type.STRING }
                    }
                }
            }
          }
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      textResponse: "I encountered an error analyzing the data. Please ensure the API key is valid and try again.",
      chartConfig: undefined,
      transformationCode: undefined
    };
  }
};

/**
 * Generates data for a new column based on existing data and a prompt.
 */
export const generateSmartColumnData = async (
    sheetData: SheetData,
    targetColumn: string,
    prompt: string
): Promise<string[]> => {
    const ai = getAiClient();
    if (!ai) {
        console.error("API Key missing for Smart Fill");
        return [];
    }

    // We can only process a limited amount of rows reliably in one go for this demo.
    // Let's cap at 50 for speed and consistency.
    const rowsToProcess = sheetData.rows.slice(0, 50);
    
    const context = `
        You are a data enrichment engine.
        Existing Columns: ${sheetData.columns.join(", ")}
        Data Sample: ${JSON.stringify(rowsToProcess)}
        
        TASK: Generate values for a NEW column named "${targetColumn}".
        INSTRUCTION: "${prompt}"
        
        REQUIREMENTS:
        - Return strictly a JSON array of strings/numbers.
        - The array length MUST match the number of input rows exactly (${rowsToProcess.length}).
        - If data cannot be determined, use null or "".
        - Return ONLY the array.
    `;

    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: [{ role: 'user', parts: [{ text: context }] }],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            }
        });

        const generatedData = JSON.parse(response.text);
        if (!Array.isArray(generatedData)) return [];
        return generatedData;

    } catch (error) {
        console.error("Smart Fill Error:", error);
        return [];
    }
}

/**
 * Generates a spreadsheet formula from a natural language description.
 */
export const generateFormulaFromDescription = async (
    description: string,
    columns: string[]
): Promise<string> => {
    const ai = getAiClient();
    if (!ai) return "";

    const context = `
        You are an expert spreadsheet formula generator.
        Columns available: ${columns.join(", ")}
        User Request: "${description}"
        
        Rules:
        1. Return ONLY the formula starting with '='.
        2. Use standard functions like SUM, AVERAGE, MIN, MAX, COUNT.
        3. For column references, map the column Name to Excel letters roughly (assuming A, B, C order matches input columns). 
           However, my system handles references like SUM(A1:A10). 
           You MUST try to infer which range the user means based on column names.
           Example: "Sum of Sales" -> if Sales is 2nd column (B), return "=SUM(B:B)" or "=SUM(B1:B100)".
           
           Better yet, since we use Column Names as keys in the JSON, but the formula engine uses A1 notation, 
           you should map the provided columns array index to letters (A, B, C...).
           
           Columns: ${columns.map((c, i) => `${c} -> ${String.fromCharCode(65+i)}`).join(", ")}
           
        4. If ambiguous, pick the most likely valid formula.
        5. Return ONLY the formula string. No markdown.
    `;

    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: [{ role: 'user', parts: [{ text: context }] }],
        });

        return response.text.trim();
    } catch (error) {
        console.error("Formula Gen Error:", error);
        return "";
    }
};