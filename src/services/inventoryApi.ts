// Inventory API Service
import { StockItem } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

interface InventoryFilters {
  collectionName?: string;
  color?: string;
  size?: string;
  locationCode?: string;
  vendorName?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface AddInventoryRequest {
  collectionName: string;
  designName: string;
  color: string;
  size: 'S' | 'M' | 'L' | 'XL' | 'XXL';
  quantity: number;
  inHouseStock?: number;
  outSourceStock?: number;
  receivedBy: string;
  locationCode: string;
  supplierName?: string;
  vendorName: string;
  remarks?: string;
  costPrice: number;
  sellingPrice: number;
  category?: string;
}

interface UpdateStockRequest {
  inHouseStock?: number;
  outSourceStock?: number;
  updatedBy: string;
  notes?: string;
}

interface TransferStockRequest {
  itemCode: string;
  fromLocationCode: string;
  toLocationCode: string;
  quantity: number;
  transferredBy: string;
  notes?: string;
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
  async getInventory(filters: InventoryFilters = {}): Promise<{
    items: StockItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const response = await this.request<{
      items: StockItem[];
      pagination: any;
    }>(`/api/inventory?${queryParams.toString()}`);
    
    return response.data;
  }

  // Get inventory by location
  async getInventoryByLocation(locationCode: string): Promise<{
    items: StockItem[];
    summary: {
      totalItems: number;
      totalQuantity: number;
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
  async addInventoryItem(item: AddInventoryRequest): Promise<StockItem> {
    const response = await this.request<StockItem>('/api/inventory', {
      method: 'POST',
      body: JSON.stringify(item),
    });
    
    return response.data;
  }

  // Update inventory item
  async updateInventoryItem(itemCode: string, updates: Partial<AddInventoryRequest>): Promise<StockItem> {
    const response = await this.request<StockItem>(`/api/inventory/${itemCode}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    
    return response.data;
  }

  // Update stock quantity
  async updateStock(itemCode: string, stockUpdate: UpdateStockRequest): Promise<StockItem> {
    const response = await this.request<StockItem>(`/api/inventory/${itemCode}/stock`, {
      method: 'PUT',
      body: JSON.stringify(stockUpdate),
    });
    
    return response.data;
  }

  // Transfer stock between locations
  async transferStock(transfer: TransferStockRequest): Promise<{
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
      body: JSON.stringify(transfer),
    });
    
    return response.data;
  }

  // Get all collections
  async getCollections(): Promise<string[]> {
    const response = await this.request<string[]>('/api/inventory/collections');
    return response.data;
  }

  // Get low stock items
  async getLowStockItems(threshold: number = 10): Promise<StockItem[]> {
    const response = await this.request<StockItem[]>(`/api/inventory/low-stock?threshold=${threshold}`);
    return response.data;
  }

  // Get stock movements for an item
  async getStockMovements(itemCode: string): Promise<any[]> {
    const response = await this.request<any[]>(`/api/inventory/movements/${itemCode}`);
    return response.data;
  }

  // Get inventory summary
  async getInventorySummary(locationCode?: string): Promise<{
    totalItems: number;
    totalValue: number;
    lowStockCount: number;
    collectionSummary: any[];
  }> {
    const queryParams = locationCode ? `?locationCode=${locationCode}` : '';
    const response = await this.request<{
      totalItems: number;
      totalValue: number;
      lowStockCount: number;
      collectionSummary: any[];
    }>(`/api/inventory/summary${queryParams}`);
    
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
}

// Export singleton instance
export const inventoryApiService = new InventoryApiService();
export default InventoryApiService;