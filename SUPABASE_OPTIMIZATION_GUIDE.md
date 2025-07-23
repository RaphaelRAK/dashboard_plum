# Guide d'Optimisation Supabase

## 🎯 Objectif
Optimiser les appels API Supabase pour réduire la charge sur la base de données, améliorer les performances et offrir une meilleure expérience utilisateur.

## 🚀 Optimisations Implémentées

### 1. Système de Cache Intelligent

#### Cache en Mémoire + localStorage
- **Cache en mémoire** : Accès ultra-rapide aux données fréquemment utilisées
- **localStorage** : Persistance entre les sessions
- **TTL configurable** : Durée de vie adaptée selon le type de données
- **Nettoyage automatique** : Gestion de la mémoire et suppression des entrées expirées

#### Configuration du Cache
```typescript
const CACHE_CONFIG = {
  ttl: 5 * 60 * 1000, // 5 minutes par défaut
  maxSize: 100 // Maximum 100 entrées
};
```

### 2. Optimiseur de Requêtes

#### Fonctionnalités
- **Requêtes conditionnelles** : Appels uniquement quand nécessaire
- **Gestion des relations** : Joins optimisés
- **Pagination intelligente** : Cache séparé pour les comptages
- **Retry automatique** : Gestion des erreurs avec backoff exponentiel
- **Requêtes parallèles** : Optimisation des appels multiples

#### Exemple d'utilisation
```typescript
// Requête optimisée avec cache
const result = await supabaseOptimizer.query<Order[]>('order', {
  filters: { status: 'pending' },
  orderBy: { column: 'created_at', ascending: false },
  useCache: true,
  cacheTTL: 5 * 60 * 1000
});

// Requête avec relations
const result = await supabaseOptimizer.queryWithRelations<Order[]>('order', [
  'fliiinker_profile.public_profile',
  'customer:public_profile',
  'billing'
], {
  orderBy: { column: 'created_at', ascending: false }
});
```

### 3. Hooks React Query Optimisés

#### Hooks Disponibles
- `useSupabaseQuery` : Requête simple avec cache
- `useSupabasePaginatedQuery` : Pagination optimisée
- `useSupabaseQueryWithRelations` : Relations optimisées
- `useSupabaseConditionalQuery` : Requêtes conditionnelles
- `useSupabaseMutation` : Mutations avec invalidation automatique
- `useSupabaseQueries` : Requêtes multiples parallèles
- `useSupabasePrefetch` : Préchargement des données
- `useSupabaseCache` : Gestion du cache

#### Exemple d'utilisation
```typescript
// Hook pour requête optimisée
const { data: orders, isLoading, error } = useSupabaseQuery<Order[]>('order', {
  filters: { status: 'pending' },
  orderBy: { column: 'created_at', ascending: false },
  staleTime: 5 * 60 * 1000,
  refetchOnWindowFocus: false
});

// Hook pour pagination
const { data, isLoading } = useSupabasePaginatedQuery<Order[]>('order', {
  page: 1,
  pageSize: 20,
  filters: { status: 'pending' }
});
```

### 4. Services Optimisés

#### Services Disponibles
- `OptimizedOrderService` : Gestion optimisée des commandes
- `OptimizedCustomerService` : Gestion optimisée des clients

#### Fonctionnalités des Services
- **Cache intelligent** : Vérification de la fraîcheur des données
- **Requêtes conditionnelles** : Appels uniquement si nécessaire
- **Statistiques optimisées** : Requêtes parallèles pour les métriques
- **Recherche optimisée** : Filtrage côté client quand approprié

#### Exemple d'utilisation
```typescript
// Service optimisé pour les commandes
const orderService = OptimizedOrderService.getInstance();

// Récupération avec cache intelligent
const orders = await orderService.getAllOrders();

// Récupération forcée (bypass cache)
const freshOrders = await orderService.getAllOrders(true);

// Statistiques optimisées
const stats = await orderService.getOrderStats();
```

