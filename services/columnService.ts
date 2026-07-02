import { SheetData } from '../types';
import { generateContent } from './apiClient';

export const generateColumnDescriptions = async (
    sheetData: SheetData | null,
    column: string
): Promise<{ description: string, type: string, tags: string[] }> => {
    if (!sheetData) return { description: 'No data available.', type: 'unknown', tags: [] };
    const sampleData = sheetData.rows.slice(0, 5).map(r => r[column]);

    // AI Quality Improvement: Use lightweight endpoint for simple text tasks & enforce strict schema
    const prompt = `Analyze column "${column}" with sample data: ${JSON.stringify(sampleData)}.
Return ONLY a valid JSON object matching exactly this schema, with no additional markdown or text:
{ "description": "short description of data", "type": "string|number|date|boolean", "tags": ["tag1", "tag2"] }`;

    try {
        const res = await generateContent({ prompt, format: 'text' });
        if (res.success && res.content) {
            const match = res.content.match(/\{[\s\S]*\}/);
            if (match) {
                // AI Quality Improvement: Validate JSON shape before returning to prevent silent failures
                const parsed = JSON.parse(match[0]);
                if (parsed && typeof parsed === 'object' && 'description' in parsed && 'type' in parsed && 'tags' in parsed && Array.isArray(parsed.tags)) {
                    return parsed as { description: string, type: string, tags: string[] };
                }
                console.warn('AI Output Validation Failed: Missing required properties', parsed);
            }
        }
    } catch (e) {
        console.error('generateColumnDescriptions AI error:', e);
    }
    return { description: `Column representing ${column} data.`, type: 'string', tags: [column.toLowerCase()] };
};
