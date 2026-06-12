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
  date_creation: string;
  date_mod: string;
  date_close: string | null;
  date_solve: string | null;
}

export interface TicketCost {
  id: number;
  num_ticket: number;
  name: string;
  duration_second: number;
  time_cost: number;
  fixed_cost: number;
  cost_material: number;
  begin_date: string | null;
  end_date: string | null;
}
