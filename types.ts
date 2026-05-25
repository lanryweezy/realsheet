// Data structures for the spreadsheet
export type CellValue = string | number | null;

export interface Row {
  [key: string]: CellValue; // Dynamic keys based on column headers
}

export type ConditionType = 'greaterThan' | 'lessThan' | 'equals' | 'containsText' | 'colorScale' | 'dataBar' | 'iconSet';

export type IconSetStyle = 'arrows' | 'arrows3' | 'traffic' | 'flags' | 'dots';

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
  // For icon sets
  iconSetStyle?: IconSetStyle;
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
  /** Print area: only this range is included when printing or exporting to PDF */
  printArea?: { start: { row: number; col: number }; end: { row: number; col: number } };
  cellStyles?: Record<string, any>; // Key: "rowIndex-colKey", Value: CSS properties
  tabColor?: string; // Hex color for the sheet tab indicator
}

// New: Workbook structure
export interface Workbook {
  id: string;
  name: string;
  sheets: SheetData[];
  activeSheetIndex: number;
  createdAt: Date;
  lastModified: Date;
  frozenPanes?: {
    rows: number; // Number of frozen rows
    cols: number; // Number of frozen columns
  };
}

export interface FileMetadata {
  id: string;
  name: string;
  lastModified: number;
  lastOpened?: number;
  rowCount: number;
  preview: string[]; // First few column names
  pinned?: boolean;
  inTrash?: boolean;
}

export interface ChartConfig {
  type: 'bar' | 'line' | 'area' | 'pie' | 'scatter' | 'bubble' | 'combo' | 'waterfall' | 'funnel' | 'gauge' | 'heatmap' | 'sparkline';
  dataKey: string;
  xAxisKey: string;
  title: string;
  description: string;
  colors?: string[];
  // Additional config for new chart types
  secondDataKey?: string; // For combo charts
  targetValue?: number; // For gauge charts
  segments?: Array<{ label: string; value: number }>; // For funnel/waterfall
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  gradient?: boolean; // For area charts
  curveType?: 'monotone' | 'linear' | 'step' | 'natural';
}

export interface PivotField {
  field: string;
  operation: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'first' | 'last';
}

export interface PivotConfig {
  rowFields: string[];
  columnFields: string[];
  valueFields: PivotField[];
  filterFields?: Record<string, any[]>;
  dateField?: string;
  dateRange?: { start: string; end: string };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  chartConfig?: ChartConfig; // Optional chart to render with the message
  isThinking?: boolean;
  toolCalls?: AgentToolCall[]; // Added for audit log
  turnResult?: string; // Added for audit log
}

export interface AgentToolCall {
  tool: 'fill_formula' | 'clear_range' | 'delete_rows' | 'delete_columns' | 'inspect_range' | 'find_cells' | 'recalculate_and_read' | 'code_interpreter' | 'switch_active_sheet' | 'get_sheet_list';
  parameters: any;
}

export interface AnalysisResult {
  textResponse: string;
  chartConfig?: ChartConfig;
  transformationCode?: string; // JavaScript code to transform the entire 'rows' array
  formattingRules?: FormattingRule[];
  filterCode?: string; // JavaScript boolean expression for filtering
  generatedComments?: { rowIndex: number; colIndex: number; text: string }[];
  toolCalls?: AgentToolCall[]; // Spreadsheet-native tool calls
}

// Enhanced analysis result with chain of thought and task planning
export interface EnhancedAnalysisResult extends AnalysisResult {
  chainOfThought?: string; // Explanation of the reasoning process
  taskPlan?: string[]; // Step-by-step plan of actions to execute
  confidence?: number; // Confidence level of the analysis (0-1)
  executionSteps?: string[]; // Detailed steps for execution
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

// Find & Replace functionality
export interface FindReplaceOptions {
  findText: string;
  replaceText?: string;
  matchCase: boolean;
  matchWholeCell: boolean;
  searchDirection: 'forward' | 'backward';
  searchScope: 'current-sheet' | 'all-sheets' | 'selected-range';
  searchWithin: 'values' | 'formulas' | 'both';
}

export interface SearchResult {
  rowIndex: number;
  colIndex: number;
  sheetIndex: number;
  oldValue: string;
  newValue?: string;
}
