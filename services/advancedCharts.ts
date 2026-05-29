/**
 * Advanced Chart Types and Visualization Service
 * Supporting 15+ chart types for comprehensive data visualization
 */

import { SheetData, Row } from '../types';

export type AdvancedChartType = 
  | 'bar' | 'line' | 'area' | 'pie' | 'donut'
  | 'scatter' | 'bubble' | 'radar' | 'polar'
  | 'waterfall' | 'funnel' | 'gauge' | 'heatmap'
  | 'treemap' | 'sankey' | 'candlestick' | 'boxplot'
  | 'histogram' | 'combo';

export interface AdvancedChartConfig {
  type: AdvancedChartType;
  title: string;
  description?: string;
  dataKey: string;
  xAxisKey: string;
  yAxisKey?: string;
  zAxisKey?: string; // For bubble charts
  colors?: string[];
  options?: {
    showLegend?: boolean;
    showGrid?: boolean;
    showTooltip?: boolean;
    showDataLabels?: boolean;
    stacked?: boolean;
    smooth?: boolean;
    fill?: boolean;
    orientation?: 'horizontal' | 'vertical';
    startAngle?: number;
    endAngle?: number;
    innerRadius?: number;
    outerRadius?: number;
    minValue?: number;
    maxValue?: number;
    threshold?: number;
    bins?: number;
    bandwidth?: number;
  };
  series?: Array<{
    name: string;
    dataKey: string;
    type?: 'bar' | 'line' | 'area';
    color?: string;
    yAxisId?: string;
  }>;
}

export interface SparklineConfig {
  type: 'line' | 'bar' | 'winloss';
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  showHighLow?: boolean;
}

/**
 * Chart Data Processor
 */
export class ChartDataProcessor {
  /**
   * Prepare data for scatter plot
   */
  static prepareScatterData(data: Row[], xKey: string, yKey: string): Array<{ x: number; y: number; name?: string }> {
    return data.map(row => ({
      x: Number(row[xKey]) || 0,
      y: Number(row[yKey]) || 0,
      name: String(row.name || ''),
    }));
  }
  
  /**
   * Prepare data for bubble chart
   */
  static prepareBubbleData(
    data: Row[],
    xKey: string,
    yKey: string,
    zKey: string
  ): Array<{ x: number; y: number; z: number; name?: string }> {
    return data.map(row => ({
      x: Number(row[xKey]) || 0,
      y: Number(row[yKey]) || 0,
      z: Number(row[zKey]) || 0,
      name: String(row.name || ''),
    }));
  }
  
  /**
   * Prepare data for waterfall chart
   */
  static prepareWaterfallData(data: Row[], categoryKey: string, valueKey: string): Array<{
    category: string;
    value: number;
    total: number;
    isTotal?: boolean;
  }> {
    let runningTotal = 0;
    return data.map((row, index) => {
      const value = Number(row[valueKey]) || 0;
      const isTotal = (row.isTotal as any) === true || String(row.isTotal) === 'true';
      
      if (isTotal) {
        return {
          category: String(row[categoryKey]),
          value: 0,
          total: runningTotal,
          isTotal: true,
        };
      }
      
      const start = runningTotal;
      runningTotal += value;
      
      return {
        category: String(row[categoryKey]),
        value,
        total: runningTotal,
        isTotal: false,
      };
    });
  }
  
  /**
   * Prepare data for funnel chart
   */
  static prepareFunnelData(data: Row[], categoryKey: string, valueKey: string): Array<{
    category: string;
    value: number;
    percentage: number;
  }> {
    const total = data.reduce((sum, row) => sum + (Number(row[valueKey]) || 0), 0);
    
    return data.map(row => {
      const value = Number(row[valueKey]) || 0;
      return {
        category: String(row[categoryKey]),
        value,
        percentage: total > 0 ? (value / total) * 100 : 0,
      };
    });
  }
  
  /**
   * Prepare data for heatmap
   */
  static prepareHeatmapData(
    data: Row[],
    xKey: string,
    yKey: string,
    valueKey: string
  ): Array<{ x: string; y: string; value: number }> {
    return data.map(row => ({
      x: String(row[xKey]),
      y: String(row[yKey]),
      value: Number(row[valueKey]) || 0,
    }));
  }
  
