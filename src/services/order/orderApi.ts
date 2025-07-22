import { supabaseClient } from '../../utility/supabaseClient';
import { Order } from '../../types/orderTypes';
import { OrderWithBilling } from '../../types/orderWithBillingType';
import { auditApi } from '../../utility/apiDecorator';

let orderCache: {
  data: Order[];
  timestamp: number;
} | null = null;

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export class OrderService {
  @auditApi('orders', 'GET')
  static async fetchOrders(): Promise<{ data: Order[], fromCache: boolean }> {
    if (orderCache && Date.now() - orderCache.timestamp < CACHE_DURATION && orderCache.data.length > 0) {
      return { data: orderCache.data, fromCache: true };
    }

    try {
      const { data, error } = await supabaseClient
        .from('order')
        .select('*, fliiinker_profile(*, public_profile(*))')
        .order('created_at', { ascending: false });

      if (error) throw error;

      orderCache = {
        data: data || [],
        timestamp: Date.now()
      };

      return { data: data || [], fromCache: false };
    } catch (error) {
      console.error('Erreur lors de la récupération des commandes:', error);
      throw error;
    }
  }
}

export const fetchOrders = async (): Promise<Order[]> => {
  try {
    const { data: ordersData, error } = await supabaseClient
      .from('order')
      .select('*, fliiinker_profile(*, public_profile(*))')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur lors de la récupération des commandes:', error);
      throw error;
    }

    return ordersData || [];
  } catch (error) {
    console.error('Erreur détaillée:', error);
    throw new Error('Erreur lors de la récupération des commandes.');
  }
};

export const fetchOrderById = async (id: string): Promise<Order | null> => {
  try {
    const { data, error } = await supabaseClient
      .from('order')
      .select('*, fliiinker_profile(*, public_profile(*))')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'ordre:', error);
    throw new Error('Erreur lors de la récupération de l\'ordre.');
  }
};

export const updateOrderStatus = async (id: string, status: string): Promise<void> => {
  try {
    const { error } = await supabaseClient
      .from('order')
      .update({ status })
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error);
    throw new Error('Erreur lors de la mise à jour du statut.');
  }
};

export const deleteOrder = async (id: string): Promise<void> => {
  try {
    const { error } = await supabaseClient
      .from('order')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'ordre:', error);
    throw new Error('Erreur lors de la suppression de l\'ordre.');
  }
};

export const fetchOrderWithBilling = async (orderId: bigint): Promise<OrderWithBilling> => {
  try {
    const { data, error } = await supabaseClient
      .from('order')
      .select(`
        *,
        billing: billing(*)
      `)
      .eq('id', orderId)
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'ordre avec le billing:', error);
    throw new Error('Erreur lors de la récupération de l\'ordre avec le billing.');
  }
};




