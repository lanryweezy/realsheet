import { SheetData, FileMetadata } from '../types';

const FILES_INDEX_KEY = 'nexsheet_files_index';
const FILE_PREFIX = 'nexsheet_file_';

export const generateId = () => Math.random().toString(36).substr(2, 9);

export const getFiles = (): FileMetadata[] => {
    try {
        const index = localStorage.getItem(FILES_INDEX_KEY);
        return index ? JSON.parse(index) : [];
    } catch (e) {
        console.error("Failed to load file index", e);
        return [];
    }
};

export const loadFile = (id: string): SheetData | null => {
    try {
        const data = localStorage.getItem(`${FILE_PREFIX}${id}`);
        if (!data) return null;
        return JSON.parse(data);
    } catch (e) {
        console.error("Failed to load file", e);
        return null;
    }
};

export const saveFile = (data: SheetData): FileMetadata => {
    const id = data.id || generateId();
    const timestamp = Date.now();
    
    const fileData: SheetData = {
        ...data,
        id,
        lastModified: timestamp
    };

    // Save Content
    localStorage.setItem(`${FILE_PREFIX}${id}`, JSON.stringify(fileData));

    // Update Index
    const files = getFiles();
    const existingIndex = files.findIndex(f => f.id === id);
    
    const metadata: FileMetadata = {
        id,
        name: data.name,
        lastModified: timestamp,
        rowCount: data.rows.length,
        preview: data.columns.slice(0, 3)
    };

    if (existingIndex >= 0) {
        files[existingIndex] = metadata;
    } else {
        files.unshift(metadata); // Add to top
    }

    localStorage.setItem(FILES_INDEX_KEY, JSON.stringify(files));
    return metadata;
};

export const deleteFile = (id: string) => {
    localStorage.removeItem(`${FILE_PREFIX}${id}`);
    const files = getFiles().filter(f => f.id !== id);
    localStorage.setItem(FILES_INDEX_KEY, JSON.stringify(files));
};

export const renameFile = (id: string, newName: string) => {
    const data = loadFile(id);
    if (data) {
        data.name = newName;
        saveFile(data);
    }
};