import React, { useState, useEffect, useMemo, useRef } from 'react';
import { FunctionSquare, Sparkles, ChevronRight, BookOpen } from 'lucide-react';

export interface FormulaDefinition {
  name: string;
  syntax: string;
  description: string;
  category: string;
  examples: string[];
  args: { name: string; description: string; required: boolean }[];
}

export const FORMULA_DATABASE: FormulaDefinition[] = [
  // Logical
  {
    name: 'IF',
    syntax: '=IF(logical_test, [value_if_true], [value_if_false])',
    description: 'Checks whether a condition is met, and returns one value if TRUE, and another value if FALSE.',
    category: 'Logical',
    examples: ['=IF(A1>10, "Yes", "No")', '=IF(B2>=60, "Pass", "Fail")'],
    args: [
      { name: 'logical_test', description: 'The condition to test', required: true },
      { name: 'value_if_true', description: 'Value if condition is TRUE', required: false },
      { name: 'value_if_false', description: 'Value if condition is FALSE', required: false }
    ]
  },
  {
    name: 'IFS',
    syntax: '=IFS(logical_test1, value1, [logical_test2, value2], ...)',
    description: 'Checks whether one or more conditions are met and returns a value corresponding to the first TRUE condition.',
    category: 'Logical',
    examples: ['=IFS(A1>90, "A", A1>80, "B", A1>70, "C")'],
    args: [
      { name: 'logical_test1', description: 'First condition to test', required: true },
      { name: 'value1', description: 'Value if first condition is TRUE', required: true }
    ]
  },
  {
    name: 'IFERROR',
    syntax: '=IFERROR(value, value_if_error)',
    description: 'Returns a different result if the first value is an error, otherwise returns the first value.',
    category: 'Logical',
    examples: ['=IFERROR(A1/B1, "Division by zero")', '=IFERROR(VLOOKUP(A1,B:C,2,FALSE), "Not found")'],
    args: [
      { name: 'value', description: 'The value to check for errors', required: true },
      { name: 'value_if_error', description: 'Value if error occurs', required: true }
    ]
  },
  {
    name: 'IFNA',
    syntax: '=IFNA(value, value_if_na)',
    description: 'Returns a different result if the first value is #N/A error, otherwise returns the first value.',
    category: 'Logical',
    examples: ['=IFNA(VLOOKUP(A1,B:C,2,FALSE), "Not found")'],
    args: [
      { name: 'value', description: 'The value to check for #N/A error', required: true },
      { name: 'value_if_na', description: 'Value if #N/A error occurs', required: true }
    ]
  },
  {
    name: 'SWITCH',
    syntax: '=SWITCH(expression, value1, result1, [value2, result2], ..., [default])',
    description: 'Evaluates an expression against a list of values and returns the result corresponding to the first matching value.',
    category: 'Logical',
    examples: ['=SWITCH(A1, 1, "One", 2, "Two", "Other")'],
    args: [
      { name: 'expression', description: 'The value to evaluate', required: true },
      { name: 'value1', description: 'First value to match', required: true },
      { name: 'result1', description: 'Result if first value matches', required: true }
    ]
  },

  // Lookup & Reference
  {
    name: 'XLOOKUP',
    syntax: '=XLOOKUP(lookup_value, lookup_array, return_array, [if_not_found], [match_mode], [search_mode])',
    description: 'Searches a range or array, and returns an item corresponding to the first match found.',
    category: 'Lookup & Reference',
    examples: ['=XLOOKUP(A1, B:B, C:C)', '=XLOOKUP(D1, E1:E100, F1:F100, "Not found")'],
    args: [
      { name: 'lookup_value', description: 'The value to search for', required: true },
      { name: 'lookup_array', description: 'The range to search in', required: true },
      { name: 'return_array', description: 'The range to return values from', required: true },
      { name: 'if_not_found', description: 'Value if not found', required: false },
      { name: 'match_mode', description: '0=exact, -1=next smaller, 1=next larger, 2=wildcard', required: false },
      { name: 'search_mode', description: '1=first to last, -1=last to first, 2=binary ascending', required: false }
    ]
  },
  {
    name: 'VLOOKUP',
    syntax: '=VLOOKUP(lookup_value, table_array, col_index_num, [range_lookup])',
    description: 'Looks for a value in the leftmost column of a table, and returns a value in the same row from a column you specify.',
    category: 'Lookup & Reference',
    examples: ['=VLOOKUP(A1, B:D, 3, FALSE)', '=VLOOKUP("Product", A1:C100, 2, TRUE)'],
    args: [
      { name: 'lookup_value', description: 'The value to search for', required: true },
      { name: 'table_array', description: 'The table range', required: true },
      { name: 'col_index_num', description: 'Column number to return', required: true },
      { name: 'range_lookup', description: 'TRUE=approximate, FALSE=exact', required: false }
    ]
  },
  {
    name: 'HLOOKUP',
    syntax: '=HLOOKUP(lookup_value, table_array, row_index_num, [range_lookup])',
    description: 'Looks for a value in the top row of a table, and returns a value in the same column from a row you specify.',
    category: 'Lookup & Reference',
    examples: ['=HLOOKUP(A1, B2:D10, 3, FALSE)'],
    args: [
      { name: 'lookup_value', description: 'The value to search for', required: true },
      { name: 'table_array', description: 'The table range', required: true },
      { name: 'row_index_num', description: 'Row number to return', required: true },
      { name: 'range_lookup', description: 'TRUE=approximate, FALSE=exact', required: false }
    ]
  },
  {
    name: 'INDEX',
    syntax: '=INDEX(array, row_num, [column_num])',
    description: 'Returns a value or reference of the cell at the intersection of a particular row and column.',
    category: 'Lookup & Reference',
    examples: ['=INDEX(A1:C10, 2, 3)', '=INDEX(A:A, 5)'],
    args: [
      { name: 'array', description: 'The range or array', required: true },
      { name: 'row_num', description: 'Row number to return', required: true },
      { name: 'column_num', description: 'Column number to return', required: false }
    ]
  },
  {
    name: 'MATCH',
    syntax: '=MATCH(lookup_value, lookup_array, [match_type])',
    description: 'Searches for a specified item in a range of cells, and returns the relative position of that item.',
    category: 'Lookup & Reference',
    examples: ['=MATCH("Apple", A1:A100, 0)', '=MATCH(100, B:B, 1)'],
    args: [
      { name: 'lookup_value', description: 'The value to search for', required: true },
      { name: 'lookup_array', description: 'The range to search', required: true },
      { name: 'match_type', description: '1=less than, 0=exact, -1=greater than', required: false }
    ]
  },
  {
    name: 'TRANSPOSE',
    syntax: '=TRANSPOSE(array)',
    description: 'Returns the transpose of a given range or array.',
    category: 'Lookup & Reference',
    examples: ['=TRANSPOSE(A1:C3)'],
    args: [
      { name: 'array', description: 'The range or array to transpose', required: true }
    ]
  },

  // Text
  {
    name: 'CONCATENATE',
    syntax: '=CONCATENATE(text1, [text2], ...)',
    description: 'Joins several text strings into one text string.',
    category: 'Text',
    examples: ['=CONCATENATE(A1, " ", B1)', '=CONCATENATE("Hello ", "World")'],
    args: [
      { name: 'text1', description: 'First text item', required: true },
      { name: 'text2', description: 'Additional text items', required: false }
    ]
  },
  {
    name: 'TEXTJOIN',
    syntax: '=TEXTJOIN(delimiter, ignore_empty, text1, [text2], ...)',
    description: 'Combines the text from multiple ranges and/or strings, and includes a delimiter between each text value.',
    category: 'Text',
    examples: ['=TEXTJOIN(", ", TRUE, A1:A10)', '=TEXTJOIN("-", FALSE, B1, C1, D1)'],
    args: [
      { name: 'delimiter', description: 'The delimiter to use', required: true },
      { name: 'ignore_empty', description: 'TRUE to ignore empty cells', required: true },
      { name: 'text1', description: 'First text item', required: true }
    ]
  },
  {
    name: 'TEXTSPLIT',
    syntax: '=TEXTSPLIT(text, col_delimiter, [row_delimiter], [ignore_empty], [match_mode])',
    description: 'Splits text strings using delimiters that you specify.',
    category: 'Text',
    examples: ['=TEXTSPLIT(A1, ",")', '=TEXTSPLIT(A1, "-", ":")'],
    args: [
      { name: 'text', description: 'The text to split', required: true },
      { name: 'col_delimiter', description: 'Delimiter for columns', required: true },
      { name: 'row_delimiter', description: 'Delimiter for rows', required: false }
    ]
  },
  {
    name: 'LEFT',
    syntax: '=LEFT(text, [num_chars])',
    description: 'Returns the specified number of characters from the start of a text string.',
    category: 'Text',
    examples: ['=LEFT(A1, 3)', '=LEFT("Hello World", 5)'],
    args: [
      { name: 'text', description: 'The text string', required: true },
      { name: 'num_chars', description: 'Number of characters to return', required: false }
    ]
  },
  {
    name: 'RIGHT',
    syntax: '=RIGHT(text, [num_chars])',
    description: 'Returns the specified number of characters from the end of a text string.',
    category: 'Text',
    examples: ['=RIGHT(A1, 3)', '=RIGHT("Hello World", 5)'],
    args: [
      { name: 'text', description: 'The text string', required: true },
      { name: 'num_chars', description: 'Number of characters to return', required: false }
    ]
  },
  {
    name: 'MID',
    syntax: '=MID(text, start_num, num_chars)',
    description: 'Returns a specific number of characters from a text string, starting at the position you specify.',
    category: 'Text',
    examples: ['=MID(A1, 2, 3)', '=MID("Hello World", 7, 5)'],
    args: [
      { name: 'text', description: 'The text string', required: true },
      { name: 'start_num', description: 'Starting position', required: true },
      { name: 'num_chars', description: 'Number of characters to return', required: true }
    ]
  },
  {
    name: 'TRIM',
    syntax: '=TRIM(text)',
    description: 'Removes all spaces from text except for single spaces between words.',
    category: 'Text',
    examples: ['=TRIM(A1)', '=TRIM("  Hello   World  ")'],
    args: [
      { name: 'text', description: 'The text to trim', required: true }
    ]
  },
  {
    name: 'UPPER',
    syntax: '=UPPER(text)',
    description: 'Converts text to uppercase.',
    category: 'Text',
    examples: ['=UPPER(A1)', '=UPPER("hello")'],
    args: [
      { name: 'text', description: 'The text to convert', required: true }
    ]
  },
  {
    name: 'LOWER',
    syntax: '=LOWER(text)',
    description: 'Converts text to lowercase.',
    category: 'Text',
    examples: ['=LOWER(A1)', '=LOWER("HELLO")'],
    args: [
      { name: 'text', description: 'The text to convert', required: true }
    ]
  },
  {
    name: 'PROPER',
    syntax: '=PROPER(text)',
    description: 'Capitalizes the first letter in each word of a text value.',
    category: 'Text',
    examples: ['=PROPER(A1)', '=PROPER("hello world")'],
    args: [
      { name: 'text', description: 'The text to convert', required: true }
    ]
  },
  {
    name: 'LEN',
    syntax: '=LEN(text)',
    description: 'Returns the number of characters in a text string.',
    category: 'Text',
    examples: ['=LEN(A1)', '=LEN("Hello")'],
    args: [
      { name: 'text', description: 'The text to measure', required: true }
    ]
  },
  {
    name: 'FIND',
    syntax: '=FIND(find_text, within_text, [start_num])',
    description: 'Returns the starting position of one text string within another text string. Case-sensitive.',
    category: 'Text',
    examples: ['=FIND("o", "Hello")', '=FIND("World", A1)'],
    args: [
      { name: 'find_text', description: 'Text to find', required: true },
      { name: 'within_text', description: 'Text to search in', required: true },
      { name: 'start_num', description: 'Starting position', required: false }
    ]
  },
  {
    name: 'SUBSTITUTE',
    syntax: '=SUBSTITUTE(text, old_text, new_text, [instance_num])',
    description: 'Substitutes new text for old text in a text string.',
    category: 'Text',
    examples: ['=SUBSTITUTE(A1, "old", "new")', '=SUBSTITUTE(A1, " ", "-")'],
    args: [
      { name: 'text', description: 'The text string', required: true },
      { name: 'old_text', description: 'Text to replace', required: true },
      { name: 'new_text', description: 'Replacement text', required: true },
      { name: 'instance_num', description: 'Which instance to replace', required: false }
    ]
  },
  {
    name: 'REGEXEXTRACT',
    syntax: '=REGEXEXTRACT(text, regular_expression)',
    description: 'Extracts text from a string using a regular expression.',
    category: 'Text',
    examples: ['=REGEXEXTRACT(A1, "\\d+")', '=REGEXEXTRACT(A1, "[A-Za-z]+")'],
    args: [
      { name: 'text', description: 'The text string', required: true },
      { name: 'regular_expression', description: 'The regex pattern', required: true }
    ]
  },
  {
    name: 'REGEXREPLACE',
    syntax: '=REGEXREPLACE(text, regular_expression, replacement)',
    description: 'Replaces text in a string using a regular expression.',
    category: 'Text',
    examples: ['=REGEXREPLACE(A1, "\\d+", "X")', '=REGEXREPLACE(A1, " ", "-")'],
    args: [
      { name: 'text', description: 'The text string', required: true },
      { name: 'regular_expression', description: 'The regex pattern', required: true },
      { name: 'replacement', description: 'Replacement text', required: true }
    ]
  },

  // Date & Time
  {
    name: 'TODAY',
    syntax: '=TODAY()',
    description: 'Returns the serial number of the current date.',
    category: 'Date & Time',
    examples: ['=TODAY()', '=TODAY()+7'],
    args: []
  },
  {
    name: 'NOW',
    syntax: '=NOW()',
    description: 'Returns the serial number of the current date and time.',
    category: 'Date & Time',
    examples: ['=NOW()', '=NOW()-TODAY()'],
    args: []
  },
  {
    name: 'DATE',
    syntax: '=DATE(year, month, day)',
    description: 'Returns the serial number of a particular date.',
    category: 'Date & Time',
    examples: ['=DATE(2024, 12, 25)', '=DATE(A1, B1, C1)'],
    args: [
      { name: 'year', description: 'The year', required: true },
      { name: 'month', description: 'The month', required: true },
      { name: 'day', description: 'The day', required: true }
    ]
  },
  {
    name: 'DATEDIF',
    syntax: '=DATEDIF(start_date, end_date, unit)',
    description: 'Calculates the number of days, months, or years between two dates.',
    category: 'Date & Time',
    examples: ['=DATEDIF(A1, B1, "Y")', '=DATEDIF(A1, B1, "M")'],
    args: [
      { name: 'start_date', description: 'The start date', required: true },
      { name: 'end_date', description: 'The end date', required: true },
      { name: 'unit', description: 'Y=years, M=months, D=days', required: true }
    ]
  },
  {
    name: 'WORKDAY',
    syntax: '=WORKDAY(start_date, days, [holidays])',
    description: 'Returns the serial number of the date before or after a specified number of workdays.',
    category: 'Date & Time',
    examples: ['=WORKDAY(A1, 10)', '=WORKDAY(A1, 10, B1:B5)'],
    args: [
      { name: 'start_date', description: 'The start date', required: true },
      { name: 'days', description: 'Number of workdays', required: true },
      { name: 'holidays', description: 'Range of holiday dates', required: false }
    ]
  },
  {
    name: 'NETWORKDAYS',
    syntax: '=NETWORKDAYS(start_date, end_date, [holidays])',
    description: 'Returns the number of whole workdays between two dates.',
    category: 'Date & Time',
    examples: ['=NETWORKDAYS(A1, B1)', '=NETWORKDAYS(A1, B1, C1:C5)'],
    args: [
      { name: 'start_date', description: 'The start date', required: true },
      { name: 'end_date', description: 'The end date', required: true },
      { name: 'holidays', description: 'Range of holiday dates', required: false }
    ]
  },
  {
    name: 'EOMONTH',
    syntax: '=EOMONTH(start_date, months)',
    description: 'Returns the serial number of the last day of the month before or after a specified number of months.',
    category: 'Date & Time',
    examples: ['=EOMONTH(A1, 0)', '=EOMONTH(A1, 1)'],
    args: [
      { name: 'start_date', description: 'The start date', required: true },
      { name: 'months', description: 'Number of months', required: true }
    ]
  },
  {
    name: 'EDATE',
    syntax: '=EDATE(start_date, months)',
    description: 'Returns the serial number of the date that is the indicated number of months before or after the start date.',
    category: 'Date & Time',
    examples: ['=EDATE(A1, 3)', '=EDATE(A1, -1)'],
    args: [
      { name: 'start_date', description: 'The start date', required: true },
      { name: 'months', description: 'Number of months', required: true }
    ]
  },
  {
    name: 'WEEKDAY',
    syntax: '=WEEKDAY(serial_number, [return_type])',
    description: 'Returns the day of the week of a serial number.',
    category: 'Date & Time',
    examples: ['=WEEKDAY(A1)', '=WEEKDAY(A1, 2)'],
    args: [
      { name: 'serial_number', description: 'The date', required: true },
      { name: 'return_type', description: 'Return type (1=Sun-Sat, 2=Mon-Sun)', required: false }
    ]
  },

  // Math & Trig
  {
    name: 'SUM',
    syntax: '=SUM(number1, [number2], ...)',
    description: 'Adds all the numbers in a range of cells.',
    category: 'Math & Trig',
    examples: ['=SUM(A1:A10)', '=SUM(A1, B1, C1)'],
    args: [
      { name: 'number1', description: 'First number or range', required: true },
      { name: 'number2', description: 'Additional numbers or ranges', required: false }
    ]
  },
  {
    name: 'SUMIF',
    syntax: '=SUMIF(range, criteria, [sum_range])',
    description: 'Adds the cells specified by a given criteria.',
    category: 'Math & Trig',
    examples: ['=SUMIF(A1:A10, ">5")', '=SUMIF(B:B, "Apples", C:C)'],
    args: [
      { name: 'range', description: 'The range to evaluate', required: true },
      { name: 'criteria', description: 'The criteria', required: true },
      { name: 'sum_range', description: 'Range to sum', required: false }
    ]
  },
  {
    name: 'SUMIFS',
    syntax: '=SUMIFS(sum_range, criteria_range1, criteria1, [criteria_range2, criteria2], ...)',
    description: 'Adds the cells in a range that meet multiple criteria.',
    category: 'Math & Trig',
    examples: ['=SUMIFS(C:C, A:A, "Apples", B:B, ">10")'],
    args: [
      { name: 'sum_range', description: 'Range to sum', required: true },
      { name: 'criteria_range1', description: 'First criteria range', required: true },
      { name: 'criteria1', description: 'First criteria', required: true }
    ]
  },
  {
    name: 'COUNTIF',
    syntax: '=COUNTIF(range, criteria)',
    description: 'Counts the number of cells that meet a criteria.',
    category: 'Math & Trig',
    examples: ['=COUNTIF(A1:A10, ">5")', '=COUNTIF(B:B, "Apples")'],
    args: [
      { name: 'range', description: 'The range to evaluate', required: true },
      { name: 'criteria', description: 'The criteria', required: true }
    ]
  },
  {
    name: 'COUNTIFS',
    syntax: '=COUNTIFS(criteria_range1, criteria1, [criteria_range2, criteria2], ...)',
    description: 'Counts the number of cells that meet multiple criteria.',
    category: 'Math & Trig',
    examples: ['=COUNTIFS(A:A, "Apples", B:B, ">10")'],
    args: [
      { name: 'criteria_range1', description: 'First criteria range', required: true },
      { name: 'criteria1', description: 'First criteria', required: true }
    ]
  },
  {
    name: 'AVERAGE',
    syntax: '=AVERAGE(number1, [number2], ...)',
    description: 'Returns the average (arithmetic mean) of the arguments.',
    category: 'Math & Trig',
    examples: ['=AVERAGE(A1:A10)', '=AVERAGE(B1, C1, D1)'],
    args: [
      { name: 'number1', description: 'First number or range', required: true },
      { name: 'number2', description: 'Additional numbers or ranges', required: false }
    ]
  },
  {
    name: 'ROUND',
    syntax: '=ROUND(number, num_digits)',
    description: 'Rounds a number to a specified number of digits.',
    category: 'Math & Trig',
    examples: ['=ROUND(A1, 2)', '=ROUND(3.14159, 2)'],
    args: [
      { name: 'number', description: 'The number to round', required: true },
      { name: 'num_digits', description: 'Number of digits', required: true }
    ]
  },
  {
    name: 'ROUNDUP',
    syntax: '=ROUNDUP(number, num_digits)',
    description: 'Rounds a number up, away from zero.',
    category: 'Math & Trig',
    examples: ['=ROUNDUP(A1, 2)', '=ROUNDUP(3.14159, 2)'],
    args: [
      { name: 'number', description: 'The number to round', required: true },
      { name: 'num_digits', description: 'Number of digits', required: true }
    ]
  },
  {
    name: 'ROUNDDOWN',
    syntax: '=ROUNDDOWN(number, num_digits)',
    description: 'Rounds a number down, toward zero.',
    category: 'Math & Trig',
    examples: ['=ROUNDDOWN(A1, 2)', '=ROUNDDOWN(3.14159, 2)'],
    args: [
      { name: 'number', description: 'The number to round', required: true },
      { name: 'num_digits', description: 'Number of digits', required: true }
    ]
  },
  {
    name: 'CEILING',
    syntax: '=CEILING(number, significance)',
    description: 'Rounds a number up to the nearest multiple of significance.',
    category: 'Math & Trig',
    examples: ['=CEILING(A1, 5)', '=CEILING(3.14, 1)'],
    args: [
      { name: 'number', description: 'The number to round', required: true },
      { name: 'significance', description: 'Multiple to round to', required: true }
    ]
  },
  {
    name: 'FLOOR',
    syntax: '=FLOOR(number, significance)',
    description: 'Rounds a number down to the nearest multiple of significance.',
    category: 'Math & Trig',
    examples: ['=FLOOR(A1, 5)', '=FLOOR(3.14, 1)'],
    args: [
      { name: 'number', description: 'The number to round', required: true },
      { name: 'significance', description: 'Multiple to round to', required: true }
    ]
  },
  {
    name: 'MOD',
    syntax: '=MOD(number, divisor)',
    description: 'Returns the remainder after division.',
    category: 'Math & Trig',
    examples: ['=MOD(A1, 2)', '=MOD(10, 3)'],
    args: [
      { name: 'number', description: 'The number to divide', required: true },
      { name: 'divisor', description: 'The divisor', required: true }
    ]
  },
  {
    name: 'POWER',
    syntax: '=POWER(number, power)',
    description: 'Returns the result of a number raised to a power.',
    category: 'Math & Trig',
    examples: ['=POWER(A1, 2)', '=POWER(2, 3)'],
    args: [
      { name: 'number', description: 'The base number', required: true },
      { name: 'power', description: 'The exponent', required: true }
    ]
  },
  {
    name: 'SQRT',
    syntax: '=SQRT(number)',
    description: 'Returns the square root of a number.',
    category: 'Math & Trig',
    examples: ['=SQRT(A1)', '=SQRT(16)'],
    args: [
      { name: 'number', description: 'The number', required: true }
    ]
  },
  {
    name: 'ABS',
    syntax: '=ABS(number)',
    description: 'Returns the absolute value of a number.',
    category: 'Math & Trig',
    examples: ['=ABS(A1)', '=ABS(-5)'],
    args: [
      { name: 'number', description: 'The number', required: true }
    ]
  },

  // Statistical
  {
    name: 'MAX',
    syntax: '=MAX(number1, [number2], ...)',
    description: 'Returns the maximum value in a set of values.',
    category: 'Statistical',
    examples: ['=MAX(A1:A10)', '=MAX(B1, C1, D1)'],
    args: [
      { name: 'number1', description: 'First number or range', required: true },
      { name: 'number2', description: 'Additional numbers or ranges', required: false }
    ]
  },
  {
    name: 'MIN',
    syntax: '=MIN(number1, [number2], ...)',
    description: 'Returns the minimum value in a set of values.',
    category: 'Statistical',
    examples: ['=MIN(A1:A10)', '=MIN(B1, C1, D1)'],
    args: [
      { name: 'number1', description: 'First number or range', required: true },
      { name: 'number2', description: 'Additional numbers or ranges', required: false }
    ]
  },
  {
    name: 'COUNT',
    syntax: '=COUNT(value1, [value2], ...)',
    description: 'Counts the number of cells that contain numbers.',
    category: 'Statistical',
    examples: ['=COUNT(A1:A10)', '=COUNT(A1, B1, "text", 100)'],
    args: [
      { name: 'value1', description: 'First value or range', required: true },
      { name: 'value2', description: 'Additional values or ranges', required: false }
    ]
  },
  {
    name: 'COUNTA',
    syntax: '=COUNTA(value1, [value2], ...)',
    description: 'Counts the number of cells that are not empty.',
    category: 'Statistical',
    examples: ['=COUNTA(A1:A10)', '=COUNTA(B1, C1, D1)'],
    args: [
      { name: 'value1', description: 'First value or range', required: true },
      { name: 'value2', description: 'Additional values or ranges', required: false }
    ]
  },
  {
    name: 'COUNTBLANK',
    syntax: '=COUNTBLANK(range)',
    description: 'Counts the number of empty cells in a range.',
    category: 'Statistical',
    examples: ['=COUNTBLANK(A1:A10)', '=COUNTBLANK(B:B)'],
    args: [
      { name: 'range', description: 'The range to check', required: true }
    ]
  },
  {
    name: 'STDEV',
    syntax: '=STDEV(number1, [number2], ...)',
    description: 'Estimates standard deviation based on a sample.',
    category: 'Statistical',
    examples: ['=STDEV(A1:A10)', '=STDEV(B1, C1, D1)'],
    args: [
      { name: 'number1', description: 'First number or range', required: true },
      { name: 'number2', description: 'Additional numbers or ranges', required: false }
    ]
  },
  {
    name: 'VAR',
    syntax: '=VAR(number1, [number2], ...)',
    description: 'Estimates variance based on a sample.',
    category: 'Statistical',
    examples: ['=VAR(A1:A10)', '=VAR(B1, C1, D1)'],
    args: [
      { name: 'number1', description: 'First number or range', required: true },
      { name: 'number2', description: 'Additional numbers or ranges', required: false }
    ]
  },
  {
    name: 'CORREL',
    syntax: '=CORREL(array1, array2)',
    description: 'Returns the correlation coefficient between two data sets.',
    category: 'Statistical',
    examples: ['=CORREL(A1:A10, B1:B10)', '=CORREL(A:A, B:B)'],
    args: [
      { name: 'array1', description: 'First range of values', required: true },
      { name: 'array2', description: 'Second range of values', required: true }
    ]
  },
  {
    name: 'PERCENTILE',
    syntax: '=PERCENTILE(array, k)',
    description: 'Returns the k-th percentile of values in a range.',
    category: 'Statistical',
    examples: ['=PERCENTILE(A1:A100, 0.9)', '=PERCENTILE(A:A, 0.5)'],
    args: [
      { name: 'array', description: 'The range of values', required: true },
      { name: 'k', description: 'Percentile (0-1)', required: true }
    ]
  },
  {
    name: 'QUARTILE',
    syntax: '=QUARTILE(array, quart)',
    description: 'Returns the quartile of a data set.',
    category: 'Statistical',
    examples: ['=QUARTILE(A1:A100, 1)', '=QUARTILE(A:A, 3)'],
    args: [
      { name: 'array', description: 'The range of values', required: true },
      { name: 'quart', description: 'Quartile (0-4)', required: true }
    ]
  },
  {
    name: 'MEDIAN',
    syntax: '=MEDIAN(number1, [number2], ...)',
    description: 'Returns the median of the given numbers.',
    category: 'Statistical',
    examples: ['=MEDIAN(A1:A10)', '=MEDIAN(B1, C1, D1)'],
    args: [
      { name: 'number1', description: 'First number or range', required: true },
      { name: 'number2', description: 'Additional numbers or ranges', required: false }
    ]
  },
  {
    name: 'MODE',
    syntax: '=MODE(number1, [number2], ...)',
    description: 'Returns the most common value in a data set.',
    category: 'Statistical',
    examples: ['=MODE(A1:A10)', '=MODE(B1, C1, D1)'],
    args: [
      { name: 'number1', description: 'First number or range', required: true },
      { name: 'number2', description: 'Additional numbers or ranges', required: false }
    ]
  },

  // Financial
  {
    name: 'PMT',
    syntax: '=PMT(rate, nper, pv, [fv], [type])',
    description: 'Calculates the payment for a loan based on constant payments and a constant interest rate.',
    category: 'Financial',
    examples: ['=PMT(0.05/12, 60, 50000)', '=PMT(6%/12, 360, 200000)'],
    args: [
      { name: 'rate', description: 'Interest rate per period', required: true },
      { name: 'nper', description: 'Total number of payments', required: true },
      { name: 'pv', description: 'Present value (loan amount)', required: true },
      { name: 'fv', description: 'Future value', required: false },
      { name: 'type', description: 'When payments are due (0=end, 1=beginning)', required: false }
    ]
  },
  {
    name: 'PV',
    syntax: '=PV(rate, nper, pmt, [fv], [type])',
    description: 'Returns the present value of an investment.',
    category: 'Financial',
    examples: ['=PV(0.05/12, 60, -1000)', '=PV(6%/12, 360, -1000)'],
    args: [
      { name: 'rate', description: 'Interest rate per period', required: true },
      { name: 'nper', description: 'Total number of payments', required: true },
      { name: 'pmt', description: 'Payment per period', required: true },
      { name: 'fv', description: 'Future value', required: false },
      { name: 'type', description: 'When payments are due', required: false }
    ]
  },
  {
    name: 'FV',
    syntax: '=FV(rate, nper, pmt, [pv], [type])',
    description: 'Returns the future value of an investment.',
    category: 'Financial',
    examples: ['=FV(0.05/12, 60, -1000)', '=FV(6%/12, 360, -500)'],
    args: [
      { name: 'rate', description: 'Interest rate per period', required: true },
      { name: 'nper', description: 'Total number of payments', required: true },
      { name: 'pmt', description: 'Payment per period', required: true },
      { name: 'pv', description: 'Present value', required: false },
      { name: 'type', description: 'When payments are due', required: false }
    ]
  },
  {
    name: 'NPV',
    syntax: '=NPV(rate, value1, [value2], ...)',
    description: 'Returns the net present value of an investment.',
    category: 'Financial',
    examples: ['=NPV(0.1, A1:A5)', '=NPV(0.08, B1, B2, B3, B4)'],
    args: [
      { name: 'rate', description: 'Discount rate', required: true },
      { name: 'value1', description: 'First cash flow', required: true },
      { name: 'value2', description: 'Additional cash flows', required: false }
    ]
  },
  {
    name: 'IRR',
    syntax: '=IRR(values, [guess])',
    description: 'Returns the internal rate of return for a series of cash flows.',
    category: 'Financial',
    examples: ['=IRR(A1:A5)', '=IRR(B1:B10, 0.1)'],
    args: [
      { name: 'values', description: 'Array of cash flows', required: true },
      { name: 'guess', description: 'Initial guess', required: false }
    ]
  },
  {
    name: 'RATE',
    syntax: '=RATE(nper, pmt, pv, [fv], [type], [guess])',
    description: 'Returns the interest rate per period of an annuity.',
    category: 'Financial',
    examples: ['=RATE(60, -1000, 50000)', '=RATE(360, -500, 100000)'],
    args: [
      { name: 'nper', description: 'Total number of payments', required: true },
      { name: 'pmt', description: 'Payment per period', required: true },
      { name: 'pv', description: 'Present value', required: true },
      { name: 'fv', description: 'Future value', required: false },
      { name: 'type', description: 'When payments are due', required: false },
      { name: 'guess', description: 'Initial guess', required: false }
    ]
  }
];

