import { StationDestination } from './data';

export interface Train {
  number: string;
  name: string;
  platform: string;
  departureTime: string;
  coachPosition: string[];
  delayStatus: {
    delayed: boolean;
    minutes?: number;
  };
  crowdLevel: 'Low' | 'Medium' | 'Heavy';
  nearbyFacilities: {
    icon: string;
    label: string;
    distance: string;
  }[];
  nearestLift: string;
  nearestEscalator: string;
  nearestExit: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

export interface AppNotification {
  id: string;
  type: 'platform' | 'delay' | 'route' | 'crowd' | 'announcement';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export interface AccessibilitySettings {
  largeText: boolean;
  highContrast: boolean;
  wheelchairFriendly: boolean;
  voiceGuidance: boolean;
  language: string;
}

export interface UserProfile {
  name: string;
  phone: string;
  avatar: string;
  savedRoutes: {
    from: string;
    to: string;
    station: string;
  }[];
}

export interface StationFloor {
  id: string;
  level: string;
  label: string;
}

export interface Facility extends StationDestination {
  id: string;
  stationId: string;
  floorId: string;
  accessible: boolean;
}

export interface RouteStep {
  instruction: string;
  distanceMeters: number;
  floor: string;
  kind: 'walk' | 'lift' | 'escalator' | 'stairs' | 'arrive';
}

export interface RouteResponse {
  stationId: string;
  from: string;
  to: string;
  distanceMeters: number;
  steps: RouteStep[];
  geometry: { x: number; y: number; floor: string }[];
}
