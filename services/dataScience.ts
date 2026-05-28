/**
 * RealSheet Data Science & Statistics Engine
 * Provides advanced analytical capabilities for pattern detection and forecasting.
 */

export const Statistics = {
  /**
   * Calculates basic descriptive statistics for a dataset.
   */
  getDescriptiveStats: (values: number[]) => {
    if (values.length === 0) return null;
    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    
    return {
      min: sorted[0],
      max: sorted[sorted.length - 1],
      mean,
      median: sorted[Math.floor(sorted.length / 2)],
      stdDev: Math.sqrt(variance),
      count: values.length,
      sum
    };
  },

  /**
   * Detects outliers using the Interquartile Range (IQR) method.
   */
  detectOutliers: (values: number[]) => {
    if (values.length < 4) return [];
    const sorted = [...values].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    
    return values.filter(v => v < lowerBound || v > upperBound);
  },

  /**
   * Simple linear regression for trend analysis.
   */
  linearRegression: (x: number[], y: number[]) => {
    const n = x.length;
    if (n === 0 || n !== y.length) return null;

    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    for (let i = 0; i < n; i++) {
      sumX += x[i];
      sumY += y[i];
      sumXY += x[i] * y[i];
      sumXX += x[i] * x[i];
    }
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return { slope, intercept, r2: 0 /* placeholder for R-squared */ };
  },

  /**
   * Detects anomalies based on standard deviation.
   */
  detectAnomalies: (values: number[]) => {
    const stats = Statistics.getDescriptiveStats(values);
    if (!stats) return { values: [], indices: [] };
    const threshold = 2 * stats.stdDev;
    const anomalies: number[] = [];
    const indices: number[] = [];

    values.forEach((v, i) => {
      if (Math.abs(v - stats.mean) > threshold) {
        anomalies.push(v);
        indices.push(i);
      }
    });

    return { values: anomalies, indices };
  }
};

export const MLModels = {
  /**
   * Simple forecasting based on moving averages.
   */
  linearRegression: Statistics.linearRegression,
  detectAnomalies: Statistics.detectAnomalies,
  forecast: (series: number[], horizon: number = 3) => {
    if (series.length < 3) return [];
    const results = [];
    let currentSeries = [...series];
    
    for (let i = 0; i < horizon; i++) {
      const avg = currentSeries.slice(-3).reduce((a, b) => a + b, 0) / 3;
      results.push(avg);
      currentSeries.push(avg);
    }
    
    return results;
  }
};
