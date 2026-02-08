/** Function names and descriptions for formula autocomplete */
export const FORMULA_FUNCTIONS: { name: string; description: string; syntax: string }[] = [
  { name: 'SUM', description: 'Adds all numbers in a range', syntax: 'SUM(range)' },
  { name: 'AVERAGE', description: 'Returns the average of numbers', syntax: 'AVERAGE(range)' },
  { name: 'AVG', description: 'Same as AVERAGE', syntax: 'AVG(range)' },
  { name: 'MIN', description: 'Returns the smallest number', syntax: 'MIN(range)' },
  { name: 'MAX', description: 'Returns the largest number', syntax: 'MAX(range)' },
  { name: 'COUNT', description: 'Counts numbers in a range', syntax: 'COUNT(range)' },
  { name: 'SUMIF', description: 'Sums cells that meet a condition', syntax: 'SUMIF(range, criteria, [sum_range])' },
  { name: 'VLOOKUP', description: 'Looks up a value in a table', syntax: 'VLOOKUP(lookup_value, table_range, col_index)' },
  { name: 'IF', description: 'Returns one value if true, another if false', syntax: 'IF(condition, value_if_true, value_if_false)' },
  { name: 'ROUND', description: 'Rounds a number to digits', syntax: 'ROUND(number, digits)' },
  { name: 'ABS', description: 'Returns the absolute value', syntax: 'ABS(number)' },
  { name: 'CONCAT', description: 'Joins text together', syntax: 'CONCAT(text1, text2, ...)' },
];

export function getFormulaSuggestions(prefix: string, limit = 8): typeof FORMULA_FUNCTIONS {
  const upper = prefix.toUpperCase().trim();
  if (!upper) return FORMULA_FUNCTIONS.slice(0, limit);
  return FORMULA_FUNCTIONS.filter((f) => f.name.startsWith(upper)).slice(0, limit);
}
