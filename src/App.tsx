import { useState, useEffect, createContext, useContext } from 'react';
import { GlobalStyle, colors } from './styles/global';
import { SystemStatus, NodeType } from './types';
import styled from '@emotion/styled';
import { Global } from '@emotion/react';
import { motion, AnimatePresence } from 'framer-motion';
import { CollapsibleMap } from './components/CollapsibleMap';
import RiskOverview from './components/RiskOverview';
import { SensorNode, PipeConnection } from './types';
import 'mapbox-gl/dist/mapbox-gl.css';

// Create a context for the map state
export const MapContext = createContext({
  isMapExpanded: false,
  setMapExpanded: (_value: boolean) => {}
});

const AppContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
  position: relative;
`;

const Navbar = styled.nav`
  background-color: #eeece6;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
`;

const Logo = styled.img`
  height: 50px;
  width: auto;
  object-fit: contain;
`;

const Title = styled.h1`
  color: #72411d;
  font-size: 2rem;
  margin: 0;
`;

const StatusBar = styled.div<{ status: SystemStatus }>`
  background-color: ${props => 
    props.status === 'Normal' ? colors.statusGood :
    props.status === 'Warning' ? colors.statusWarning :
    colors.statusCritical
  };
  color: white;
  padding: 0.5rem;
  text-align: center;
  font-weight: bold;
  position: relative;
  z-index: 20;
`;

const SystemStatusBar = styled.div<{ status: SystemStatus }>`
  background-color: ${props => 
    props.status === 'Normal' ? colors.statusGood :
    props.status === 'Warning' ? colors.statusWarning :
    colors.statusCritical
  };
  color: white;
  padding: 0.7rem;
  text-align: center;
  font-weight: bold;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 1rem auto;
  border-radius: 8px;
  width: 90%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const RainfallAlert = styled(motion.div)`
  position: fixed;
  inset: 0; /* top:0, bottom:0, left:0, right:0 */
  margin: auto;
  min-width: 340px;
  max-width: 40vw;
  height: fit-content;
  background: rgba(255, 255, 255, 0.95);
  border-left: 8px solid ${colors.statusWarning};
  box-shadow: 0 12px 40px 0 rgba(0,0,0,0.35), 0 1.5px 8px 0 rgba(0,0,0,0.10);
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 28px 36px 28px 28px;
  z-index: 9999;
  font-size: 1.25rem;
  font-weight: 700;
  color: ${colors.statusCritical};
  letter-spacing: 0.01em;
  pointer-events: none;
  gap: 18px;
  text-align: center;
`;

const OptimizationAlert = styled(motion.div)`
  position: fixed;
  inset: 0; /* top:0, bottom:0, left:0, right:0 */
  margin: auto;
  min-width: 340px;
  max-width: 40vw;
  height: fit-content;
  background: rgba(255, 255, 255, 0.95);
  border-left: 8px solid ${colors.statusGood};
  box-shadow: 0 12px 40px 0 rgba(0,0,0,0.35), 0 1.5px 8px 0 rgba(0,0,0,0.10);
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 28px 36px 28px 28px;
  z-index: 9999;
  font-size: 1.25rem;
  font-weight: 700;
  color: ${colors.statusGood};
  letter-spacing: 0.01em;
  pointer-events: none;
  gap: 18px;
  text-align: center;
`;

const AlertIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${colors.statusWarning};
  color: #fff;
  border-radius: 50%;
  width: 38px;
  height: 38px;
  font-size: 1.7rem;
  flex-shrink: 0;
  box-shadow: 0 2px 8px 0 rgba(255, 193, 7, 0.18);
`;

const SuccessIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${colors.statusGood};
  color: #fff;
  border-radius: 50%;
  width: 38px;
  height: 38px;
  font-size: 1.7rem;
  flex-shrink: 0;
  box-shadow: 0 2px 8px 0 rgba(76, 175, 80, 0.18);
`;

// Add a backdrop overlay
const AlertBackdrop = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(2px);
  z-index: 9998;
  pointer-events: none;
`;

const MainContent = styled.div`
  display: flex;
  flex: 1;
  position: relative;
  min-height: calc(100vh - 70px);
  margin-top: 10px;
`;

const ContentContainer = styled.div`
  padding: 1rem;
  width: 50%;
  transition: all 0.3s ease-in-out;
  max-height: calc(100vh - 70px);
  overflow-y: auto;
  position: relative;
  z-index: 1;
`;

const MainPanel = styled.div<{ isMapExpanded?: boolean }>`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0 1rem;
  width: 100%;
`;

const RiskPanel = styled.div`
  background-color: white;
  padding: 1rem;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const AlertPanel = styled.div`
  background-color: white;
  padding: 1rem;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const AlertTitle = styled.h3`
  color: ${colors.textPrimary};
  margin-top: 0;
`;

const AlertList = styled.ul`
  list-style-type: none;
  padding: 0;
  margin: 0;
`;

const AlertItem = styled.li<{ status: SystemStatus }>`
  padding: 1rem;
  margin-bottom: 0.5rem;
  border-radius: 8px;
  border-left: 4px solid ${props => 
    props.status === 'Normal' ? colors.statusGood :
    props.status === 'Warning' ? colors.statusWarning :
    colors.statusCritical
  };
  background-color: ${props => 
    props.status === 'Normal' ? 'rgba(76, 175, 80, 0.1)' :
    props.status === 'Warning' ? 'rgba(255, 152, 0, 0.1)' :
    'rgba(244, 67, 54, 0.1)'
  };
