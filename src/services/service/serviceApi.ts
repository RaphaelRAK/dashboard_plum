import { supabaseClient } from '../../utility/supabaseClient';
import { Service } from '../../types/serviceTypes';

let serviceCache: {
  data: Service[];
  timestamp: number;
} | null = null;

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const fetchServices = async (): Promise<Service[]> => {
  if (serviceCache && Date.now() - serviceCache.timestamp < CACHE_DURATION) {
    console.log('Récupération des services depuis le cache');
    return serviceCache.data;
  }

  try {
    const { data, error } = await supabaseClient
      .from('service')
      .select('*');

    if (error) {
      console.error('Erreur lors de la récupération des services:', error);
      throw new Error('Erreur lors de la récupération des services.');
    }

    serviceCache = {
      data: data || [],
      timestamp: Date.now()
    };

    return data || [];
  } catch (error: any) {
    console.error('Erreur détaillée:', error);
    throw new Error('Erreur lors de la récupération des services.');
  }
};

export const fetchServiceById = async (id: string): Promise<Service | null> => {
  try {
    const { data, error } = await supabaseClient
      .from('service')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erreur lors de la récupération du service:', error);
      throw new Error('Erreur lors de la récupération du service.');
    }

    return data;
  } catch (error: any) {
    console.error('Erreur détaillée:', error);
    throw new Error('Erreur lors de la récupération du service.');
  }
};

export const deleteService = async (id: string): Promise<void> => {
  try {
    const { error } = await supabaseClient
      .from('service')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erreur lors de la suppression du service:', error);
      throw new Error('Erreur lors de la suppression du service.');
    }
  } catch (error: any) {
    console.error('Erreur détaillée:', error);
    throw new Error('Erreur lors de la suppression du service.');
  }
};