import { Linking } from "../../types/linking";
import { supabaseClient } from "../../utility/supabaseClient";
import { RealtimeChannel } from '@supabase/supabase-js';

let customerConfirmedCache: {
  data: Linking[];
  timestamp: number;
} | null = null;

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const fetchLinkingCustomerConfirmed = async (): Promise<Linking[]> => {
  // if (customerConfirmedCache && Date.now() - customerConfirmedCache.timestamp < CACHE_DURATION && customerConfirmedCache.data.length > 0) {
  //   console.log('Récupération des liens confirmés depuis le cache');
  //   return customerConfirmedCache.data;
  // }

  try {
    const { data, error } = await supabaseClient
      .from('linking')
      .select('*')
      .filter('events', 'cs', '[{"name": "customer_confirmed"}]');

    if (error) {
      console.error('Erreur lors de la récupération des liens acceptés', error);
      throw error;
    }

    console.log("Données reçues linking accepted:", data?.length || 0, 'liens acceptés');

    customerConfirmedCache = {
      data: data || [],
      timestamp: Date.now()
    };

    return data || [];
  } catch (error) {
    console.error('Erreur détaillée linking accepted:', error);
    throw error;
  }
};

export const subscribeToCustomerConfirmed = (
  setCustomerConfirmed: React.Dispatch<React.SetStateAction<Linking[]>>,
  onError?: (error: any) => void
): RealtimeChannel => {
  try {
    console.log("Subscribe to accepted linking");

    const refreshCustomerConfirmed = async () => {
      try {
        const linkings = await fetchLinkingCustomerConfirmed();
        setCustomerConfirmed(linkings);
      } catch (error) {
        console.error('Erreur lors du rafraîchissement:', error);
        if (onError) onError(error);
      }
    };

    const channel = supabaseClient
      .channel('customer-confirmed-linkings')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'linking'
      }, async (payload) => {
        console.log('Changement détecté:', payload.eventType, payload);
        await refreshCustomerConfirmed();
      })
      .subscribe((status) => {
        console.log('Statut de la subscription:', status);
        if (status === 'SUBSCRIBED') {
          console.log('Subscription réussie aux changements de liens acceptés');
          refreshCustomerConfirmed();
        }
        if (status === 'CLOSED') {
          console.log('Subscription annulée aux changements de liens acceptés');
        }
      });

    return channel;
  } catch (error) {
    console.error('Erreur dans customerConfirmedApi:', error);
    if (onError) {
      onError(error);
    }
    throw error;
  }
};

export const unsubscribeFromCustomerConfirmed = (channel: RealtimeChannel): void => {
  if (channel) {
    console.log('Désabonnement du canal customer confirmed linking');
    supabaseClient.removeChannel(channel);
  }
};

