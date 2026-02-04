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

// --- New Template & Blank Sheet Logic ---

const generateColumns = (count: number): string[] => {
    const cols = [];
    for(let i = 0; i < count; i++) {
        cols.push(String.fromCharCode(65 + i)); // A, B, C...
    }
    return cols;
};

export const createBlankSheet = (): SheetData => {
    const columns = generateColumns(10); // A to J
    const rows: Row[] = Array(20).fill(null).map(() => {
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

export const getTemplateData = (type: 'budget' | 'invoice' | 'schedule'): SheetData => {
    switch(type) {
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
