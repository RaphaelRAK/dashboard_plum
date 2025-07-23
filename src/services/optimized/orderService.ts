import { supabaseOptimizer } from '../../utils/supabase-optimizer';
import { supabaseCache } from '../../utils/supabase-cache';
import { Order } from '../../types/orderTypes';

/**
 * Service optimisé pour les commandes
 */
export class OptimizedOrderService {
  private static instance: OptimizedOrderService;
  private cache = supabaseCache;
  private optimizer = supabaseOptimizer;

  static getInstance(): OptimizedOrderService {
    if (!OptimizedOrderService.instance) {
      OptimizedOrderService.instance = new OptimizedOrderService();
    }
    return OptimizedOrderService.instance;
  }

  /**
   * Récupère toutes les commandes avec cache intelligent
   */
  async getAllOrders(forceRefresh = false): Promise<Order[]> {
    console.group('🔍 [Optimized] getAllOrders');
    console.log('Force refresh:', forceRefresh);

    // Vérifier si on a besoin de rafraîchir
    if (!forceRefresh) {
      const lastFetch = this.getLastFetchTime();
      const timeSinceLastFetch = Date.now() - lastFetch;
      
      // Si moins de 2 minutes se sont écoulées, utiliser le cache
      if (timeSinceLastFetch < 2 * 60 * 1000) {
        console.log('✅ Utilisation du cache (dernière mise à jour il y a', Math.round(timeSinceLastFetch / 1000), 'secondes)');
        console.groupEnd();
        return this.getCachedOrders();
      }
    }

    try {
      const result = await this.optimizer.queryWithRelations<Order[]>('order', [
        'fliiinker_profile.public_profile',
        'customer:public_profile',
        'billing'
      ], {
        orderBy: { column: 'created_at', ascending: false },
        useCache: true,
        cacheTTL: 5 * 60 * 1000 // 5 minutes
      });

      this.setLastFetchTime();
      console.log('✅ Données récupérées:', result.data.length, 'commandes');
      console.groupEnd();
      
      return result.data;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des commandes:', error);
      console.groupEnd();
      throw error;
    }
  }

  /**
   * Récupère une commande spécifique avec ses relations
   */
  async getOrderById(orderId: string): Promise<Order | null> {
    console.group('🔍 [Optimized] getOrderById');
    console.log('Order ID:', orderId);

    try {
      const result = await this.optimizer.query<Order[]>('order', {
        filters: { id: orderId },
        select: '*, fliiinker_profile(*, public_profile(*)), customer:public_profile!customer_id(*), billing(*)',
        useCache: true,
        cacheTTL: 10 * 60 * 1000 // 10 minutes pour les détails
      });

      console.log('✅ Commande récupérée');
      console.groupEnd();
      
      return result.data[0] || null;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération de la commande:', error);
      console.groupEnd();
      throw error;
    }
  }

  /**
   * Récupère les commandes avec pagination optimisée
   */
  async getOrdersPaginated(
    page: number,
    pageSize: number,
    filters: Record<string, any> = {}
  ): Promise<{ data: Order[]; total: number; page: number; totalPages: number }> {
    console.group('🔍 [Optimized] getOrdersPaginated');
    console.log('Page:', page, 'PageSize:', pageSize, 'Filters:', filters);

    try {
      const result = await this.optimizer.queryPaginated<Order[]>('order', page, pageSize, {
        filters,
        select: '*, fliiinker_profile(*, public_profile(*)), customer:public_profile!customer_id(*), billing(*)',
        orderBy: { column: 'created_at', ascending: false },
        useCache: true,
        cacheTTL: 3 * 60 * 1000 // 3 minutes pour la pagination
      });

      console.log('✅ Données paginées récupérées:', result.data.length, 'commandes');
      console.groupEnd();
      
      return result;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des commandes paginées:', error);
      console.groupEnd();
      throw error;
    }
  }

