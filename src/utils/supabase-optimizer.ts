import { supabaseClient } from '../utility/supabaseClient';
import { supabaseCache } from './supabase-cache';

// Types pour les options de requête
interface QueryOptions {
  useCache?: boolean;
  cacheTTL?: number;
  select?: string;
  filters?: Record<string, any>;
  orderBy?: { column: string; ascending?: boolean };
  limit?: number;
  offset?: number;
  includeRelations?: string[];
}

interface OptimizedQueryResult<T> {
  data: T;
  fromCache: boolean;
  timestamp: number;
}

/**
 * Optimiseur de requêtes Supabase
 */
export class SupabaseOptimizer {
  private static instance: SupabaseOptimizer;
  private cache = supabaseCache;

  static getInstance(): SupabaseOptimizer {
    if (!SupabaseOptimizer.instance) {
      SupabaseOptimizer.instance = new SupabaseOptimizer();
    }
    return SupabaseOptimizer.instance;
  }

  /**
   * Requête optimisée avec cache et gestion des relations
   */
  async query<T>(
    table: string,
    options: QueryOptions = {}
  ): Promise<OptimizedQueryResult<T>> {
    const {
      useCache = true,
      cacheTTL,
      select = '*',
      filters = {},
      orderBy,
      limit,
      offset,
      includeRelations = []
    } = options;

    // Construire la clé de cache
    const cacheKey = {
      table,
      select,
      filters,
      orderBy,
      limit,
      offset,
      includeRelations
    };

    // Vérifier le cache si activé
    if (useCache) {
      const cachedData = this.cache.get<T>(table, cacheKey);
      if (cachedData) {
        return {
          data: cachedData,
          fromCache: true,
          timestamp: Date.now()
        };
      }
    }

    // Construire la requête Supabase
    let query = supabaseClient.from(table).select(select);

    // Appliquer les filtres
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          query = query.in(key, value);
        } else {
          query = query.eq(key, value);
        }
      }
    });

    // Appliquer l'ordre
    if (orderBy) {
      query = query.order(orderBy.column, {
        ascending: orderBy.ascending ?? true
      });
    }

    // Appliquer la pagination
    if (limit) {
      query = query.limit(limit);
    }
    if (offset) {
      query = query.range(offset, offset + (limit || 1000) - 1);
    }

    // Exécuter la requête
    const { data, error } = await query;

    if (error) {
      console.error(`❌ Erreur Supabase pour ${table}:`, error);
      throw error;
    }

    // Mettre en cache si activé
    if (useCache && data) {
      this.cache.set(table, cacheKey, data, cacheTTL);
    }

    console.log(`✅ Requête optimisée pour ${table}: ${data?.length || 0} résultats`);

    return {
      data: data as T,
      fromCache: false,
      timestamp: Date.now()
    };
  }

  /**
   * Requête avec relations optimisées
   */
  async queryWithRelations<T>(
    table: string,
    relations: string[],
    options: QueryOptions = {}
  ): Promise<OptimizedQueryResult<T>> {
    const select = this.buildSelectWithRelations(table, relations);
    return this.query<T>(table, { ...options, select });
  }

  /**
   * Construit une clause SELECT optimisée avec relations
   */
  private buildSelectWithRelations(table: string, relations: string[]): string {
    const baseSelect = '*';
    const relationSelects = relations.map(relation => `${relation}(*)`).join(',');
    
    return relationSelects ? `${baseSelect}, ${relationSelects}` : baseSelect;
  }

  /**
   * Requête paginée optimisée
   */
  async queryPaginated<T>(
    table: string,
    page: number,
    pageSize: number,
    options: QueryOptions = {}
  ): Promise<{ data: T; total: number; page: number; totalPages: number }> {
    const offset = (page - 1) * pageSize;
    
    // Requête pour les données
    const dataResult = await this.query<T>(table, {
      ...options,
      limit: pageSize,
      offset
    });

    // Requête pour le total (avec cache séparé)
    const totalResult = await this.getCount(table, options.filters || {});

    const totalPages = Math.ceil(totalResult / pageSize);

    return {
      data: dataResult.data,
      total: totalResult,
      page,
      totalPages
    };
  }

  /**
   * Récupère le nombre total d'enregistrements
   */
  async getCount(table: string, filters: Record<string, any> = {}): Promise<number> {
    const cacheKey = { table, count: true, filters };
    
    // Vérifier le cache
    const cachedCount = this.cache.get<number>(`${table}_count`, cacheKey);
    if (cachedCount !== null) {
      return cachedCount;
    }

    // Construire la requête de comptage
    let query = supabaseClient.from(table).select('*', { count: 'exact', head: true });

    // Appliquer les filtres
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          query = query.in(key, value);
        } else {
          query = query.eq(key, value);
        }
      }
    });

    const { count, error } = await query;

    if (error) {
      console.error(`❌ Erreur comptage pour ${table}:`, error);
      throw error;
    }

    const total = count || 0;

    // Mettre en cache (TTL plus long pour les comptages)
    this.cache.set(`${table}_count`, cacheKey, total, 10 * 60 * 1000); // 10 minutes

    return total;
  }

  /**
   * Requête conditionnelle - ne fait l'appel que si nécessaire
   */
  async conditionalQuery<T>(
    table: string,
    condition: () => boolean,
    options: QueryOptions = {}
  ): Promise<OptimizedQueryResult<T> | null> {
    if (!condition()) {
      console.log(`⏭️ Requête conditionnelle ignorée pour ${table}`);
      return null;
    }

    return this.query<T>(table, options);
  }

  /**
   * Requête avec retry automatique
   */
  async queryWithRetry<T>(
    table: string,
    options: QueryOptions = {},
    maxRetries: number = 3
  ): Promise<OptimizedQueryResult<T>> {
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.query<T>(table, options);
      } catch (error) {
        lastError = error;
        console.warn(`⚠️ Tentative ${attempt}/${maxRetries} échouée pour ${table}:`, error);
        
        if (attempt < maxRetries) {
          // Attendre avant de réessayer (backoff exponentiel)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    throw lastError;
  }

  /**
   * Invalide le cache pour une table
   */
  invalidateCache(table: string): void {
    this.cache.invalidate(table);
  }

  /**
   * Vide tout le cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Récupère les statistiques du cache
   */
  getCacheStats() {
    return this.cache.getStats();
  }
}

// Instance singleton
export const supabaseOptimizer = SupabaseOptimizer.getInstance();