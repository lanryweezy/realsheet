// Data structures for the spreadsheet
export type CellValue = string | number | null;

export interface Row {
  [key: string]: CellValue; // Dynamic keys based on column headers
}

export type ConditionType = 'greaterThan' | 'lessThan' | 'equals' | 'containsText' | 'colorScale' | 'dataBar';

export interface FormattingRule {
  id: string;
  type: ConditionType;
  column: string;
  value1?: number | string;
  style?: {
    backgroundColor?: string;
    textColor?: string;
  };
  // For color scales (e.g., #ff0000 to #00ff00)
  scaleColors?: [string, string]; 
  // For data bars
  barColor?: string;
}

export interface FilterDefinition {
    description: string;
    code: string; // JavaScript boolean expression string, e.g. "row['Age'] > 18"
}

export interface SheetData {
  id?: string; // Unique ID for persistence
  lastModified?: number;
  name: string;
  columns: string[];
  rows: Row[];
  formattingRules?: FormattingRule[];
  filter?: FilterDefinition; // Active filter
  comments?: Record<string, string>; // Key: "rowIndex-colIndex", Value: Comment text
  watchedCells?: string[]; // Array of cell addresses e.g. ["A1", "C5"]
  columnWidths?: Record<string, number>; // Column widths in pixels
}

// New: Workbook structure
export interface Workbook {
  id: string;
  name: string;
  sheets: SheetData[];
  activeSheetIndex: number;
  createdAt: Date;
  lastModified: Date;
}

export interface FileMetadata {
    id: string;
    name: string;
    lastModified: number;
    rowCount: number;
    preview: string[]; // First few column names
}

export interface ChartConfig {
  type: 'bar' | 'line' | 'area' | 'pie';
  dataKey: string;
  xAxisKey: string;
  title: string;
  description: string;
  colors?: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  chartConfig?: ChartConfig; // Optional chart to render with the message
  isThinking?: boolean;
}

export interface AnalysisResult {
  textResponse: string;
  chartConfig?: ChartConfig;
  transformationCode?: string; // JavaScript code to transform the entire 'rows' array
  formattingRules?: FormattingRule[];
  filterCode?: string; // JavaScript boolean expression for filtering
  generatedComments?: { rowIndex: number; colIndex: number; text: string }[];
}

export interface DashboardItem {
  id: string;
  chartConfig: ChartConfig;
  createdAt: Date;
}

export interface SelectionRange {
    start: { rowIndex: number; colIndex: number };
    end: { rowIndex: number; colIndex: number };
}

// Data Validation
export type ValidationType = 'list' | 'number' | 'date' | 'textLength' | 'custom';

export interface DataValidation {
  id: string;
  range: string; // e.g., "A1:B10"
  type: ValidationType;
  criteria: {
    operator?: string; // for number/date: ">", "<", "=", etc.
    value1?: string | number;
    value2?: string | number;
    listValues?: string[]; // for list validation
    formula?: string; // for custom validation
  };
  errorMessage?: string;
  showErrorMessage: boolean;
}