import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";
import { supabaseOptimizer } from "../utils/supabase-optimizer";
import { supabaseCache } from "../utils/supabase-cache";

// Types pour les options de requête
interface SupabaseQueryOptions {
  useCache?: boolean;
  cacheTTL?: number;
  select?: string;
  filters?: Record<string, any>;
  orderBy?: { column: string; ascending?: boolean };
  limit?: number;
  offset?: number;
  includeRelations?: string[];
  enabled?: boolean;
  staleTime?: number;
  refetchOnWindowFocus?: boolean;
  refetchOnMount?: boolean;
}

interface PaginationOptions extends SupabaseQueryOptions {
  page: number;
  pageSize: number;
}

/**
 * Hook pour requêtes Supabase optimisées avec React Query
 */
export const useSupabaseQuery = <T>(
  table: string,
  options: SupabaseQueryOptions = {},
) => {
  const {
    useCache = true,
    cacheTTL,
    select,
    filters = {},
    orderBy,
    limit,
    offset,
    includeRelations = [],
    enabled = true,
    staleTime = 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus = false,
    refetchOnMount = true,
  } = options;

  // Générer une clé de requête unique
  const queryKey = [
    "supabase",
    table,
    select,
    filters,
    orderBy,
    limit,
    offset,
    includeRelations,
  ];

  return useQuery({
    queryKey,
    queryFn: async () => {
      const result = await supabaseOptimizer.query<T>(table, {
        useCache,
        cacheTTL,
        select,
        filters,
        orderBy,
        limit,
        offset,
        includeRelations,
      });
      return result.data;
    },
    enabled,
    staleTime,
    refetchOnWindowFocus,
    refetchOnMount,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

/**
 * Hook pour requêtes paginées
 */
export const useSupabasePaginatedQuery = <T>(
  table: string,
  options: PaginationOptions,
) => {
  const {
    page,
    pageSize,
    useCache = true,
    cacheTTL,
    select,
    filters = {},
    orderBy,
    includeRelations = [],
    enabled = true,
    staleTime = 5 * 60 * 1000,
    refetchOnWindowFocus = false,
    refetchOnMount = true,
  } = options;

  const queryKey = [
    "supabase-paginated",
    table,
    page,
    pageSize,
    select,
    filters,
    orderBy,
    includeRelations,
  ];

  return useQuery({
    queryKey,
    queryFn: async () => {
      return await supabaseOptimizer.queryPaginated<T>(table, page, pageSize, {
        useCache,
        cacheTTL,
        select,
        filters,
        orderBy,
        includeRelations,
      });
    },
    enabled,
    staleTime,
    refetchOnWindowFocus,
    refetchOnMount,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

/**
 * Hook pour requêtes avec relations
 */
export const useSupabaseQueryWithRelations = <T>(
  table: string,
  relations: string[],
  options: SupabaseQueryOptions = {},
) => {
  return useSupabaseQuery<T>(table, {
    ...options,
    includeRelations: relations,
  });
};

/**
 * Hook pour requêtes conditionnelles
 */
export const useSupabaseConditionalQuery = <T>(
  table: string,
  condition: () => boolean,
  options: SupabaseQueryOptions = {},
) => {
  const {
    useCache = true,
    cacheTTL,
    select,
    filters = {},
    orderBy,
    limit,
    offset,
    includeRelations = [],
    staleTime = 5 * 60 * 1000,
    refetchOnWindowFocus = false,
    refetchOnMount = true,
  } = options;

  const queryKey = [
    "supabase-conditional",
    table,
    condition.toString(),
    select,
    filters,
    orderBy,
    limit,
    offset,
    includeRelations,
  ];

  return useQuery({
    queryKey,
    queryFn: async () => {
      const result = await supabaseOptimizer.conditionalQuery<T>(
        table,
        condition,
        {
          useCache,
          cacheTTL,
          select,
          filters,
          orderBy,
          limit,
          offset,
          includeRelations,
        },
      );
      return result?.data || null;
    },
    enabled: condition(),
    staleTime,
    refetchOnWindowFocus,
    refetchOnMount,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

/**
 * Hook pour mutations avec invalidation automatique du cache
 */
export const useSupabaseMutation = <TData, TVariables>(
  table: string,
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: {
    invalidateQueries?: boolean;
    invalidateRelations?: string[];
  } = {},
) => {
  const queryClient = useQueryClient();
  const { invalidateQueries = true, invalidateRelations = [] } = options;

  return useMutation({
    mutationFn,
    onSuccess: () => {
      if (invalidateQueries) {
        // Invalider toutes les requêtes pour cette table
        queryClient.invalidateQueries({ queryKey: ["supabase", table] });
        queryClient.invalidateQueries({
          queryKey: ["supabase-paginated", table],
        });
        queryClient.invalidateQueries({
          queryKey: ["supabase-conditional", table],
        });

        // Invalider les relations
        invalidateRelations.forEach((relation) => {
          queryClient.invalidateQueries({ queryKey: ["supabase", relation] });
        });

        // Invalider le cache local
        supabaseCache.invalidate(table);
        invalidateRelations.forEach((relation) => {
          supabaseCache.invalidate(relation);
        });
      }
    },
    onError: (error) => {
      console.error(`❌ Erreur mutation pour ${table}:`, error);
    },
  });
};

/**
 * Hook pour optimiser les requêtes multiples
 */
export const useSupabaseQueries = <T>(
  queries: Array<{
    table: string;
    options: SupabaseQueryOptions;
  }>,
) => {
  const results = queries.map(({ table, options }, index) => {
    const queryKey = [
      "supabase-multiple",
      index,
      table,
      options.select,
      options.filters,
      options.orderBy,
      options.limit,
      options.offset,
      options.includeRelations,
    ];

    return useQuery({
      queryKey,
      queryFn: async () => {
        const result = await supabaseOptimizer.query<T>(table, options);
        return result.data;
      },
      enabled: options.enabled !== false,
      staleTime: options.staleTime || 5 * 60 * 1000,
      refetchOnWindowFocus: options.refetchOnWindowFocus || false,
      refetchOnMount: options.refetchOnMount !== false,
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    });
  });

  return results;
};

/**
 * Hook pour précharger les données
 */
export const useSupabasePrefetch = () => {
  const queryClient = useQueryClient();

  const prefetchQuery = async <T>(
    table: string,
    options: SupabaseQueryOptions = {},
  ) => {
    const queryKey = [
      "supabase",
      table,
      options.select,
      options.filters,
      options.orderBy,
      options.limit,
      options.offset,
      options.includeRelations,
    ];

    await queryClient.prefetchQuery({
      queryKey,
      queryFn: async () => {
        const result = await supabaseOptimizer.query<T>(table, options);
        return result.data;
      },
      staleTime: options.staleTime || 5 * 60 * 1000,
    });
  };

  return { prefetchQuery };
};

/**
 * Hook pour gérer le cache
 */
export const useSupabaseCache = () => {
  const queryClient = useQueryClient();

  const invalidateTable = (table: string) => {
    queryClient.invalidateQueries({ queryKey: ["supabase", table] });
    supabaseCache.invalidate(table);
  };

  const clearAllCache = () => {
    queryClient.clear();
    supabaseCache.clear();
  };

  const getCacheStats = () => {
    return supabaseCache.getStats();
  };

  return {
    invalidateTable,
    clearAllCache,
    getCacheStats,
  };
};
