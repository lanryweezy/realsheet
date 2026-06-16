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

        const rawRows = jsonData.slice(1) as any[];
        let maxRowLength = headers.length;
        for (const row of rawRows) {
            if (row && Array.isArray(row) && row.length > maxRowLength) {
                maxRowLength = row.length;
            }
        }

        // Sanitize headers
        let sanitizedHeaders = headers.map(header => {
            if (typeof header === 'string') {
                return header.trim() || `Column_${Math.random().toString(36).substr(2, 5)}`;
            }
            return `Column_${header || Math.random().toString(36).substr(2, 5)}`;
        });

        if (maxRowLength > sanitizedHeaders.length) {
            const getColName = (idx: number) => {
                let name = '';
                let temp = idx;
                while (temp >= 0) {
                    name = String.fromCharCode(65 + (temp % 26)) + name;
                    temp = Math.floor(temp / 26) - 1;
                }
                return name;
            };
            const additionalCols = [];
            for (let i = sanitizedHeaders.length; i < maxRowLength; i++) {
                additionalCols.push(getColName(i));
            }
            sanitizedHeaders = [...sanitizedHeaders, ...additionalCols];
        }

        const rows: Row[] = rawRows.map((rowArray: any) => {
          const rowObject: Row = {};
          const rowValues = Array.isArray(rowArray) ? rowArray : [];
          sanitizedHeaders.forEach((header, index) => {
            let value = rowValues[index];
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

export const getTemplateData = (type: 'budget' | 'invoice' | 'schedule' | 'finance' | 'supply_chain' | 'hr' | 'sales' | 'real_estate' | 'ecommerce' | 'freelancer' | 'crypto' | 'banking' | 'manufacturing' | 'fmcg'): SheetData => {
    switch(type) {
        case 'banking':
            return {
                name: "Fintech_Loan_Portfolio.xlsx",
                columns: ["Loan_ID", "Client", "Principal", "Interest_Rate", "Term_Months", "Monthly_Payment", "Current_Balance", "Risk_Score", "Provisioning", "Status"],
                rows: [
                    { Loan_ID: "L-9001", Client: "FinNovate Ltd", Principal: 500000, Interest_Rate: 0.045, Term_Months: 60, Monthly_Payment: "=(C2*(D2/12))/(1-(1+D2/12)^(-E2))", Current_Balance: 420000, Risk_Score: 820, Provisioning: "=IF(H2<600, G2*0.05, G2*0.01)", Status: "Current" },
                    { Loan_ID: "L-9002", Client: "Alpha Retail", Principal: 150000, Interest_Rate: 0.082, Term_Months: 24, Monthly_Payment: "=(C3*(D3/12))/(1-(1+D3/12)^(-E3))", Current_Balance: 85000, Risk_Score: 540, Provisioning: "=IF(H3<600, G3*0.05, G3*0.01)", Status: "Watchlist" },
                    { Loan_ID: "L-9003", Client: "Zenith Corp", Principal: 1200000, Interest_Rate: 0.038, Term_Months: 120, Monthly_Payment: "=(C4*(D4/12))/(1-(1+D4/12)^(-E4))", Current_Balance: 1150000, Risk_Score: 890, Provisioning: "=IF(H4<600, G4*0.05, G4*0.01)", Status: "Current" }
                ],
                formattingRules: [
                    { id: 'risk-high', type: 'lessThan', column: 'Risk_Score', value1: 600, style: { backgroundColor: '#fee2e2', textColor: '#991b1b' } },
                    { id: 'watchlist', type: 'containsText', column: 'Status', value1: 'Watchlist', style: { backgroundColor: '#fff7ed', textColor: '#9a3412' } }
                ]
            };
        case 'manufacturing':
            return {
                name: "Manufacturing_OEE_Tracker.xlsx",
                columns: ["Line_ID", "Shift", "Availability_%", "Performance_%", "Quality_%", "OEE", "Target_OEE", "Downtime_Mins", "Defects", "Status"],
                rows: [
                    { Line_ID: "LINE-A", Shift: "Morning", "Availability_%": 0.92, "Performance_%": 0.88, "Quality_%": 0.99, OEE: "=C2*D2*E2", Target_OEE: 0.85, Downtime_Mins: 45, Defects: 12, Status: "=IF(F2>=G2,\"Optimal\",\"Under\")" },
                    { Line_ID: "LINE-B", Shift: "Morning", "Availability_%": 0.78, "Performance_%": 0.82, "Quality_%": 0.95, OEE: "=C3*D3*E3", Target_OEE: 0.85, Downtime_Mins: 120, Defects: 45, Status: "=IF(F3>=G3,\"Optimal\",\"Under\")" },
                    { Line_ID: "LINE-C", Shift: "Night", "Availability_%": 0.95, "Performance_%": 0.91, "Quality_%": 0.98, OEE: "=C4*D4*E4", Target_OEE: 0.85, Downtime_Mins: 20, Defects: 8, Status: "=IF(F4>=G4,\"Optimal\",\"Under\")" }
                ],
                formattingRules: [
                    { id: 'oee-under', type: 'lessThan', column: 'OEE', value1: 0.8, style: { backgroundColor: '#fee2e2', textColor: '#991b1b' } },
                    { id: 'oee-optimal', type: 'greaterThan', column: 'OEE', value1: 0.85, style: { backgroundColor: '#dcfce7', textColor: '#166534' } }
                ]
            };
        case 'fmcg':
            return {
                name: "Consumer_Goods_Promotion_ROI.xlsx",
                columns: ["Product", "Promo_Type", "Channel", "Base_Sales", "Promo_Sales", "Uplift_%", "Cost", "Incremental_Profit", "ROI"],
                rows: [
                    { Product: "Organic Milk 1L", Promo_Type: "BOGO", Channel: "Tesco", Base_Sales: 12000, Promo_Sales: 28000, "Uplift_%": "=(E2-D2)/D2", Cost: 5000, Incremental_Profit: "=(E2-D2)*0.4-G2", ROI: "=H2/G2" },
                    { Product: "Greek Yogurt", Promo_Type: "Price Cut", Channel: "Sainsbury", Base_Sales: 8000, Promo_Sales: 11000, "Uplift_%": "=(E3-D3)/D3", Cost: 1500, Incremental_Profit: "=(E3-D3)*0.35-G3", ROI: "=H3/G3" },
                    { Product: "Cheddar 500g", Promo_Type: "Multipack", Channel: "ASDA", Base_Sales: 15000, Promo_Sales: 22000, "Uplift_%": "=(E4-D4)/D4", Cost: 3000, Incremental_Profit: "=(E4-D4)*0.3-G4", ROI: "=H4/G4" }
                ],
                formattingRules: [
                    { id: 'roi-positive', type: 'greaterThan', column: 'ROI', value1: 0.2, style: { backgroundColor: '#dcfce7', textColor: '#166534' } },
                    { id: 'roi-negative', type: 'lessThan', column: 'ROI', value1: 0, style: { backgroundColor: '#fee2e2', textColor: '#991b1b' } }
                ]
            };
        case 'ecommerce':
            return {
                name: "E-commerce_Inventory.xlsx",
                columns: ["Product_ID", "Name", "Category", "Supplier", "Cost_Price", "Sale_Price", "Markup_%", "Stock", "Reorder_Level", "Status"],
                rows: [
                    { Product_ID: "P101", Name: "Wireless Mouse", Category: "Electronics", Supplier: "TechSupply", Cost_Price: 15, Sale_Price: 29.99, "Markup_%": "=(F2-E2)/E2", Stock: 150, Reorder_Level: 20, Status: "=IF(H2<=I2,\"Restock\",\"OK\")" },
                    { Product_ID: "P102", Name: "Mechanical Keyboard", Category: "Electronics", Supplier: "TechSupply", Cost_Price: 45, Sale_Price: 89.99, "Markup_%": "=(F3-E3)/E3", Stock: 15, Reorder_Level: 20, Status: "=IF(H3<=I3,\"Restock\",\"OK\")" },
                    { Product_ID: "P103", Name: "USB-C Cable", Category: "Accessories", Supplier: "GlobalLink", Cost_Price: 3, Sale_Price: 12.99, "Markup_%": "=(F4-E4)/E4", Stock: 500, Reorder_Level: 100, Status: "=IF(H4<=I4,\"Restock\",\"OK\")" }
                ],
                formattingRules: [
                    { id: 'restock', type: 'containsText', column: 'Status', value1: 'Restock', style: { backgroundColor: '#fee2e2', textColor: '#991b1b' } }
                ]
            };
        case 'freelancer':
            return {
                name: "Freelancer_Invoicing.xlsx",
                columns: ["Project", "Client", "Hours", "Rate", "Amount", "Status", "Due_Date", "Tax_%", "Total"],
                rows: [
                    { Project: "Website Redesign", Client: "Nexus App", Hours: 40, Rate: 75, Amount: "=C2*D2", Status: "Paid", Due_Date: "2024-05-15", "Tax_%": 0.1, Total: "=E2*(1+H2)" },
                    { Project: "Logo Design", Client: "GreenEnergy", Hours: 10, Rate: 80, Amount: "=C3*D3", Status: "Sent", Due_Date: "2024-06-01", "Tax_%": 0.1, Total: "=E3*(1+H3)" },
                    { Project: "SEO Audit", Client: "CloudNine", Hours: 15, Rate: 90, Amount: "=C4*D4", Status: "Overdue", Due_Date: "2024-05-01", "Tax_%": 0.1, Total: "=E4*(1+H4)" }
                ],
                formattingRules: [
                    { id: 'overdue', type: 'containsText', column: 'Status', value1: 'Overdue', style: { backgroundColor: '#fee2e2', textColor: '#991b1b' } },
                    { id: 'paid', type: 'containsText', column: 'Status', value1: 'Paid', style: { backgroundColor: '#dcfce7', textColor: '#166534' } }
                ]
            };
        case 'crypto':
            return {
                name: "Crypto_Portfolio.xlsx",
                columns: ["Asset", "Holdings", "Buy_Price", "Current_Price", "Investment", "Current_Value", "P/L", "P/L_%"],
                rows: [
                    { Asset: "Bitcoin", Holdings: 0.5, Buy_Price: 45000, Current_Price: 65000, Investment: "=B2*C2", Current_Value: "=B2*D2", "P/L": "=F2-E2", "P/L_%": "=(D2-C2)/C2" },
                    { Asset: "Ethereum", Holdings: 5.0, Buy_Price: 2500, Current_Price: 3500, Investment: "=B3*C3", Current_Value: "=B3*D3", "P/L": "=F3-E3", "P/L_%": "=(D3-C3)/C3" },
                    { Asset: "Solana", Holdings: 100, Buy_Price: 120, Current_Price: 150, Investment: "=B4*C4", Current_Value: "=B4*D4", "P/L": "=F4-E4", "P/L_%": "=(D4-C4)/C4" }
                ],
                formattingRules: [
                    { id: 'profit', type: 'greaterThan', column: 'P/L', value1: 0, style: { backgroundColor: '#dcfce7', textColor: '#166534' } },
                    { id: 'loss', type: 'lessThan', column: 'P/L', value1: 0, style: { backgroundColor: '#fee2e2', textColor: '#991b1b' } }
                ]
            };
        case 'finance':
            return {
                name: "Portfolio_Risk_Analysis.xlsx",
                columns: ["Asset_ID", "Ticker", "Value_USD", "Volatility", "Beta", "Expected_Return", "Weight_%", "Contrib_to_Risk"],
                rows: [
                    { Asset_ID: "A001", Ticker: "SPY", Value_USD: 50000, Volatility: 0.15, Beta: 1.0, Expected_Return: 0.08, "Weight_%": "=C2/SUM($C$2:$C$5)", "Contrib_to_Risk": "=G2*D2" },
                    { Asset_ID: "A002", Ticker: "QQQ", Value_USD: 35000, Volatility: 0.22, Beta: 1.2, Expected_Return: 0.12, "Weight_%": "=C3/SUM($C$2:$C$5)", "Contrib_to_Risk": "=G3*D3" },
                    { Asset_ID: "A003", Ticker: "VTI", Value_USD: 75000, Volatility: 0.14, Beta: 0.95, Expected_Return: 0.07, "Weight_%": "=C4/SUM($C$2:$C$5)", "Contrib_to_Risk": "=G4*D4" },
                    { Asset_ID: "A004", Ticker: "BND", Value_USD: 40000, Volatility: 0.05, Beta: 0.05, Expected_Return: 0.03, "Weight_%": "=C5/SUM($C$2:$C$5)", "Contrib_to_Risk": "=G5*D5" }
                ],
                formattingRules: [
                    { id: 'risk-high', type: 'greaterThan', column: 'Contrib_to_Risk', value1: 0.03, style: { backgroundColor: '#fee2e2', textColor: '#991b1b' } }
                ]
            };
        case 'supply_chain':
            return {
                name: "Inventory_Optimization.xlsx",
                columns: ["SKU", "Warehouse", "Stock_Level", "Safety_Stock", "Status", "Demand_Forecast", "Restock_Qty"],
                rows: [
                    { SKU: "SKU-992", Warehouse: "East-01", Stock_Level: 450, Safety_Stock: 100, Status: "=IF(C2<D2,\"Low\",\"OK\")", Demand_Forecast: 500, Restock_Qty: "=MAX(0, F2-C2)" },
                    { SKU: "SKU-104", Warehouse: "West-02", Stock_Level: 80, Safety_Stock: 150, Status: "=IF(C3<D3,\"Low\",\"OK\")", Demand_Forecast: 200, Restock_Qty: "=MAX(0, F3-C3)" },
                    { SKU: "SKU-441", Warehouse: "East-01", Stock_Level: 1200, Safety_Stock: 500, Status: "=IF(C4<D4,\"Low\",\"OK\")", Demand_Forecast: 1500, Restock_Qty: "=MAX(0, F4-C4)" }
                ],
                formattingRules: [
                    { id: 'low-stock', type: 'containsText', column: 'Status', value1: 'Low', style: { backgroundColor: '#fef3c7', textColor: '#92400e' } }
                ]
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
