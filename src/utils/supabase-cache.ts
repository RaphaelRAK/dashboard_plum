import { supabaseClient } from '../utility/supabaseClient';

// Types pour le cache
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live en millisecondes
}

interface CacheConfig {
  ttl: number; // Durée de vie par défaut (5 minutes)
  maxSize: number; // Taille maximale du cache
}

// Configuration du cache
const CACHE_CONFIG: CacheConfig = {
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 100 // Maximum 100 entrées
};

// Cache en mémoire
const memoryCache = new Map<string, CacheEntry<any>>();

// Cache localStorage pour la persistance
const STORAGE_PREFIX = 'supabase_cache_';

/**
 * Gestionnaire de cache intelligent pour Supabase
 */
export class SupabaseCache {
  private static instance: SupabaseCache;
  private cache = memoryCache;
  private config = CACHE_CONFIG;

  static getInstance(): SupabaseCache {
    if (!SupabaseCache.instance) {
      SupabaseCache.instance = new SupabaseCache();
    }
    return SupabaseCache.instance;
  }

  /**
   * Génère une clé de cache unique basée sur la requête
   */
  private generateCacheKey(table: string, query: any): string {
    const queryString = JSON.stringify(query);
    return `${table}_${this.hashString(queryString)}`;
  }

  /**
   * Hash simple pour la clé de cache
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
  }

  /**
   * Vérifie si une entrée de cache est valide
   */
  private isCacheValid(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  /**
   * Nettoie le cache expiré
   */
  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (!this.isCacheValid(entry)) {
        this.cache.delete(key);
        localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
      }
    }
  }

  /**
   * Gère la taille du cache
   */
  private manageCacheSize(): void {
    if (this.cache.size > this.config.maxSize) {
      // Supprimer les entrées les plus anciennes
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toDelete = entries.slice(0, this.cache.size - this.config.maxSize);
      toDelete.forEach(([key]) => {
        this.cache.delete(key);
        localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
      });
    }
  }

  /**
   * Récupère une entrée du cache
   */
  get<T>(table: string, query: any): T | null {
    this.cleanupCache();
    
    const key = this.generateCacheKey(table, query);
    const entry = this.cache.get(key);
    
    if (entry && this.isCacheValid(entry)) {
      console.log(`✅ Cache hit pour ${table}`);
      return entry.data;
    }
    
    // Essayer le localStorage
    try {
      const stored = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
      if (stored) {
        const parsedEntry: CacheEntry<T> = JSON.parse(stored);
        if (this.isCacheValid(parsedEntry)) {
          this.cache.set(key, parsedEntry);
          console.log(`✅ Cache localStorage hit pour ${table}`);
          return parsedEntry.data;
        }
      }
    } catch (error) {
      console.warn('Erreur lors de la lecture du cache localStorage:', error);
    }
    
    return null;
  }

  /**
   * Stocke une entrée dans le cache
   */
  set<T>(table: string, query: any, data: T, ttl?: number): void {
    this.cleanupCache();
    this.manageCacheSize();
    
    const key = this.generateCacheKey(table, query);
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.ttl
    };
    
    this.cache.set(key, entry);
    
    // Sauvegarder dans localStorage
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(entry));
    } catch (error) {
      console.warn('Erreur lors de la sauvegarde du cache localStorage:', error);
    }
    
    console.log(`💾 Cache mis à jour pour ${table}`);
  }

  /**
   * Invalide le cache pour une table spécifique
   */
  invalidate(table: string): void {
    const keysToDelete: string[] = [];
    
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${table}_`)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => {
      this.cache.delete(key);
      localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
    });
    
    console.log(`🗑️ Cache invalidé pour ${table}`);
  }

  /**
   * Vide tout le cache
   */
  clear(): void {
    this.cache.clear();
    
    // Vider le localStorage
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key);
      }
    }
    
    console.log('🗑️ Cache complètement vidé');
  }

  /**
   * Récupère les statistiques du cache
   */
  getStats(): { size: number; maxSize: number; hitRate: number } {
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      hitRate: 0 // À implémenter avec un compteur de hits
    };
  }
}

// Instance singleton
export const supabaseCache = SupabaseCache.getInstance();