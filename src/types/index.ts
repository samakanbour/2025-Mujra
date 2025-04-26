export type SystemStatus = 'Normal' | 'Warning' | 'Critical';
export type NodeType = 'Standard' | 'Flow' | 'Pressure' | 'Junction' | 'Pump';
export type CityType = 'dubai' | 'sharjah' | 'abudhabi' | 'ajman' | 'ummalquwain' | 'rasalkhaimah' | 'fujairah';

export interface SensorNode {
  id: string;
  position: [number, number];
  status: SystemStatus;
  type: NodeType;
  flowLevel?: number;
  riskValue?: number;
  pressure?: number;
  lastMaintenance?: string;
  city?: CityType;
}

export interface PipeConnection {
  id: string;
  startNode: string;
  endNode: string;
  status: SystemStatus;
  flowRate?: number;
  diameter?: number;
  material?: string;
  age?: number;
  city?: CityType;
}

export interface MapViewState {
  latitude: number;
  longitude: number;
  zoom: number;
} 