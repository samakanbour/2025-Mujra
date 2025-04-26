import { useState, useEffect, useMemo } from 'react';
import Map, { Source, Layer, Marker, NavigationControl, Popup } from 'react-map-gl';
import { motion } from 'framer-motion';
import { SensorNode, PipeConnection, SystemStatus } from '../types';
import { colors } from '../styles/global';
import 'mapbox-gl/dist/mapbox-gl.css';

// Helper function to get color for status
const getStatusColor = (status: SystemStatus): string => {
  switch (status) {
    case 'Normal': return colors.statusGood;
    case 'Warning': return colors.statusWarning;
    case 'Critical': return colors.statusCritical;
    default: return colors.statusGood;
  }
};

// Get node icon based on type
const getNodeIcon = (type: string): string => {
  switch (type) {
    case 'Pump': return '⚙️';
    case 'Junction': return '✚';
    case 'Flow': return '⇆';
    case 'Pressure': return '🔄';
    default: return '●';
  }
};

// Get node size based on type and ID (for distinguishing primary nodes)
const getNodeSize = (type: string, id: string): number => {
  // Primary district nodes should be larger
  if (id.includes('-primary')) return 26;
  
  // Facilities are the largest
  if (id.startsWith('facility-')) return 32;
  
  // Standard sizes based on type
  switch (type) {
    case 'Pump': return 28;
    case 'Junction': return 22;
    case 'Flow': return 22;
    case 'Pressure': return 24;
    default: return 16; // Make standard nodes smaller to reduce visual clutter
  }
};

// Get pipe width based on diameter
const getPipeWidth = (diameter?: number): number => {
  if (!diameter) return 3;
  return 2 + diameter * 8; // Increased multiplier for better visibility
};

interface InteractiveMapProps {
  nodes: SensorNode[];
  connections: PipeConnection[];
  initialViewState?: {
    longitude: number;
    latitude: number;
    zoom: number;
  };
}