  /**
   * Récupère les commandes par statut avec cache conditionnel
   */
  async getOrdersByStatus(status: string, forceRefresh = false): Promise<Order[]> {
    console.group('🔍 [Optimized] getOrdersByStatus');
    console.log('Status:', status, 'Force refresh:', forceRefresh);

    // Vérifier si on a besoin de rafraîchir
    if (!forceRefresh) {
      const lastFetch = this.getLastFetchTimeForStatus(status);
      const timeSinceLastFetch = Date.now() - lastFetch;
      
      // Si moins de 1 minute s'est écoulée, utiliser le cache
      if (timeSinceLastFetch < 60 * 1000) {
        console.log('✅ Utilisation du cache pour le statut', status);
        console.groupEnd();
        return this.getCachedOrdersByStatus(status);
      }
    }

    try {
      const result = await this.optimizer.query<Order[]>('order', {
        filters: { status },
        select: '*, fliiinker_profile(*, public_profile(*)), customer:public_profile!customer_id(*), billing(*)',
        orderBy: { column: 'created_at', ascending: false },
        useCache: true,
        cacheTTL: 2 * 60 * 1000 // 2 minutes pour les statuts
      });

      this.setLastFetchTimeForStatus(status);
      console.log('✅ Commandes par statut récupérées:', result.data.length);
      console.groupEnd();
      
      return result.data;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des commandes par statut:', error);
      console.groupEnd();
      throw error;
    }
  }

  /**
   * Recherche optimisée de commandes
   */
  async searchOrders(searchTerm: string, limit = 20): Promise<Order[]> {
    console.group('🔍 [Optimized] searchOrders');
    console.log('Search term:', searchTerm, 'Limit:', limit);

    if (!searchTerm.trim()) {
      console.log('⏭️ Terme de recherche vide, retour vide');
      console.groupEnd();
      return [];
    }

    try {
      // Recherche par ID de commande
      const result = await this.optimizer.query<Order[]>('order', {
        filters: { id: searchTerm },
        select: '*, fliiinker_profile(*, public_profile(*)), customer:public_profile!customer_id(*), billing(*)',
        limit,
        useCache: false, // Pas de cache pour les recherches
        orderBy: { column: 'created_at', ascending: false }
      });

      console.log('✅ Résultats de recherche:', result.data.length);
      console.groupEnd();
      
      return result.data;
    } catch (error) {
      console.error('❌ Erreur lors de la recherche:', error);
      console.groupEnd();
      throw error;
    }
  }

  /**
   * Récupère les statistiques des commandes
   */
  async getOrderStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    recent: number;
  }> {
    console.group('🔍 [Optimized] getOrderStats');

    try {
      // Utiliser des requêtes parallèles pour optimiser
      const [totalResult, recentResult] = await Promise.all([
        this.optimizer.getCount('order'),
        this.optimizer.getCount('order', {
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        })
      ]);

      // Récupérer les statistiques par statut
      const statuses = ['pending', 'confirmed', 'cancelled', 'completed'];
      const statusCounts = await Promise.all(
        statuses.map(async (status) => {
          const count = await this.optimizer.getCount('order', { status });
          return { status, count };
        })
      );

      const byStatus = statusCounts.reduce((acc, { status, count }) => {
        acc[status] = count;
        return acc;
      }, {} as Record<string, number>);

      const stats = {
        total: totalResult,
        byStatus,
        recent: recentResult
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
   * Invalide le cache des commandes
   */
  invalidateCache(): void {
    this.optimizer.invalidateCache('order');
    this.clearLastFetchTimes();
    console.log('🗑️ Cache des commandes invalidé');
  }

  // Méthodes privées pour la gestion du cache local
  private getLastFetchTime(): number {
    return parseInt(localStorage.getItem('orders_last_fetch') || '0');
  }

  private setLastFetchTime(): void {
    localStorage.setItem('orders_last_fetch', Date.now().toString());
  }

  private getLastFetchTimeForStatus(status: string): number {
    return parseInt(localStorage.getItem(`orders_last_fetch_${status}`) || '0');
  }

  private setLastFetchTimeForStatus(status: string): void {
    localStorage.setItem(`orders_last_fetch_${status}`, Date.now().toString());
  }

  private clearLastFetchTimes(): void {
    localStorage.removeItem('orders_last_fetch');
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('orders_last_fetch_')) {
        localStorage.removeItem(key);
      }
    });
  }

  private getCachedOrders(): Order[] {
    // Cette méthode devrait récupérer les données du cache Redux ou local
    // Pour l'instant, on retourne un tableau vide
    return [];
  }

  private getCachedOrdersByStatus(status: string): Order[] {
    // Cette méthode devrait récupérer les données du cache Redux ou local
    // Pour l'instant, on retourne un tableau vide
    return [];
  }
}

// Instance singleton
export const optimizedOrderService = OptimizedOrderService.getInstance();