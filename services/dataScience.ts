/**
 * Data Science Integration Service
 * Inspired by Quadratic - Python/SQL support for advanced analytics
 */

import { SheetData, Row } from '../types';

export interface CodeCell {
  id: string;
  type: 'python' | 'sql' | 'javascript';
  code: string;
  output?: any;
  error?: string;
  executedAt?: Date;
}

export interface SQLConnection {
  id: string;
  name: string;
  type: 'postgresql' | 'mysql' | 'sqlite' | 'mongodb';
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
}

/**
 * Python Code Execution (Browser-based using Pyodide)
 * Note: This requires Pyodide to be loaded in the browser
 */
export class PythonExecutor {
  private pyodide: any = null;
  private isLoading = false;
  private isLoaded = false;
  
  async initialize(): Promise<void> {
    if (this.isLoaded) return;
    if (this.isLoading) {
      // Wait for loading to complete
      while (this.isLoading) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return;
    }
    
    this.isLoading = true;
    
    try {
      // Load Pyodide from CDN
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js';
      document.head.appendChild(script);
      
      await new Promise((resolve, reject) => {
        script.onload = resolve;
        script.onerror = reject;
      });
      
      // @ts-ignore
      this.pyodide = await loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/',
      });
      
      // Load common packages
      await this.pyodide.loadPackage(['numpy', 'pandas', 'matplotlib']);
      
      this.isLoaded = true;
    } catch (error) {
      console.error('Failed to load Pyodide:', error);
      throw new Error('Python environment failed to initialize');
    } finally {
      this.isLoading = false;
    }
  }
  
  async execute(code: string, data?: SheetData): Promise<any> {
    if (!this.isLoaded) {
      await this.initialize();
    }
    
    try {
      // Inject sheet data as pandas DataFrame if provided
      if (data) {
        const dataJson = JSON.stringify(data.rows);
        await this.pyodide.runPythonAsync(`
import pandas as pd
import json

data_json = '''${dataJson}'''
df = pd.DataFrame(json.loads(data_json))
        `);
      }
      
      // Execute user code
      const result = await this.pyodide.runPythonAsync(code);
      
      return result;
    } catch (error: any) {
      console.error('Python execution error:', error);
      throw new Error(`Python Error: ${error.message}`);
    }
  }
  
  async installPackage(packageName: string): Promise<void> {
    if (!this.isLoaded) {
      await this.initialize();
    }
    
    try {
      await this.pyodide.loadPackage(packageName);
    } catch (error) {
      console.error(`Failed to install package ${packageName}:`, error);
      throw error;
    }
  }
}

/**
 * SQL Query Builder and Executor
 */
export class SQLExecutor {
  private connections: Map<string, SQLConnection> = new Map();
  
  addConnection(connection: SQLConnection): void {
    this.connections.set(connection.id, connection);
    this.saveToStorage();
  }
  
  getConnection(id: string): SQLConnection | undefined {
    return this.connections.get(id);
  }
  
  async executeQuery(connectionId: string, query: string): Promise<Row[]> {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      throw new Error('Connection not found');
    }
    
    // For browser-based SQL, we'll use SQL.js (SQLite in browser)
    // This is a simplified implementation
    try {
      // In a real implementation, this would connect to actual databases
      // For now, we'll simulate with local data
      console.log('Executing SQL query:', query);
      return [];
    } catch (error) {
      console.error('SQL execution error:', error);
      throw error;
    }
  }
  
  /**
   * Execute SQL query on sheet data (in-memory)
   */
  async executeOnSheet(query: string, sheetData: SheetData): Promise<Row[]> {
    try {
      // Use alasql for in-memory SQL queries
      // This would need to be imported: npm install alasql
      
      // For now, return a placeholder
      console.log('Executing SQL on sheet data:', query);
      return sheetData.rows;
    } catch (error) {
      console.error('SQL execution error:', error);
      throw error;
    }
  }
  
  /**
   * Generate SQL query from natural language
   */
  async generateQuery(description: string, tableSchema: string[]): Promise<string> {
    // This would use AI to generate SQL
    // Placeholder implementation
    return `SELECT * FROM table WHERE condition`;
  }
  
  private saveToStorage(): void {
    try {
      localStorage.setItem('sql_connections', JSON.stringify(Array.from(this.connections.entries())));
    } catch (error) {
      console.error('Failed to save SQL connections:', error);
    }
  }
  
  loadFromStorage(): void {
    try {
      const data = localStorage.getItem('sql_connections');
      if (data) {
        const entries = JSON.parse(data);
        this.connections = new Map(entries);
      }
    } catch (error) {
      console.error('Failed to load SQL connections:', error);
    }
  }
}

