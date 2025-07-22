export interface PlumPayment {
    id: number;
    fliiinker_id: string;
    order_id: number;
    date_order: string;
    amount_earned: number;
    is_payed: boolean;
    date_payment: string | null;
    prestation_day: number | null;
    prestation_month: number | null;
    prestation_year: number | null;
    service_name: string | null;
    status: string | null;
    service_end_date: string | null;
    is_finished: boolean | null;
  }