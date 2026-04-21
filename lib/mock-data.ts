export const vehicles = [
  {
    id: '1',
    equipment_name: 'Service Truck',
    unit_number: '17',
    current_mileage: 82450,
    current_hours: null,
    next_oil_change: 85000
  },
  {
    id: '2',
    equipment_name: 'Skid Steer',
    unit_number: '204',
    current_mileage: null,
    current_hours: 1420,
    next_oil_change: null
  }
];

export const reports = [
  {
    id: '101',
    vehicle_id: '1',
    type: 'Repair',
    title: 'Hydraulic leak on left rear',
    description: 'Leak under rear axle after running for 20 minutes.',
    status: 'Open',
    submitted_at: '2026-04-18',
    closed_at: null
  },
  {
    id: '102',
    vehicle_id: '1',
    type: 'Service',
    title: 'Oil change due soon',
    description: 'Sticker says due this week.',
    status: 'In Progress',
    submitted_at: '2026-04-16',
    closed_at: null
  }
];