`;

const AlertHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const AlertLocation = styled.span`
  font-weight: bold;
`;

const AlertTime = styled.span`
  font-size: 0.9rem;
  color: ${colors.textSecondary};
`;

const AlertMessage = styled.div`
  color: ${colors.textPrimary};
`;

const StatsPanel = styled.div`
  background-color: white;
  padding: 1rem;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  width: 100%;
`;

const StatsTitle = styled.h3`
  color: ${colors.textPrimary};
  margin-top: 0;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin: 0 auto;
  width: 90%;
`;

const StatItem = styled.div`
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
  color: ${colors.primary};
`;

const StatLabel = styled.div`
  font-size: 0.9rem;
  color: ${colors.textSecondary};
`;

const SystemPanel = styled.div`
  background-color: white;
  padding: 1rem;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const SystemTitle = styled.h3`
  color: ${colors.textPrimary};
  margin-top: 0;
`;

const SystemInfo = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
`;

const SystemItem = styled.div`
  flex: 1;
  min-width: 150px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const StatusIndicator = styled.div<{ status: SystemStatus }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: ${props => 
    props.status === 'Normal' ? colors.statusGood :
    props.status === 'Warning' ? colors.statusWarning :
    colors.statusCritical
  };
`;

const SystemLabel = styled.div`
  font-size: 0.9rem;
  color: ${colors.textSecondary};
`;

const SystemValue = styled.div`
  font-weight: bold;
  color: ${colors.textPrimary};
`;

const OptimizeButton = styled.button`
  background-color: ${colors.primary};
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  margin-top: 1rem;
  transition: transform 0.2s;

  &:hover {
    transform: scale(1.05);
  }