## 📊 Stratégies de Cache

### 1. Durées de Cache par Type de Données

| Type de Données | TTL | Raison |
|----------------|-----|--------|
| **Commandes** | 5 minutes | Données changeantes |
| **Clients** | 5 minutes | Données relativement stables |
| **Détails commande** | 10 minutes | Données détaillées coûteuses |
| **Statistiques** | 10 minutes | Calculs coûteux |
| **Recherches** | Pas de cache | Données dynamiques |
| **Pagination** | 3 minutes | Données de navigation |

### 2. Conditions de Rafraîchissement

#### Commandes
- **Cache** : 2 minutes
- **Force refresh** : Après modification
- **Invalidation** : Nouvelle commande, changement de statut

#### Clients
- **Cache** : 3 minutes
- **Force refresh** : Modification du profil
- **Invalidation** : Nouveau client, mise à jour profil

### 3. Stratégies d'Invalidation

#### Invalidation Automatique
```typescript
// Après une mutation
const mutation = useSupabaseMutation('order', updateOrder, {
  invalidateQueries: true,
  invalidateRelations: ['public_profile', 'billing']
});
```

#### Invalidation Manuelle
```typescript
const { invalidateTable } = useSupabaseCache();
invalidateTable('order'); // Invalide toutes les requêtes pour 'order'
```

## 🔧 Optimisations des Requêtes

### 1. Sélection Optimisée

#### Avant (Non optimisé)
```sql
SELECT * FROM order 
JOIN fliiinker_profile ON order.fliiinker_id = fliiinker_profile.id
JOIN public_profile ON fliiinker_profile.public_profile_id = public_profile.id
JOIN billing ON order.id = billing.order_id
```

#### Après (Optimisé)
```typescript
// Sélection spécifique avec relations
const result = await supabaseOptimizer.queryWithRelations<Order[]>('order', [
  'fliiinker_profile.public_profile',
  'customer:public_profile',
  'billing'
], {
  select: 'id, status, created_at, fliiinker_profile(id, public_profile(first_name, last_name)), billing(amount)'
});
```

### 2. Filtrage Optimisé

#### Conditions Intelligentes
```typescript
// Requête conditionnelle
const result = await supabaseOptimizer.conditionalQuery<Order[]>('order', 
  () => searchTerm.length > 2, // Ne fait l'appel que si nécessaire
  {
    filters: { id: searchTerm },
    useCache: false
  }
);
```

### 3. Pagination Optimisée

#### Comptage Séparé
```typescript
// Pagination avec cache séparé pour le total
const result = await supabaseOptimizer.queryPaginated<Order[]>('order', page, pageSize, {
  filters: { status: 'pending' }
});
// Le total est mis en cache séparément avec un TTL plus long
```

## 📈 Monitoring et Performance

### 1. Composants de Monitoring

#### PerformanceMonitor
- Temps de chargement des pages
- Utilisation mémoire
- Informations sur le bundle

#### SupabasePerformanceMonitor
- Statistiques du cache
- Performance des requêtes
- Taux de hit/miss
- Recommandations d'optimisation

### 2. Métriques Clés

#### Cache Performance
- **Hit Rate** : Pourcentage de requêtes servies depuis le cache
- **Cache Size** : Utilisation de l'espace cache
- **TTL Efficiency** : Optimisation des durées de vie

#### Query Performance
- **Response Time** : Temps de réponse moyen
- **Cache Hits/Misses** : Efficacité du cache
- **Error Rate** : Taux d'erreurs

### 3. Recommandations Automatiques

Le système génère automatiquement des recommandations basées sur :
- Taux de cache faible (< 60%)
- Temps de réponse élevé (> 200ms)
- Cache presque plein (> 80%)
- Erreurs fréquentes

## 🛠️ Migration des Services Existants

