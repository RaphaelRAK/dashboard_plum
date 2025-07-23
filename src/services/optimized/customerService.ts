import { supabaseOptimizer } from '../../utils/supabase-optimizer';
import { supabaseCache } from '../../utils/supabase-cache';
import { Public_profile } from '../../types/public_profileTypes';

/**
 * Service optimisé pour les clients
 */
export class OptimizedCustomerService {
  private static instance: OptimizedCustomerService;
  private cache = supabaseCache;
  private optimizer = supabaseOptimizer;

  static getInstance(): OptimizedCustomerService {
    if (!OptimizedCustomerService.instance) {
      OptimizedCustomerService.instance = new OptimizedCustomerService();
    }
    return OptimizedCustomerService.instance;
  }

  /**
   * Récupère tous les clients avec cache intelligent
   */
  async getAllCustomers(forceRefresh = false): Promise<Public_profile[]> {
    console.group('🔍 [Optimized] getAllCustomers');
    console.log('Force refresh:', forceRefresh);

    // Vérifier si on a besoin de rafraîchir
    if (!forceRefresh) {
      const lastFetch = this.getLastFetchTime();
      const timeSinceLastFetch = Date.now() - lastFetch;
      
      // Si moins de 3 minutes se sont écoulées, utiliser le cache
      if (timeSinceLastFetch < 3 * 60 * 1000) {
        console.log('✅ Utilisation du cache (dernière mise à jour il y a', Math.round(timeSinceLastFetch / 1000), 'secondes)');
        console.groupEnd();
        return this.getCachedCustomers();
      }
    }

    try {
      const result = await this.optimizer.query<Public_profile[]>('public_profile', {
        filters: { is_fliiinker: false },
        orderBy: { column: 'created_at', ascending: false },
        useCache: true,
        cacheTTL: 5 * 60 * 1000 // 5 minutes
      });

      this.setLastFetchTime();
      console.log('✅ Données récupérées:', result.data.length, 'clients');
      console.groupEnd();
      
      return result.data;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des clients:', error);
      console.groupEnd();
      throw error;
    }
  }

  /**
   * Récupère un client par ID avec cache
   */
  async getCustomerById(customerId: string): Promise<Public_profile | null> {
    console.group('🔍 [Optimized] getCustomerById');
    console.log('Customer ID:', customerId);

    try {
      const result = await this.optimizer.query<Public_profile[]>('public_profile', {
        filters: { id: customerId, is_fliiinker: false },
        useCache: true,
        cacheTTL: 10 * 60 * 1000 // 10 minutes pour les détails
      });

      console.log('✅ Client récupéré');
      console.groupEnd();
      
      return result.data[0] || null;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération du client:', error);
      console.groupEnd();
      throw error;
    }
  }

  /**
   * Récupère les clients avec pagination optimisée
   */
  async getCustomersPaginated(
    page: number,
    pageSize: number,
    filters: Record<string, any> = {}
  ): Promise<{ data: Public_profile[]; total: number; page: number; totalPages: number }> {
    console.group('🔍 [Optimized] getCustomersPaginated');
    console.log('Page:', page, 'PageSize:', pageSize, 'Filters:', filters);

    try {
      const result = await this.optimizer.queryPaginated<Public_profile[]>('public_profile', page, pageSize, {
        filters: { ...filters, is_fliiinker: false },
        orderBy: { column: 'created_at', ascending: false },
        useCache: true,
        cacheTTL: 3 * 60 * 1000 // 3 minutes pour la pagination
      });

      console.log('✅ Données paginées récupérées:', result.data.length, 'clients');
      console.groupEnd();
      
      return result;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des clients paginés:', error);
      console.groupEnd();
      throw error;
    }
  }

  /**
   * Recherche optimisée de clients
   */
  async searchCustomers(searchTerm: string, limit = 20): Promise<Public_profile[]> {
    console.group('🔍 [Optimized] searchCustomers');
    console.log('Search term:', searchTerm, 'Limit:', limit);

    if (!searchTerm.trim()) {
      console.log('⏭️ Terme de recherche vide, retour vide');
      console.groupEnd();
      return [];
    }

    try {
      // Recherche par nom ou email
      const result = await this.optimizer.query<Public_profile[]>('public_profile', {
        filters: { 
          is_fliiinker: false,
          // Note: Pour une vraie recherche textuelle, il faudrait utiliser full-text search
          // ou faire une recherche côté client
        },
        limit,
        useCache: false, // Pas de cache pour les recherches
        orderBy: { column: 'created_at', ascending: false }
      });

      // Filtrer côté client pour la recherche textuelle
      const filteredData = result.data.filter(customer => 
        customer.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );

      console.log('✅ Résultats de recherche:', filteredData.length);
      console.groupEnd();
      
      return filteredData;
    } catch (error) {
      console.error('❌ Erreur lors de la recherche:', error);
      console.groupEnd();
      throw error;
    }
  }

