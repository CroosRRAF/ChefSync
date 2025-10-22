import { useState, useCallback } from 'react';

export interface OptimisticAction<T> {
  id: string;
  type: 'create' | 'update' | 'delete';
  data: T;
  originalData?: T;
}

export interface UseOptimisticUpdatesOptions<T> {
  onSuccess?: (action: OptimisticAction<T>) => void;
  onError?: (action: OptimisticAction<T>, error: Error) => void;
  onRevert?: (action: OptimisticAction<T>) => void;
}

export function useOptimisticUpdates<T>(
  initialData: T[],
  options: UseOptimisticUpdatesOptions<T> = {}
) {
  const [data, setData] = useState<T[]>(initialData);
  const [pendingActions, setPendingActions] = useState<OptimisticAction<T>[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Apply optimistic update immediately
  const applyOptimisticUpdate = useCallback((action: OptimisticAction<T>) => {
    setPendingActions(prev => [...prev, action]);
    
    setData(prevData => {
      switch (action.type) {
        case 'create':
          return [...prevData, action.data];
        
        case 'update':
          return prevData.map(item => 
            (item as any).id === (action.data as any).id ? action.data : item
          );
        
        case 'delete':
          return prevData.filter(item => 
            (item as any).id !== (action.data as any).id
          );
        
        default:
          return prevData;
      }
    });
  }, []);

  // Confirm optimistic update (remove from pending)
  const confirmOptimisticUpdate = useCallback((actionId: string) => {
    setPendingActions(prev => {
      const action = prev.find(a => a.id === actionId);
      if (action && options.onSuccess) {
        options.onSuccess(action);
      }
      return prev.filter(a => a.id !== actionId);
    });
  }, [options]);

  // Revert optimistic update on error
  const revertOptimisticUpdate = useCallback((actionId: string, error?: Error) => {
    setPendingActions(prev => {
      const action = prev.find(a => a.id === actionId);
      if (!action) return prev;

      // Revert the data change
      setData(prevData => {
        switch (action.type) {
          case 'create':
            return prevData.filter(item => 
              (item as any).id !== (action.data as any).id
            );
          
          case 'update':
            return action.originalData 
              ? prevData.map(item => 
                  (item as any).id === (action.originalData as any).id 
                    ? action.originalData 
                    : item
                )
              : prevData;
          
          case 'delete':
            return action.originalData 
              ? [...prevData, action.originalData]
              : prevData;
          
          default:
            return prevData;
        }
      });

      // Call error and revert callbacks
      if (error && options.onError) {
        options.onError(action, error);
      }
      if (options.onRevert) {
        options.onRevert(action);
      }

      return prev.filter(a => a.id !== actionId);
    });
  }, [options]);

  // Execute an action with optimistic updates
  const executeWithOptimism = useCallback(async <R>(
    action: OptimisticAction<T>,
    asyncOperation: () => Promise<R>
  ): Promise<R> => {
    try {
      setIsLoading(true);
      
      // Apply optimistic update immediately
      applyOptimisticUpdate(action);
      
      // Execute the actual operation
      const result = await asyncOperation();
      
      // Confirm the optimistic update
      confirmOptimisticUpdate(action.id);
      
      return result;
    } catch (error) {
      // Revert on error
      revertOptimisticUpdate(action.id, error as Error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [applyOptimisticUpdate, confirmOptimisticUpdate, revertOptimisticUpdate]);

  // Helper functions for common operations
  const optimisticCreate = useCallback(async <R>(
    newItem: T,
    asyncOperation: () => Promise<R>
  ): Promise<R> => {
    const action: OptimisticAction<T> = {
      id: `create-${Date.now()}-${Math.random()}`,
      type: 'create',
      data: newItem,
    };
    
    return executeWithOptimism(action, asyncOperation);
  }, [executeWithOptimism]);

  const optimisticUpdate = useCallback(async <R>(
    updatedItem: T,
    originalItem: T,
    asyncOperation: () => Promise<R>
  ): Promise<R> => {
    const action: OptimisticAction<T> = {
      id: `update-${(updatedItem as any).id}-${Date.now()}`,
      type: 'update',
      data: updatedItem,
      originalData: originalItem,
    };
    
    return executeWithOptimism(action, asyncOperation);
  }, [executeWithOptimism]);

  const optimisticDelete = useCallback(async <R>(
    itemToDelete: T,
    asyncOperation: () => Promise<R>
  ): Promise<R> => {
    const action: OptimisticAction<T> = {
      id: `delete-${(itemToDelete as any).id}-${Date.now()}`,
      type: 'delete',
      data: itemToDelete,
      originalData: itemToDelete,
    };
    
    return executeWithOptimism(action, asyncOperation);
  }, [executeWithOptimism]);

  // Update data from external source (e.g., refetch)
  const updateData = useCallback((newData: T[]) => {
    setData(newData);
  }, []);

  // Check if an item is pending
  const isPending = useCallback((itemId: string) => {
    return pendingActions.some(action => 
      (action.data as any).id === itemId
    );
  }, [pendingActions]);

  // Get pending action for an item
  const getPendingAction = useCallback((itemId: string) => {
    return pendingActions.find(action => 
      (action.data as any).id === itemId
    );
  }, [pendingActions]);

  return {
    data,
    pendingActions,
    isLoading,
    optimisticCreate,
    optimisticUpdate,
    optimisticDelete,
    updateData,
    isPending,
    getPendingAction,
    executeWithOptimism,
  };
}

export default useOptimisticUpdates;
