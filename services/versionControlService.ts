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
  /**
   * Enhanced Structural Merge:
   * Iterates through all sheets and cells, performing a property-level merge.
   * Prioritizes the source (incoming) branch for conflicting cell values
   * but preserves structural elements (new columns/sheets) from both.
   */
  const target = JSON.parse(JSON.stringify(targetBranch.workbook)) as Workbook;
  const source = sourceBranch.workbook;

  source.sheets.forEach(sourceSheet => {
    let targetSheet = target.sheets.find(s => s.id === sourceSheet.id);

    if (!targetSheet) {
      // New sheet from source - add it
      target.sheets.push(JSON.parse(JSON.stringify(sourceSheet)));
      return;
    }

    // Merge columns (union of column names)
    const allCols = Array.from(new Set([...targetSheet.columns, ...sourceSheet.columns]));
    targetSheet.columns = allCols;

    // Merge rows
    sourceSheet.rows.forEach((sourceRow, ri) => {
      if (!targetSheet) return; // TS guard

      if (!targetSheet.rows[ri]) {
        // Source has more rows
        targetSheet.rows[ri] = { ...sourceRow };
      } else {
        // Structural merge of the row object
        targetSheet.rows[ri] = {
          ...targetSheet.rows[ri],
          ...sourceRow
        };
      }
    });

    // Merge styles if they exist
    if (sourceSheet.cellStyles) {
      targetSheet.cellStyles = {
        ...(targetSheet.cellStyles || {}),
        ...sourceSheet.cellStyles
      };
    }
  });

  target.lastModified = new Date();
  return target;
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
