export interface Claim {
  claim_id: number; 
  claim_slug: string; 
  order_id: number; 
  user_id: string; 
  description: string; 
  status: 'OPEN_UNPROCESSED' | 'CLOSED' | 'IN_PROGRESS'; 
  created_at: string; 
  updated_at: string; 
  closed_at?: string | null; 
  channel_id?: number | null; 
}