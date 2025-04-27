import { SensorNode, PipeConnection, SystemStatus, NodeType } from '../types';
import { 
  calculateNodeRisk, 
  randomPositionNear, 
  findNearestNodes, 
  generateMaintenanceDate 
} from './networkUtils';

// Replace NodeData with reference to SensorNode
export interface NetworkData {
  nodes: SensorNode[];
  connections: PipeConnection[];
}

const generateNodeName = (type: string, index: number): string => {
  return `${type}-${index.toString().padStart(3, '0')}`;
};

const generateConnectionName = (index: number): string => {
  return `Pipe-${index.toString().padStart(3, '0')}`;
};

const generateInstallDate = (): string => {
  const currentYear = new Date().getFullYear();
  const minYear = currentYear - 50; // Pipes installed up to 50 years ago
  const year = Math.floor(Math.random() * (currentYear - minYear + 1)) + minYear;
  const month = Math.floor(Math.random() * 12) + 1;
  const day = Math.floor(Math.random() * 28) + 1; // Avoid invalid dates
  
  return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
};

const generateStatus = (isCritical: boolean = false): SystemStatus => {
  if (isCritical) {
    // Higher chance of warning/critical for critical areas
    const rand = Math.random();
    if (rand < 0.4) return 'Critical';
    if (rand < 0.7) return 'Warning';
    return 'Normal';
  } else {
    // Normal distribution
    const rand = Math.random();
    if (rand < 0.1) return 'Critical';
    if (rand < 0.25) return 'Warning';
    return 'Normal';
  }
};

const generateNodeType = (): NodeType => {
  const rand = Math.random();
  if (rand < 0.15) return 'Pump';
  if (rand < 0.35) return 'Flow';
  if (rand < 0.55) return 'Pressure';
  if (rand < 0.75) return 'Junction';
  return 'Standard';
};

const generatePipeMaterial = (): string => {
  const materials = ['PVC', 'Steel', 'Iron', 'Concrete'];
  const rand = Math.random();
  if (rand < 0.4) return materials[0];
  if (rand < 0.7) return materials[1];
  if (rand < 0.9) return materials[2];
  return materials[3];
};

