import { SheetData, Row } from '../types';
import * as XLSX from 'xlsx';

// Use the imported XLSX library directly
export const parseExcelFile = async (file: File): Promise<SheetData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    // Add timeout for large files
    const timeout = setTimeout(() => {
        reject(new Error("File processing timeout. File may be too large or corrupted."));
    }, 30000); // 30 second timeout

    reader.onload = (e) => {
      try {
        clearTimeout(timeout);
        const data = e.target?.result;
        
        if (!data) {
            reject(new Error("File data is empty or invalid"));
            return;
        }
        
        // Read workbook using the imported library
        let workbook;
        if (data instanceof ArrayBuffer) {
            workbook = XLSX.read(data, { type: 'array' });
        } else {
            workbook = XLSX.read(data, { type: 'binary' });
        }

        // Get the first sheet name
        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
            reject(new Error("No worksheets found in the file"));
            return;
        }
        
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        if (!worksheet) {
            reject(new Error(`Worksheet '${firstSheetName}' is empty or invalid`));
            return;
        }

        // Convert to JSON with error handling
        let jsonData;
        try {
            jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        } catch (convertError) {
            console.error("Sheet to JSON conversion failed:", convertError);
            reject(new Error("Unable to convert spreadsheet data. File may be corrupted."));
            return;
        }

        if (jsonData.length === 0) {
          reject(new Error("Sheet is empty"));
          return;
        }

        const headers = jsonData[0] as string[];
        if (!headers || headers.length === 0) {
            reject(new Error("No column headers found in the first row"));
            return;
        }

        // Sanitize headers
        const sanitizedHeaders = headers.map(header => {
            if (typeof header === 'string') {
                return header.trim() || `Column_${Math.random().toString(36).substr(2, 5)}`;
            }
            return `Column_${header || Math.random().toString(36).substr(2, 5)}`;
        });

        const rawRows = jsonData.slice(1) as any[];
        const rows: Row[] = rawRows.map((rowArray: any) => {
          const rowObject: Row = {};
          sanitizedHeaders.forEach((header, index) => {
            let value = rowArray[index];
            if (value === undefined || value === null) value = "";
            // Convert numbers and handle special values
            if (typeof value === 'number' && !isNaN(value)) {
                rowObject[header] = value;
            } else {
                rowObject[header] = String(value);
            }
          });
          return rowObject;
        });

        resolve({
          name: file.name,
          columns: sanitizedHeaders,
          rows: rows,
          formattingRules: []
        });
      } catch (error) {
        clearTimeout(timeout);
        console.error("Parse Excel File Error:", error);
        reject(new Error(`File parsing failed: ${error.message || 'Unknown error'}`));
      }
    };

    reader.onerror = (error) => {
        clearTimeout(timeout);
        console.error("FileReader Error:", error);
        reject(new Error("Failed to read file. Please try again."));
    };
    
    reader.onabort = () => {
        clearTimeout(timeout);
        reject(new Error("File reading was aborted."));
    };
    
    // Read as ArrayBuffer for better compatibility
    reader.readAsArrayBuffer(file);
  });
};

export const exportToCSV = (data: SheetData): string => {
    const header = data.columns.join(",");
    const rows = data.rows.map(row => {
        return data.columns.map(col => {
            const val = row[col];
            return val === null ? "" : `"${val}"`;
        }).join(",");
    }).join("\n");
    return `${header}\n${rows}`;
};

/** Export sheet to .xlsx with structure and values (formatting preserved where supported by xlsx) */
export const exportToExcel = (data: SheetData, fileName?: string): void => {
  const { start, end } = data.printArea
    ? { start: data.printArea.start, end: data.printArea.end }
    : { start: { row: 0, col: 0 }, end: { row: Math.max(0, data.rows.length - 1), col: Math.max(0, data.columns.length - 1) } };
  const cols = data.columns.slice(start.col, end.col + 1);
  const rowsSlice = data.rows.slice(start.row, end.row + 1);
  const arr: (string | number)[][] = [cols];
  rowsSlice.forEach(row => {
    arr.push(cols.map(c => row[c] ?? ''));
  });
  const ws = XLSX.utils.aoa_to_sheet(arr);
  const wb = XLSX.utils.book_new();
  const name = (fileName || data.name || 'export').replace(/\.[^/.]+$/, '') || 'Sheet1';
  XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
  XLSX.writeFile(wb, `${name}.xlsx`);
};

// --- New Template & Blank Sheet Logic ---

// Generate columns up to AAA (26*26*26 = 17,576 columns)
const generateColumns = (count: number): string[] => {
    const cols = [];
    for(let i = 0; i < count; i++) {
        let colName = '';
        let num = i;
        do {
            colName = String.fromCharCode(65 + (num % 26)) + colName;
            num = Math.floor(num / 26) - 1;
        } while (num >= 0);
        cols.push(colName);
    }
    return cols;
};

