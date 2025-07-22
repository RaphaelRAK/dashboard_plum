export interface Meeting {
    id: string;
    created_at: string;
    is_free: boolean;
    timezone: string;
    date_to_call: string | null;
    hour_to_call: string | null;
    is_finish: boolean;
  }