`;

// Helper function to get a random item from an array
const getRandomItem = <T,>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

// Calculate distance between two points in km
const getDistance = (pos1: [number, number], pos2: [number, number]): number => {
  const R = 6371; // Radius of the earth in km
  const dLat = (pos2[1] - pos1[1]) * Math.PI / 180;
  const dLon = (pos2[0] - pos1[0]) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(pos1[1] * Math.PI / 180) * Math.cos(pos2[1] * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c;
};

// Calculate system status based on nodes, connections and risk percentage
const calculateSystemStatus = (
  nodes: SensorNode[],
  connections: PipeConnection[],
  riskPercentage: number
): SystemStatus => {
  // Count critical and warning nodes
  const criticalNodes = nodes.filter(n => n.status === 'Critical').length;
  const warningNodes = nodes.filter(n => n.status === 'Warning').length;
  const totalNodes = nodes.length;
  
  // Calculate percentage of problematic nodes
  const problematicPercentage = ((criticalNodes * 3) + warningNodes) / totalNodes * 100;
  
  // Create a weighted score - both from risk percentage and node statuses
  const nodeStatusWeight = 0.6; // 60% weight for node status
  const floodingRiskWeight = 0.4; // 40% weight for flooding risk
  
  const combinedScore = (problematicPercentage * nodeStatusWeight) + (riskPercentage * floodingRiskWeight);
  
  // Determine system status based on the combined score
  if (combinedScore > 60 || riskPercentage > 80 || criticalNodes > totalNodes * 0.15) {
    return 'Critical';
  } else if (combinedScore > 30 || riskPercentage > 50 || warningNodes > totalNodes * 0.25) {
    return 'Warning';
  } else {
    return 'Normal';
  }
};

function App() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>('Normal');
  const [riskPercentage, setRiskPercentage] = useState(25);
  const [showOptimizeButton, setShowOptimizeButton] = useState(false);
  const [isMapExpanded, setMapExpanded] = useState(false);
  const [showRainfallAlert, setShowRainfallAlert] = useState(false);
  const [showOptimizationAlert, setShowOptimizationAlert] = useState(false);
  const [optimizationImpact, setOptimizationImpact] = useState(0);

  // Sample dynamic data for the map
  const initialNodes: SensorNode[] = [];
  const nodeTypes: NodeType[] = ['Standard', 'Flow', 'Pressure', 'Junction', 'Pump'];
  
  // Updated coordinates for Dubai
  const baseLat = 25.2048; // Dubai latitude
  const baseLng = 55.2708; // Dubai longitude
  
  // Dubai Districts locations
  const districts = [
    { name: 'Downtown', lat: 25.1972, lng: 55.2744 },
    { name: 'BusinessBay', lat: 25.1872, lng: 55.2775 },
    { name: 'Jumeirah', lat: 25.2192, lng: 55.2601 },
    { name: 'DubaiMarina', lat: 25.0817, lng: 55.1423 },
    { name: 'PalmJumeirah', lat: 25.1124, lng: 55.1390 },
    { name: 'DeiraDubai', lat: 25.2657, lng: 55.3092 },
    { name: 'AlQuoz', lat: 25.1539, lng: 55.2289 },
    { name: 'JebelAli', lat: 25.0119, lng: 55.0678 },
    { name: 'InternationalCity', lat: 25.1595, lng: 55.4003 }
  ];
  
  // Add main water treatment plants and pumping stations
  const mainFacilities = [
    { name: 'MainPump', lat: 25.1875, lng: 55.2747, type: 'Pump' as NodeType, pressure: 12.5 },
    { name: 'JebelAliPlant', lat: 25.0147, lng: 55.0795, type: 'Pump' as NodeType, pressure: 14.8 },
    { name: 'AlAwirPlant', lat: 25.1678, lng: 55.3821, type: 'Pump' as NodeType, pressure: 13.2 },
    { name: 'MarinaPump', lat: 25.0823, lng: 55.1456, type: 'Pump' as NodeType, pressure: 11.6 }
  ];
  
  // Add major treatment plants first
  mainFacilities.forEach((facility, index) => {
    initialNodes.push({
      id: `facility-${facility.name}`,
      position: [facility.lng, facility.lat],
      status: 'Normal',
      type: facility.type,
      pressure: facility.pressure
    });
  });
  
  // Create nodes for each district with different densities based on area
  districts.forEach(district => {
    // Determine how many nodes to create in this district (based on density)
    const nodeDensity = district.name === 'Downtown' || district.name === 'BusinessBay' ? 12 : 
                       district.name === 'DubaiMarina' || district.name === 'DeiraDubai' ? 10 : 
                       district.name === 'PalmJumeirah' ? 15 : 8;
    
    // Add a primary junction for this district
    initialNodes.push({
      id: `${district.name}-primary`,
      position: [district.lng, district.lat],
      status: 'Normal',
      type: 'Junction',
    });
    
    // Add a monitoring station for major districts
    if (['Downtown', 'BusinessBay', 'DubaiMarina', 'DeiraDubai', 'PalmJumeirah'].includes(district.name)) {
      initialNodes.push({
        id: `${district.name}-monitor`,
        position: [district.lng + 0.002, district.lat - 0.001],
        status: 'Normal',
        type: 'Flow',
        flowLevel: Math.random() * 12 + 3
      });
    }
    
    // Add a pressure regulator for each district
    initialNodes.push({
      id: `${district.name}-pressure`,
      position: [district.lng - 0.003, district.lat + 0.002],
      status: 'Normal',
      type: 'Pressure',
      pressure: Math.random() * 4 + 4
    });
    
    // Add randomly distributed nodes in this district
    for (let i = 0; i < nodeDensity; i++) {
      // Calculate a radius for the node based on district size
      const radius = district.name === 'PalmJumeirah' ? 0.015 : 0.008;
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * radius;
      const xOffset = Math.cos(angle) * distance;
      const yOffset = Math.sin(angle) * distance;
      
      // Select a node type biased toward "Standard" nodes
      const nodeType = Math.random() < 0.7 ? 'Standard' : getRandomItem(nodeTypes.filter(t => t !== 'Pump'));
      
      initialNodes.push({
        id: `${district.name}-node-${i}`,
        position: [
          district.lng + xOffset,
          district.lat + yOffset
        ],
        status: 'Normal',
        type: nodeType,
        // Add type-specific properties
        ...(nodeType === 'Flow' ? { flowLevel: Math.random() * 10 } : {}),
        ...(nodeType === 'Pressure' ? { pressure: Math.random() * 8 } : {}),
        ...(nodeType === 'Pump' ? { pressure: Math.random() * 12 } : {})
      });
    }
  });
  
  // Add nodes along major water pipeline routes (Dubai Creek)
  const creekPoints = [
    { lat: 25.2595, lng: 55.3245 }, // Creek entrance
    { lat: 25.2534, lng: 55.3196 },
    { lat: 25.2465, lng: 55.3223 },
    { lat: 25.2437, lng: 55.3268 },
    { lat: 25.2402, lng: 55.3294 },
    { lat: 25.2308, lng: 55.3241 },
    { lat: 25.2256, lng: 55.3193 },
    { lat: 25.2131, lng: 55.3135 }, // Business Bay connection
  ];
  
  creekPoints.forEach((point, index) => {
    initialNodes.push({
      id: `creek-node-${index}`,
      position: [point.lng, point.lat],
      status: 'Normal',
      type: index % 3 === 0 ? 'Junction' : 'Standard',
      flowLevel: Math.random() * 15 + 5
    });
  });
  
  // Add nodes along Sheikh Zayed Road
  const szhRoadPoints = [
    { lat: 25.2657, lng: 55.3092 }, // North end
    { lat: 25.2460, lng: 55.3000 },
    { lat: 25.2254, lng: 55.2867 },
    { lat: 25.2006, lng: 55.2740 }, // Downtown
    { lat: 25.1615, lng: 55.2452 },
    { lat: 25.1276, lng: 55.2110 },
    { lat: 25.0993, lng: 55.1780 },
    { lat: 25.0688, lng: 55.1443 }, // Marina area
    { lat: 25.0289, lng: 55.1123 }  // Towards Jebel Ali
  ];
  
  szhRoadPoints.forEach((point, index) => {
    const nodeType = index % 4 === 0 ? 'Junction' : 
                    index % 4 === 1 ? 'Pressure' : 
                    index % 4 === 2 ? 'Flow' : 'Standard';
    
    initialNodes.push({
      id: `szr-node-${index}`,
      position: [point.lng, point.lat],
      status: 'Normal',
      type: nodeType,
      ...(nodeType === 'Flow' ? { flowLevel: Math.random() * 8 + 2 } : {}),
      ...(nodeType === 'Pressure' ? { pressure: Math.random() * 5 + 3 } : {})
    });
  });
  
  const [nodes, setNodes] = useState<SensorNode[]>(initialNodes);

  // Generate pipe connections
  const initialConnections: PipeConnection[] = [];
  
  // Connect main facilities to nearest districts
  mainFacilities.forEach(facility => {
    const facilityNode = initialNodes.find(node => node.id === `facility-${facility.name}`);
    if (!facilityNode) return;
    
    // Find the 3 closest district primary nodes to connect to
    const primaryNodes = initialNodes.filter(node => node.id.includes('-primary'));
    const sortedByDistance = [...primaryNodes].sort((a, b) => {
      const distA = getDistance(facilityNode.position, a.position);
      const distB = getDistance(facilityNode.position, b.position);
      return distA - distB;
    });
    
    // Connect to closest 3 nodes
    for (let i = 0; i < Math.min(3, sortedByDistance.length); i++) {
      initialConnections.push({
        id: `facility-conn-${facility.name}-${i}`,
        startNode: facilityNode.id,
        endNode: sortedByDistance[i].id,
        status: 'Normal',
        flowRate: Math.random() * 20 + 10,
        diameter: 0.6, // Large main pipes
        material: 'Steel',
        age: Math.floor(Math.random() * 15)
      });
    }
  });
  
  // Connect primary district junctions to their respective nodes
  districts.forEach(district => {
    const primaryNode = initialNodes.find(node => node.id === `${district.name}-primary`);
    if (!primaryNode) return;
    
    // Connect to all nodes in this district
    const districtNodes = initialNodes.filter(node => 
      node.id.startsWith(`${district.name}-node-`) || 
      node.id === `${district.name}-monitor` || 
      node.id === `${district.name}-pressure`
    );
    
    districtNodes.forEach((node, index) => {
      initialConnections.push({
        id: `${district.name}-conn-${index}`,
        startNode: primaryNode.id,
        endNode: node.id,
        status: 'Normal',
        flowRate: Math.random() * 5 + 1,
        diameter: 0.3,
        material: Math.random() > 0.6 ? 'PVC' : 'Concrete',
        age: Math.floor(Math.random() * 25)
      });
    });
    
    // Connect district nodes to each other in a realistic manner
    if (districtNodes.length > 5) {
      // Create a "loop" design for more redundancy in larger districts
      for (let i = 0; i < districtNodes.length; i++) {
        const nextNode = districtNodes[(i + 1) % districtNodes.length];
        if (getDistance(districtNodes[i].position, nextNode.position) < 0.01) {
          initialConnections.push({
            id: `${district.name}-loop-${i}`,
            startNode: districtNodes[i].id,
            endNode: nextNode.id,
            status: 'Normal',
            flowRate: Math.random() * 3 + 0.5,
            diameter: 0.2,
            material: 'PVC',
            age: Math.floor(Math.random() * 15 + 5)
          });
        }
      }
    }
  });
  
  // Create connections between districts (major pipeline corridors)
  for (let i = 0; i < districts.length - 1; i++) {
    const primaryNode1 = initialNodes.find(node => node.id === `${districts[i].name}-primary`);
    const primaryNode2 = initialNodes.find(node => node.id === `${districts[i+1].name}-primary`);
    
    if (primaryNode1 && primaryNode2) {
      // Only connect if distance is reasonable
      const dist = getDistance(primaryNode1.position, primaryNode2.position);
      if (dist < 15) { // 15km threshold
        initialConnections.push({
          id: `district-conn-${i}`,
          startNode: primaryNode1.id,
          endNode: primaryNode2.id,
          status: 'Normal',
          flowRate: Math.random() * 15 + 5,
          diameter: 0.5,
          material: 'Steel',
          age: Math.floor(Math.random() * 10)
        });
      }
    }
  }
  
  // Connect creek nodes to form the main creek pipeline
  for (let i = 0; i < creekPoints.length - 1; i++) {
    initialConnections.push({
      id: `creek-pipe-${i}`,
      startNode: `creek-node-${i}`,
      endNode: `creek-node-${i+1}`,
      status: 'Normal',
      flowRate: Math.random() * 18 + 7,
      diameter: 0.55,
      material: 'Steel',
      age: Math.floor(Math.random() * 20)
    });
  }
  
  // Connect Sheikh Zayed Road nodes
  for (let i = 0; i < szhRoadPoints.length - 1; i++) {
    initialConnections.push({
      id: `szr-pipe-${i}`,
      startNode: `szr-node-${i}`,
      endNode: `szr-node-${i+1}`,
      status: 'Normal',
      flowRate: Math.random() * 12 + 8,
      diameter: 0.5,
      material: i % 2 === 0 ? 'Steel' : 'Concrete',
      age: Math.floor(Math.random() * 15 + 5)
    });
  }
  
  // Connect Creek system to Sheikh Zayed Road at several junction points
  const creekToSZRConnections = [
    { creek: 2, szr: 1 },
    { creek: 5, szr: 3 },
    { creek: 7, szr: 4 }
  ];
  
  creekToSZRConnections.forEach((conn, index) => {
    initialConnections.push({
      id: `creek-szr-conn-${index}`,
      startNode: `creek-node-${conn.creek}`,
      endNode: `szr-node-${conn.szr}`,
      status: 'Normal',
      flowRate: Math.random() * 10 + 3,
      diameter: 0.4,
      material: 'Steel',
      age: Math.floor(Math.random() * 12 + 3)
    });
  });

  // Add a few cross-connections (redundant pathways)
  for (let i = 0; i < 15; i++) {
    const startNode = getRandomItem(initialNodes);
    let endNode = getRandomItem(initialNodes);
    
    // Make sure nodes aren't too far away and aren't the same
    while (endNode.id === startNode.id || getDistance(startNode.position, endNode.position) > 5) {
      endNode = getRandomItem(initialNodes);
    }
    
    // Add connection only if it doesn't exist already
    if (!initialConnections.some(c => 
      (c.startNode === startNode.id && c.endNode === endNode.id) || 
      (c.startNode === endNode.id && c.endNode === startNode.id)
    )) {
      initialConnections.push({
        id: `cross-conn-${i}`,
        startNode: startNode.id,
        endNode: endNode.id,
        status: 'Normal',
        flowRate: Math.random() * 4 + 1,
        diameter: 0.25,
        material: Math.random() > 0.7 ? 'PVC' : 'Concrete',
        age: Math.floor(Math.random() * 10 + 5)
      });
    }
  }
  
  const [connections, setConnections] = useState<PipeConnection[]>(initialConnections);

  // Simulate status changes and risk updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Count nodes by status for flooding risk calculation
      const criticalCount = nodes.filter(n => n.status === 'Critical').length;
      const warningCount = nodes.filter(n => n.status === 'Warning').length;
      const totalNodes = nodes.length;
      
      // Calculate base risk percentage from node statuses (0-100)
      const nodeBasedRisk = ((criticalCount * 100) + (warningCount * 50)) / (totalNodes * 1.5);
      
      // Add small random fluctuation for more natural behavior (-1 to +1)
      const riskFluctuation = (Math.random() * 2) - 1;
      
      // Calculate new flooding risk with weighted average - 70% from nodes, 30% from previous risk plus fluctuation
      const calculatedRisk = Math.min(100, Math.max(0, 
        (nodeBasedRisk * 0.7) + (riskPercentage * 0.3) + riskFluctuation
      ));
      
      // Update risk percentage based on calculation
      setRiskPercentage(calculatedRisk);
      
      // Calculate system status from nodes and risk percentage
      const calculatedSystemStatus = calculateSystemStatus(nodes, connections, calculatedRisk);
      setSystemStatus(calculatedSystemStatus);
      
      // Show optimize button if risk is high
      setShowOptimizeButton(calculatedRisk > 70);
      
      // Occasionally update node statuses (not every node every time)
      setNodes(prevNodes => prevNodes.map(node => {
        // Higher chance of issues for older infrastructure and when flood risk is higher
        const nodeConnection = connections.find(c => c.startNode === node.id || c.endNode === node.id);
        const age = nodeConnection?.age || 5;
        // Increase failure probability based on flood risk
        const floodRiskFactor = calculatedRisk / 100; // 0-1 scale
        const failureProbability = Math.min(0.01 + (age / 200) + (floodRiskFactor * 0.2), 0.25);
        
        // Flood-prone areas (low elevation areas) are more affected by high flood risk
        const isFloodProneArea = node.id.includes('Downtown') || 
                                 node.id.includes('Marina') || 
                                 node.id.includes('Jumeirah');
        
        // Adjust probability based on area susceptibility
        const adjustedProbability = isFloodProneArea ? 
                                   failureProbability * 1.5 : 
                                   failureProbability;
        
        if (Math.random() < adjustedProbability) {
          // Higher flooding risk increases chance of critical status
          if (calculatedRisk > 70 && Math.random() < 0.6) {
            return { ...node, status: 'Critical' };
          } else {
            return { ...node, status: getRandomItem(['Warning', 'Critical'] as SystemStatus[]) };
          }
        } else if (Math.random() < 0.05) {
          return {
            ...node,
            status: getRandomItem(['Normal', 'Warning', 'Critical'] as SystemStatus[])
          };
        }
        return node;
      }));
      
      // Occasionally update connection statuses
      setConnections(prevConnections => prevConnections.map(conn => {
        // Connections are more likely to have issues if they're older and if flooding risk is higher
        const floodRiskFactor = calculatedRisk / 100; // 0-1 scale
        const failureProbability = Math.min(0.005 + (conn.age || 0) / 300 + (floodRiskFactor * 0.15), 0.2);
        
        // Get the nodes this connection links
        const startNode = nodes.find(n => n.id === conn.startNode);
        const endNode = nodes.find(n => n.id === conn.endNode);
        
        // Connection is more likely to have issues if its nodes have issues
        const nodeIssueMultiplier = 
          (startNode?.status === 'Critical' || endNode?.status === 'Critical') ? 2.0 :
          (startNode?.status === 'Warning' || endNode?.status === 'Warning') ? 1.5 : 1.0;
        
        // Final adjusted probability
        const adjustedProbability = failureProbability * nodeIssueMultiplier;
        
        if (Math.random() < adjustedProbability) {
          // Higher flooding risk increases chance of critical status
          if (calculatedRisk > 70 && Math.random() < 0.5) {
            return { ...conn, status: 'Critical' };
          } else {
            return { ...conn, status: getRandomItem(['Warning', 'Critical'] as SystemStatus[]) };
          }
        } else if (Math.random() < 0.03) {
          return {
            ...conn,
            status: getRandomItem(['Normal', 'Warning', 'Critical'] as SystemStatus[])
          };
        }
        return conn;
      }));

    }, 1000); // Update more frequently for smoother animation

    return () => clearInterval(interval);
  }, [riskPercentage, connections]);

  // Make risk update also affect node statuses 
  useEffect(() => {
    // If risk is high, make nodes more likely to have issues
    if (riskPercentage > 70) {
      setNodes(prevNodes => prevNodes.map(node => {
        if (Math.random() < 0.2) { // 20% chance to worsen node status when risk is high
          if (node.status === 'Normal') return { ...node, status: 'Warning' };
          if (node.status === 'Warning') return { ...node, status: 'Critical' };
          return node;
        }
        return node;
      }));
    }
  }, [riskPercentage]);

  const handleOptimize = () => {
    // Store current risk to calculate the impact
    const currentRisk = riskPercentage;
    
    // Simulate optimization - reduce risk and fix node statuses
    setRiskPercentage(prev => {
      const newRisk = Math.max(0, prev - 30);
      setOptimizationImpact(currentRisk - newRisk);
      return newRisk;
    });
    setShowOptimizeButton(false);
    
    // Fix statuses of problematic nodes and connections
    setNodes(prevNodes => prevNodes.map(node => ({
      ...node,
      status: node.status === 'Critical' ? 'Warning' : node.status === 'Warning' ? 'Normal' : node.status
    })));
    
    setConnections(prevConnections => prevConnections.map(conn => ({
      ...conn,
      status: conn.status === 'Critical' ? 'Warning' : conn.status === 'Warning' ? 'Normal' : conn.status
    })));
    
    // Update system status after optimization
    setSystemStatus('Normal');
    
    // Show optimization alert only when initiating
    setShowOptimizationAlert(true);
    setTimeout(() => {
      setShowOptimizationAlert(false);
    }, 2000);
    
    // Create a protection period where the system stays optimized
    const protectionPeriod = 30000; // 30 seconds of stability
    const optimizationTime = Date.now();
    
    // Create an interval to check if we're still in the protection period
    const protectionInterval = setInterval(() => {
      // If we're still within the protection period, reset any critical nodes
      if (Date.now() - optimizationTime < protectionPeriod) {
        setNodes(prevNodes => prevNodes.map(node => {
          if (node.status === 'Critical') {
            return { ...node, status: 'Warning' };
          }
          // 90% chance to maintain stability for Warning nodes too
          if (node.status === 'Warning' && Math.random() < 0.9) {
            return { ...node, status: 'Normal' };
          }
          return node;
        }));
        
        // Also keep connections stable
        setConnections(prevConnections => prevConnections.map(conn => {
          if (conn.status === 'Critical') {
            return { ...conn, status: 'Warning' };
          }
          // 80% chance to maintain stability for Warning connections
          if (conn.status === 'Warning' && Math.random() < 0.8) {
            return { ...conn, status: 'Normal' };
          }
          return conn;
        }));
        
        // Keep risk percentage relatively low
        setRiskPercentage(prev => {
          // Allow small fluctuations but keep it low
          const fluctuation = (Math.random() * 4) - 2; // -2 to +2
          return Math.max(15, Math.min(35, prev + fluctuation));
        });
      } else {
        // Once protection period is over, clear the interval
        clearInterval(protectionInterval);
      }
    }, 1000);
  };

  // Get tomorrow's date for the rainfall alert
  const getTomorrowsDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'j') {
        // 1st: Show rainfall warning alert for 2 seconds
        setShowRainfallAlert(true);
        
        // Calculate how much to increase risk based on current system status
        const riskIncrease = systemStatus === 'Critical' ? 15 : systemStatus === 'Warning' ? 25 : 35;
        
        // Increase risk percentage to show impact of rainfall
        setRiskPercentage(prev => {
          const newRisk = Math.min(95, prev + riskIncrease);
          return newRisk;
        });
        
        // Make flood-prone nodes more severely affected
        setNodes(prevNodes => prevNodes.map(node => {
          const isFloodProneArea = node.id.includes('Downtown') || 
                                 node.id.includes('Marina') || 
                                 node.id.includes('Jumeirah');
          
          if (isFloodProneArea) {
            // 80% chance of critical status in flood-prone areas
            return { 
              ...node, 
              status: Math.random() < 0.8 ? 'Critical' : 'Warning'
            };
          } else {
            // Other areas mostly get warning status
            return { 
              ...node, 
              status: Math.random() < 0.3 ? 'Critical' : 'Warning'
            };
          }
        }));
        
        // Update connections based on the nodes they connect
        setConnections(prevConnections => prevConnections.map(conn => {
          // Get the nodes this connection links
          const startNode = nodes.find(n => n.id === conn.startNode);
          const endNode = nodes.find(n => n.id === conn.endNode);
          
          // If either node is critical, connection has high chance of being critical
          if (startNode?.status === 'Critical' || endNode?.status === 'Critical') {
            return { ...conn, status: Math.random() < 0.7 ? 'Critical' : 'Warning' };
          } else {
            return { ...conn, status: 'Warning' };
          }
        }));
        
        // Update system status to reflect the change
        setSystemStatus('Critical');
        
        // After 2 seconds, hide rainfall alert and show optimization alert
        setTimeout(() => {
          setShowRainfallAlert(false);
          
          // 2nd: Show the quantum optimization success alert
          setShowOptimizationAlert(true);
          
          // Store current risk to calculate impact
          const currentRisk = riskPercentage;
          
          // After 2 seconds, hide optimization alert
          setTimeout(() => {
            setShowOptimizationAlert(false);
            
            // 3rd: Wait 5s and optimize the system
            setTimeout(() => {
              // Calculate optimization impact
              setOptimizationImpact(currentRisk - Math.max(20, currentRisk - 50));
              
              // Set all nodes to improved status
              setNodes(prevNodes => prevNodes.map(node => ({
                ...node,
                status: node.status === 'Critical' ? 'Warning' : 'Normal'
              })));
              
              // Improve connection statuses
              setConnections(prevConnections => prevConnections.map(conn => ({
                ...conn,
                status: conn.status === 'Critical' ? 'Warning' : 'Normal'
              })));
              
              // Decrease risk percentage to show impact of optimization
              setRiskPercentage(prev => Math.max(20, prev - 50));
              
              // Update system status
              setSystemStatus('Normal');
              
              // Create a protection period where the system stays optimized
              const protectionPeriod = 30000; // 30 seconds of stability
              const optimizationTime = Date.now();
              
              // Create an interval to check if we're still in the protection period
              const protectionInterval = setInterval(() => {
                // If we're still within the protection period, reset any critical nodes
                if (Date.now() - optimizationTime < protectionPeriod) {
                  setNodes(prevNodes => prevNodes.map(node => {
                    if (node.status === 'Critical') {
                      return { ...node, status: 'Warning' };
                    }
                    // 90% chance to maintain stability for Warning nodes too
                    if (node.status === 'Warning' && Math.random() < 0.9) {
                      return { ...node, status: 'Normal' };
                    }
                    return node;
                  }));
                  
                  // Also keep connections stable
                  setConnections(prevConnections => prevConnections.map(conn => {
                    if (conn.status === 'Critical') {
                      return { ...conn, status: 'Warning' };
                    }
                    // 80% chance to maintain stability for Warning connections
                    if (conn.status === 'Warning' && Math.random() < 0.8) {
                      return { ...conn, status: 'Normal' };
                    }
                    return conn;
                  }));
                  
                  // Keep risk percentage relatively low
                  setRiskPercentage(prev => {
                    // Allow small fluctuations but keep it low
                    const fluctuation = (Math.random() * 4) - 2; // -2 to +2
                    return Math.max(15, Math.min(35, prev + fluctuation));
                  });
                } else {
                  // Once protection period is over, clear the interval
                  clearInterval(protectionInterval);
                }
              }, 1000);
            }, 5000); // 5 seconds wait before optimization
          }, 2000); // 2 seconds for optimization alert
        }, 2000); // 2 seconds for rainfall alert
      }
      
      if (e.key.toLowerCase() === 'r') {
        // Randomize the network slightly, not huge differences
        setNodes(prevNodes => prevNodes.map(node => {
          // 30% chance to change a node's status
          if (Math.random() < 0.3) {
            const statuses: SystemStatus[] = ['Normal', 'Warning', 'Critical'];
            const weights = [0.6, 0.3, 0.1]; // Weighted probabilities
            
            // Select status based on weights
            const rand = Math.random();
            let cumulativeWeight = 0;
            let selectedStatus = 'Normal' as SystemStatus;
            
            for (let i = 0; i < statuses.length; i++) {
              cumulativeWeight += weights[i];
              if (rand < cumulativeWeight) {
                selectedStatus = statuses[i];
                break;
              }
            }
            
            return {
              ...node,
              status: selectedStatus
            };
          }
          return node;
        }));
        
        // Also randomize connections
        setConnections(prevConnections => prevConnections.map(conn => {
          if (Math.random() < 0.3) {
            const statuses: SystemStatus[] = ['Normal', 'Warning', 'Critical'];
            const weights = [0.6, 0.3, 0.1];
            
            const rand = Math.random();
            let cumulativeWeight = 0;
            let selectedStatus = 'Normal' as SystemStatus;
            
            for (let i = 0; i < statuses.length; i++) {
              cumulativeWeight += weights[i];
              if (rand < cumulativeWeight) {
                selectedStatus = statuses[i];
                break;
              }
            }
            
            return {
              ...conn,
              status: selectedStatus
            };
          }
          return conn;
        }));
        
        // Slightly adjust risk percentage
        const riskChange = (Math.random() * 20) - 10; // -10 to +10
        setRiskPercentage(prev => Math.min(100, Math.max(0, prev + riskChange)));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [setShowRainfallAlert, setShowOptimizationAlert, setNodes, setConnections, setRiskPercentage]);

  return (
    <MapContext.Provider value={{ isMapExpanded, setMapExpanded }}>
      <AppContainer>
        <Global styles={GlobalStyle} />
        <Navbar>
          <Logo src="/logo.png" alt="Mujra Logo" />
          <Title>Mujra</Title>
        </Navbar>
        <AnimatePresence>
          {showRainfallAlert && (
            <>
              <AlertBackdrop
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1 }}
              />
              <RainfallAlert
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ type: "spring", stiffness: 400, damping: 50 }}
              >
                <AlertIcon>⚠️</AlertIcon>
                Mujra expecting flood risk
              </RainfallAlert>
            </>
          )}
          
          {showOptimizationAlert && (
            <>
              <AlertBackdrop
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1 }}
              />
              <OptimizationAlert
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ type: "spring", stiffness: 400, damping: 50 }}
              >
                <SuccessIcon>✓</SuccessIcon>
                Mujra quantum optimization process initiated successfully: 
              </OptimizationAlert>
            </>
          )}
        </AnimatePresence>
        <MainContent>
          <ContentContainer>
            <MainPanel>
              <SystemPanel>
                <SystemTitle>System Health</SystemTitle>
                <SystemInfo>
                  {/* <SystemItem>
                    <StatusIndicator status="Normal" />
                    <SystemLabel>Quantum Solver:</SystemLabel>
                    <SystemValue>Active</SystemValue>
                  </SystemItem>
                  <SystemItem>
                    <StatusIndicator status="Normal" />
                    <SystemLabel>Optimization Time:</SystemLabel>
                    <SystemValue>0.15s</SystemValue>
                  </SystemItem>
                  <SystemItem>
                    <StatusIndicator status="Normal" />
                    <SystemLabel>Last Reaction:</SystemLabel>
                    <SystemValue>12 sec ago</SystemValue>
                  </SystemItem> */}
                </SystemInfo>
                <SystemStatusBar status={systemStatus}>
                  System Status: {systemStatus} {riskPercentage > 70 ? "- High Flooding Risk" : 
                  riskPercentage > 50 ? "- Moderate Flooding Risk" : 
                  riskPercentage > 30 ? "- Low Flooding Risk" : "- Normal Conditions"}
                </SystemStatusBar>
              </SystemPanel>
              
              {/* <StatsPanel>
                <StatsTitle>Current Stats</StatsTitle>
                <StatsGrid>
                  <StatItem>
                    <StatValue>12,706 m³/hr</StatValue>
                    <StatLabel>Total Flow Volume</StatLabel>
                  </StatItem>
                  <StatItem>
                    <StatValue>13.38 mm/hr</StatValue>
                    <StatLabel>Rainfall Rate</StatLabel>
                  </StatItem>
                  <StatItem>
                    <StatValue>{nodes.filter(n => n.status === 'Critical').length}</StatValue>
                    <StatLabel>Critical Nodes</StatLabel>
                  </StatItem>
                  <StatItem>
                    <StatValue>{nodes.filter(n => n.status === 'Warning').length}</StatValue>
                    <StatLabel>Warning Nodes</StatLabel>
                  </StatItem>
                  <StatItem>
                    <StatValue>{(riskPercentage * 0.23 + 9.7).toFixed(2)} mm/hr</StatValue>
                    <StatLabel>Water Level Rise</StatLabel>
                  </StatItem>
                  <StatItem>
                    <StatValue>{Math.max(0, (riskPercentage - 20) * 2).toFixed(0)}%</StatValue>
                    <StatLabel>System Pressure</StatLabel>
                  </StatItem>
                </StatsGrid>
              </StatsPanel> */}
              
              <RiskPanel>
                <RiskOverview riskPercentage={riskPercentage} />
                {showOptimizeButton && (
                  <OptimizeButton onClick={handleOptimize}>
                    Optimize Network
                  </OptimizeButton>
                )}
              </RiskPanel>
              <StatsPanel>
                <StatsTitle>Current Stats</StatsTitle>
                <StatsGrid>
                  <StatItem>
                    <StatValue>12,706 m³/hr</StatValue>
                    <StatLabel>Total Flow Volume</StatLabel>
                  </StatItem>
                  <StatItem>
                    <StatValue>13.38 mm/hr</StatValue>
                    <StatLabel>Rainfall Rate</StatLabel>
                  </StatItem>
                  <StatItem>
                    <StatValue>{nodes.filter(n => n.status === 'Critical').length}</StatValue>
                    <StatLabel>Critical Nodes</StatLabel>
                  </StatItem>
                  <StatItem>
                    <StatValue>{nodes.filter(n => n.status === 'Warning').length}</StatValue>
                    <StatLabel>Warning Nodes</StatLabel>
                  </StatItem>
                  <StatItem>
                    <StatValue>{(riskPercentage * 0.23 + 9.7).toFixed(2)} mm/hr</StatValue>
                    <StatLabel>Water Level Rise</StatLabel>
                  </StatItem>
                  <StatItem>
                    <StatValue>{Math.max(0, (riskPercentage - 20) * 2).toFixed(0)}%</StatValue>
                    <StatLabel>System Pressure</StatLabel>
                  </StatItem>
                </StatsGrid>
              </StatsPanel>
              <AlertPanel>
                <AlertTitle>Alerts & Warnings</AlertTitle>
                <AlertList>
                  <AlertItem status="Warning">
                    <AlertHeader>
                      <AlertLocation>Zone B</AlertLocation>
                      <AlertTime>1:36:38 PM</AlertTime>
                    </AlertHeader>
                    <AlertMessage>Mild flood risk in Zone B</AlertMessage>
                  </AlertItem>
                  <AlertItem status="Warning">
                    <AlertHeader>
                      <AlertLocation>Route 17</AlertLocation>
                      <AlertTime>1:34:38 PM</AlertTime>
                    </AlertHeader>
                    <AlertMessage>Overflow detected in Route 17</AlertMessage>
                  </AlertItem>
                  <AlertItem status="Warning">
                    <AlertHeader>
                      <AlertLocation>Sector C</AlertLocation>
                      <AlertTime>1:31:38 PM</AlertTime>
                    </AlertHeader>
                    <AlertMessage>Rising water levels in Sector C</AlertMessage>
                  </AlertItem>
                </AlertList>
              </AlertPanel>
                <SystemPanel>
                  <SystemInfo>
                    <SystemItem>
                      <StatusIndicator status="Warning" />
                      <SystemLabel>Quantum Solver:</SystemLabel>
                      <SystemValue>Armed</SystemValue>
                    </SystemItem>
                    <SystemItem>
                      <StatusIndicator status="Normal" />
                      <SystemLabel>Last Optimization Time:</SystemLabel>
                      <SystemValue>0.12s</SystemValue>
                    </SystemItem>
                    <SystemItem>
                      <StatusIndicator status="Normal" />
                      <SystemLabel>Last Reaction:</SystemLabel>
                      <SystemValue>3 sec ago</SystemValue>
                    </SystemItem>
                  </SystemInfo>
                </SystemPanel>
            </MainPanel>
          </ContentContainer>
          <CollapsibleMap 
            nodes={nodes} 
            connections={connections} 
            initialViewState={{
              longitude: baseLng,
              latitude: baseLat,
              zoom: 12.5
            }}
          />
        </MainContent>
      </AppContainer>
    </MapContext.Provider>
  );
}

export default App;
