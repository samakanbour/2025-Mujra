import { useState, useEffect, useMemo, useRef } from 'react';
import Map, { Source, Layer, Marker, NavigationControl, Popup } from 'react-map-gl';
import { motion } from 'framer-motion';
import { SensorNode, PipeConnection, SystemStatus, NodeType, CityType } from '../types';
import { colors } from '../styles/global';
import 'mapbox-gl/dist/mapbox-gl.css';

// Helper function to get color for status
const getStatusColor = (status: SystemStatus, city?: string): string => {
  // Base colors
  const baseColors = {
    Normal: colors.statusGood,
    Warning: colors.statusWarning,
    Critical: colors.statusCritical
  };
  
  // City-specific color adjustments
  if (city === 'sharjah') {
    return {
      Normal: '#5C6BC0', // Indigo for Sharjah
      Warning: '#FB8C00', // Orange for Sharjah warnings
      Critical: '#C2185B'  // Pink for Sharjah critical
    }[status] || baseColors[status];
  }
  
  if (city === 'abudhabi') {
    return {
      Normal: '#26A69A', // Teal for Abu Dhabi
      Warning: '#FF8F00', // Amber for Abu Dhabi warnings
      Critical: '#D32F2F'  // Red for Abu Dhabi critical
    }[status] || baseColors[status];
  }
  
  if (city === 'ajman') {
    return {
      Normal: '#9575CD', // Light Purple for Ajman
      Warning: '#FF7043', // Deep Orange for Ajman warnings
      Critical: '#7B1FA2'  // Purple for Ajman critical
    }[status] || baseColors[status];
  }
  
  if (city === 'ummalquwain') {
    return {
      Normal: '#EC407A', // Pink for UAQ
      Warning: '#FFA726', // Orange for UAQ warnings
      Critical: '#D81B60'  // Dark Pink for UAQ critical
    }[status] || baseColors[status];
  }
  
  if (city === 'rasalkhaimah') {
    return {
      Normal: '#FF9800', // Orange for RAK
      Warning: '#F57C00', // Dark Orange for RAK warnings
      Critical: '#E65100'  // Deep Orange for RAK critical
    }[status] || baseColors[status];
  }
  
  if (city === 'fujairah') {
    return {
      Normal: '#66BB6A', // Green for Fujairah
      Warning: '#FFA000', // Amber for Fujairah warnings
      Critical: '#D84315'  // Deep Orange for Fujairah critical
    }[status] || baseColors[status];
  }
  
  return baseColors[status] || colors.statusGood;
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
    width?: number;
    height?: number;
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
  
  // Get city-specific border color
  const getBorderColor = () => {
    if (isPrimary) return '#ffffff';
    if (node.status === 'Critical') return getStatusColor('Critical', node.city);
    
    if (node.type === 'Pump') {
      switch (node.city) {
        case 'dubai': return '#f8d568';
        case 'sharjah': return '#7986CB';
        case 'abudhabi': return '#80CBC4';
        case 'ajman': return '#B39DDB';
        case 'ummalquwain': return '#F48FB1';
        case 'rasalkhaimah': return '#FFB74D';
        case 'fujairah': return '#81C784';
        default: return '#f8d568';
      }
    }
    
    return 'white';
  };
  
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
          backgroundColor: getStatusColor(node.status, node.city),
          borderRadius: node.type === 'Junction' ? '20%' : '50%',
          border: `3px solid ${getBorderColor()}`,
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
  const [mapWrapperKey, setMapWrapperKey] = useState(0);
  const [mapSize, setMapSize] = useState({ width: 0, height: 0 });
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [currentCity, setCurrentCity] = useState<CityType>('dubai');
  const [showLegend, setShowLegend] = useState(true);
  const [viewState, setViewState] = useState(initialViewState || {
    longitude: 55.2708, // Dubai longitude
    latitude: 25.2048,  // Dubai latitude
    zoom: 11.5,
  });

  // Update map dimensions when container size changes
  useEffect(() => {
    const updateMapSize = () => {
      if (mapContainerRef.current) {
        const { width, height } = mapContainerRef.current.getBoundingClientRect();
        setMapSize({ width, height });
      }
    };

    updateMapSize();
    const resizeObserver = new ResizeObserver(updateMapSize);
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Update viewState when size changes
  useEffect(() => {
    if (mapSize.width > 0 && mapSize.height > 0) {
      setViewState(prev => ({
        ...prev,
        width: mapSize.width,
        height: mapSize.height
      }));
    }
  }, [mapSize]);

  // Update viewState when initialViewState changes (for example when container resizes)
  useEffect(() => {
    if (initialViewState) {
      setViewState(prev => ({
        ...prev,
        ...initialViewState
      }));
    }
  }, [initialViewState]);

  // City view states
  const cityViewStates = {
    dubai: {
      longitude: 55.2708, // Dubai longitude
      latitude: 25.2048,  // Dubai latitude
      zoom: 11.5,
    },
    sharjah: {
      longitude: 55.3914, // Sharjah longitude
      latitude: 25.3463,  // Sharjah latitude
      zoom: 11.2,
    },
    abudhabi: {
      longitude: 54.3773, // Abu Dhabi longitude
      latitude: 24.4539,  // Abu Dhabi latitude
      zoom: 11,
    },
    ajman: {
      longitude: 55.4788, // Ajman longitude
      latitude: 25.4111,  // Ajman latitude
      zoom: 12.5,
    },
    ummalquwain: {
      longitude: 55.5552, // Umm Al Quwain longitude
      latitude: 25.5647,  // Umm Al Quwain latitude
      zoom: 12,
    },
    rasalkhaimah: {
      longitude: 55.9432, // Ras Al Khaimah longitude
      latitude: 25.7895,  // Ras Al Khaimah latitude
      zoom: 11.5,
    },
    fujairah: {
      longitude: 56.3414, // Fujairah longitude
      latitude: 25.1288,  // Fujairah latitude
      zoom: 11.8,
    }
  };

  // Create city-specific nodes by filtering or transforming the original nodes
  const cityNodes = useMemo(() => {
    // Original Dubai nodes remain unchanged
    if (currentCity === 'dubai') {
      return nodes.map(node => ({
        ...node,
        city: 'dubai' as CityType
      }));
    }
    
    // For other emirates, create derived nodes with adjusted positions
    const cityOffsets = {
      sharjah: {
        longitude: 55.3914 - 55.2708, // Difference between Sharjah and Dubai
        latitude: 25.3463 - 25.2048,
      },
      abudhabi: {
        longitude: 54.3773 - 55.2708, // Difference between Abu Dhabi and Dubai
        latitude: 24.4539 - 25.2048,
      },
      ajman: {
        longitude: 55.4788 - 55.2708, // Difference between Ajman and Dubai
        latitude: 25.4111 - 25.2048,
      },
      ummalquwain: {
        longitude: 55.5552 - 55.2708, // Difference between UAQ and Dubai
        latitude: 25.5647 - 25.2048,
      },
      rasalkhaimah: {
        longitude: 55.9432 - 55.2708, // Difference between RAK and Dubai
        latitude: 25.7895 - 25.2048,
      },
      fujairah: {
        longitude: 56.3414 - 55.2708, // Difference between Fujairah and Dubai
        latitude: 25.1288 - 25.2048,
      },
    };
    
    // Create new nodes with city-specific IDs and adjusted positions
    return nodes.map(node => ({
      ...node,
      id: `${currentCity}-${node.id}`,
      position: [
        node.position[0] + cityOffsets[currentCity].longitude,
        node.position[1] + cityOffsets[currentCity].latitude
      ] as [number, number],
      city: currentCity as CityType
    }));
  }, [nodes, currentCity]);

  // Create city-specific connections
  const cityConnections = useMemo(() => {
    if (currentCity === 'dubai') {
      return connections.map(conn => ({
        ...conn,
        city: 'dubai' as CityType
      }));
    }
    
    // Create new connections with city-specific IDs and node references
    return connections.map(conn => ({
      ...conn,
      id: `${currentCity}-${conn.id}`,
      startNode: `${currentCity}-${conn.startNode}`,
      endNode: `${currentCity}-${conn.endNode}`,
      city: currentCity as CityType
    }));
  }, [connections, currentCity]);

  // Default view state centered on selected city if not provided
  const defaultViewState = initialViewState || cityViewStates[currentCity];
  
  // Categorize connections for layered rendering
  const mainPipes = useMemo(() => 
    cityConnections.filter(conn => conn.diameter && conn.diameter >= 0.4), 
  [cityConnections]);
  
  const secondaryPipes = useMemo(() => 
    cityConnections.filter(conn => !conn.diameter || conn.diameter < 0.4), 
  [cityConnections]);

  // Get city-specific properties
  const getCityProperties = () => {
    switch (currentCity) {
      case 'sharjah':
        return {
          title: 'Sharjah Distribution System',
          description: 'Northern emirate network',
          pipeMaterial: 'HDPE',
          networkAge: '10-15 years'
        };
      case 'abudhabi':
        return {
          title: 'Abu Dhabi Water Network',
          description: 'Capital city infrastructure',
          pipeMaterial: 'Carbon Steel',
          networkAge: '15-20 years'
        };
      case 'ajman':
        return {
          title: 'Ajman Water Grid',
          description: 'Compact urban network',
          pipeMaterial: 'PVC',
          networkAge: '8-12 years'
        };
      case 'ummalquwain':
        return {
          title: 'Umm Al Quwain System',
          description: 'Coastal distribution network',
          pipeMaterial: 'HDPE',
          networkAge: '12-18 years'
        };
      case 'rasalkhaimah':
        return {
          title: 'Ras Al Khaimah Grid',
          description: 'Northern mountain region network',
          pipeMaterial: 'Ductile Iron',
          networkAge: '10-15 years'
        };
      case 'fujairah':
        return {
          title: 'Fujairah Distribution',
          description: 'East coast network system',
          pipeMaterial: 'Carbon Steel/PVC',
          networkAge: '7-14 years'
        };
      default:
        return {
          title: 'Dubai Smart Water Network',
          description: 'Smart city water management',
          pipeMaterial: 'Steel',
          networkAge: '5-10 years'
        };
    }
  };

  // Create main pipe GeoJSON for the drainage network
  const mainPipeData = useMemo(() => {
    const cityProps = getCityProperties();
    return {
      type: 'FeatureCollection',
      features: mainPipes.map(connection => {
        const startNode = cityNodes.find(n => n.id === connection.startNode);
        const endNode = cityNodes.find(n => n.id === connection.endNode);
        
        if (!startNode || !endNode) return null;
        
        return {
          type: 'Feature',
          properties: {
            id: connection.id,
            status: connection.status,
            flowRate: connection.flowRate || 2.5,
            diameter: connection.diameter || 0.5,
            material: connection.material || cityProps.pipeMaterial,
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
  }, [mainPipes, cityNodes, currentCity]);
  
  // Create secondary pipe GeoJSON
  const secondaryPipeData = useMemo(() => {
    const cityProps = getCityProperties();
    return {
      type: 'FeatureCollection',
      features: secondaryPipes.map(connection => {
        const startNode = cityNodes.find(n => n.id === connection.startNode);
        const endNode = cityNodes.find(n => n.id === connection.endNode);
        
        if (!startNode || !endNode) return null;
        
        return {
          type: 'Feature',
          properties: {
            id: connection.id,
            status: connection.status,
            flowRate: connection.flowRate || 1.5,
            diameter: connection.diameter || 0.3,
            material: connection.material || cityProps.pipeMaterial,
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
  }, [secondaryPipes, cityNodes, currentCity]);

  // Create overlay GeoJSON for pipe flow animations
  const flowData = useMemo(() => {
    return {
      type: 'FeatureCollection',
      features: cityConnections
        .filter(conn => conn.status !== 'Critical')
        .map(connection => {
          const startNode = cityNodes.find(n => n.id === connection.startNode);
          const endNode = cityNodes.find(n => n.id === connection.endNode);
          
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
  }, [cityConnections, cityNodes]);

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

  // Filter out which nodes to show based on city, zoom and importance
  const visibleNodes = cityNodes.filter(node => {
    // Always show primary nodes and pump stations
    if (node.id.includes('-primary') || node.type === 'Pump' || node.id.startsWith('facility-')) {
      return true;
    }
    
    // Show all nodes for now - can implement zoom-based filtering if needed
    return true;
  });

  // Get the city color for UI elements
  const getCityColor = (city: CityType): string => {
    switch (city) {
      case 'dubai': return colors.primary;
      case 'sharjah': return '#3949AB'; // Indigo
      case 'abudhabi': return '#00897B'; // Teal
      case 'ajman': return '#7B1FA2'; // Purple
      case 'ummalquwain': return '#D81B60'; // Pink
      case 'rasalkhaimah': return '#F57C00'; // Orange
      case 'fujairah': return '#388E3C'; // Green
      default: return colors.primary;
    }
  };

  // Handle city change
  const handleCityChange = (city: CityType) => {
    setCurrentCity(city);
    setPopupInfo(null);
    // Force map re-render when changing cities
    setMapWrapperKey(prev => prev + 1);
  };

  const cityProperties = getCityProperties();
  const cityColor = getCityColor(currentCity);

  return (
    <div 
      ref={mapContainerRef}
      style={{ 
        width: '100%', 
        height: '100%', 
        position: 'relative',
        overflow: 'hidden'
      }} 
      key={mapWrapperKey}
    >
      {/* City info panel */}
      <div style={{
        position: 'absolute',
        top: '65px',
        left: '10px',
        zIndex: 10,
        background: 'white',
        padding: '10px',
        borderRadius: '4px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
        maxWidth: '200px',
        fontSize: '13px'
      }}>
        <h3 style={{ margin: '0 0 8px 0', color: cityColor }}>
          {cityProperties.title}
        </h3>
        <p style={{ margin: '0 0 5px 0', color: colors.textSecondary }}>{cityProperties.description}</p>
        <div style={{ fontSize: '12px', color: colors.textPrimary }}>
          <div>Primary material: {cityProperties.pipeMaterial}</div>
          <div>Avg network age: {cityProperties.networkAge}</div>
        </div>
      </div>
      
      {/* Map Legend */}
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        zIndex: 10,
        background: 'white',
        padding: showLegend ? '12px' : '6px',
        borderRadius: '4px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
        maxWidth: '240px',
        fontSize: '12px',
        transition: 'all 0.3s ease'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: showLegend ? '10px' : '0'
        }}>
          <h4 style={{ 
            margin: '0',
            fontSize: '14px',
            fontWeight: 'bold',
            color: cityColor
          }}>
            Map Legend
          </h4>
          <button
            onClick={() => setShowLegend(!showLegend)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              color: colors.textSecondary,
              padding: '0 0 0 8px'
            }}
          >
            {showLegend ? '−' : '+'}
          </button>
        </div>
        
        {showLegend && (
          <div style={{ 
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {/* Status Colors */}
            <div>
              <div style={{ 
                fontWeight: 'bold', 
                marginBottom: '6px',
                color: colors.textPrimary
              }}>
                Node Status
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: '80px' }}>
                  <div style={{ 
                    width: '12px', 
                    height: '12px', 
                    borderRadius: '50%', 
                    backgroundColor: getStatusColor('Normal', currentCity)
                  }}></div>
                  <span>Normal</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: '80px' }}>
                  <div style={{ 
                    width: '12px', 
                    height: '12px', 
                    borderRadius: '50%', 
                    backgroundColor: getStatusColor('Warning', currentCity)
                  }}></div>
                  <span>Warning</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: '80px' }}>
                  <div style={{ 
                    width: '12px', 
                    height: '12px', 
                    borderRadius: '50%', 
                    backgroundColor: getStatusColor('Critical', currentCity)
                  }}></div>
                  <span>Critical</span>
                </div>
              </div>
            </div>
            
            {/* Node Types */}
            <div>
              <div style={{ 
                fontWeight: 'bold', 
                marginBottom: '6px',
                color: colors.textPrimary
              }}>
                Node Types
              </div>
              <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ 
                    width: '20px', 
                    height: '20px', 
                    borderRadius: '50%', 
                    backgroundColor: getStatusColor('Normal', currentCity),
                    border: '3px solid #f8d568',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px'
                  }}>
                    ⚙️
                  </div>
                  <span>Pump Station</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ 
                    width: '20px', 
                    height: '20px', 
                    borderRadius: '20%', 
                    backgroundColor: getStatusColor('Normal', currentCity),
                    border: '3px solid white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px'
                  }}>
                    ✚
                  </div>
                  <span>Junction</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ 
                    width: '20px', 
                    height: '20px', 
                    borderRadius: '50%', 
                    backgroundColor: getStatusColor('Normal', currentCity),
                    border: '3px solid white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px'
                  }}>
                    ⇆
                  </div>
                  <span>Flow Sensor</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ 
                    width: '20px', 
                    height: '20px', 
                    borderRadius: '50%', 
                    backgroundColor: getStatusColor('Normal', currentCity),
                    border: '3px solid white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px'
                  }}>
                    🔄
                  </div>
                  <span>Pressure Sensor</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ 
                    width: '24px', 
                    height: '24px', 
                    borderRadius: '50%', 
                    backgroundColor: getStatusColor('Normal', currentCity),
                    border: '3px solid white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}>
                    P
                  </div>
                  <span>Primary Node</span>
                </div>
              </div>
            </div>
            
            {/* Pipe Types */}
            <div>
              <div style={{ 
                fontWeight: 'bold', 
                marginBottom: '6px',
                color: colors.textPrimary
              }}>
                Pipe Types
              </div>
              <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ 
                    width: '30px', 
                    height: '6px', 
                    backgroundColor: getStatusColor('Normal', currentCity),
                    borderRadius: '3px'
                  }}></div>
                  <span>Main Pipeline</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ 
                    width: '30px', 
                    height: '3px', 
                    backgroundColor: getStatusColor('Normal', currentCity),
                    borderRadius: '2px'
                  }}></div>
                  <span>Secondary Pipeline</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ 
                    width: '30px', 
                    height: '3px', 
                    backgroundColor: getStatusColor('Normal', currentCity),
                    borderRadius: '2px',
                    background: `repeating-linear-gradient(
                      90deg,
                      ${getStatusColor('Normal', currentCity)},
                      ${getStatusColor('Normal', currentCity)} 3px,
                      transparent 3px,
                      transparent 6px
                    )`
                  }}></div>
                  <span>Flow Direction</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <Map
        mapboxAccessToken={mapboxToken}
        initialViewState={viewState}
        style={{ 
          width: '100%', 
          height: '100%', 
          borderRadius: '12px',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
        mapStyle="mapbox://styles/mapbox/light-v11"
        onClick={handleMapClick}
        onLoad={handleMapLoad}
        projection={'mercator' as any}
        interactiveLayerIds={[`mainPipes-${currentCity}`, `secondaryPipes-${currentCity}`]}
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
                    'Normal', getStatusColor('Normal', currentCity),
                    'Warning', getStatusColor('Warning', currentCity),
                    'Critical', getStatusColor('Critical', currentCity),
                    getStatusColor('Normal', currentCity)
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
                    'Normal', getStatusColor('Normal', currentCity),
                    'Warning', getStatusColor('Warning', currentCity),
                    'Critical', getStatusColor('Critical', currentCity),
                    getStatusColor('Normal', currentCity)
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
                    'Normal', currentCity === 'dubai' ? 'rgba(76, 175, 80, 0.8)' : 
                              currentCity === 'sharjah' ? 'rgba(92, 107, 192, 0.8)' :
                              currentCity === 'abudhabi' ? 'rgba(38, 166, 154, 0.8)' :
                              currentCity === 'ajman' ? 'rgba(149, 117, 205, 0.8)' :
                              currentCity === 'ummalquwain' ? 'rgba(236, 64, 122, 0.8)' :
                              currentCity === 'rasalkhaimah' ? 'rgba(255, 152, 0, 0.8)' :
                              'rgba(102, 187, 106, 0.8)',
                    'Warning', currentCity === 'dubai' ? 'rgba(255, 152, 0, 0.8)' :
                               currentCity === 'sharjah' ? 'rgba(251, 140, 0, 0.8)' :
                               currentCity === 'abudhabi' ? 'rgba(255, 143, 0, 0.8)' :
                               currentCity === 'ajman' ? 'rgba(255, 112, 67, 0.8)' :
                               currentCity === 'ummalquwain' ? 'rgba(255, 167, 38, 0.8)' :
                               currentCity === 'rasalkhaimah' ? 'rgba(245, 124, 0, 0.8)' :
                               'rgba(255, 160, 0, 0.8)',
                    currentCity === 'dubai' ? 'rgba(33, 150, 243, 0.8)' :
                    currentCity === 'sharjah' ? 'rgba(57, 73, 171, 0.8)' :
                    currentCity === 'abudhabi' ? 'rgba(0, 137, 123, 0.8)' :
                    currentCity === 'ajman' ? 'rgba(123, 31, 162, 0.8)' :
                    currentCity === 'ummalquwain' ? 'rgba(216, 27, 96, 0.8)' :
                    currentCity === 'rasalkhaimah' ? 'rgba(230, 81, 0, 0.8)' :
                    'rgba(216, 67, 21, 0.8)'
                  ],
                  'line-width': 2.5,
                  'line-opacity': 0.9,
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
                    backgroundColor: getStatusColor(popupInfo.status, popupInfo.city) + '22',
                  }}>
                    <div style={{ 
                      width: '12px', 
                      height: '12px', 
                      borderRadius: '50%', 
                      backgroundColor: getStatusColor(popupInfo.status, popupInfo.city),
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
                    {cityConnections.filter(c => c.startNode === popupInfo.id || c.endNode === popupInfo.id).length} connected pipes
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