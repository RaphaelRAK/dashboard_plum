import { useState, useCallback, useEffect } from 'react';
import { Order } from '../types/orderTypes';
import { OrderService } from '../services/order/orderApi';
import debounce from 'lodash/debounce';

interface UseOrdersReturn {
  orders: Order[];
  loading: boolean;
  error: string | null;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedStatus: string | undefined;
  setSelectedStatus: (status: string | undefined) => void;
  filteredOrders: Order[];
}

export const useOrders = (): UseOrdersReturn => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>();
  const [lastFetch, setLastFetch] = useState(0);
  const cacheTimeout = 5 * 60 * 1000; // 5 minutes

  const loadOrders = useCallback(async () => {
    const now = Date.now();
    if (orders.length === 0 || now - lastFetch > cacheTimeout) {
      setLoading(true);
      try {
        const { data } = await OrderService.fetchOrders();
        setOrders(data);
        setLastFetch(now);
      } catch (err) {
        setError("Erreur lors du chargement des commandes");
      } finally {
        setLoading(false);
      }
    }
  }, [orders.length, lastFetch]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const debouncedSearch = debounce((term: string) => {
    setSearchTerm(term);
  }, 300);

  const filteredOrders = useCallback(() => {
    return orders.filter(order => {
      const matchesStatus = !selectedStatus || order.status === selectedStatus;
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = order.id.toString().includes(searchLower) ||
        (order.fliiinker_profile?.public_profile?.first_name || '').toLowerCase().includes(searchLower) ||
        (order.fliiinker_profile?.public_profile?.last_name || '').toLowerCase().includes(searchLower);

      return matchesStatus && matchesSearch;
    });
  }, [orders, searchTerm, selectedStatus]);

  return {
    orders,
    loading,
    error,
    searchTerm,
    setSearchTerm: debouncedSearch,
    selectedStatus,
    setSelectedStatus,
    filteredOrders: filteredOrders()
  };
}; 