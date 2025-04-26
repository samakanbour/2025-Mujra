import { useState, useEffect, useContext, useMemo } from 'react';
import styled from '@emotion/styled';
import { motion, AnimatePresence } from 'framer-motion';
import { InteractiveMap } from './InteractiveMap';
import { SensorNode, PipeConnection } from '../types';
import { MapContext } from '../App';
import React from 'react';
import { EmiratesSelector } from './EmiratesSelector';

interface CollapsibleMapProps {
  nodes: SensorNode[];
  connections: PipeConnection[];
  initialViewState?: {
    longitude: number;
    latitude: number;
    zoom: number;
  };
}

const MapContainer = styled(motion.div)<{ isExpanded: boolean }>`
  width: 50%;
  height: calc(100vh - 70px);
  background-color: white;
  z-index: 10;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  will-change: width;
  transform: translateZ(0);
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
`;

const MapContent = styled.div`
  flex: 1;
  overflow: hidden;
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  .mapboxgl-map {
    width: 100% !important;
    height: 100% !important;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .mapboxgl-canvas {
    width: 100% !important;
    height: 100% !important;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
`;

export function CollapsibleMap({ nodes, connections, initialViewState }: CollapsibleMapProps) {
  const { isMapExpanded } = useContext(MapContext);
  const [mapSize, setMapSize] = useState({ width: 0, height: 0 });
  const [viewState, setViewState] = useState(initialViewState || {
    longitude: 55.2708,
    latitude: 25.2048,
    zoom: 11.5
  });
  const mapContainerRef = React.useRef<HTMLDivElement>(null);

  // Update map dimensions when container size changes
  useEffect(() => {
    const updateMapSize = () => {
      if (mapContainerRef.current) {
        setMapSize({
          width: mapContainerRef.current.clientWidth,
          height: mapContainerRef.current.clientHeight
        });
      }
    };

    updateMapSize();
    window.addEventListener('resize', updateMapSize);
    
    if (mapContainerRef.current) {
      const resizeObserver = new ResizeObserver(updateMapSize);
      resizeObserver.observe(mapContainerRef.current);
      return () => {
        resizeObserver.disconnect();
        window.removeEventListener('resize', updateMapSize);
      };
    }
    
    return () => {
      window.removeEventListener('resize', updateMapSize);
    };
  }, []);

  const handleEmirateChange = (coordinates: { longitude: number; latitude: number; zoom: number }) => {
    setViewState(prev => ({
      ...prev,
      ...coordinates
    }));
  };

  // Create valid viewState with defaults for required properties
  const mapViewState = useMemo(() => {
    return {
      ...viewState,
      width: mapSize.width,
      height: mapSize.height
    };
  }, [viewState, mapSize.width, mapSize.height]);

  return (
    <MapContainer 
      isExpanded={isMapExpanded}
      ref={mapContainerRef}
    >
      <EmiratesSelector onEmirateChange={handleEmirateChange} />
      <MapContent>
        <InteractiveMap 
          nodes={nodes} 
          connections={connections} 
          initialViewState={mapViewState}
          key={`map-${mapSize.width}-${mapSize.height}`}
        />
      </MapContent>
    </MapContainer>
  );
} 