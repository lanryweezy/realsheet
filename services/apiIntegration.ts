/**
 * API Integration Service
 * Inspired by Rows.com - Connect to external APIs and data sources
 */

import { SheetData, Row } from '../types';

export interface APIConnection {
  id: string;
  name: string;
  type: 'rest' | 'graphql' | 'webhook';
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  auth?: {
    type: 'none' | 'apiKey' | 'bearer' | 'oauth';
    key?: string;
    value?: string;
  };
  params?: Record<string, string>;
  body?: string;
  responseMapping?: Record<string, string>;
}

export interface DataSource {
  id: string;
  name: string;
  type: 'api' | 'database' | 'file' | 'cloud';
  connection: APIConnection;
  refreshInterval?: number; // in minutes
  lastRefresh?: Date;
}

/**
 * =FETCH(url, [method], [headers], [body])
 * Fetch data from an API endpoint
 * Example: =FETCH("https://api.example.com/data")
 * Example: =FETCH("https://api.example.com/users", "GET", "Authorization: Bearer token")
 */
export const evaluateFETCH = async (
  url: string,
  method: string = 'GET',
  headers?: string,
  body?: string
): Promise<any> => {
  try {
    const headerObj: Record<string, string> = {};
    
    if (headers) {
      headers.split(',').forEach(header => {
        const [key, value] = header.split(':').map(s => s.trim());
        if (key && value) headerObj[key] = value;
      });
    }
    
    const options: RequestInit = {
      method,
      headers: headerObj,
    };
    
    if (body && method !== 'GET') {
      options.body = body;
    }
    
    const response = await fetch(url, options);
    
    if (!response.ok) {
      return `#HTTP_ERROR_${response.status}!`;
    }
    
    const data = await response.json();
    return JSON.stringify(data);
  } catch (error) {
    console.error('FETCH error:', error);
    return '#FETCH_ERROR!';
  }
};

/**
 * =IMPORTJSON(url, path)
 * Import JSON data from URL and extract specific path
 * Example: =IMPORTJSON("https://api.example.com/data", "users[0].name")
 */
export const evaluateIMPORTJSON = async (url: string, path?: string): Promise<any> => {
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      return `#HTTP_ERROR_${response.status}!`;
    }
    
    let data = await response.json();
    
    // Extract path if provided
    if (path) {
      const parts = path.split('.');
      for (const part of parts) {
        // Handle array indexing like users[0]
        const arrayMatch = part.match(/(\w+)\[(\d+)\]/);
        if (arrayMatch) {
          data = data[arrayMatch[1]][parseInt(arrayMatch[2])];
        } else {
          data = data[part];
        }
        
        if (data === undefined) return '#PATH_NOT_FOUND!';
      }
    }
    
    return typeof data === 'object' ? JSON.stringify(data) : data;
  } catch (error) {
    console.error('IMPORTJSON error:', error);
    return '#IMPORT_ERROR!';
  }
};

/**
 * =IMPORTXML(url, xpath)
 * Import XML/HTML data from URL using XPath
 * Example: =IMPORTXML("https://example.com", "//title")
 */
export const evaluateIMPORTXML = async (url: string, xpath: string): Promise<string> => {
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      return `#HTTP_ERROR_${response.status}!`;
    }
    
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Simple XPath-like selector (limited implementation)
    const selector = xpath.replace('//', '').replace('/', ' ');
    const elements = doc.querySelectorAll(selector);
    
    if (elements.length === 0) return '#NOT_FOUND!';
    
    return Array.from(elements).map(el => el.textContent).join(', ');
  } catch (error) {
    console.error('IMPORTXML error:', error);
    return '#IMPORT_ERROR!';
  }
};

/**
 * =WEBHOOK(url, trigger_event)
 * Set up a webhook to receive data
 * Example: =WEBHOOK("https://hooks.example.com/abc123", "on_change")
 */
export const setupWebhook = (url: string, triggerEvent: string): string => {
  // This would need backend support for real implementation
  console.log(`Webhook setup: ${url} on ${triggerEvent}`);
  return 'Webhook configured (requires backend support)';
};

/**
 * Connect to popular APIs
 */

export const connectGoogleAnalytics = async (viewId: string, metrics: string[], dimensions: string[]): Promise<any[]> => {
  // Placeholder - would need OAuth implementation
  return [{ message: 'Google Analytics integration requires OAuth setup' }];
};

