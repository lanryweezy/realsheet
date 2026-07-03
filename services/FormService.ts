import { SheetData } from '../types';
import { generateContent } from './apiClient';

export interface FormField {
    id: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'select' | 'boolean';
    options?: string[]; // For select type
    required: boolean;
    placeholder?: string;
    columnKey: string;
}

export interface FormSchema {
    id: string;
    title: string;
    description: string;
    fields: FormField[];
    theme: {
        primaryColor: string;
        background: string;
    };
}

export const generateFormSchema = async (sheetData: SheetData): Promise<FormSchema> => {
    const columns = sheetData.columns;
    const sampleRows = sheetData.rows.slice(0, 3);
    
    const prompt = `Based on these spreadsheet columns: [${columns.join(', ')}] and these sample rows: ${JSON.stringify(sampleRows)}, generate a beautiful, semantic data entry form.
    
    You must return a valid JSON object matching this structure:
    {
        "id": string,
        "title": string,
        "description": string,
        "fields": [
            { "id": string, "label": string, "type": "text" | "number" | "date" | "select" | "boolean", "options": string[], "required": boolean, "placeholder": string, "columnKey": string }
        ],
        "theme": { "primaryColor": string, "background": string }
    }
    
    Map each field to the correct "columnKey" from the input. For "select" types, suggest 3-5 logical options based on the data.`;

    const response = await generateContent({
        prompt: prompt,
        context: "You are a professional UX Form Architect. Your goal is to turn raw spreadsheet columns into high-conversion, beautiful data entry forms."
    });
    
    try {
        const responseText = response.content || '';
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);

            // Validate output schema shape to prevent downstream UI crashes
            if (!parsed || typeof parsed !== 'object') {
                throw new Error('Parsed response is not an object');
            }
            if (!('id' in parsed) || !('title' in parsed) || !('fields' in parsed) || !Array.isArray(parsed.fields)) {
                throw new Error('Parsed schema is missing required structure');
            }

            return parsed as FormSchema;
        }
        throw new Error('No JSON object found in response');
    } catch (e) {
        console.error("Failed to parse form schema", e);
        // Fallback schema
        return {
            id: Date.now().toString(),
            title: `${sheetData.name} Entry Form`,
            description: "Data collection portal.",
            fields: columns.map(c => ({ id: c, label: c, type: 'text', required: false, columnKey: c })),
            theme: { primaryColor: '#3b82f6', background: '#0f172a' }
        };
    }
};
