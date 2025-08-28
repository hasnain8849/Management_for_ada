// Inventory API Service
import { StockItem } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

interface InventoryFilters {
  collectionName?: string;
  color?: string;
  size?: string;
  locationCode?: string;
  vendorName?: string;
  lowStock?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

class InventoryApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('Inventory API Error:', error);
      throw error;
    }
  }

  // Get all inventory items with filters
  async getInventory(filters: InventoryFilters = {}): Promise<PaginatedResponse<StockItem>> {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const response = await this.request<PaginatedResponse<StockItem>>(
      `/api/inventory?${queryParams.toString()}`
    );
    
    return response.data;
  }

  // Get inventory by location
  async getInventoryByLocation(locationCode: string): Promise<{
    items: StockItem[];
    summary: {
      totalItems: number;
      totalInHouseStock: number;
      totalOutSourceStock: number;
      totalValue: number;
      lowStockItems: number;
    };
  }> {
    const response = await this.request<{
      items: StockItem[];
      summary: any;
    }>(`/api/inventory/location/${locationCode}`);
    
    return response.data;
  }

  // Add new inventory item
  async addInventoryItem(itemData: {
    collectionName: string;
    designName: string;
    color: string;
    size: string;
    inHouseStock: number;
    outSourceStock: number;
    receivedBy: string;
    locationCode: string;
    supplierName?: string;
    vendorName: string;
    remarks?: string;
    costPrice?: number;
    sellingPrice?: number;
  }): Promise<StockItem> {
    const response = await this.request<StockItem>('/api/inventory', {
      method: 'POST',
      body: JSON.stringify(itemData),
    });
    
    return response.data;
  }

  // Update stock quantity
  async updateStock(itemCode: string, stockUpdate: {
    inHouseChange?: number;
    outSourceChange?: number;
    updatedBy: string;
    notes?: string;
    movementType?: string;
  }): Promise<StockItem> {
    const response = await this.request<StockItem>(`/api/inventory/${itemCode}/stock`, {
      method: 'PUT',
      body: JSON.stringify(stockUpdate),
    });
    
    return response.data;
  }

  // Transfer stock between locations
  async transferStock(transferData: {
    itemCode: string;
    fromLocationCode: string;
    toLocationCode: string;
    quantity: number;
    transferredBy: string;
    notes?: string;
  }): Promise<{
    sourceItem: StockItem;
    destinationItem: StockItem;
    movement: any;
  }> {
    const response = await this.request<{
      sourceItem: StockItem;
      destinationItem: StockItem;
      movement: any;
    }>('/api/inventory/transfer', {
      method: 'POST',
      body: JSON.stringify(transferData),
    });
    
    return response.data;
  }

  // Search inventory
  async searchInventory(searchParams: {
    q?: string;
    collectionName?: string;
    color?: string;
    size?: string;
    locationCode?: string;
    vendorName?: string;
    lowStock?: boolean;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<StockItem>> {
    const queryParams = new URLSearchParams();
    
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const response = await this.request<PaginatedResponse<StockItem>>(
      `/api/inventory/search?${queryParams.toString()}`
    );
    
    return response.data;
  }

  // Get specific inventory item
  async getInventoryItem(itemCode: string): Promise<{
    item: StockItem;
    movements: any[];
  }> {
    const response = await this.request<{
      item: StockItem;
      movements: any[];
    }>(`/api/inventory/${itemCode}`);
    
    return response.data;
  }

  // Update inventory item
  async updateInventoryItem(itemCode: string, updateData: Partial<StockItem>): Promise<StockItem> {
    const response = await this.request<StockItem>(`/api/inventory/${itemCode}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
    
    return response.data;
  }

  // Delete inventory item (soft delete)
  async deleteInventoryItem(itemCode: string, deletedBy: string): Promise<StockItem> {
    const response = await this.request<StockItem>(`/api/inventory/${itemCode}`, {
      method: 'DELETE',
      body: JSON.stringify({ deletedBy }),
    });
    
    return response.data;
  }

  // Get inventory analytics
  async getInventoryAnalytics(locationCode?: string): Promise<{
    summary: {
      totalItems: number;
      totalStockValue: number;
      lowStockItems: number;
      averageItemValue: number;
    };
    collectionBreakdown: any[];
    locationBreakdown: any[];
  }> {
    const queryParams = locationCode ? `?locationCode=${locationCode}` : '';
    
    const response = await this.request<{
      summary: any;
      collectionBreakdown: any[];
      locationBreakdown: any[];
    }>(`/api/inventory/analytics/summary${queryParams}`);
    
    return response.data;
  }
}

// Export singleton instance
export const inventoryApiService = new InventoryApiService();
export default InventoryApiService;