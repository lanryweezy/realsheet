/**
 * Advanced Number Formatting Service
 * Implements Excel-style custom number formats
 */

export type FormatType = 
  | 'general'
  | 'number'
  | 'currency'
  | 'accounting'
  | 'percentage'
  | 'scientific'
  | 'fraction'
  | 'date'
  | 'time'
  | 'datetime'
  | 'custom';

export interface NumberFormatOptions {
  type: FormatType;
  decimals?: number;
  currencySymbol?: string;
  currencyCode?: string;
  locale?: string;
  showThousandsSeparator?: boolean;
  showNegativeInParentheses?: boolean;
  negativeColor?: string;
  customFormat?: string; // Excel-style custom format string
}

/**
 * Format a number according to specified format options
 */
export const formatNumber = (value: number | string | null, options: NumberFormatOptions): string => {
  if (value === null || value === undefined || value === '') return '';
  
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return String(value);

  const locale = options.locale || 'en-US';

  switch (options.type) {
    case 'general':
      return formatGeneral(num, locale);
    
    case 'number':
      return formatStandardNumber(num, options, locale);
    
    case 'currency':
      return formatCurrency(num, options, locale);
    
    case 'accounting':
      return formatAccounting(num, options, locale);
    
    case 'percentage':
      return formatPercentage(num, options, locale);
    
    case 'scientific':
      return formatScientific(num, options, locale);
    
    case 'fraction':
      return formatFraction(num, options);
    
    case 'date':
      return formatDate(num, options);
    
    case 'time':
      return formatTime(num, options);
    
    case 'datetime':
      return formatDateTime(num, options);
    
    case 'custom':
      return formatCustom(num, options);
    
    default:
      return String(num);
  }
};

/**
 * General format - Excel's default format
 */
const formatGeneral = (num: number, locale: string): string => {
  // For very large or very small numbers, use scientific notation
  if (Math.abs(num) >= 1e12 || (Math.abs(num) < 1e-9 && num !== 0)) {
    return num.toExponential(2);
  }
  
  // For numbers with many decimal places, limit to reasonable precision
  if (Number.isInteger(num)) {
    return num.toLocaleString(locale);
  }
  
  return num.toLocaleString(locale, { maximumFractionDigits: 10 });
};

/**
 * Standard number format with thousands separator
 */
const formatStandardNumber = (num: number, options: NumberFormatOptions, locale: string): string => {
  const decimals = options.decimals ?? 2;
  const useSeparator = options.showThousandsSeparator ?? true;
  
  const formatOptions: Intl.NumberFormatOptions = {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: useSeparator,
  };

  let formatted = num.toLocaleString(locale, formatOptions);
  
  // Handle negative numbers
  if (num < 0 && options.showNegativeInParentheses) {
    formatted = `(${Math.abs(num).toLocaleString(locale, formatOptions)})`;
  }
  
  return formatted;
};

/**
 * Currency format
 */
const formatCurrency = (num: number, options: NumberFormatOptions, locale: string): string => {
  const decimals = options.decimals ?? 2;
  const currency = options.currencyCode || 'USD';
  const symbol = options.currencySymbol;
  
  const formatOptions: Intl.NumberFormatOptions = {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    currencyDisplay: symbol ? 'symbol' : 'narrowSymbol',
  };

  let formatted = num.toLocaleString(locale, formatOptions);
  
  if (options.showNegativeInParentheses && num < 0) {
    formatted = `(${Math.abs(num).toLocaleString(locale, formatOptions)})`;
  }
  
  return formatted;
};

/**
 * Accounting format - currency symbol aligned left
 */
const formatAccounting = (num: number, options: NumberFormatOptions, locale: string): string => {
  const decimals = options.decimals ?? 2;
  const currency = options.currencySymbol || '$';
  
  const absNum = Math.abs(num);
  const formatted = absNum.toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: true,
  });

  if (num < 0) {
    return options.showNegativeInParentheses 
      ? `(${currency}${formatted})` 
      : `-${currency}${formatted}`;
  }
  
  return `${currency}${formatted}`;
};

