import { SheetData, Row } from '../types';

// Access global XLSX loaded via script tag
const getXLSX = () => {
    // @ts-ignore
    const X = window.XLSX;
    if (!X) throw new Error("XLSX library not loaded. Please refresh the page.");
    return X;
};

export const parseExcelFile = async (file: File): Promise<SheetData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const XLSX = getXLSX();
        const data = e.target?.result;
        
        const workbook = XLSX.read(data, { type: 'binary' });

        // Get the first sheet name
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (jsonData.length === 0) {
          reject(new Error("Sheet is empty"));
          return;
        }

        const headers = jsonData[0] as string[];
        const rawRows = jsonData.slice(1) as any[];

        const rows: Row[] = rawRows.map((rowArray: any) => {
          const rowObject: Row = {};
          headers.forEach((header, index) => {
            // Basic sanitization
            let value = rowArray[index];
            if (value === undefined) value = null;
            rowObject[header] = value;
          });
          return rowObject;
        });

        resolve({
          name: file.name,
          columns: headers,
          rows: rows,
          formattingRules: []
        });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
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
}

// --- New Template & Blank Sheet Logic ---

const generateColumns = (count: number): string[] => {
    const cols = [];
    for(let i = 0; i < count; i++) {
        cols.push(String.fromCharCode(65 + i)); // A, B, C...
    }
    return cols;
}

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
    switch (type) {
        case 'budget':
            return {
                name: "Monthly_Budget.xlsx",
                columns: ["Category", "Planned", "Actual", "Difference", "Status"],
                rows: [
                    { Category: "Housing", Planned: 1200, Actual: 1200, Difference: 0, Status: "On Track" },
                    { Category: "Food", Planned: 400, Actual: 450, Difference: -50, Status: "Over" },
                    { Category: "Transport", Planned: 200, Actual: 150, Difference: 50, Status: "Under" },
                    { Category: "Utilities", Planned: 150, Actual: 160, Difference: -10, Status: "Over" },
                    { Category: "Savings", Planned: 500, Actual: 500, Difference: 0, Status: "On Track" },
                    { Category: "Entertainment", Planned: 100, Actual: 120, Difference: -20, Status: "Over" },
                ],
                formattingRules: [
                    { id: '1', type: 'lessThan', column: 'Difference', value1: 0, style: { backgroundColor: '#fee2e2', textColor: '#b91c1c' } },
                    { id: '2', type: 'greaterThan', column: 'Difference', value1: 0, style: { backgroundColor: '#dcfce7', textColor: '#15803d' } },
                    { id: '3', type: 'containsText', column: 'Status', value1: 'Over', style: { backgroundColor: '#fee2e2', textColor: '#b91c1c' } },
                    { id: '4', type: 'dataBar', column: 'Actual', barColor: '#3b82f6' }
                ]
            };
        case 'invoice':
            return {
                name: "Invoice_Template.xlsx",
                columns: ["Item", "Description", "Quantity", "Unit Price", "Total"],
                rows: [
                    { Item: "Web Design", Description: "Homepage Mockup", Quantity: 1, "Unit Price": 500, Total: 500 },
                    { Item: "Development", Description: "React Implementation", Quantity: 10, "Unit Price": 80, Total: 800 },
                    { Item: "Hosting", Description: "Annual Server Cost", Quantity: 1, "Unit Price": 120, Total: 120 },
                    { Item: "Maintenance", Description: "Monthly Support", Quantity: 1, "Unit Price": 50, Total: 50 },
                ],
                formattingRules: [
                    { id: '1', type: 'colorScale', column: 'Total', scaleColors: ['#ffffff', '#22d3ee'] }
                ]
            };
        case 'schedule':
            return {
                name: "Weekly_Schedule.xlsx",
                columns: ["Time", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                rows: [
                    { Time: "09:00 AM", Monday: "Team Standup", Tuesday: "Focus Time", Wednesday: "Team Standup", Thursday: "Focus Time", Friday: "Team Standup" },
                    { Time: "10:00 AM", Monday: "Client Call", Tuesday: "Development", Wednesday: "Review", Thursday: "Development", Friday: "Planning" },
                    { Time: "11:00 AM", Monday: "Work", Tuesday: "Development", Wednesday: "Work", Thursday: "Development", Friday: "Wrap up" },
                    { Time: "12:00 PM", Monday: "Lunch", Tuesday: "Lunch", Wednesday: "Lunch", Thursday: "Lunch", Friday: "Lunch" },
                    { Time: "01:00 PM", Monday: "Project A", Tuesday: "Project B", Wednesday: "Project A", Thursday: "Project B", Friday: "Demo" },
                ],
                formattingRules: []
            };
        default:
            return createBlankSheet();
    }
};