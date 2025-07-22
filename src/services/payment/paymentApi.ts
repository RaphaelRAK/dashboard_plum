import { PlumPayment } from "../../types/plumPayment";
import { supabaseClient } from "../../utility/supabaseClient"

// Récupérer tous les paiements
export const fetchAllPayments = async (): Promise<PlumPayment[]> => {
    try {
        const { data, error } = await supabaseClient
            .from('fliiinker_paiement_history')
            .select('*')
            .order('service_end_date', { ascending: true });

        if (error) {
            console.error("Erreur Supabase fetchAllPayments :", error);
            throw error;
        }
        return data || [];
    } catch (error) {
        console.error("Erreur fetchAllPayments :", error);
        throw error;
    }
};

// Récupérer les paiements par statut
export const fetchPaymentsByStatus = async (status: 'payment_pending' | 'blocked_by_claim' | 'paid'): Promise<PlumPayment[]> => {
    try {
        const { data, error } = await supabaseClient
            .from('fliiinker_paiement_history')
            .select('*')
            .eq('status', status)
            .order('service_end_date', { ascending: true });

        if (error) {
            console.error(`Erreur Supabase fetchPaymentsByStatus (${status}) :`, error);
            throw error;
        }
        return data || [];
    } catch (error) {
        console.error(`Erreur fetchPaymentsByStatus (${status}) :`, error);
        throw error;
    }
};

// Récupérer les paiements pour le lendemain
export const fetchPaymentsForNextDay = async (): Promise<PlumPayment[]> => {
    try {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const tomorrowStart = new Date(tomorrow.setHours(0, 0, 0, 0)).toISOString();
        const tomorrowEnd = new Date(tomorrow.setHours(23, 59, 59, 999)).toISOString();
        
        const { data, error } = await supabaseClient
            .from('fliiinker_paiement_history')
            .select('*')
            .eq('status', 'payment_pending')
            .gte('service_end_date', tomorrowStart)
            .lte('service_end_date', tomorrowEnd);

        if (error) {
            console.error("Erreur Supabase fetchPaymentsForNextDay :", error);
            throw error;
        }
        return data || [];
    } catch (error) {
        console.error("Erreur fetchPaymentsForNextDay :", error);
        throw error;
    }
};

// Mettre à jour le statut d'un paiement
export const updatePaymentStatus = async (paymentId: number, status: 'payment_pending' | 'blocked_by_claim' | 'paid'): Promise<void> => {
    try {
        const updateData: { status: string, date_payment?: string } = { status };
        
        // Si le statut est "paid", on met à jour la date de paiement
        if (status === 'paid') {
            updateData.date_payment = new Date().toISOString();
        }
        
        const { error } = await supabaseClient
            .from('fliiinker_paiement_history')
            .update(updateData)
            .eq('id', paymentId);

        if (error) {
            console.error("Erreur Supabase updatePaymentStatus :", error);
            throw error;
        }
    } catch (error) {
        console.error("Erreur updatePaymentStatus :", error);
        throw error;
    }
};

// Mettre à jour le statut de plusieurs paiements
export const updateMultiplePaymentsStatus = async (paymentIds: number[], status: 'payment_pending' | 'blocked_by_claim' | 'paid'): Promise<void> => {
    try {
        // Préparer les données à mettre à jour
        const updateData: { 
            status: string, 
            date_payment?: string | null
        } = { status };
        
        // Si le statut est "paid", on met à jour la date de paiement
        if (status === 'paid') {
            // Utiliser CURRENT_TIMESTAMP pour obtenir l'heure serveur PostgreSQL
            updateData.date_payment = new Date().toISOString();
            
            console.log(`Mise à jour des paiements ids=${paymentIds.join(',')} avec status=${status} et date_payment=${updateData.date_payment}`);
        } else if (status === 'payment_pending') {
            // Réinitialiser la date de paiement si on revient à "en attente"
            updateData.date_payment = null;
        }
        
        const { error } = await supabaseClient
            .from('fliiinker_paiement_history')
            .update(updateData)
            .in('id', paymentIds);

        if (error) {
            console.error("Erreur Supabase updateMultiplePaymentsStatus :", error);
            throw error;
        }
        
        console.log(`${paymentIds.length} paiement(s) mis à jour avec succès`);
    } catch (error) {
        console.error("Erreur updateMultiplePaymentsStatus :", error);
        throw error;
    }
};

// Fonctions existantes conservées pour la compatibilité
export const fetchPlumPaymentsByMounth = async (month: number, year: number): Promise<PlumPayment[]> => {
    try {
        const { data, error } = await supabaseClient
            .from('fliiinker_paiement_history')
            .select('*')
            .eq('prestation_month', month)
            .eq('prestation_year', year)
            .order('prestation_day', { ascending: true });

        if (error) {
            console.error("Erreur Supabase fetchPlumPaymentsByMounth :", error);
            throw error;
        }
        return data || [];
    } catch (error) {
        console.error("Erreur fetchPlumPaymentsByMounth :", error);
        throw error;
    }
};

export const updatePlumPaymentStatus = async (payementId: number, isPayed: boolean): Promise<void> => {
    try {
        const { error } = await supabaseClient
            .from('fliiinker_paiement_history')
            .update({ 
                is_payed: isPayed,
                status: isPayed ? 'paid' : 'payment_pending' 
            })
            .eq('id', payementId);

        if (error) {
            console.error("Erreur Supabase updatePlumPaymentStatus :", error);
            throw error;
        }
    } catch (error) {
        console.error("Erreur updatePlumPaymentStatus :", error);
        throw error;
    }
};