/**
 * Machine Learning Models
 */
export class MLModels {
  /**
   * Linear Regression
   */
  static linearRegression(xValues: number[], yValues: number[]): { slope: number; intercept: number; predict: (x: number) => number } {
    const n = xValues.length;
    const sumX = xValues.reduce((a, b) => a + b, 0);
    const sumY = yValues.reduce((a, b) => a + b, 0);
    const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
    const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return {
      slope,
      intercept,
      predict: (x: number) => slope * x + intercept,
    };
  }
  
  /**
   * K-Means Clustering
   */
  static kMeans(data: number[][], k: number, maxIterations: number = 100): { clusters: number[]; centroids: number[][] } {
    const n = data.length;
    const dimensions = data[0].length;
    
    // Initialize centroids randomly
    let centroids: number[][] = [];
    for (let i = 0; i < k; i++) {
      centroids.push(data[Math.floor(Math.random() * n)]);
    }
    
    let clusters: number[] = new Array(n).fill(0);
    
    for (let iter = 0; iter < maxIterations; iter++) {
      // Assign points to nearest centroid
      let changed = false;
      for (let i = 0; i < n; i++) {
        let minDist = Infinity;
        let minCluster = 0;
        
        for (let j = 0; j < k; j++) {
          const dist = this.euclideanDistance(data[i], centroids[j]);
          if (dist < minDist) {
            minDist = dist;
            minCluster = j;
          }
        }
        
        if (clusters[i] !== minCluster) {
          clusters[i] = minCluster;
          changed = true;
        }
      }
      
      if (!changed) break;
      
      // Update centroids
      const newCentroids: number[][] = [];
      for (let j = 0; j < k; j++) {
        const clusterPoints = data.filter((_, i) => clusters[i] === j);
        if (clusterPoints.length === 0) {
          newCentroids.push(centroids[j]);
          continue;
        }
        
        const centroid = new Array(dimensions).fill(0);
        for (const point of clusterPoints) {
          for (let d = 0; d < dimensions; d++) {
            centroid[d] += point[d];
          }
        }
        for (let d = 0; d < dimensions; d++) {
          centroid[d] /= clusterPoints.length;
        }
        newCentroids.push(centroid);
      }
      centroids = newCentroids;
    }
    
    return { clusters, centroids };
  }
  
  /**
   * Time Series Forecasting (Simple Moving Average)
   */
  static movingAverage(data: number[], window: number): number[] {
    const result: number[] = [];
    for (let i = 0; i < data.length; i++) {
      if (i < window - 1) {
        result.push(NaN);
      } else {
        const sum = data.slice(i - window + 1, i + 1).reduce((a, b) => a + b, 0);
        result.push(sum / window);
      }
    }
    return result;
  }
  
  /**
   * Exponential Smoothing
   */
  static exponentialSmoothing(data: number[], alpha: number): number[] {
    const result: number[] = [data[0]];
    for (let i = 1; i < data.length; i++) {
      result.push(alpha * data[i] + (1 - alpha) * result[i - 1]);
    }
    return result;
  }
  
  /**
   * Anomaly Detection (Z-Score method)
   */
  static detectAnomalies(data: number[], threshold: number = 3): { indices: number[]; values: number[]; zScores: number[] } {
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    const stdDev = Math.sqrt(variance);
    
    const zScores = data.map(val => (val - mean) / stdDev);
    const anomalies = zScores
      .map((z, i) => ({ index: i, value: data[i], zScore: z }))
      .filter(item => Math.abs(item.zScore) > threshold);
    
    return {
      indices: anomalies.map(a => a.index),
      values: anomalies.map(a => a.value),
      zScores: anomalies.map(a => a.zScore),
    };
  }
  
