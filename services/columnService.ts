import { SheetData } from '../types';
import { generateContent } from './apiClient';

export const generateColumnDescriptions = async (
    sheetData: SheetData | null,
    column: string
): Promise<{ description: string, type: string, tags: string[] }> => {
    if (!sheetData) return { description: 'No data available.', type: 'unknown', tags: [] };
    const sampleData = sheetData.rows.slice(0, 5).map(r => r[column]);
    const prompt = `Analyze column "${column}" with data: ${JSON.stringify(sampleData)}. Return JSON: { "description": "...", "type": "...", "tags": ["...", "...", "..."] }`;
    try {
        // ASTRA: Use lightweight generateContent instead of heavy analyzeDataViaAPI for context efficiency
        const res = await generateContent({ prompt, format: 'text' });
        if (res.success && res.content) {
            const text = res.content;
            const match = text.match(/\{[\s\S]*\}/);
            if (match) {
                const parsed = JSON.parse(match[0]);
                // ASTRA: Validate expected JSON structure to prevent silent downstream errors
                if (!parsed || typeof parsed !== 'object' || !('description' in parsed) || !('type' in parsed) || !Array.isArray(parsed.tags)) {
                    throw new Error('AI output missing required fields');
                }
                return parsed;
            }
        }
    } catch (e) {
        console.error("Failed to generate column description", e);
    }
    return { description: `Column representing ${column} data.`, type: 'string', tags: [column.toLowerCase()] };
};
