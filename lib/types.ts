export type Role = 'admin' | 'mechanic' | 'employee';

export type Profile = {
  id: string;
  full_name: string | null;
  role: Role;
};

export type Vehicle = {
  id: string;
  equipment_name: string;
  unit_number: string | null;
  current_mileage: number | null;
  current_hours: number | null;
  next_oil_change: number | null;
  created_at: string;
};

export type Report = {
  id: string;
  vehicle_id: string;
  report_type: 'Service' | 'Repair' | 'Note';
  title: string;
  description: string | null;
  status: 'Open' | 'In Progress' | 'Closed';
  submitted_mileage: number | null;
  submitted_hours: number | null;
  closed_mileage: number | null;
  closed_hours: number | null;
  closing_notes: string | null;
  next_oil_change_at_close: number | null;
  submitted_at: string;
  closed_at: string | null;
  created_by_name: string | null;
};