export const generateNetworkData = (
  centerLat: number = 24.5227, // Default to Abu Dhabi
  centerLng: number = 54.4368,
  nodeCount: number = 50,
  connectionDensity: number = 0.15, // 0-1 value, higher means more connections
  criticalAreaProbability: number = 0.2 // Probability of generating a critical area
): NetworkData => {
  const nodes: SensorNode[] = [];
  const connections: PipeConnection[] = [];
  
  // Generate critical areas (if any)
  const criticalAreas: Array<{center: [number, number], radius: number}> = [];
  const criticalAreasCount = Math.floor(criticalAreaProbability * nodeCount / 10);
  
  for (let i = 0; i < criticalAreasCount; i++) {
    const criticalCenter = randomPositionNear([centerLng, centerLat], 10);
    criticalAreas.push({
      center: criticalCenter,
      radius: 1 + Math.random() * 2 // 1-3km radius
    });
  }
  
  // Generate nodes
  for (let i = 0; i < nodeCount; i++) {
    const position = randomPositionNear([centerLng, centerLat], 10);
    
    // Check if node is in a critical area
    const inCriticalArea = criticalAreas.some(area => {
      const distance = Math.sqrt(
        Math.pow(position[0] - area.center[0], 2) + 
        Math.pow(position[1] - area.center[1], 2)
      );
      return distance <= area.radius;
    });
    
    const nodeType = generateNodeType();
    const status = generateStatus(inCriticalArea);
    
    const node: SensorNode = {
      id: `node-${i}`,
      position,
      type: nodeType,
      status,
      lastMaintenance: generateMaintenanceDate()
    };
    
    // Add type-specific metrics
    if (nodeType === 'Flow' || nodeType === 'Pump') {
      node.flowLevel = 20 + Math.random() * 80; // 20-100
    }
    
    if (nodeType === 'Pressure') {
      node.pressure = 25 + Math.random() * 75; // 25-100 psi
    }
    
    nodes.push(node);
  }
  
  // Generate connections
  for (let i = 0; i < nodes.length; i++) {
    const startNode = nodes[i];
    
    // Determine number of connections for this node
    const maxConnections = Math.max(1, Math.floor(nodes.length * connectionDensity / 2));
    const connectionsCount = Math.min(
      Math.max(1, Math.floor(Math.random() * maxConnections)),
      5 // Cap at 5 connections per node to avoid overconnected network
    );
    
    // Find nearest nodes to connect to
    const nearestNodes = findNearestNodes(
      startNode.position[0],
      startNode.position[1],
      nodes,
      connectionsCount + 3, // Get more than needed to have some variety
      [startNode.id] // Exclude self
    );
    
    // Randomly select from nearest nodes
    const nodesToConnect = [];
    for (let j = 0; j < connectionsCount && j < nearestNodes.length; j++) {
      const randomIndex = Math.floor(Math.random() * nearestNodes.length);
      nodesToConnect.push(nearestNodes[randomIndex]);
      nearestNodes.splice(randomIndex, 1);
    }
    
    // Create connections
    for (let j = 0; j < nodesToConnect.length; j++) {
      const endNode = nodesToConnect[j];
      
      // Check if connection already exists
      const connectionExists = connections.some(conn => 
        (conn.startNode === startNode.id && conn.endNode === endNode.id) ||
        (conn.startNode === endNode.id && conn.endNode === startNode.id)
      );
      
      if (!connectionExists) {
        // Calculate length as distance between nodes
        const length = Math.sqrt(
          Math.pow(startNode.position[0] - endNode.position[0], 2) +
          Math.pow(startNode.position[1] - endNode.position[1], 2)
        ) * 100; // Convert to approximate meters
        
        const connection: PipeConnection = {
          id: `connection-${connections.length}`,
          startNode: startNode.id,
          endNode: endNode.id,
          status: generateStatus(false),
          flowRate: 10 + Math.random() * 90, // 10-100
          diameter: 100 + Math.floor(Math.random() * 900), // 100-1000mm
          material: generatePipeMaterial(),
          age: Math.floor(Math.random() * 50) // 0-50 years
        };
        
        connections.push(connection);
      }
    }
  }
  
  // Update node statuses based on calculated risks
  nodes.forEach(node => {
    // Skip nodes that are already critical
    if (node.status !== 'Critical') {
      // Find connections for this node
      const nodeConnections = connections.filter(conn => 
        conn.startNode === node.id || conn.endNode === node.id
      );
      
      const connectedNodes = nodes.filter(n => 
        nodeConnections.some(c => c.startNode === n.id || c.endNode === n.id)
      );
      
      const risk = calculateNodeRisk(node, nodeConnections, connectedNodes);
      node.riskValue = risk;
      
      // Update status based on calculated risk
      if (risk > 0.7) {
        node.status = 'Critical';
      } else if (risk > 0.4) {
        node.status = 'Warning';
      }
    }
  });
  
  return { nodes, connections };
};

/**
 * Generate a small sample network for testing
 */
export const generateSampleNetwork = (): NetworkData => {
  return generateNetworkData(24.5227, 54.4368, 30, 0.2);
};

/**
 * Generate a timeline of events for the network
 */
export interface NetworkEvent {
  id: string;
  timestamp: string;
  nodeId?: string;
  connectionId?: string;
  type: SystemStatus | 'Maintenance';
  description: string;
}

