import { SensorNode, PipeConnection, SystemStatus } from '../types';

/**
 * Calculate haversine distance between two points in km
 */
export const calculateDistance = (
  lon1: number, 
  lat1: number, 
  lon2: number, 
  lat2: number
): number => {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

/**
 * Find the n nearest nodes to a given point
 */
export const findNearestNodes = (
  lon: number,
  lat: number,
  nodes: SensorNode[],
  n: number = 1,
  excludeIds: string[] = []
): SensorNode[] => {
  const distances = nodes
    .filter(node => !excludeIds.includes(node.id))
    .map(node => ({
      node,
      distance: calculateDistance(lon, lat, node.position[0], node.position[1])
    }))
    .sort((a, b) => a.distance - b.distance);
  
  return distances.slice(0, n).map(d => d.node);
};

/**
 * Generate a random position [longitude, latitude] near a center point
 * @param center Center point as [longitude, latitude]
 * @param radiusKm Radius in kilometers
 * @returns Random position near the center
 */
export const randomPositionNear = (center: [number, number], radiusKm: number): [number, number] => {
  // Earth's radius in kilometers
  const earthRadius = 6371;
  
  // Convert radius from kilometers to radians
  const radiusRad = radiusKm / earthRadius;
  
  // Generate a random distance within the radius
  // Using square root to distribute points evenly across the circle area
  const randomDistance = radiusRad * Math.sqrt(Math.random());
  
  // Generate a random angle in radians
  const randomAngle = Math.random() * 2 * Math.PI;
  
  // Convert center from degrees to radians
  const centerLngRad = center[0] * Math.PI / 180;
  const centerLatRad = center[1] * Math.PI / 180;
  
  // Calculate new position
  // Simplified formula for small distances
  const newLatRad = centerLatRad + randomDistance * Math.cos(randomAngle);
  const newLngRad = centerLngRad + randomDistance * Math.sin(randomAngle) / Math.cos(centerLatRad);
  
  // Convert back to degrees
  const newLat = newLatRad * 180 / Math.PI;
  const newLng = newLngRad * 180 / Math.PI;
  
  return [newLng, newLat];
};

/**
 * Find the nearest connection to a point
 */
export const findNearestConnection = (
  lon: number,
  lat: number,
  connections: PipeConnection[],
  nodes: SensorNode[]
): PipeConnection | null => {
  // Create a map for quick node lookup
  const nodeMap = new Map<string, SensorNode>();
  nodes.forEach(node => nodeMap.set(node.id, node));
  
  let nearestConnection: PipeConnection | null = null;
  let minDistance = Infinity;
  
  connections.forEach(conn => {
    const startNode = nodeMap.get(conn.startNode);
    const endNode = nodeMap.get(conn.endNode);
    
    if (!startNode || !endNode) return;
    
    // Calculate distance to line segment
    const distance = distanceToLineSegment(
      lon, lat,
      startNode.position[0], startNode.position[1],
      endNode.position[0], endNode.position[1]
    );
    
    if (distance < minDistance) {
      minDistance = distance;
      nearestConnection = conn;
    }
  });
  
  return nearestConnection;
};

/**
 * Calculate the shortest distance from a point to a line segment
 */
const distanceToLineSegment = (
  px: number, py: number,
  x1: number, y1: number,
  x2: number, y2: number
): number => {
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;
  
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;
  
  if (lenSq !== 0) param = dot / lenSq;
  
  let xx, yy;
  
  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }
  
  const dx = px - xx;
  const dy = py - yy;
  
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Calculate risk level based on node properties and connection status
 * @returns A risk score between 0 (lowest) and 1 (highest)
 */
export const calculateNodeRisk = (
  node: SensorNode,
  connections: PipeConnection[],
  nodes: SensorNode[]
): number => {
  let risk = 0;
  
  // Base risk from status
  switch (node.status) {
    case 'Normal': 
      risk += 0.1;
      break;
    case 'Warning':
      risk += 0.5;
      break;
    case 'Critical':
      risk += 0.9;
      break;
  }
  
  // Risk from node type
  if (node.type === 'Pump') {
    risk += 0.2; // Pumps are critical infrastructure
  } else if (node.type === 'Junction') {
    const connectedCount = connections.filter(
      c => c.startNode === node.id || c.endNode === node.id
    ).length;
    
    // Higher risk for junctions with many connections
    risk += Math.min(0.2, connectedCount * 0.05);
  }
  
  // Risk from neighboring critical nodes
  const connectedNodeIds = connections
    .filter(c => c.startNode === node.id || c.endNode === node.id)
    .map(c => c.startNode === node.id ? c.endNode : c.startNode);
  
  const connectedNodes = nodes.filter(n => connectedNodeIds.includes(n.id));
  const criticalConnectedCount = connectedNodes.filter(n => n.status === 'Critical').length;
  
  risk += criticalConnectedCount * 0.15;
  
  // Cap risk at 1
  return Math.min(1, risk);
};

/**
 * Get risk classification based on risk score
 */
export const getRiskClassification = (riskScore: number): SystemStatus => {
  if (riskScore >= 0.7) return 'Critical';
  if (riskScore >= 0.3) return 'Warning';
  return 'Normal';
};

/**
 * Generate a random maintenance date within the past 2 years
 */
export const generateMaintenanceDate = (): string => {
  const now = new Date();
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(now.getFullYear() - 2);
  
  // Random date between now and two years ago
  const randomTime = twoYearsAgo.getTime() + Math.random() * (now.getTime() - twoYearsAgo.getTime());
  const randomDate = new Date(randomTime);
  
  return randomDate.toISOString().split('T')[0]; // YYYY-MM-DD format
};

/**
 * Calculate system flow metrics based on current network state
 */
export const calculateSystemMetrics = (
  nodes: SensorNode[],
  connections: PipeConnection[]
) => {
  // Count node types
  const pumpCount = nodes.filter(n => n.type === 'Pump').length;
  const junctionCount = nodes.filter(n => n.type === 'Junction').length;
  const flowCount = nodes.filter(n => n.type === 'Flow').length;
  const pressureCount = nodes.filter(n => n.type === 'Pressure').length;
  
  // Count status types
  const criticalCount = nodes.filter(n => n.status === 'Critical').length;
  const warningCount = nodes.filter(n => n.status === 'Warning').length;
  const normalCount = nodes.filter(n => n.status === 'Normal').length;
  
  // Calculate flow volume
  const totalFlowCapacity = connections.reduce((acc, conn) => {
    const diameter = conn.diameter || 0.3;
    return acc + (diameter * diameter * Math.PI * 0.25); // Area of pipe in m²
  }, 0);
  
  // Health percentage
  const healthScore = ((normalCount * 100) + (warningCount * 40)) / nodes.length;
  
  return {
    nodeCount: nodes.length,
    connectionCount: connections.length,
    pumpCount,
    junctionCount,
    flowCount,
    pressureCount,
    criticalCount,
    warningCount,
    normalCount,
    totalFlowCapacity: totalFlowCapacity.toFixed(2),
    healthScore: healthScore.toFixed(1),
    averageNodeConnections: (connections.length * 2 / nodes.length).toFixed(2)
  };
};

/**
 * Calculate the color for a node or connection based on its status
 */
export const getStatusColor = (status: 'Normal' | 'Warning' | 'Critical'): string => {
  switch (status) {
    case 'Critical':
      return '#FF3B30'; // Red
    case 'Warning':
      return '#FF9500'; // Orange
    case 'Normal':
      return '#34C759'; // Green
    default:
      return '#8E8E93'; // Gray
  }
};

/**
 * Format a number with appropriate units
 */
export const formatMetric = (value: number, type: 'pressure' | 'flow' | 'quality' | 'length' | 'diameter'): string => {
  if (value === undefined || value === null) return 'N/A';
  
  switch (type) {
    case 'pressure':
      return `${value.toFixed(1)} kPa`;
    case 'flow':
      return `${value.toFixed(1)} L/s`;
    case 'quality':
      return `${value.toFixed(0)}%`;
    case 'length':
      return value < 1 ? `${(value * 1000).toFixed(0)} m` : `${value.toFixed(2)} km`;
    case 'diameter':
      return `${value} mm`;
    default:
      return value.toString();
  }
};

/**
 * Calculate the flow rate color based on the value
 */
export const getFlowRateColor = (flow: number): string => {
  if (flow < 3) return '#FF3B30'; // Red for very low flow
  if (flow < 7) return '#FF9500'; // Orange for low flow
  if (flow > 15) return '#5AC8FA'; // Blue for high flow
  return '#34C759'; // Green for normal flow
};

/**
 * Calculate risk level as a string
 */
export const getRiskLevel = (risk: number): 'Low' | 'Medium' | 'High' | 'Critical' => {
  if (risk < 0.3) return 'Low';
  if (risk < 0.6) return 'Medium';
  if (risk < 0.8) return 'High';
  return 'Critical';
};

/**
 * Get appropriate icon for a node type
 */
export const getNodeIcon = (type: string): string => {
  switch (type) {
    case 'Pump':
      return 'pump';
    case 'Reservoir':
      return 'water';
    case 'Junction':
      return 'hub';
    case 'Valve':
      return 'valve';
    case 'Facility':
      return 'building';
    default:
      return 'circle';
  }
}; 