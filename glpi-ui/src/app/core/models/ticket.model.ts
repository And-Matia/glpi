export interface Ticket {
  id: number;
  ref_ticket: number;
  date: string;
  heure: string;
  type: number;
  titre: string;
  description: string;
  status: number;
  priority: number;
  items: string[];
}