// Create initial sheet with reasonable defaults
export const createBlankSheet = (): SheetData => {
    // Start with 100 rows and A-Z columns (26 columns)
    const columns = generateColumns(26); // A to Z
    const rows: Row[] = Array(100).fill(null).map(() => {
        const row: Row = {};
        columns.forEach(col => row[col] = "");
        return row;
    });
    return {
        name: "Book1.xlsx",
        columns,
        rows,
        formattingRules: []
    };
};

// Function to expand sheet dynamically
export const expandSheet = (sheetData: SheetData, targetRows: number, targetCols: number): SheetData => {
    const currentRows = sheetData.rows.length;
    const currentCols = sheetData.columns.length;
    
    let newColumns = [...sheetData.columns];
    let newRows = [...sheetData.rows];
    
    // Expand columns if needed
    if (targetCols > currentCols) {
        const additionalCols = generateColumns(targetCols).slice(currentCols);
        newColumns = [...sheetData.columns, ...additionalCols];
        
        // Add new columns to existing rows
        newRows = newRows.map(row => {
            const newRow = { ...row };
            additionalCols.forEach(col => {
                newRow[col] = "";
            });
            return newRow;
        });
    }
    
    // Expand rows if needed
    if (targetRows > currentRows) {
        const additionalRows: Row[] = Array(targetRows - currentRows).fill(null).map(() => {
            const row: Row = {};
            newColumns.forEach(col => row[col] = "");
            return row;
        });
        newRows = [...newRows, ...additionalRows];
    }
    
    return {
        ...sheetData,
        columns: newColumns,
        rows: newRows
    };
};

// Get maximum column index needed (AAA = 17576)
export const getMaxColumnIndex = (): number => {
    // AAA = 26^3 + 26^2 + 26^1 = 17576
    return 17576;
};