interface FormulaAutocompleteProps {
  inputValue: string;
  onSelectFormula: (formulaName: string) => void;
  onClose: () => void;
}

const FormulaAutocomplete: React.FC<FormulaAutocompleteProps> = ({
  inputValue,
  onSelectFormula,
  onClose
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  // Extract formula name being typed
  const formulaName = inputValue.replace(/^[=()]/, '').toUpperCase().split('(')[0];

  // Filter formulas based on input
  const filteredFormulas = useMemo(() => {
    let filtered = FORMULA_DATABASE;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(f => f.category === selectedCategory);
    }

    // Filter by search term
    if (formulaName) {
      filtered = filtered.filter(f => 
        f.name.toUpperCase().includes(formulaName) ||
        f.description.toLowerCase().includes(formulaName.toLowerCase())
      );
    }

    return filtered.slice(0, 10); // Limit to 10 results
  }, [formulaName, selectedCategory]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(FORMULA_DATABASE.map(f => f.category));
    return ['all', ...Array.from(cats)];
  }, []);

  useEffect(() => {
    setSelectedIndex(0);
  }, [formulaName, selectedCategory]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredFormulas.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredFormulas.length) % filteredFormulas.length);
      } else if (e.key === 'Enter' && filteredFormulas[selectedIndex]) {
        e.preventDefault();
        onSelectFormula(filteredFormulas[selectedIndex].name);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredFormulas, selectedIndex, onSelectFormula, onClose]);

  if (!inputValue.startsWith('=')) {
    return null;
  }

  return (
    <div 
      className="absolute left-0 top-full mt-1 w-[600px] bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-50 overflow-hidden"
      style={{ maxHeight: '500px', overflowY: 'auto' }}
    >
      {/* Category Filter */}
      <div className="flex items-center gap-1 p-2 border-b border-slate-700 bg-slate-800/50 overflow-x-auto">
        <span className="text-[10px] uppercase font-semibold text-slate-500 px-2">Filter:</span>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-2 py-1 text-xs rounded transition-colors whitespace-nowrap ${
              selectedCategory === cat
                ? 'bg-nexus-accent/20 text-nexus-accent'
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            {cat === 'all' ? 'All' : cat}
          </button>
        ))}
      </div>

      {/* Formula List */}
      <div className="divide-y divide-slate-700">
        {filteredFormulas.length === 0 ? (
          <div className="p-4 text-center text-slate-500">
            <FunctionSquare className="w-8 h-8 mx-auto mb-2 opacity-20" />
            <p className="text-sm">No formulas found</p>
          </div>
        ) : (
          filteredFormulas.map((formula, idx) => (
            <button
              key={formula.name}
              onClick={() => onSelectFormula(formula.name)}
              onMouseEnter={() => setSelectedIndex(idx)}
              className={`w-full text-left p-3 transition-colors ${
                idx === selectedIndex
                  ? 'bg-nexus-accent/10 border-l-2 border-nexus-accent'
                  : 'hover:bg-slate-800 border-l-2 border-transparent'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <FunctionSquare className="w-4 h-4 text-nexus-accent flex-shrink-0" />
                    <span className="font-mono font-bold text-white">{formula.name}</span>
                    <span className="text-xs text-slate-500">({formula.category})</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-2">{formula.description}</p>
                  <div className="flex items-center gap-2 text-xs">
                    <BookOpen className="w-3 h-3 text-slate-500" />
                    <span className="text-slate-500">{formula.syntax}</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-600 flex-shrink-0" />
              </div>
            </button>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 bg-slate-800/50 border-t border-slate-700 text-xs text-slate-500 flex items-center justify-between">
        <span>{filteredFormulas.length} formula{filteredFormulas.length !== 1 ? 's' : ''}</span>
        <div className="flex items-center gap-3">
          <span>↑↓ Navigate</span>
          <span>Enter Select</span>
          <span>Esc Close</span>
        </div>
      </div>
    </div>
  );
};

export default FormulaAutocomplete;