// Reusable marker component
const SensorNodeMarker = ({ 
  node, 
  onClick
}: { 
  node: SensorNode; 
  onClick: (node: SensorNode) => void;
}) => {
  const nodeSize = getNodeSize(node.type, node.id);
  const isPrimary = node.id.includes('-primary') || node.id.startsWith('facility-');
  
  return (
    <Marker
      longitude={node.position[0]}
      latitude={node.position[1]}
      anchor="center"
      onClick={(e) => {
        e.originalEvent.stopPropagation();
        onClick(node);
      }}
    >
      <motion.div
        style={{
          width: nodeSize,
          height: nodeSize,
          backgroundColor: getStatusColor(node.status),
          borderRadius: node.type === 'Junction' ? '20%' : '50%',
          border: `3px solid ${
            isPrimary ? '#ffffff' : 
            node.status === 'Critical' ? colors.statusCritical : 
            node.type === 'Pump' ? '#f8d568' : 'white'
          }`,
          boxShadow: `0 3px 6px rgba(0,0,0,${node.status === 'Critical' || isPrimary ? 0.5 : 0.3})`,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          fontSize: nodeSize * 0.4,
          color: node.status === 'Normal' ? '#333' : 'white',
          animation: (node.status === 'Warning' || node.status === 'Critical') 
                     ? 'pulse 1.5s infinite ease-in-out' 
                     : (node.type === 'Pump') 
                     ? 'gentle-pulse 3s infinite ease-in-out' 
                     : 'none',
          zIndex: isPrimary ? 20 : node.type === 'Pump' ? 15 : 10,
        }}
        whileHover={{ scale: 1.4, transition: { duration: 0.2 } }}
      >
        {getNodeIcon(node.type)}
      </motion.div>
      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(255, 82, 82, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(255, 82, 82, 0); }
          100% { box-shadow: 0 0 0 0 rgba(255, 82, 82, 0); }
        }
        @keyframes gentle-pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
      `}</style>
    </Marker>
  );
};

export function InteractiveMap({ nodes, connections, initialViewState }: InteractiveMapProps) {
  const [popupInfo, setPopupInfo] = useState<SensorNode | null>(null);
  const [popupTimeout, setPopupTimeout] = useState<number | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapWrapperKey, setMapWrapperKey] = useState(0); // For forcing re-render

  // Default view state centered on Dubai if not provided
  const defaultViewState = initialViewState || {
    longitude: 55.2708, // Dubai longitude
    latitude: 25.2048,  // Dubai latitude
    zoom: 11.5,
  };
  
  // Categorize connections for layered rendering
  const mainPipes = useMemo(() => 
    connections.filter(conn => conn.diameter && conn.diameter >= 0.4), 
  [connections]);
  
  const secondaryPipes = useMemo(() => 
    connections.filter(conn => !conn.diameter || conn.diameter < 0.4), 
  [connections]);

  // Create main pipe GeoJSON for the drainage network
  const mainPipeData = useMemo(() => {
    return {
      type: 'FeatureCollection',
      features: mainPipes.map(connection => {
        const startNode = nodes.find(n => n.id === connection.startNode);
        const endNode = nodes.find(n => n.id === connection.endNode);
        
        if (!startNode || !endNode) return null;
        
        return {
          type: 'Feature',
          properties: {
            id: connection.id,
            status: connection.status,
            flowRate: connection.flowRate || 2.5,
            diameter: connection.diameter || 0.5,
            material: connection.material || 'Steel',
            age: connection.age || Math.floor(Math.random() * 20)
          },
          geometry: {
            type: 'LineString',
            coordinates: [
              startNode.position,
              endNode.position
            ]
          }
        };
      }).filter(Boolean)
    };
  }, [mainPipes, nodes]);
  
  // Create secondary pipe GeoJSON
  const secondaryPipeData = useMemo(() => {
    return {
      type: 'FeatureCollection',
      features: secondaryPipes.map(connection => {
        const startNode = nodes.find(n => n.id === connection.startNode);
        const endNode = nodes.find(n => n.id === connection.endNode);
        
        if (!startNode || !endNode) return null;
        
        return {
          type: 'Feature',
          properties: {
            id: connection.id,
            status: connection.status,
            flowRate: connection.flowRate || 1.5,
            diameter: connection.diameter || 0.3,
            material: connection.material || 'PVC',
            age: connection.age || Math.floor(Math.random() * 20)
          },
          geometry: {
            type: 'LineString',
            coordinates: [
              startNode.position,
              endNode.position
            ]
          }
        };
      }).filter(Boolean)
    };
  }, [secondaryPipes, nodes]);

  // Create overlay GeoJSON for pipe flow animations
  const flowData = useMemo(() => {
    return {
      type: 'FeatureCollection',
      features: connections
        .filter(conn => conn.status !== 'Critical')
        .map(connection => {
          const startNode = nodes.find(n => n.id === connection.startNode);
          const endNode = nodes.find(n => n.id === connection.endNode);
          
          if (!startNode || !endNode) return null;
          
          return {
            type: 'Feature',
            properties: {
              id: `flow-${connection.id}`,
              status: connection.status,
              flowRate: connection.flowRate || 2.5,
              diameter: connection.diameter || 0.3
            },
            geometry: {
              type: 'LineString',
              coordinates: [
                startNode.position,
                endNode.position
              ]
            }
          };
      }).filter(Boolean)
    };
  }, [connections, nodes]);

  // Handle node click to show popup
  const handleNodeClick = (node: SensorNode) => {
    if (popupTimeout) {
      window.clearTimeout(popupTimeout);
      setPopupTimeout(null);
    }
    setPopupInfo(node);
  };

  // Handle map click to close popup
  const handleMapClick = () => {
    setPopupInfo(null);
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (popupTimeout) {
        window.clearTimeout(popupTimeout);
      }
    };
  }, [popupTimeout]);

  // Force re-render the map if nodes or connections change significantly
  useEffect(() => {
    setMapWrapperKey(prev => prev + 1);
  }, []);

  // Get Mapbox token from environment
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;

  if (!mapboxToken) {
    console.error('Mapbox token is missing! Map cannot be initialized.');
    return <div style={{ padding: '20px', color: 'red' }}>Error: Mapbox token is missing.</div>;
  }
  
  const handleMapLoad = () => {
    console.log('Map loaded successfully!');
    setMapLoaded(true);
  };

  // Filter out which nodes to show based on zoom and importance
  const visibleNodes = nodes.filter(node => {
    // Always show primary nodes and pump stations
    if (node.id.includes('-primary') || node.type === 'Pump' || node.id.startsWith('facility-')) {
      return true;
    }
    
    // Show all nodes for now - can implement zoom-based filtering if needed
    return true;
  });

  return (
    <div key={mapWrapperKey} style={{ width: '100%', height: '100%' }}>
      <Map
        initialViewState={defaultViewState}
        style={{ width: '100%', height: '100%', borderRadius: '12px' }}
        mapStyle="mapbox://styles/mapbox/satellite-streets-v12" // Use satellite-streets style for Dubai
        mapboxAccessToken={mapboxToken}
        onClick={handleMapClick}
        onLoad={handleMapLoad}
        projection={'mercator'}
      >
        <NavigationControl position="top-right" />
        
        {mapLoaded && (
          <>
            {/* Main pipes layer - the primary infrastructure */}
            <Source id="main-pipes-source" type="geojson" data={mainPipeData}>
              <Layer
                id="main-pipes-casing"
                type="line"
                layout={{
                  'line-join': 'round',
                  'line-cap': 'round',
                }}
                paint={{
                  'line-color': '#ffffff',
                  'line-width': [
                    'interpolate',
                    ['linear'],
                    ['get', 'diameter'],
                    0.4, 10,
                    0.6, 16
                  ],
                  'line-opacity': 0.9,
                }}
              />
              
              <Layer
                id="main-pipes-layer"
                type="line"
                layout={{
                  'line-join': 'round',
                  'line-cap': 'round',
                }}
                paint={{
                  'line-color': [
                    'match',
                    ['get', 'status'],
                    'Normal', colors.statusGood,
                    'Warning', colors.statusWarning,
                    'Critical', colors.statusCritical,
                    colors.statusGood
                  ],
                  'line-width': [
                    'interpolate',
                    ['linear'],
                    ['get', 'diameter'],
                    0.4, 7,
                    0.6, 12
                  ],
                  'line-opacity': 0.9,
                }}
              />
            </Source>
            
            {/* Secondary pipes - smaller distribution lines */}
            <Source id="secondary-pipes-source" type="geojson" data={secondaryPipeData}>
              <Layer
                id="secondary-pipes-casing"
                type="line"
                layout={{
                  'line-join': 'round',
                  'line-cap': 'round',
                }}
                paint={{
                  'line-color': '#ffffff',
                  'line-width': [
                    'interpolate',
                    ['linear'],
                    ['get', 'diameter'],
                    0.2, 5,
                    0.3, 8
                  ],
                  'line-opacity': 0.8,
                }}
              />
              
              <Layer
                id="secondary-pipes-layer"
                type="line"
                layout={{
                  'line-join': 'round',
                  'line-cap': 'round',
                }}
                paint={{
                  'line-color': [
                    'match',
                    ['get', 'status'],
                    'Normal', colors.statusGood,
                    'Warning', colors.statusWarning,
                    'Critical', colors.statusCritical,
                    colors.statusGood
                  ],
                  'line-width': [
                    'interpolate',
                    ['linear'],
                    ['get', 'diameter'],
                    0.2, 3,
                    0.3, 5
                  ],
                  'line-opacity': 0.8,
                }}
              />
            </Source>
            
            {/* Flow animations layer */}
            <Source id="flow-source" type="geojson" data={flowData}>
              <Layer
                id="flow-layer"
                type="line"
                layout={{
                  'line-join': 'round',
                  'line-cap': 'round',
                }}
                paint={{
                  'line-color': [
                    'match',
                    ['get', 'status'],
                    'Normal', 'rgba(76, 175, 80, 0.8)',
                    'Warning', 'rgba(255, 152, 0, 0.8)',
                    'rgba(33, 150, 243, 0.8)',
                  ],
                  'line-width': 2.5,
                  'line-opacity': 0.9, // Increased opacity for better visibility on satellite imagery
                  'line-dasharray': [0, 4, 3],
                  'line-gap-width': [
                    'interpolate',
                    ['linear'],
                    ['get', 'diameter'],
                    0.2, 2,
                    0.3, 4,
                    0.5, 6,
                    0.6, 9
                  ]
                }}
              />
            </Source>

            {visibleNodes.map(node => (
              <SensorNodeMarker 
                key={node.id} 
                node={node} 
                onClick={handleNodeClick}
              />
            ))}

            {popupInfo && (
              <Popup
                anchor="top"
                longitude={Number(popupInfo.position[0])}
                latitude={Number(popupInfo.position[1])}
                onClose={() => setPopupInfo(null)}
                closeButton={true}
                closeOnClick={false}
                offset={25}
                style={{ zIndex: 10 }}
              >
                <div 
                  style={{
                    background: 'white',
                    color: colors.textPrimary,
                    padding: '12px 15px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    fontFamily: '"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    maxWidth: '250px',
                    cursor: 'default',
                  }}
                >
                  <strong style={{ display: 'block', marginBottom: '8px', color: colors.primary, fontSize: '16px' }}>
                    {popupInfo.type} Node: {popupInfo.id.split('-').slice(0, 2).join('-')}
                  </strong>
                  
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    marginBottom: '5px',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    backgroundColor: getStatusColor(popupInfo.status) + '22',
                  }}>
                    <div style={{ 
                      width: '12px', 
                      height: '12px', 
                      borderRadius: '50%', 
                      backgroundColor: getStatusColor(popupInfo.status),
                      marginRight: '8px'
                    }}></div>
                    <strong>Status:</strong> 
                    <span style={{ marginLeft: '5px', fontWeight: 'bold' }}>{popupInfo.status}</span>
                  </div>
                  
                  {popupInfo.type === 'Pump' && (
                    <>
                      <div><strong>Capacity:</strong> {(popupInfo.pressure || 5).toFixed(1)} bar</div>
                      <div><strong>Efficiency:</strong> {Math.floor(Math.random() * 30) + 70}%</div>
                      <div><strong>Power:</strong> {Math.floor(Math.random() * 50) + 150} kW</div>
                    </>
                  )}
                  
                  {popupInfo.type === 'Flow' && (
                    <>
                      <div><strong>Flow Rate:</strong> {(popupInfo.flowLevel || Math.random() * 10).toFixed(1)} L/s</div>
                      <div><strong>Velocity:</strong> {(Math.random() * 2 + 0.5).toFixed(1)} m/s</div>
                    </>
                  )}
                  
                  {popupInfo.type === 'Pressure' && (
                    <>
                      <div><strong>Pressure:</strong> {(popupInfo.pressure || Math.random() * 8).toFixed(1)} bar</div>
                      <div><strong>Variation:</strong> ±{(Math.random() * 0.5).toFixed(2)} bar</div>
                    </>
                  )}
                  
                  {popupInfo.type === 'Junction' && (
                    <>
                      <div><strong>Connections:</strong> {Math.floor(Math.random() * 3) + 2}</div>
                      <div><strong>Elevation:</strong> {Math.floor(Math.random() * 10) + 1} m</div>
                    </>
                  )}
                  
                  {popupInfo.lastMaintenance && (
                    <div><strong>Last Maint:</strong> {popupInfo.lastMaintenance}</div>
                  )}
                  
                  <div style={{ marginTop: '10px', fontSize: '13px', color: colors.textSecondary }}>
                    {connections.filter(c => c.startNode === popupInfo.id || c.endNode === popupInfo.id).length} connected pipes
                  </div>
                </div>
              </Popup>
            )}
          </>
        )}
      </Map>
    </div>
  );
}