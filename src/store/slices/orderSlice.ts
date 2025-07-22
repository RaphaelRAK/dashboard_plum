import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabaseClient } from '../../utility/supabaseClient';
import { Order } from '../../types/orderTypes';

// Déclaration de l'interface OrderState
interface OrderState {
  orders: { [key: string]: Order };
  filteredOrders: string[];
  searchTerm: string;
  selectedStatus: string | null;
  loading: boolean;
  error: string | null;
  lastFetch: number;
}

// Déclaration de l'état initial
const initialState: OrderState = {
  orders: {},
  filteredOrders: [],
  searchTerm: '',
  selectedStatus: null,
  loading: false,
  error: null,
  lastFetch: 0
};

// Création d'une action asynchrone pour récupérer toutes les commandes
export const fetchOrders = createAsyncThunk(
  'orders/fetch',
  async () => {
    console.group('🔍 [API Call] fetchOrders');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Appelé depuis:', new Error().stack?.split('\n')[2]);

    const { data, error } = await supabaseClient
      .from('order')
      .select(`
        *, 
        fliiinker_profile(*, public_profile(*)),
        customer:public_profile!customer_id(*),
        billing:billing(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erreur API fetchOrders:', error);
      console.groupEnd();
      throw error;
    }

    console.log('✅ Données reçues:', data?.length, 'commandes avec billing et customers');
    console.groupEnd();
    return data || [];
  }
);

// Création d'une action asynchrone pour récupérer une commande avec billing
export const fetchOrderWithBillingThunk = createAsyncThunk(
  'order/fetchWithBilling',
  async (orderId: string) => {
    console.group('🔍 [API Call] fetchOrderWithBillingThunk');
    console.log('Order ID:', orderId);
    console.log('Timestamp:', new Date().toISOString());
    console.log('Appelé depuis:', new Error().stack?.split('\n')[2]);

    const { data, error } = await supabaseClient
      .from('order')
      .select(`
        *,
        billing:billing(*)
      `)
      .eq('id', orderId)
      .single();

    if (error) {
      console.error('❌ Erreur API fetchOrderWithBillingThunk:', error);
      console.groupEnd();
      throw error;
    }

    console.log('✅ Données reçues pour la commande');
    console.groupEnd();
    return data;
  }
);

// Création d'une action asynchrone pour récupérer toutes les commandes avec leurs relations
export const fetchOrdersWithRelations = createAsyncThunk(
  'orders/fetchWithRelations',
  async () => {
    const [ordersResponse, customersResponse, fliinkersResponse] = await Promise.all([
      supabaseClient.from('order').select('*'),
      supabaseClient.from('public_profile').select('*').eq('is_fliiinker', false),
      supabaseClient.from('fliiinker_profile').select('*')
    ]);

    return {
      orders: ordersResponse.data || [],
      customers: customersResponse.data || [],
      fliiinkers: fliinkersResponse.data || []
    };
  }
);

// Création du slice pour les commandes
const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    setSearchTerm: (state, action) => {
      console.log('🔍 [Redux] Mise à jour du terme de recherche:', action.payload);
      state.searchTerm = action.payload;
      state.filteredOrders = filterOrders(state);
    },
    setSelectedStatus: (state, action) => {
      console.log('🔍 [Redux] Mise à jour du statut sélectionné:', action.payload);
      state.selectedStatus = action.payload;
      state.filteredOrders = filterOrders(state);
    }
  },
  // Ajout des extraReducers pour gérer les actions asynchrones
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => {
        console.log('⏳ [Redux] Début du chargement des commandes');
        state.loading = true;
      }) // Gestion du statut de chargement
      .addCase(fetchOrders.fulfilled, (state, action) => {
        console.log('✅ [Redux] Commandes chargées avec succès');
        if (action.payload) {
          state.orders = action.payload.reduce((acc, order) => {
            acc[order.id] = order;
            return acc;
          }, {});
          state.lastFetch = Date.now();
          state.filteredOrders = filterOrders(state);
        }
        state.loading = false;
      }) // Gestion de la réponse de l'action asynchrone
      .addCase(fetchOrders.rejected, (state, action) => {
        console.error('❌ [Redux] Échec du chargement des commandes:', action.error);
        state.loading = false;
        state.error = action.error.message || 'Une erreur est survenue';
      });
  },
});

const filterOrders = (state: OrderState): string[] => {
  return Object.values(state.orders)
    .filter(order => {
      const matchesStatus = !state.selectedStatus || 
                          order.status === state.selectedStatus;
      const searchLower = state.searchTerm.toLowerCase();
      const matchesSearch = order.id.toString().includes(searchLower) ||
        order.fliiinker_profile?.public_profile?.first_name
          ?.toLowerCase().includes(searchLower) ||
        order.fliiinker_profile?.public_profile?.last_name
          ?.toLowerCase().includes(searchLower);

      return matchesStatus && matchesSearch;
    })
    .map(order => order.id);
};

export const { setSearchTerm, setSelectedStatus } = orderSlice.actions;
export default orderSlice.reducer; 