import { Linking } from "../../types/linking";
import { supabaseClient } from "../../utility";
import { RealtimeChannel } from '@supabase/supabase-js';

let fliiinkerRefuseCache: {
  data: Linking[];
  timestamp: number;
} | null = null;

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const fetchLinkingAbort = async (): Promise<Linking[]> => {
  // if (fliiinkerRefuseCache && Date.now() - fliiinkerRefuseCache.timestamp < CACHE_DURATION && fliiinkerRefuseCache.data.length > 0) {
  //   console.log('Récupération des liens refusés depuis le cache');
  //   return fliiinkerRefuseCache.data;
  // }

  try {
    const { data, error } = await supabaseClient
      .from('linking')
      .select('*')
      .filter('events', 'cs', '[{"name": "fliiinker_refuse"}]');

    if (error) {
      console.error('Erreur lors de la récupération des liens refusés', error);
      throw error;
    }

    console.log('Données reçues linking refused:', data?.length || 0, 'liens refusés');

    fliiinkerRefuseCache = {
      data: data || [],
      timestamp: Date.now()
    };

    return data || [];
  } catch (error) {
    console.error('Erreur détaillée linking refused:', error);
    throw error;
  }
};

export const subscribeToFliiinkerAbort = (
  setFliiinkerAbort: React.Dispatch<React.SetStateAction<Linking[]>>,
  onError?: (error: any) => void
): RealtimeChannel => {
  try {
    console.log("Subscribe to fliiinker abort");

    const refreshFliiinkerAbort = async () => {
      try {
        const linkings = await fetchLinkingAbort();
        setFliiinkerAbort(linkings);
      } catch (error) {
        console.error('Erreur lors du rafraîchissement:', error);
        if (onError) onError(error);
      }
    };

    const channel = supabaseClient
      .channel('fliiinker-abort')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'linking'
      }, async (payload) => {
        console.log('Changement détecté dans fliiinker abort : ', payload.eventType, payload);
        await refreshFliiinkerAbort();
      })
      .subscribe((status) => {
        console.log('Statut de la subscription:', status);
        switch (status) {
          case 'SUBSCRIBED':
            console.log('Subscription réussie aux changements de liens refusés');
            refreshFliiinkerAbort();
            break;
          case 'CLOSED':
            console.log('Subscription annulée aux changements de liens refusés');
            break;
        }
      });

    return channel;
  } catch (error) {
    console.error('Erreur dans fliiinkerAbortApi:', error);
    if (onError) onError(error);
    throw error;
  }
};

export const unsubscribeFromFliiinkerAbort = (channel: RealtimeChannel): void => {
  if (channel) {
    console.log('Désabonnement du canal fliiinker abort');
    supabaseClient.removeChannel(channel);
  }
};