  /**
   * Prepare data for box plot
   */
  static prepareBoxPlotData(data: Row[], categoryKey: string, valueKey: string): Array<{
    category: string;
    min: number;
    q1: number;
    median: number;
    q3: number;
    max: number;
    outliers: number[];
  }> {
    const grouped = new Map<string, number[]>();
    
    // Group data by category
    data.forEach(row => {
      const category = String(row[categoryKey]);
      const value = Number(row[valueKey]);
      
      if (!isNaN(value)) {
        if (!grouped.has(category)) {
          grouped.set(category, []);
        }
        grouped.get(category)!.push(value);
      }
    });
    
    // Calculate box plot statistics for each category
    return Array.from(grouped.entries()).map(([category, values]) => {
      const sorted = values.sort((a, b) => a - b);
      const n = sorted.length;
      
      const q1Index = Math.floor(n * 0.25);
      const medianIndex = Math.floor(n * 0.5);
      const q3Index = Math.floor(n * 0.75);
      
      const q1 = sorted[q1Index];
      const median = sorted[medianIndex];
      const q3 = sorted[q3Index];
      const iqr = q3 - q1;
      
      const lowerBound = q1 - 1.5 * iqr;
      const upperBound = q3 + 1.5 * iqr;
      
      const outliers = sorted.filter(v => v < lowerBound || v > upperBound);
      const inliers = sorted.filter(v => v >= lowerBound && v <= upperBound);
      
      return {
        category,
        min: inliers[0] || sorted[0],
        q1,
        median,
        q3,
        max: inliers[inliers.length - 1] || sorted[sorted.length - 1],
        outliers,
      };
    });
  }
  
  /**
   * Prepare data for histogram
   */
  static prepareHistogramData(data: Row[], valueKey: string, bins: number = 10): Array<{
    bin: string;
    count: number;
    range: [number, number];
  }> {
    const values = data.map(row => Number(row[valueKey])).filter(v => !isNaN(v));
    
    if (values.length === 0) return [];
    
    const min = Math.min(...values);
    const max = Math.max(...values);
    const binWidth = (max - min) / bins;
    
    const histogram: Array<{ bin: string; count: number; range: [number, number] }> = [];
    
    for (let i = 0; i < bins; i++) {
      const binStart = min + i * binWidth;
      const binEnd = binStart + binWidth;
      const count = values.filter(v => v >= binStart && (i === bins - 1 ? v <= binEnd : v < binEnd)).length;
      
      histogram.push({
        bin: `${binStart.toFixed(1)}-${binEnd.toFixed(1)}`,
        count,
        range: [binStart, binEnd],
      });
    }
    
    return histogram;
  }
  
  /**
   * Prepare data for treemap
   */
  static prepareTreemapData(data: Row[], categoryKey: string, valueKey: string, parentKey?: string): any {
    const root: any = {
      name: 'root',
      children: [],
    };
    
    if (parentKey) {
      // Hierarchical data
      const nodeMap = new Map<string, any>();
      nodeMap.set('root', root);
      
      data.forEach(row => {
        const name = String(row[categoryKey]);
        const value = Number(row[valueKey]) || 0;
        const parent = String(row[parentKey] || 'root');
        
        const node = {
          name,
          value,
          children: [],
        };
        
        nodeMap.set(name, node);
        
        const parentNode = nodeMap.get(parent) || root;
        parentNode.children.push(node);
      });
    } else {
      // Flat data
      root.children = data.map(row => ({
        name: String(row[categoryKey]),
        value: Number(row[valueKey]) || 0,
      }));
    }
    
    return root;
  }
  
  /**
   * Calculate trendline
   */
  static calculateTrendline(data: Array<{ x: number; y: number }>): {
    slope: number;
    intercept: number;
    points: Array<{ x: number; y: number }>;
  } {
    const n = data.length;
    const sumX = data.reduce((sum, point) => sum + point.x, 0);
    const sumY = data.reduce((sum, point) => sum + point.y, 0);
    const sumXY = data.reduce((sum, point) => sum + point.x * point.y, 0);
    const sumXX = data.reduce((sum, point) => sum + point.x * point.x, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    const points = data.map(point => ({
      x: point.x,
      y: slope * point.x + intercept,
    }));
    
    return { slope, intercept, points };
  }
}

/**
 * Sparkline Generator
 */
export class SparklineGenerator {
  static generateSVG(config: SparklineConfig): string {
    const { type, data, width = 100, height = 30, color = '#3b82f6', showHighLow = false } = config;
    
    if (data.length === 0) return '';
    
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return { x, y, value };
    });
    
    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
    
