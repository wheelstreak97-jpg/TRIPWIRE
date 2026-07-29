export interface Notification {
  id: string;
  organization_id: string;
  subscription_id: string | null;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}