/**
 * Percentage format
 */
const formatPercentage = (num: number, options: NumberFormatOptions, locale: string): string => {
  const decimals = options.decimals ?? 1;
  
  // Assume input is already a decimal (0.5 = 50%)
  const percentageValue = num * 100;
  
  return `${percentageValue.toFixed(decimals)}%`;
};

/**
 * Scientific notation format
 */
const formatScientific = (num: number, options: NumberFormatOptions, locale: string): string => {
  const decimals = options.decimals ?? 2;
  return num.toExponential(decimals);
};

/**
 * Fraction format
 */
const formatFraction = (num: number, options: NumberFormatOptions): string => {
  const tolerance = 1.0E-6;
  const maxDenominator = options.decimals ? Math.pow(10, options.decimals) : 1000;
  
  const sign = num < 0 ? '-' : '';
  const absNum = Math.abs(num);
  const integerPart = Math.floor(absNum);
  const fractionalPart = absNum - integerPart;
  
  if (fractionalPart < tolerance) {
    return `${sign}${integerPart}`;
  }
  
  // Find best fraction approximation
  let bestNumerator = 0;
  let bestDenominator = 1;
  let bestError = Infinity;
  
  for (let denominator = 1; denominator <= maxDenominator; denominator++) {
    const numerator = Math.round(fractionalPart * denominator);
    const error = Math.abs(fractionalPart - numerator / denominator);
    
    if (error < bestError && error < tolerance * 100) {
      bestNumerator = numerator;
      bestDenominator = denominator;
      bestError = error;
    }
  }
  
  if (integerPart > 0) {
    return `${sign}${integerPart} ${bestNumerator}/${bestDenominator}`;
  }
  
  return `${sign}${bestNumerator}/${bestDenominator}`;
};

/**
 * Date format (from Excel serial date number)
 */
const formatDate = (serialDate: number, options: NumberFormatOptions): string => {
  // Excel serial date: days since 1899-12-30
  const excelEpoch = new Date(1899, 11, 30).getTime();
  const date = new Date(excelEpoch + serialDate * 24 * 60 * 60 * 1000);
  
  const formatStr = options.customFormat || 'MM/DD/YYYY';
  return formatDateString(date, formatStr);
};

/**
 * Time format (from Excel serial time)
 */
const formatTime = (serialTime: number, options: NumberFormatOptions): string => {
  // Excel serial time: fraction of day
  const totalSeconds = Math.round(serialTime * 24 * 60 * 60);
  const hours = Math.floor(totalSeconds / 3600) % 24;
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  const formatStr = options.customFormat || 'HH:MM:SS';
  const date = new Date(0, 0, 0, hours, minutes, seconds);
  return formatDateString(date, formatStr);
};

/**
 * DateTime format
 */
const formatDateTime = (serialDateTime: number, options: NumberFormatOptions): string => {
  const excelEpoch = new Date(1899, 11, 30).getTime();
  const dateTime = new Date(excelEpoch + serialDateTime * 24 * 60 * 60 * 1000);
  
  const formatStr = options.customFormat || 'MM/DD/YYYY HH:MM:SS';
  return formatDateString(dateTime, formatStr);
};

/**
 * Format date string with custom format
 */
const formatDateString = (date: Date, format: string): string => {
  const replacements: Record<string, string | number> = {
    'YYYY': date.getFullYear(),
    'YY': String(date.getFullYear()).slice(-2),
    'MM': String(date.getMonth() + 1).padStart(2, '0'),
    'M': String(date.getMonth() + 1),
    'DD': String(date.getDate()).padStart(2, '0'),
    'D': String(date.getDate()),
    'HH': String(date.getHours()).padStart(2, '0'),
    'H': String(date.getHours()),
    'hh': String(date.getHours() % 12 || 12).padStart(2, '0'),
    'h': String(date.getHours() % 12 || 12),
    'mm': String(date.getMinutes()).padStart(2, '0'),
    'm': String(date.getMinutes()),
    'SS': String(date.getSeconds()).padStart(2, '0'),
    's': String(date.getSeconds()),
    'AM/PM': date.getHours() >= 12 ? 'PM' : 'AM',
    'dddd': ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()],
    'ddd': ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()],
    'MMMM': ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][date.getMonth()],
    'MMM': ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.getMonth()],
  };

  let result = format;
  Object.entries(replacements).forEach(([key, value]) => {
    result = result.replace(new RegExp(key, 'g'), String(value));
  });

  return result;
};

