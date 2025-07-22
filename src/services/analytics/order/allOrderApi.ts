import { supabaseClient } from "../../../utility/supabaseClient";
import { Order } from "../../../types/orderTypes";

interface CacheEntry {
  data: Order[];
  timestamp: number;
  startDate: string;
  endDate: string;
}

let orderCache: CacheEntry | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const PAGE_SIZE = 1000;

// Fonctions de validation du cache
const isCacheExpired = (cache: CacheEntry | null): boolean => {
  return !cache || Date.now() - cache.timestamp >= CACHE_DURATION;
};

const isCacheEmpty = (cache: CacheEntry | null): boolean => {
  return !cache || cache.data.length === 0;
};

const areDatesInCache = (startDate: string, endDate: string, cache: CacheEntry | null): boolean => {
  if (!cache || cache.data.length === 0) return false;

  const requestStart = new Date(`${startDate}T00:00:00`);
  const requestEnd = new Date(`${endDate}T23:59:59`);

  const cacheDates = cache.data
    .map(order => new Date(order.created_at))
    .filter(date => !isNaN(date.getTime()));

  if (cacheDates.length === 0) return false;

  const cacheStart = new Date(Math.min(...cacheDates.map(date => date.getTime())));
  const cacheEnd = new Date(Math.max(...cacheDates.map(date => date.getTime())));

  return cacheStart <= requestStart && cacheEnd >= requestEnd;
};

const validateCache = (startDate: string, endDate: string): boolean => {
  if (isCacheExpired(orderCache)) {
    console.log('Cache expiré');
    return false;
  }

  if (isCacheEmpty(orderCache)) {
    console.log('Cache vide');
    return false;
  }

  const datesInCache = areDatesInCache(startDate, endDate, orderCache);
  if (!datesInCache) {
    console.log('Dates non présentes dans le cache');
    return false;
  }

  console.log('Cache valide');
  return true;
};

/**
 * Récupère les commandes depuis Supabase pour une période donnée.
 */
const fetchOrdersFromSupabase = async (startDate: string, endDate: string): Promise<Order[]> => {
  let allData: Order[] = [];
  let currentPage = 0;

  while (true) {
    try {
      const { data, error } = await supabaseClient
        .from('order')
        .select('*')
        .gte('created_at', `${startDate}T00:00:00`)
        .lte('created_at', `${endDate}T23:59:59`)
        .order('created_at', { ascending: false })
        .range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1);

      if (error) {
        console.error("Erreur lors de la récupération des commandes:", error);
        throw error;
      }

      if (!data || data.length === 0) break;

      allData = [...allData, ...data];
      currentPage++;

      console.log(`Page ${currentPage} récupérée : ${data.length} résultats`);
    } catch (error) {
      console.error("Erreur lors de la récupération des commandes:", error);
      throw error;
    }
  }

  return allData;
};

/**
 * Récupère les dates des commandes dans une période donnée.
 */
export const fetchAllOrderInPeriod = async (startDate: string, endDate: string): Promise<Date[]> => {
  console.log("Appel de fetchAllOrderInPeriod:", new Error().stack?.split('\n')[2]?.trim() || 'inconnu');

  if (validateCache(startDate, endDate)) {
    console.log('Utilisation du cache');
    return orderCache!.data
      .filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate >= new Date(`${startDate}T00:00:00`) && 
               orderDate <= new Date(`${endDate}T23:59:59`);
      })
      .map(order => new Date(order.created_at));
  }

  console.log("Récupération des données depuis Supabase");
  const orders = await fetchOrdersFromSupabase(startDate, endDate);

  orderCache = {
    data: orders,
    timestamp: Date.now(),
    startDate,
    endDate
  };

  return orders.map(order => new Date(order.created_at));
};

/**
 * Récupère les commandes complètes dans une période donnée pour des analyses.
 */
export const fetchAllOrderInPeriodForAnalytics = async (startDate: string, endDate: string): Promise<Order[]> => {
  console.log("Appel de fetchAllOrderInPeriodForAnalytics:", new Error().stack?.split('\n')[2]?.trim() || 'inconnu');

  if (validateCache(startDate, endDate)) {
    console.log('Utilisation du cache');
    return orderCache!.data.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate >= new Date(`${startDate}T00:00:00`) && 
             orderDate <= new Date(`${endDate}T23:59:59`);
    });
  }

  console.log("Récupération des données depuis Supabase");
  const orders = await fetchOrdersFromSupabase(startDate, endDate);

  orderCache = {
    data: orders,
    timestamp: Date.now(),
    startDate,
    endDate
  };

  return orders;
};