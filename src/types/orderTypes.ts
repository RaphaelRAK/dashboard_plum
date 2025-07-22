import { FliiinkerProfile } from "./fliiinkerProfileTypes";
import { Public_profile } from "./public_profileTypes";
import { Service } from "./serviceTypes";

export type OrderStatus =
  | "created"
  | "payment_confirmed"
  | "awaiting_start"
  | "fliiinker_on_the_way"
  | "service_started"
  | "service_start_confirmed"
  | "service_completed_before_due_date"
  | "customer_confirmed_ending"
  | "service_completed"
  | "cancelled";

export interface Order {
  billing: any;
  id: string;
  created_at: string;
  start_date: string;
  end_date: string;
  status: OrderStatus;
  service_id: string;
  channel_id?: string | null;
  customer_id: string;
  customer?: Public_profile; // Relation avec le customer
  fliiinker_id: string;
  fliiinker_profile: FliiinkerProfile;
  public_profile: Public_profile;   
  service: Service;
  events?: any[];
}
