export interface StationDestination {
  label: string;
  x: number;
  y: number;
  details: string;
  floor: string;
  type: string;
  crowd: 'Low' | 'Medium' | 'Heavy';
  keywords: string[];
}

export const STATION_DESTINATIONS: StationDestination[] = [
  // Ground Floor
  { x: 260, y: 120, label: 'Platform 5', details: 'NDLS Shatabdi Exp arriving', floor: 'GF', type: 'platforms', crowd: 'Medium', keywords: ['platform 5', 'shatabdi', 'ndls', 'train 5'] },
  { x: 100, y: 120, label: 'Platform 4', details: 'Rajdhani Exp Departing', floor: 'GF', type: 'platforms', crowd: 'Low', keywords: ['platform 4', 'rajdhani', 'train 4'] },
  { x: 180, y: 220, label: 'Restroom Block A', details: 'Clean toilets, Disabled-friendly', floor: 'GF', type: 'restrooms', crowd: 'Low', keywords: ['restroom', 'washroom', 'toilet', 'bathroom', 'restroom block a', 'washrooms', 'restrooms', 'toilets'] },
  { x: 60, y: 260, label: 'Ticket Counter North', details: '8 windows open', floor: 'GF', type: 'waiting', crowd: 'Heavy', keywords: ['ticket', 'booking', 'counter', 'ticket counter north'] },
  { x: 210, y: 160, label: 'Glass Lift A', details: 'Wheelchair access, Level GF to FF', floor: 'GF', type: 'elevators', crowd: 'Low', keywords: ['lift', 'elevator', 'glass lift a'] },
  { x: 310, y: 240, label: 'State Bank ATM', details: 'Cash Available', floor: 'GF', type: 'atms', crowd: 'Low', keywords: ['atm', 'cash', 'money', 'state bank atm', 'sbi'] },
  { x: 150, y: 320, label: 'General Waiting Room', details: 'AC waiting facilities, 200 seats', floor: 'GF', type: 'waiting', crowd: 'Medium', keywords: ['waiting room', 'lounge', 'waiting hall', 'general waiting room'] },

  // First Floor
  { x: 120, y: 160, label: 'IRCTC Food Court', details: 'Dominos, Haldirams, Coffee Kiosks', floor: 'FF', type: 'food', crowd: 'Heavy', keywords: ['food', 'restaurant', 'canteen', 'irctc food court', 'eat', 'coffee', 'dominos', 'haldirams', 'cafe'] },
  { x: 220, y: 220, label: 'Executive VIP Lounge', details: 'Sofa seating, refreshments', floor: 'FF', type: 'waiting', crowd: 'Low', keywords: ['vip', 'executive', 'executive vip lounge', 'lounge'] },
  { x: 300, y: 140, label: 'Charging Point Station B', details: '6 USB power docks, multi-pin', floor: 'FF', type: 'charging', crowd: 'Medium', keywords: ['charge', 'charging', 'charging point', 'usb', 'power', 'charging point station b'] },
  { x: 80, y: 100, label: 'Platform 6 Stairs', details: 'Stairs & Escalator down', floor: 'FF', type: 'escalators', crowd: 'Heavy', keywords: ['stair', 'stairs', 'escalator', 'platform 6 stairs'] },
  { x: 160, y: 280, label: 'Water Purifier Station', details: 'Free cold RO water', floor: 'FF', type: 'water', crowd: 'Medium', keywords: ['water', 'drinking water', 'purifier', 'ro water', 'water purifier station'] },

  // Second Floor
  { x: 150, y: 150, label: 'Railway Police Office', details: 'RPF Booth, Help 24/7', floor: 'SF', type: 'waiting', crowd: 'Low', keywords: ['police', 'rpf', 'security', 'cop', 'help desk', 'railway police office'] },
  { x: 250, y: 200, label: 'Resting Dormitories', details: 'AC & Non-AC sleeping berths', floor: 'SF', type: 'waiting', crowd: 'Low', keywords: ['dormitory', 'dormitories', 'rest', 'sleeping', 'resting dormitories', 'bed'] },
  { x: 100, y: 240, label: 'Lost & Found Center', details: 'Claim missing baggage here', floor: 'SF', type: 'waiting', crowd: 'Low', keywords: ['lost', 'found', 'missing', 'lost & found center', 'baggage'] }
];
