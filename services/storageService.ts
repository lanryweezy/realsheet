import { SheetData, FileMetadata } from '../types';

const FILES_INDEX_KEY = 'nexsheet_files_index';
const FILE_PREFIX = 'nexsheet_file_';

const RECENT_DISPLAY_LIMIT = 12;

export const generateId = () => Math.random().toString(36).substr(2, 9);

export const getFiles = (): FileMetadata[] => {
    try {
        const index = localStorage.getItem(FILES_INDEX_KEY);
        const raw = index ? JSON.parse(index) : [];
        return (raw || []).map((f: FileMetadata) => ({
            ...f,
            pinned: !!f.pinned,
            inTrash: !!f.inTrash,
        }));
    } catch (e) {
        console.error("Failed to load file index", e);
        return [];
    }
};

/** Files not in trash, for "All files" and grouping */
export const getActiveFiles = (): FileMetadata[] =>
    getFiles().filter(f => !f.inTrash);

/** Pinned files (not in trash), most recently opened first */
export const getPinnedFiles = (): FileMetadata[] =>
    getActiveFiles()
        .filter(f => f.pinned)
        .sort((a, b) => (b.lastOpened ?? b.lastModified) - (a.lastOpened ?? a.lastModified));

/** Recent active files, limited */
export const getRecentFiles = (limit = RECENT_DISPLAY_LIMIT): FileMetadata[] =>
    getActiveFiles()
        .filter(f => !f.pinned)
        .sort((a, b) => (b.lastOpened ?? b.lastModified) - (a.lastOpened ?? a.lastModified))
        .slice(0, limit);

/** Trash */
export const getTrashFiles = (): FileMetadata[] =>
    getFiles().filter(f => f.inTrash);

/** Group active files by display name (e.g. "Invoice.xlsx") for version grouping */
export const getFilesGroupedByName = (): { name: string; files: FileMetadata[] }[] => {
    const active = getActiveFiles();
    const byName: Record<string, FileMetadata[]> = {};
    active.forEach(f => {
        const key = (f.name || 'Untitled').trim();
        if (!byName[key]) byName[key] = [];
        byName[key].push(f);
    });
    return Object.entries(byName)
        .map(([name, files]) => ({ name, files: files.sort((a, b) => (b.lastOpened ?? b.lastModified) - (a.lastOpened ?? a.lastModified)) }))
        .sort((a, b) => Math.max(...b.files.map(x => x.lastOpened ?? x.lastModified)) - Math.max(...a.files.map(x => x.lastOpened ?? x.lastModified)));
};

/** Recent (non-pinned) files grouped by name, with total file count limited */
export const getRecentGrouped = (limit: number): { name: string; files: FileMetadata[] }[] => {
    const recent = getRecentFiles(limit);
    const byName: Record<string, FileMetadata[]> = {};
    recent.forEach(f => {
        const key = (f.name || 'Untitled').trim();
        if (!byName[key]) byName[key] = [];
        byName[key].push(f);
    });
    return Object.entries(byName)
        .map(([name, files]) => ({ name, files: files.sort((a, b) => (b.lastOpened ?? b.lastModified) - (a.lastOpened ?? a.lastModified)) }))
        .sort((a, b) => Math.max(...b.files.map(x => x.lastOpened ?? x.lastModified)) - Math.max(...a.files.map(x => x.lastOpened ?? x.lastModified)));
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
        preview: data.columns.slice(0, 3),
        pinned: existingIndex >= 0 ? files[existingIndex].pinned : false,
        inTrash: existingIndex >= 0 ? files[existingIndex].inTrash : false,
        lastOpened: existingIndex >= 0 ? files[existingIndex].lastOpened : undefined,
    };

    if (existingIndex >= 0) {
        files[existingIndex] = metadata;
    } else {
        files.unshift(metadata);
    }

    localStorage.setItem(FILES_INDEX_KEY, JSON.stringify(files));
    return metadata;
};

export const updateLastOpened = (id: string) => {
    const files = getFiles();
    const i = files.findIndex(f => f.id === id);
    if (i >= 0) {
        files[i].lastOpened = Date.now();
        localStorage.setItem(FILES_INDEX_KEY, JSON.stringify(files));
    }
};

export const pinFile = (id: string) => {
    const files = getFiles();
    const i = files.findIndex(f => f.id === id);
    if (i >= 0) {
        files[i].pinned = true;
        localStorage.setItem(FILES_INDEX_KEY, JSON.stringify(files));
    }
};

export const unpinFile = (id: string) => {
    const files = getFiles();
    const i = files.findIndex(f => f.id === id);
    if (i >= 0) {
        files[i].pinned = false;
        localStorage.setItem(FILES_INDEX_KEY, JSON.stringify(files));
    }
};

export const moveToTrash = (id: string) => {
    const files = getFiles();
    const i = files.findIndex(f => f.id === id);
    if (i >= 0) {
        files[i].inTrash = true;
        localStorage.setItem(FILES_INDEX_KEY, JSON.stringify(files));
    }
};

export const restoreFromTrash = (id: string) => {
    const files = getFiles();
    const i = files.findIndex(f => f.id === id);
    if (i >= 0) {
        files[i].inTrash = false;
        localStorage.setItem(FILES_INDEX_KEY, JSON.stringify(files));
    }
};

export const duplicateFile = (id: string): FileMetadata | null => {
    const data = loadFile(id);
    if (!data) return null;
    const copy = { ...data, id: undefined, name: `${data.name.replace(/\.[^/.]+$/, '')} (copy)` };
    if (!copy.name.endsWith('.xlsx') && !copy.name.endsWith('.csv')) copy.name += ' (copy)';
    return saveFile(copy);
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

export const saveWorkbook = (workbook: Workbook) => {
    localStorage.setItem(`realsheet_workbook_${workbook.id}`, JSON.stringify(workbook));

    // Update metadata if it exists
    const files = getFiles();
    const i = files.findIndex(f => f.id === workbook.id);
    if (i >= 0) {
        files[i].name = workbook.name;
        files[i].lastModified = Date.now();
        localStorage.setItem(FILES_INDEX_KEY, JSON.stringify(files));
    }
};

export const loadWorkbook = (id: string): Workbook | null => {
    const raw = localStorage.getItem(`realsheet_workbook_${id}`);
    return raw ? JSON.parse(raw) : null;
};