export const connectStripe = async (endpoint: string, apiKey: string): Promise<any[]> => {
  try {
    const response = await fetch(`https://api.stripe.com/v1/${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Stripe API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Stripe connection error:', error);
    return [];
  }
};

export const connectAirtable = async (baseId: string, tableName: string, apiKey: string): Promise<Row[]> => {
  try {
    const response = await fetch(`https://api.airtable.com/v0/${baseId}/${tableName}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Airtable API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.records.map((record: any) => record.fields);
  } catch (error) {
    console.error('Airtable connection error:', error);
    return [];
  }
};

export const connectHubSpot = async (endpoint: string, apiKey: string): Promise<any[]> => {
  try {
    const response = await fetch(`https://api.hubapi.com/${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`HubSpot API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('HubSpot connection error:', error);
    return [];
  }
};

/**
 * API Connection Manager
 */
export class APIConnectionManager {
  private connections: Map<string, APIConnection> = new Map();
  private dataSources: Map<string, DataSource> = new Map();
  
  addConnection(connection: APIConnection): void {
    this.connections.set(connection.id, connection);
    this.saveToStorage();
  }
  
  getConnection(id: string): APIConnection | undefined {
    return this.connections.get(id);
  }
  
  removeConnection(id: string): void {
    this.connections.delete(id);
    this.saveToStorage();
  }
  
  listConnections(): APIConnection[] {
    return Array.from(this.connections.values());
  }
  
  async executeConnection(id: string): Promise<any> {
    const connection = this.connections.get(id);
    if (!connection) throw new Error('Connection not found');
    
    const headers: Record<string, string> = { ...connection.headers };
    
    // Add authentication
    if (connection.auth) {
      switch (connection.auth.type) {
        case 'apiKey':
          if (connection.auth.key && connection.auth.value) {
            headers[connection.auth.key] = connection.auth.value;
          }
          break;
        case 'bearer':
          if (connection.auth.value) {
            headers['Authorization'] = `Bearer ${connection.auth.value}`;
          }
          break;
      }
    }
    
    const options: RequestInit = {
      method: connection.method || 'GET',
      headers,
    };
    
    if (connection.body && connection.method !== 'GET') {
      options.body = connection.body;
    }
    
    let url = connection.url;
    if (connection.params) {
      const params = new URLSearchParams(connection.params);
      url += `?${params.toString()}`;
    }
    
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  }
  
  addDataSource(source: DataSource): void {
    this.dataSources.set(source.id, source);
    this.saveToStorage();
  }
  
  async refreshDataSource(id: string): Promise<any> {
    const source = this.dataSources.get(id);
    if (!source) throw new Error('Data source not found');
    
    const data = await this.executeConnection(source.connection.id);
    source.lastRefresh = new Date();
    this.saveToStorage();
    
    return data;
  }
  
  private saveToStorage(): void {
    try {
      localStorage.setItem('api_connections', JSON.stringify(Array.from(this.connections.entries())));
      localStorage.setItem('data_sources', JSON.stringify(Array.from(this.dataSources.entries())));
    } catch (error) {
      console.error('Failed to save API connections:', error);
    }
  }
  
  loadFromStorage(): void {
    try {
      const connectionsData = localStorage.getItem('api_connections');
      if (connectionsData) {
        const entries = JSON.parse(connectionsData);
        this.connections = new Map(entries);
      }
      
      const sourcesData = localStorage.getItem('data_sources');
      if (sourcesData) {
        const entries = JSON.parse(sourcesData);
        this.dataSources = new Map(entries);
      }
    } catch (error) {
      console.error('Failed to load API connections:', error);
    }
  }
}

// Global instance
export const apiManager = new APIConnectionManager();
apiManager.loadFromStorage();

/**
 * Pre-configured API templates
 */
export const API_TEMPLATES = {
  stripe: {
    name: 'Stripe',
    baseUrl: 'https://api.stripe.com/v1',
    authType: 'bearer' as const,
    endpoints: {
      customers: '/customers',
      charges: '/charges',
      subscriptions: '/subscriptions',
      invoices: '/invoices',
    },
  },
  hubspot: {
    name: 'HubSpot',
    baseUrl: 'https://api.hubapi.com',
    authType: 'bearer' as const,
    endpoints: {
      contacts: '/crm/v3/objects/contacts',
      companies: '/crm/v3/objects/companies',
      deals: '/crm/v3/objects/deals',
    },
  },
  airtable: {
    name: 'Airtable',
    baseUrl: 'https://api.airtable.com/v0',
    authType: 'bearer' as const,
    endpoints: {},
  },
  googleSheets: {
    name: 'Google Sheets',
    baseUrl: 'https://sheets.googleapis.com/v4/spreadsheets',
    authType: 'oauth' as const,
    endpoints: {},
  },
  notion: {
    name: 'Notion',
    baseUrl: 'https://api.notion.com/v1',
    authType: 'bearer' as const,
    endpoints: {
      databases: '/databases',
      pages: '/pages',
      search: '/search',
    },
  },
  slack: {
    name: 'Slack',
    baseUrl: 'https://slack.com/api',
    authType: 'bearer' as const,
    endpoints: {
      postMessage: '/chat.postMessage',
      users: '/users.list',
      channels: '/conversations.list',
    },
  },
};
