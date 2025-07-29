// API pour les réclamations
import { supabaseClient } from '../utility/supabaseClient';

export interface Claim {
  id: string;
  created_at: string;
  updated_at: string;
  status: string;
  description: string;
  order_id?: string;
  customer_id?: string;
  fliiinker_id?: string;
}

export const fetchAllClaimInPeriod = async (startDate?: string, endDate?: string): Promise<Claim[]> => {
  try {
    let query = supabaseClient
      .from('claims')
      .select('*')
      .order('created_at', { ascending: false });

    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erreur lors de la récupération des réclamations:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Erreur dans fetchAllClaimInPeriod:', error);
    return [];
  }
}; 