  /**
   * Correlation Matrix
   */
  static correlationMatrix(data: number[][]): number[][] {
    const n = data.length;
    const matrix: number[][] = [];
    
    for (let i = 0; i < n; i++) {
      matrix[i] = [];
      for (let j = 0; j < n; j++) {
        matrix[i][j] = this.correlation(data[i], data[j]);
      }
    }
    
    return matrix;
  }
  
  private static correlation(x: number[], y: number[]): number {
    const n = x.length;
    const meanX = x.reduce((a, b) => a + b, 0) / n;
    const meanY = y.reduce((a, b) => a + b, 0) / n;
    
    let numerator = 0;
    let denomX = 0;
    let denomY = 0;
    
    for (let i = 0; i < n; i++) {
      const diffX = x[i] - meanX;
      const diffY = y[i] - meanY;
      numerator += diffX * diffY;
      denomX += diffX * diffX;
      denomY += diffY * diffY;
    }
    
    return numerator / Math.sqrt(denomX * denomY);
  }
  
  private static euclideanDistance(a: number[], b: number[]): number {
    return Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0));
  }
}

/**
 * Statistical Analysis Functions
 */
export class Statistics {
  static mean(values: number[]): number {
    return values.reduce((a, b) => a + b, 0) / values.length;
  }
  
  static median(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  }
  
  static mode(values: number[]): number {
    const frequency: Record<number, number> = {};
    let maxFreq = 0;
    let mode = values[0];
    
    for (const val of values) {
      frequency[val] = (frequency[val] || 0) + 1;
      if (frequency[val] > maxFreq) {
        maxFreq = frequency[val];
        mode = val;
      }
    }
    
    return mode;
  }
  
  static standardDeviation(values: number[]): number {
    const mean = this.mean(values);
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }
  
  static percentile(values: number[], p: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = (p / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;
    
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }
  
  static quartiles(values: number[]): { q1: number; q2: number; q3: number } {
    return {
      q1: this.percentile(values, 25),
      q2: this.percentile(values, 50),
      q3: this.percentile(values, 75),
    };
  }
  
  static outliers(values: number[]): number[] {
    const { q1, q3 } = this.quartiles(values);
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    
    return values.filter(val => val < lowerBound || val > upperBound);
  }
}

// Global instances
export const pythonExecutor = new PythonExecutor();
export const sqlExecutor = new SQLExecutor();
sqlExecutor.loadFromStorage();

/**
 * Data Science Templates
 */
export const DATA_SCIENCE_TEMPLATES = {
  linearRegression: `import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression

# Fit linear regression model
X = df[['feature_column']].values
y = df['target_column'].values

model = LinearRegression()
model.fit(X, y)

# Make predictions
predictions = model.predict(X)
df['predictions'] = predictions

print(f"R² Score: {model.score(X, y):.4f}")
print(f"Coefficients: {model.coef_}")
print(f"Intercept: {model.intercept_}")`,

  clustering: `import pandas as pd
from sklearn.cluster import KMeans
import matplotlib.pyplot as plt

# Perform K-means clustering
X = df[['feature1', 'feature2']].values
kmeans = KMeans(n_clusters=3, random_state=42)
df['cluster'] = kmeans.fit_predict(X)

# Visualize clusters
plt.scatter(X[:, 0], X[:, 1], c=df['cluster'], cmap='viridis')
plt.xlabel('Feature 1')
plt.ylabel('Feature 2')
plt.title('K-Means Clustering')
plt.show()`,

  timeSeries: `import pandas as pd
import numpy as np
from statsmodels.tsa.seasonal import seasonal_decompose

# Time series analysis
df['date'] = pd.to_datetime(df['date'])
df = df.set_index('date')

# Decompose time series
decomposition = seasonal_decompose(df['value'], model='additive', period=12)

# Plot components
decomposition.plot()
plt.show()`,

  correlation: `import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt

# Calculate correlation matrix
corr_matrix = df.corr()

# Visualize with heatmap
plt.figure(figsize=(10, 8))
sns.heatmap(corr_matrix, annot=True, cmap='coolwarm', center=0)
plt.title('Correlation Matrix')
plt.show()`,
};
