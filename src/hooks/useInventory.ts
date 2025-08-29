// Custom React Hook for Inventory Management
import { useState, useEffect, useCallback } from 'react';
import { inventoryApiService } from '../services/inventoryApi';
import { StockItem } from '../types';

interface UseInventoryState {
  items: StockItem[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  } | null;
}

interface UseInventoryFilters {
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

export function useInventory(filters: UseInventoryFilters = {}) {
  const [state, setState] = useState<UseInventoryState>({
    items: [],
    loading: false,
    error: null,
    pagination: null
  });

  const fetchInventory = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const result = await inventoryApiService.getInventory(filters);
      setState({
        items: result.items,
        loading: false,
        error: null,
        pagination: result.pagination
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch inventory'
      }));
    }
  }, [filters]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const addItem = useCallback(async (itemData: any) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const newItem = await inventoryApiService.addInventoryItem(itemData);
      setState(prev => ({
        ...prev,
        items: [newItem, ...prev.items],
        loading: false
      }));
      return newItem;
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to add item'
      }));
      throw error;
    }
  }, []);

  const updateStock = useCallback(async (itemCode: string, stockUpdate: any) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const updatedItem = await inventoryApiService.updateStock(itemCode, stockUpdate);
      setState(prev => ({
        ...prev,
        items: prev.items.map(item => 
          item.itemCode === itemCode ? updatedItem : item
        ),
        loading: false
      }));
      return updatedItem;
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to update stock'
      }));
      throw error;
    }
  }, []);

  const transferStock = useCallback(async (transferData: any) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const result = await inventoryApiService.transferStock(transferData);
      // Refresh inventory after transfer
      await fetchInventory();
      return result;
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to transfer stock'
      }));
      throw error;
    }
  }, [fetchInventory]);

  const deleteItem = useCallback(async (itemCode: string, deletedBy: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      await inventoryApiService.deleteInventoryItem(itemCode, deletedBy);
      setState(prev => ({
        ...prev,
        items: prev.items.filter(item => item.itemCode !== itemCode),
        loading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to delete item'
      }));
      throw error;
    }
  }, []);

  return {
    ...state,
    refetch: fetchInventory,
    addItem,
    updateStock,
    transferStock,
    deleteItem
  };
}

// Hook for inventory summary
export function useInventorySummary(locationCode?: string) {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await inventoryApiService.getInventorySummary(locationCode);
      setSummary(result);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch summary');
    } finally {
      setLoading(false);
    }
  }, [locationCode]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return {
    summary,
    loading,
    error,
    refetch: fetchSummary
  };
}

// Hook for low stock items
export function useLowStockItems(threshold: number = 10) {
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLowStockItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await inventoryApiService.getLowStockItems(threshold);
      setItems(result);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch low stock items');
    } finally {
      setLoading(false);
    }
  }, [threshold]);

  useEffect(() => {
    fetchLowStockItems();
  }, [fetchLowStockItems]);

  return {
    items,
    loading,
    error,
    refetch: fetchLowStockItems
  };
}