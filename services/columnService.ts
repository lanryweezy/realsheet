import { SheetData } from '../types';
import { analyzeData as analyzeDataViaAPI } from './apiClient';

export const generateColumnDescriptions = async (
    sheetData: SheetData | null,
    column: string
): Promise<{ description: string, type: string, tags: string[] }> => {
    if (!sheetData) return { description: 'No data available.', type: 'unknown', tags: [] };
    const sampleData = sheetData.rows.slice(0, 5).map(r => r[column]);
    const prompt = `Analyze column "${column}" with data: ${JSON.stringify(sampleData)}. Return JSON: { "description": "...", "type": "...", "tags": ["...", "...", "..."] }`;
    try {
        const res = await analyzeDataViaAPI({ prompt, data: sheetData });
        if (res.success && res.data) {
            const text = res.data.textResponse;
            const match = text.match(/\{[\s\S]*\}/);
            if (match) return JSON.parse(match[0]);
        }
    } catch (e) {}
    return { description: `Column representing ${column} data.`, type: 'string', tags: [column.toLowerCase()] };
};