export const generateNetworkEvents = (
  network: NetworkData,
  count: number = 20,
  daysBack: number = 7
): NetworkEvent[] => {
  const events: NetworkEvent[] = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    // Random time within the last X days
    const timestamp = new Date(
      now.getTime() - Math.random() * daysBack * 24 * 60 * 60 * 1000
    ).toISOString();
    
    // Decide if this is a node or connection event
    const isNodeEvent = Math.random() < 0.6;
    
    if (isNodeEvent && network.nodes.length > 0) {
      // Get a random node, preferring ones with non-normal status
      const criticalNodes = network.nodes.filter(n => n.status === 'Critical');
      const warningNodes = network.nodes.filter(n => n.status === 'Warning');
      
      let node;
      if (criticalNodes.length > 0 && Math.random() < 0.5) {
        node = criticalNodes[Math.floor(Math.random() * criticalNodes.length)];
      } else if (warningNodes.length > 0 && Math.random() < 0.3) {
        node = warningNodes[Math.floor(Math.random() * warningNodes.length)];
      } else {
        node = network.nodes[Math.floor(Math.random() * network.nodes.length)];
      }
      
      // Generate event type based on node status
      let eventType: SystemStatus | 'Maintenance';
      if (node.status === 'Critical') {
        eventType = Math.random() < 0.7 ? 'Critical' : 'Warning';
      } else if (node.status === 'Warning') {
        eventType = Math.random() < 0.2 ? 'Critical' : 'Warning';
      } else {
        eventType = Math.random() < 0.7 ? 'Maintenance' : 'Normal';
      }
      
      // Generate description
      let description = '';
      switch (eventType) {
        case 'Critical':
          description = [
            `${node.id} experiencing critical pressure drop`,
            `${node.id} water quality below threshold`,
            `${node.id} system failure detected`,
            `Emergency shutdown required at ${node.id}`
          ][Math.floor(Math.random() * 4)];
          break;
        case 'Warning':
          description = [
            `${node.id} pressure fluctuation detected`,
            `${node.id} requires inspection`,
            `Minor anomaly detected at ${node.id}`,
            `Scheduled maintenance recommended for ${node.id}`
          ][Math.floor(Math.random() * 4)];
          break;
        case 'Maintenance':
          description = [
            `Routine maintenance performed on ${node.id}`,
            `${node.id} preventive check completed`,
            `System update at ${node.id}`,
            `Calibration of sensors at ${node.id}`
          ][Math.floor(Math.random() * 4)];
          break;
        case 'Normal':
          description = [
            `${node.id} operating within normal parameters`,
            `Confirmation of system stability at ${node.id}`,
            `Flow rate verification at ${node.id}`,
            `Quality check passed at ${node.id}`
          ][Math.floor(Math.random() * 4)];
          break;
      }
      
      events.push({
        id: `event-${i}`,
        timestamp,
        nodeId: node.id,
        type: eventType,
        description
      });
    } else if (network.connections.length > 0) {
      // Connection event
      const criticalConnections = network.connections.filter(c => c.status === 'Critical');
      const warningConnections = network.connections.filter(c => c.status === 'Warning');
      
      let connection;
      if (criticalConnections.length > 0 && Math.random() < 0.5) {
        connection = criticalConnections[Math.floor(Math.random() * criticalConnections.length)];
      } else if (warningConnections.length > 0 && Math.random() < 0.3) {
        connection = warningConnections[Math.floor(Math.random() * warningConnections.length)];
      } else {
        connection = network.connections[Math.floor(Math.random() * network.connections.length)];
      }
      
      // Generate event type based on connection status
      let eventType: SystemStatus | 'Maintenance';
      if (connection.status === 'Critical') {
        eventType = Math.random() < 0.7 ? 'Critical' : 'Warning';
      } else if (connection.status === 'Warning') {
        eventType = Math.random() < 0.2 ? 'Critical' : 'Warning';
      } else {
        eventType = Math.random() < 0.7 ? 'Maintenance' : 'Normal';
      }
      
      // Generate description
      let description = '';
      switch (eventType) {
        case 'Critical':
          description = [
            `Leak detected in connection ${connection.id}`,
            `Connection ${connection.id} flow obstruction detected`,
            `Critical pressure failure in connection ${connection.id}`,
            `Connection ${connection.id} requires emergency repair`
          ][Math.floor(Math.random() * 4)];
          break;
        case 'Warning':
          description = [
            `Connection ${connection.id} showing signs of wear`,
            `Flow inconsistency in connection ${connection.id}`,
            `Pressure fluctuation in connection ${connection.id}`,
            `Connection ${connection.id} approaching maintenance threshold`
          ][Math.floor(Math.random() * 4)];
          break;
        case 'Maintenance':
          description = [
            `Routine inspection of connection ${connection.id} completed`,
            `Connection ${connection.id} flushing procedure performed`,
            `Preventive maintenance on connection ${connection.id}`,
            `Flow calibration for connection ${connection.id}`
          ][Math.floor(Math.random() * 4)];
          break;
        case 'Normal':
          description = [
            `Connection ${connection.id} operating within parameters`,
            `Flow verification completed for connection ${connection.id}`,
            `Connection ${connection.id} pressure test passed`,
            `Connection ${connection.id} inspection passed`
          ][Math.floor(Math.random() * 4)];
          break;
      }
      
      events.push({
        id: `event-${i}`,
        timestamp,
        connectionId: connection.id,
        type: eventType,
        description
      });
    }
  }
  
  // Sort events by timestamp
  return events.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}; 