    if (type === 'line') {
      const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
      svg += `<path d="${pathData}" fill="none" stroke="${color}" stroke-width="2"/>`;
      
      if (showHighLow) {
        const maxPoint = points.reduce((max, p) => p.value > max.value ? p : max);
        const minPoint = points.reduce((min, p) => p.value < min.value ? p : min);
        
        svg += `<circle cx="${maxPoint.x}" cy="${maxPoint.y}" r="3" fill="green"/>`;
        svg += `<circle cx="${minPoint.x}" cy="${minPoint.y}" r="3" fill="red"/>`;
      }
    } else if (type === 'bar') {
      const barWidth = width / data.length;
      points.forEach(p => {
        const barHeight = height - p.y;
        svg += `<rect x="${p.x - barWidth / 2}" y="${p.y}" width="${barWidth * 0.8}" height="${barHeight}" fill="${color}"/>`;
      });
    } else if (type === 'winloss') {
      const barWidth = width / data.length;
      const midY = height / 2;
      points.forEach(p => {
        const isWin = p.value >= 0;
        const barHeight = Math.abs(p.y - midY);
        const barY = isWin ? midY - barHeight : midY;
        const barColor = isWin ? 'green' : 'red';
        svg += `<rect x="${p.x - barWidth / 2}" y="${barY}" width="${barWidth * 0.8}" height="${barHeight}" fill="${barColor}"/>`;
      });
    }
    
    svg += '</svg>';
    return svg;
  }
}

/**
 * Chart Color Schemes
 */
export const CHART_COLOR_SCHEMES = {
  default: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'],
  pastel: ['#fbb6ce', '#fed7aa', '#fef3c7', '#d9f99d', '#a7f3d0', '#a5f3fc', '#ddd6fe', '#fecaca'],
  vibrant: ['#dc2626', '#ea580c', '#d97706', '#65a30d', '#059669', '#0891b2', '#4f46e5', '#9333ea'],
  monochrome: ['#1f2937', '#374151', '#4b5563', '#6b7280', '#9ca3af', '#d1d5db', '#e5e7eb', '#f3f4f6'],
  earth: ['#78350f', '#92400e', '#b45309', '#d97706', '#f59e0b', '#fbbf24', '#fcd34d', '#fde68a'],
  ocean: ['#0c4a6e', '#075985', '#0369a1', '#0284c7', '#0ea5e9', '#38bdf8', '#7dd3fc', '#bae6fd'],
  sunset: ['#7c2d12', '#9a3412', '#c2410c', '#ea580c', '#f97316', '#fb923c', '#fdba74', '#fed7aa'],
  forest: ['#14532d', '#166534', '#15803d', '#16a34a', '#22c55e', '#4ade80', '#86efac', '#bbf7d0'],
};

/**
 * Chart Export Utilities
 */
export class ChartExporter {
  static async exportToPNG(chartElement: HTMLElement, filename: string): Promise<void> {
    // This would use html2canvas or similar library
    console.log('Exporting chart to PNG:', filename);
  }
  
  static async exportToSVG(chartElement: HTMLElement, filename: string): Promise<void> {
    // Export as SVG
    console.log('Exporting chart to SVG:', filename);
  }
  
  static async exportToPDF(chartElement: HTMLElement, filename: string): Promise<void> {
    // Export as PDF using jsPDF
    console.log('Exporting chart to PDF:', filename);
  }
}

/**
 * Chart Templates
 */
export const CHART_TEMPLATES = {
  salesDashboard: {
    charts: [
      { type: 'line' as const, title: 'Revenue Trend', dataKey: 'revenue', xAxisKey: 'month' },
      { type: 'bar' as const, title: 'Sales by Region', dataKey: 'sales', xAxisKey: 'region' },
      { type: 'pie' as const, title: 'Product Mix', dataKey: 'value', xAxisKey: 'product' },
      { type: 'funnel' as const, title: 'Sales Funnel', dataKey: 'count', xAxisKey: 'stage' },
    ],
  },
  financialReport: {
    charts: [
      { type: 'waterfall' as const, title: 'Cash Flow', dataKey: 'amount', xAxisKey: 'category' },
      { type: 'combo' as const, title: 'Revenue vs Profit', dataKey: 'value', xAxisKey: 'quarter' },
      { type: 'gauge' as const, title: 'Budget Utilization', dataKey: 'percentage', xAxisKey: 'department' },
    ],
  },
  marketingAnalytics: {
    charts: [
      { type: 'funnel' as const, title: 'Conversion Funnel', dataKey: 'users', xAxisKey: 'stage' },
      { type: 'heatmap' as const, title: 'Engagement by Time', dataKey: 'engagement', xAxisKey: 'hour', yAxisKey: 'day' },
      { type: 'scatter' as const, title: 'Cost vs ROI', dataKey: 'roi', xAxisKey: 'cost' },
    ],
  },
};