/**
 * Custom format using Excel-style format string
 */
const formatCustom = (num: number, options: NumberFormatOptions): string => {
  const formatStr = options.customFormat || '';
  
  // Parse Excel-style format (simplified implementation)
  // Full implementation would handle all Excel format codes
  
  // Handle basic patterns
  if (formatStr.includes('#,##0')) {
    const decimals = (formatStr.match(/\.([0#]+)/) || [])[1]?.length || 0;
    return num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      useGrouping: true,
    });
  }
  
  if (formatStr.includes('0.00')) {
    return num.toFixed(2);
  }
  
  if (formatStr.includes('%')) {
    return `${(num * 100).toFixed(2)}%`;
  }
  
  // Default to general format
  return formatGeneral(num, 'en-US');
};

/**
 * Parse a number from formatted string
 */
export const parseNumber = (formattedValue: string, options?: NumberFormatOptions): number | null => {
  if (!formattedValue) return null;
  
  // Remove currency symbols, commas, parentheses, etc.
  let cleaned = formattedValue
    .replace(/[$€£¥]/g, '')
    .replace(/,/g, '')
    .replace(/\(/g, '-')
    .replace(/\)/g, '')
    .replace(/%/g, '')
    .trim();
  
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
};

/**
 * Get common format presets
 */
export const getFormatPresets = (): Array<{ id: FormatType; name: string; example: string }> => [
  { id: 'general', name: 'General', example: '1234.567' },
  { id: 'number', name: 'Number', example: '1,234.57' },
  { id: 'currency', name: 'Currency', example: '$1,234.57' },
  { id: 'accounting', name: 'Accounting', example: '$ 1,234.57' },
  { id: 'percentage', name: 'Percentage', example: '12.35%' },
  { id: 'scientific', name: 'Scientific', example: '1.23E+03' },
  { id: 'fraction', name: 'Fraction', example: '1234 4/7' },
  { id: 'date', name: 'Date', example: '03/14/2024' },
  { id: 'time', name: 'Time', example: '13:30:00' },
];

/**
 * Apply conditional formatting based on rules
 */
export interface ConditionalFormatRule {
  type: 'greaterThan' | 'lessThan' | 'between' | 'equalTo' | 'containsText' | 'topN' | 'bottomN';
  value1?: number | string;
  value2?: number | string;
  format: {
    backgroundColor?: string;
    textColor?: string;
    fontWeight?: 'normal' | 'bold';
    fontStyle?: 'normal' | 'italic';
    underline?: boolean;
  };
}

export const applyConditionalFormatting = (
  value: number | string | null,
  rules: ConditionalFormatRule[]
): ConditionalFormatRule['format'] | null => {
  for (const rule of rules) {
    if (meetsCondition(value, rule)) {
      return rule.format;
    }
  }
  return null;
};

const meetsCondition = (value: number | string | null, rule: ConditionalFormatRule): boolean => {
  if (value === null || value === undefined) return false;
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  const strValue = String(value);
  
  switch (rule.type) {
    case 'greaterThan':
      return numValue > Number(rule.value1);
    
    case 'lessThan':
      return numValue < Number(rule.value1);
    
    case 'between':
      return numValue >= Number(rule.value1) && numValue <= Number(rule.value2);
    
    case 'equalTo':
      return numValue === Number(rule.value1);
    
    case 'containsText':
      return strValue.toLowerCase().includes(String(rule.value1).toLowerCase());
    
    default:
      return false;
  }
};