  /**
   * Récupère les statistiques des clients
   */
  async getCustomerStats(): Promise<{
    total: number;
    active: number;
    recent: number;
    byLocation: Record<string, number>;
  }> {
    console.group('🔍 [Optimized] getCustomerStats');

    try {
      // Utiliser des requêtes parallèles pour optimiser
      const [totalResult, recentResult] = await Promise.all([
        this.optimizer.getCount('public_profile', { is_fliiinker: false }),
        this.optimizer.getCount('public_profile', {
          is_fliiinker: false,
          created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() // 30 jours
        })
      ]);

      // Récupérer les clients actifs (avec des commandes récentes)
      const activeResult = await this.optimizer.getCount('public_profile', {
        is_fliiinker: false,
        // Note: Il faudrait une jointure avec les commandes pour un vrai comptage actif
      });

      const stats = {
        total: totalResult,
        active: activeResult,
        recent: recentResult,
        byLocation: {} // À implémenter si nécessaire
      };

      console.log('✅ Statistiques récupérées:', stats);
      console.groupEnd();
      
      return stats;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des statistiques:', error);
      console.groupEnd();
      throw error;
    }
  }

  /**
   * Récupère les clients par localisation
   */
  async getCustomersByLocation(location: string): Promise<Public_profile[]> {
    console.group('🔍 [Optimized] getCustomersByLocation');
    console.log('Location:', location);

    try {
      const result = await this.optimizer.query<Public_profile[]>('public_profile', {
        filters: { 
          is_fliiinker: false,
          address: location // Note: Cela dépend de la structure de vos données
        },
        orderBy: { column: 'created_at', ascending: false },
        useCache: true,
        cacheTTL: 5 * 60 * 1000
      });

      console.log('✅ Clients par localisation récupérés:', result.data.length);
      console.groupEnd();
      
      return result.data;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des clients par localisation:', error);
      console.groupEnd();
      throw error;
    }
  }

  /**
   * Récupère les clients récents
   */
  async getRecentCustomers(limit = 10): Promise<Public_profile[]> {
    console.group('🔍 [Optimized] getRecentCustomers');
    console.log('Limit:', limit);

    try {
      const result = await this.optimizer.query<Public_profile[]>('public_profile', {
        filters: { is_fliiinker: false },
        orderBy: { column: 'created_at', ascending: false },
        limit,
        useCache: true,
        cacheTTL: 2 * 60 * 1000 // 2 minutes pour les données récentes
      });

      console.log('✅ Clients récents récupérés:', result.data.length);
      console.groupEnd();
      
      return result.data;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des clients récents:', error);
      console.groupEnd();
      throw error;
    }
  }

  /**
   * Vérifie si un client existe
   */
  async customerExists(customerId: string): Promise<boolean> {
    console.group('🔍 [Optimized] customerExists');
    console.log('Customer ID:', customerId);

    try {
      const count = await this.optimizer.getCount('public_profile', {
        id: customerId,
        is_fliiinker: false
      });

      const exists = count > 0;
      console.log('✅ Vérification existence:', exists);
      console.groupEnd();
      
      return exists;
    } catch (error) {
      console.error('❌ Erreur lors de la vérification d\'existence:', error);
      console.groupEnd();
      throw error;
    }
  }

  /**
   * Invalide le cache des clients
   */
  invalidateCache(): void {
    this.optimizer.invalidateCache('public_profile');
    this.clearLastFetchTimes();
    console.log('🗑️ Cache des clients invalidé');
  }

  // Méthodes privées pour la gestion du cache local
  private getLastFetchTime(): number {
    return parseInt(localStorage.getItem('customers_last_fetch') || '0');
  }

  private setLastFetchTime(): void {
    localStorage.setItem('customers_last_fetch', Date.now().toString());
  }

  private clearLastFetchTimes(): void {
    localStorage.removeItem('customers_last_fetch');
  }

  private getCachedCustomers(): Public_profile[] {
    // Cette méthode devrait récupérer les données du cache Redux ou local
    // Pour l'instant, on retourne un tableau vide
    return [];
  }
}

// Instance singleton
export const optimizedCustomerService = OptimizedCustomerService.getInstance();