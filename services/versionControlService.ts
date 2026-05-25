import { Workbook, Branch, Commit, Diff, SheetData } from '../types';
import { generateId } from '../utils/idGenerator';

const BRANCHES_KEY = 'realsheet_branches';
const COMMITS_KEY = 'realsheet_commits_';

export const createBranch = (name: string, workbook: Workbook, parentBranchId?: string): Branch => {
  return {
    id: generateId(),
    name,
    workbookId: workbook.id,
    parentBranchId,
    createdAt: Date.now(),
    lastModified: Date.now(),
    workbook: JSON.parse(JSON.stringify(workbook)) // Deep copy
  };
};

export const createCommit = (branchId: string, message: string, workbook: Workbook, author: string = 'User'): Commit => {
  return {
    id: generateId(),
    branchId,
    message,
    timestamp: Date.now(),
    author,
    workbookSnapshot: JSON.parse(JSON.stringify(workbook))
  };
};

export const calculateDiff = (oldWorkbook: Workbook, newWorkbook: Workbook): Diff[] => {
  const diffs: Diff[] = [];

  // Compare sheets
  newWorkbook.sheets.forEach((newSheet, index) => {
    const oldSheet = oldWorkbook.sheets.find(s => s.id === newSheet.id);

    if (!oldSheet) {
      diffs.push({
        type: 'sheet_add',
        sheetId: newSheet.id || '',
        location: { sheetIndex: index },
        newValue: newSheet
      });
      return;
    }

    // Compare rows
    if (newSheet.rows.length !== oldSheet.rows.length) {
       // Simplistic row count diff
       if (newSheet.rows.length > oldSheet.rows.length) {
           diffs.push({
               type: 'row_insert',
               sheetId: newSheet.id || '',
               location: { row: oldSheet.rows.length },
               newValue: newSheet.rows.slice(oldSheet.rows.length)
           });
       } else {
           diffs.push({
               type: 'row_delete',
               sheetId: newSheet.id || '',
               location: { row: newSheet.rows.length },
               oldValue: oldSheet.rows.slice(newSheet.rows.length)
           });
       }
    }

    // Compare cells
    newSheet.rows.forEach((row, ri) => {
      const oldRow = oldSheet.rows[ri];
      if (!oldRow) return;

      newSheet.columns.forEach(col => {
        if (row[col] !== oldRow[col]) {
          diffs.push({
            type: 'cell_change',
            sheetId: newSheet.id || '',
            location: { row: ri, col },
            oldValue: oldRow[col],
            newValue: row[col]
          });
        }
      });
    });
  });

  return diffs;
};

export const mergeBranches = (sourceBranch: Branch, targetBranch: Branch): Workbook => {
  // Simple merge strategy: source overwrites target
  // In a real app, this would involve 3-way merge
  const mergedWorkbook = JSON.parse(JSON.stringify(sourceBranch.workbook));
  return mergedWorkbook;
};

export const saveBranch = (branch: Branch) => {
  const branches = getBranches();
  const index = branches.findIndex(b => b.id === branch.id);
  if (index >= 0) {
    branches[index] = branch;
  } else {
    branches.push(branch);
  }
  localStorage.setItem(BRANCHES_KEY, JSON.stringify(branches));
};

export const getBranches = (workbookId?: string): Branch[] => {
  const raw = localStorage.getItem(BRANCHES_KEY);
  const branches: Branch[] = raw ? JSON.parse(raw) : [];
  if (workbookId) {
    return branches.filter(b => b.workbookId === workbookId);
  }
  return branches;
};

export const saveCommit = (commit: Commit) => {
  const key = `${COMMITS_KEY}${commit.branchId}`;
  const commits = getCommits(commit.branchId);
  commits.push(commit);
  localStorage.setItem(key, JSON.stringify(commits));
};

export const getCommits = (branchId: string): Commit[] => {
  const key = `${COMMITS_KEY}${branchId}`;
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
};