export const getTemplateData = (type: 'budget' | 'invoice' | 'schedule' | 'finance' | 'supply_chain' | 'hr' | 'sales' | 'real_estate'): SheetData => {
    switch(type) {
        case 'finance':
            return {
                name: "Portfolio_Risk_Analysis.xlsx",
                columns: ["Asset_ID", "Ticker", "Value_USD", "Volatility", "Beta", "Expected_Return"],
                rows: [
                    { Asset_ID: "A001", Ticker: "SPY", Value_USD: 50000, Volatility: 0.15, Beta: 1.0, Expected_Return: 0.08 },
                    { Asset_ID: "A002", Ticker: "QQQ", Value_USD: 35000, Volatility: 0.22, Beta: 1.2, Expected_Return: 0.12 },
                    { Asset_ID: "A003", Ticker: "VTI", Value_USD: 75000, Volatility: 0.14, Beta: 0.95, Expected_Return: 0.07 },
                    { Asset_ID: "A004", Ticker: "BND", Value_USD: 40000, Volatility: 0.05, Beta: 0.05, Expected_Return: 0.03 }
                ],
                formattingRules: []
            };
        case 'supply_chain':
            return {
                name: "Inventory_Optimization.xlsx",
                columns: ["SKU", "Warehouse", "Stock_Level", "Safety_Stock", "Lead_Time_Days", "Demand_Forecast"],
                rows: [
                    { SKU: "SKU-992", Warehouse: "East-01", Stock_Level: 450, Safety_Stock: 100, Lead_Time_Days: 5, Demand_Forecast: 500 },
                    { SKU: "SKU-104", Warehouse: "West-02", Stock_Level: 80, Safety_Stock: 150, Lead_Time_Days: 12, Demand_Forecast: 200 },
                    { SKU: "SKU-441", Warehouse: "East-01", Stock_Level: 1200, Safety_Stock: 500, Lead_Time_Days: 7, Demand_Forecast: 1500 }
                ],
                formattingRules: []
            };
        case 'hr':
            return {
                name: "Compensation_Audit.xlsx",
                columns: ["Employee_ID", "Department", "Position", "Salary_USD", "Performance_Rating", "Tenure_Years", "Bonus_Ratio", "Total_Comp"],
                rows: [
                    { Employee_ID: "E1001", Department: "Engineering", Position: "Senior Dev", Salary_USD: 145000, Performance_Rating: 4.5, Tenure_Years: 3, Bonus_Ratio: 0.15, Total_Comp: "=D2*(1+G2)" },
                    { Employee_ID: "E1002", Department: "Sales", Position: "Account Manager", Salary_USD: 95000, Performance_Rating: 3.8, Tenure_Years: 1.5, Bonus_Ratio: 0.25, Total_Comp: "=D3*(1+G3)" },
                    { Employee_ID: "E1003", Department: "Engineering", Position: "Junior Dev", Salary_USD: 85000, Performance_Rating: 4.2, Tenure_Years: 0.5, Bonus_Ratio: 0.10, Total_Comp: "=D4*(1+G4)" }
                ],
                formattingRules: [
                    { id: 'high-perf', type: 'greaterThan', column: 'Performance_Rating', value1: 4.0, style: { backgroundColor: '#dcfce7', textColor: '#166534' } }
                ]
            };
        case 'sales':
            return {
                name: "Sales_Performance_Tracker.xlsx",
                columns: ["Region", "Sales_Rep", "Q1_Actual", "Q1_Target", "Gap", "Achievement_%", "Status"],
                rows: [
                    { Region: "North", Sales_Rep: "Sarah J.", Q1_Actual: 450000, Q1_Target: 400000, Gap: "=C2-D2", "Achievement_%": "=C2/D2", Status: "=IF(F2>=1,\"Quota Met\",\"Under\")" },
                    { Region: "South", Sales_Rep: "Mike R.", Q1_Actual: 320000, Q1_Target: 350000, Gap: "=C3-D3", "Achievement_%": "=C3/D3", Status: "=IF(F3>=1,\"Quota Met\",\"Under\")" },
                    { Region: "West", Sales_Rep: "Chris L.", Q1_Actual: 510000, Q1_Target: 480000, Gap: "=C4-D4", "Achievement_%": "=C4/D4", Status: "=IF(F4>=1,\"Quota Met\",\"Under\")" }
                ],
                formattingRules: [
                    { id: 'quota-met', type: 'containsText', column: 'Status', value1: 'Quota Met', style: { backgroundColor: '#dcfce7', textColor: '#166534' } },
                    { id: 'quota-under', type: 'containsText', column: 'Status', value1: 'Under', style: { backgroundColor: '#fee2e2', textColor: '#991b1b' } }
                ]
            };
        case 'real_estate':
            return {
                name: "Property_Valuation_Model.xlsx",
                columns: ["Property_Name", "Units", "Avg_Rent", "Gross_Income", "Op_Expenses", "NOI", "Cap_Rate", "Valuation"],
                rows: [
                    { Property_Name: "Sunset Apartments", Units: 24, Avg_Rent: 1200, Gross_Income: "=B2*C2*12", Op_Expenses: "=D2*0.35", NOI: "=D2-E2", Cap_Rate: 0.055, Valuation: "=F2/G2" },
                    { Property_Name: "Oak Ridge Lofts", Units: 12, Avg_Rent: 1850, Gross_Income: "=B3*C3*12", Op_Expenses: "=D3*0.40", NOI: "=D3-E3", Cap_Rate: 0.060, Valuation: "=F3/G3" },
                    { Property_Name: "Pine View Suites", Units: 48, Avg_Rent: 950, Gross_Income: "=B4*C4*12", Op_Expenses: "=D4*0.30", NOI: "=D4-E4", Cap_Rate: 0.052, Valuation: "=F4/G4" }
                ],
                formattingRules: [
                    { id: 'high-val', type: 'greaterThan', column: 'Valuation', value1: 5000000, style: { backgroundColor: '#f0f9ff', textColor: '#075985' } }
                ]
            };
        case 'budget':
            return {
                name: "Budget.xlsx",
                columns: ["Category", "Amount", "Notes"],
                rows: [
                    { Category: "Rent", Amount: 1200, Notes: "Monthly rent" },
                    { Category: "Utilities", Amount: 300, Notes: "Electricity, water, gas" },
                    { Category: "Groceries", Amount: 400, Notes: "Weekly shopping" },
                    { Category: "Transportation", Amount: 150, Notes: "Gas and public transport" },
                    { Category: "Entertainment", Amount: 100, Notes: "Movies, dining out" },
                    { Category: "Savings", Amount: 200, Notes: "Emergency fund" }
                ],
                formattingRules: []
            };
        case 'invoice':
            return {
                name: "Invoice.xlsx",
                columns: ["Item", "Quantity", "Unit Price", "Total"],
                rows: [
                    { Item: "Product A", Quantity: 2, "Unit Price": 10, Total: 20 },
                    { Item: "Product B", Quantity: 1, "Unit Price": 15, Total: 15 },
                    { Item: "Product C", Quantity: 3, "Unit Price": 5, Total: 15 }
                ],
                formattingRules: []
            };
        case 'schedule':
            return {
                name: "Schedule.xlsx",
                columns: ["Date", "Event", "Location"],
                rows: [
                    { Date: "2023-10-01", Event: "Meeting", Location: "Conference Room" },
                    { Date: "2023-10-02", Event: "Lunch", Location: "Cafeteria" },
                    { Date: "2023-10-03", Event: "Presentation", Location: "Auditorium" }
                ],
                formattingRules: []
            };
        default:
            throw new Error(`Unknown template type: ${type}`);
    }
};