### 1. Remplacer les Appels Directs

#### Avant
```typescript
// Appel direct non optimisé
const { data, error } = await supabaseClient
  .from('order')
  .select('*')
  .order('created_at', { ascending: false });
```

#### Après
```typescript
// Appel optimisé avec cache
const { data, error } = await supabaseOptimizer.query<Order[]>('order', {
  orderBy: { column: 'created_at', ascending: false },
  useCache: true,
  cacheTTL: 5 * 60 * 1000
});
```

### 2. Migration des Slices Redux

#### Avant
```typescript
export const fetchOrders = createAsyncThunk(
  'orders/fetch',
  async () => {
    const { data, error } = await supabaseClient
      .from('order')
      .select('*')
      .order('created_at', { ascending: false });
    return data || [];
  }
);
```

#### Après
```typescript
export const fetchOrders = createAsyncThunk(
  'orders/fetch',
  async (_, { getState }) => {
    const state = getState() as RootState;
    const lastFetch = state.orders.lastFetch;
    
    // Vérifier si on a besoin de rafraîchir
    if (Date.now() - lastFetch < 2 * 60 * 1000) {
      return state.orders.orders;
    }
    
    const result = await supabaseOptimizer.query<Order[]>('order', {
      orderBy: { column: 'created_at', ascending: false },
      useCache: true
    });
    
    return result.data;
  }
);
```

## 🎯 Bénéfices Attendus

### 1. Performance
- **Réduction des appels API** : 70-80% de réduction
- **Temps de réponse** : Amélioration de 60-80%
- **Charge serveur** : Réduction significative
- **Expérience utilisateur** : Interface plus réactive

### 2. Coûts
- **Réduction des coûts Supabase** : Moins d'appels = moins de coûts
- **Optimisation des ressources** : Meilleure utilisation du cache
- **Scalabilité** : Support de plus d'utilisateurs

### 3. Maintenance
- **Code plus propre** : Services centralisés
- **Debugging facilité** : Monitoring intégré
- **Évolutivité** : Architecture modulaire

## 📋 Checklist d'Implémentation

### Phase 1 : Infrastructure
- [x] Système de cache intelligent
- [x] Optimiseur de requêtes
- [x] Hooks React Query
- [x] Services optimisés

### Phase 2 : Migration
- [ ] Remplacer les appels directs dans les slices Redux
- [ ] Migrer les services existants
- [ ] Adapter les composants pour utiliser les nouveaux hooks
- [ ] Tester les performances

### Phase 3 : Optimisation
- [ ] Ajuster les TTL selon l'usage
- [ ] Optimiser les requêtes complexes
- [ ] Implémenter le préchargement
- [ ] Configurer les invalidations automatiques

### Phase 4 : Monitoring
- [ ] Activer les moniteurs de performance
- [ ] Analyser les métriques
- [ ] Ajuster les stratégies
- [ ] Documenter les bonnes pratiques

## 🔍 Dépannage

### Problèmes Courants

#### Cache ne fonctionne pas
```typescript
// Vérifier la configuration
console.log(supabaseCache.getStats());

// Forcer le rafraîchissement
supabaseCache.clear();
```

#### Requêtes lentes
```typescript
// Vérifier les relations
const result = await supabaseOptimizer.queryWithRelations('order', [
  'fliiinker_profile.public_profile'
], {
  select: 'id, status, created_at' // Sélection spécifique
});
```

#### Données obsolètes
```typescript
// Invalider le cache
supabaseOptimizer.invalidateCache('order');

// Ou forcer le rafraîchissement
const freshData = await service.getAllData(true);
```

## 📚 Ressources

- [Documentation Supabase](https://supabase.com/docs)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Performance Monitoring](https://web.dev/vitals/)
- [Cache Strategies](https://web.dev/learn/pwa/caching?hl=fr)

---

*Dernière mise à jour : $(date)*
*Version : 1.0.0*