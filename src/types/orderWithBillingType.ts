// Interface pour la table billing
interface Billing {
    id: number;
    created_at: string;
    total_amount: number;
    fees: number;
    fliiinker_rate: number;
    order_id: number;
    payment_status: string;
    payment_events: any[]; // Remplacez par un type plus spécifique si possible
  }
  
  // Interface pour la table order
  interface Order {
    id: number;
    created_at: string;
    start_date: string;
    end_date: string;
    status: string;
    service_id: number;
    channel_id: number | null;
    customer_id: string;
    fliiinker_id: string;
    events: any[]; // Remplacez par un type plus spécifique si possible
  }
  
  // Interface combinée pour Order avec Billing
  export interface OrderWithBilling extends Order {
    billing: Billing | null;
  }
  