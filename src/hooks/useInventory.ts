// Custom React Hooks for Inventory Management
import { useState, useEffect, useCallback } from 'react';
import { inventoryApiService } from '../services/inventoryApi';
import { StockItem } from '../types';

interface UseInventoryState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseInventoryOptions {
  immediate?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

// Generic hook for inventory operations
export function useInventoryOperation<T, P = void>(
  operation: (params: P) => Promise<T>,
  options: UseInventoryOptions = {}
) {
  const { immediate = false, onSuccess, onError } = options;
  
  const [state, setState] = useState<UseInventoryState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(async (params?: P) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const result = await operation(params as P);
      setState({ data: result, loading: false, error: null });
      onSuccess?.(result);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setState({ data: null, loading: false, error: errorMessage });
      onError?.(errorMessage);
      throw error;
    }
  }, [operation, onSuccess, onError]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}

// Hook for fetching inventory with filters
export function useInventory(filters: any = {}, immediate = true) {
  return useInventoryOperation(
    () => inventoryApiService.getInventory(filters),
    { immediate }
  );
}

// Hook for inventory by location
export function useInventoryByLocation(locationCode: string, immediate = true) {
  return useInventoryOperation(
    () => inventoryApiService.getInventoryByLocation(locationCode),
    { immediate: immediate && !!locationCode }
  );
}

// Hook for searching inventory
export function useInventorySearch() {
  return useInventoryOperation(
    (searchParams: any) => inventoryApiService.searchInventory(searchParams)
  );
}

// Hook for adding inventory item
export function useAddInventoryItem(options: UseInventoryOptions = {}) {
  return useInventoryOperation(
    (itemData: any) => inventoryApiService.addInventoryItem(itemData),
    options
  );
}

// Hook for updating stock
export function useUpdateStock(options: UseInventoryOptions = {}) {
  return useInventoryOperation(
    ({ itemCode, stockUpdate }: { itemCode: string; stockUpdate: any }) => 
      inventoryApiService.updateStock(itemCode, stockUpdate),
    options
  );
}

// Hook for transferring stock
export function useTransferStock(options: UseInventoryOptions = {}) {
  return useInventoryOperation(
    (transferData: any) => inventoryApiService.transferStock(transferData),
    options
  );
}

// Hook for inventory analytics
export function useInventoryAnalytics(locationCode?: string, immediate = true) {
  return useInventoryOperation(
    () => inventoryApiService.getInventoryAnalytics(locationCode),
    { immediate }
  );
}

// Hook for getting specific inventory item
export function useInventoryItem(itemCode: string, immediate = true) {
  return useInventoryOperation(
    () => inventoryApiService.getInventoryItem(itemCode),
    { immediate: immediate && !!itemCode }
  );
}

// Custom hook for managing inventory state
export function useInventoryManager() {
  const [inventory, setInventory] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshInventory = useCallback(async (filters: any = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await inventoryApiService.getInventory(filters);
      setInventory(result.items);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch inventory';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const addItem = useCallback(async (itemData: any) => {
    try {
      const newItem = await inventoryApiService.addInventoryItem(itemData);
      setInventory(prev => [...prev, newItem]);
      return newItem;
    } catch (error) {
      throw error;
    }
  }, []);

  const updateItem = useCallback(async (itemCode: string, updateData: any) => {
    try {
      const updatedItem = await inventoryApiService.updateInventoryItem(itemCode, updateData);
      setInventory(prev => prev.map(item => 
        item.itemCode === itemCode ? updatedItem : item
      ));
      return updatedItem;
    } catch (error) {
      throw error;
    }
  }, []);

  const transferStock = useCallback(async (transferData: any) => {
    try {
      const result = await inventoryApiService.transferStock(transferData);
      // Refresh inventory to get updated stock levels
      await refreshInventory();
      return result;
    } catch (error) {
      throw error;
    }
  }, [refreshInventory]);

  return {
    inventory,
    loading,
    error,
    refreshInventory,
    addItem,
    updateItem,
    transferStock,
  };
}