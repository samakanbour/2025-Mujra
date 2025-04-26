export type SystemStatus = 'Normal' | 'Warning' | 'Critical';
export type NodeType = 'Standard' | 'Flow' | 'Pressure' | 'Junction' | 'Pump';

export interface SensorNode {
  id: string;
  position: [number, number];
  status: SystemStatus;
  type: NodeType;
  flowLevel?: number;
  riskValue?: number;
  pressure?: number;
  lastMaintenance?: string;
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
}

export interface MapViewState {
  latitude: number;
  longitude: number;
  zoom: number;
} 