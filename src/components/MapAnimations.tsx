import React, { useState, useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';

interface FlowAnimationProps {
  connections: Array<{
    id: string;
    startNode: string;
    endNode: string;
    startPosition: [number, number];
    endPosition: [number, number];
    status?: string;
    flow?: number;
  }>;
  nodes: any[];
  visible: boolean;
}

export const FlowAnimation: React.FC<FlowAnimationProps> = ({ 
  connections, 
  nodes, 
  visible 
}) => {
  const map = useMap();
  const [particles, setParticles] = useState<L.CircleMarker[]>([]);
  
  // Create a reference for animation frame
  const animationRef = React.useRef<number | null>(null);
  
  // Calculate particle speed based on flow
  const getParticleSpeed = (flow?: number) => {
    const baseSpeed = 0.0005; // Base speed
    const flowMultiplier = flow || 1;
    return baseSpeed * Math.min(flowMultiplier, 3); // Cap speed multiplier at 3x
  };
  
  // Get particle color based on status
  const getParticleColor = (status?: string) => {
    switch(status) {
      case 'Critical':
        return '#ff5252';
      case 'Warning':
        return '#ffb142';
      default:
        return '#4fc3f7';
    }
  };
  
  useEffect(() => {
    // Remove existing particles when connections change or visibility changes
    particles.forEach(particle => particle.remove());
    setParticles([]);
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    if (!visible || connections.length === 0) return;
    
    // Create a map of node positions for quick lookup
    const nodePositionMap = new Map();
    nodes.forEach(node => {
      nodePositionMap.set(node.id, L.latLng(node.position[1], node.position[0]));
    });
    
    // Create new particles
    const newParticles: L.CircleMarker[] = [];
    
    // Function to animate particles
    const animateParticles = () => {
      connections.forEach((connection, connectionIndex) => {
        // Skip connections with missing nodes
        if (!nodePositionMap.has(connection.startNode) || 
            !nodePositionMap.has(connection.endNode)) {
          return;
        }
        
        const startPos = nodePositionMap.get(connection.startNode);
        const endPos = nodePositionMap.get(connection.endNode);
        
        // Calculate how many particles to show based on flow
        const particleCount = connection.flow ? Math.max(1, Math.min(Math.floor(connection.flow), 3)) : 1;
        
        for (let i = 0; i < particleCount; i++) {
          // Create a new particle with a random offset in the connection
          // Offset makes particles appear at different positions in the connection
          const randomOffset = Math.random();
          
          // Calculate particle position
          const position = L.latLng(
            startPos.lat + (endPos.lat - startPos.lat) * randomOffset,
            startPos.lng + (endPos.lng - startPos.lng) * randomOffset
          );
          
          // Create particle
          const particle = L.circleMarker(position, {
            radius: 2,
            color: getParticleColor(connection.status),
            fillColor: getParticleColor(connection.status),
            fillOpacity: 0.8,
            weight: 1
          }).addTo(map);
          
          // Store additional data
          (particle as any).connectionId = connection.id;
          (particle as any).startPos = startPos;
          (particle as any).endPos = endPos;
          (particle as any).progress = randomOffset;
          (particle as any).speed = getParticleSpeed(connection.flow);
          
          newParticles.push(particle);
        }
      });
      
      setParticles(prevParticles => [...prevParticles, ...newParticles]);
    };
    
    // Initial particle creation
    animateParticles();
    
    // Animation loop
    let lastTime = 0;
    const animate = (timestamp: number) => {
      const deltaTime = timestamp - lastTime;
      lastTime = timestamp;
      
      // Move each particle along its connection
      particles.forEach(particle => {
        const startPos = (particle as any).startPos;
        const endPos = (particle as any).endPos;
        const progress = (particle as any).progress;
        const speed = (particle as any).speed;
        
        // Update progress
        (particle as any).progress = (progress + speed * deltaTime / 16) % 1;
        
        // Calculate new position
        const newPos = L.latLng(
          startPos.lat + (endPos.lat - startPos.lat) * (particle as any).progress,
          startPos.lng + (endPos.lng - startPos.lng) * (particle as any).progress
        );
        
        // Update marker position
        particle.setLatLng(newPos);
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    // Cleanup function
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      particles.forEach(particle => particle.remove());
    };
  }, [connections, nodes, map, visible]);
  
  return null;
};

interface HeatmapLayerProps {
  nodes: Array<{
    id: string;
    position: [number, number];
    status?: string;
    type?: string;
  }>;
  visible: boolean;
  intensity?: number;
  radius?: number;
}

export const HeatmapLayer: React.FC<HeatmapLayerProps> = ({ 
  nodes, 
  visible, 
  intensity = 1, 
  radius = 15 
}) => {
  const map = useMap();
  const [heatLayer, setHeatLayer] = useState<L.HeatLayer | null>(null);
  
  useEffect(() => {
    // Remove existing heat layer
    if (heatLayer) {
      map.removeLayer(heatLayer);
      setHeatLayer(null);
    }
    
    if (!visible || nodes.length === 0) return;
    
    // Prepare heat data
    const heatData = nodes.map(node => {
      // Calculate intensity based on node status
      let nodeIntensity = 0.3;
      
      if (node.status === 'Warning') {
        nodeIntensity = 0.6;
      } else if (node.status === 'Critical') {
        nodeIntensity = 1.0;
      }
      
      // Extra intensity for important nodes
      if (node.type === 'Pump' || node.type === 'Facility') {
        nodeIntensity *= 1.5;
      }
      
      // Apply global intensity modifier
      nodeIntensity *= intensity;
      
      // Return [lat, lng, intensity]
      return [node.position[1], node.position[0], nodeIntensity];
    });
    
    // Create heat layer
    // @ts-ignore - leaflet.heat types might not be available
    const newHeatLayer = L.heatLayer(heatData, {
      radius,
      blur: radius * 1.5,
      maxZoom: 17,
      gradient: {
        0.2: 'blue',
        0.4: 'cyan',
        0.6: 'lime',
        0.8: 'yellow',
        1.0: 'red'
      }
    }).addTo(map);
    
    setHeatLayer(newHeatLayer);
    
    // Cleanup function
    return () => {
      if (newHeatLayer) {
        map.removeLayer(newHeatLayer);
      }
    };
  }, [map, nodes, visible, intensity, radius]);
  
  return null;
};

interface PulseMarkerProps {
  position: [number, number];
  color?: string;
  size?: number;
  pulseSize?: number;
  pulseDuration?: number;
  visible?: boolean;
}

export const PulseMarker: React.FC<PulseMarkerProps> = ({
  position,
  color = '#4fc3f7',
  size = 10,
  pulseSize = 30,
  pulseDuration = 2,
  visible = true
}) => {
  const map = useMap();
  const [marker, setMarker] = useState<L.CircleMarker | null>(null);
  const [pulseCircle, setPulseCircle] = useState<L.CircleMarker | null>(null);
  
  useEffect(() => {
    // Clean up existing markers
    if (marker) marker.remove();
    if (pulseCircle) pulseCircle.remove();
    
    if (!visible) return;
    
    // Create base marker
    const newMarker = L.circleMarker([position[1], position[0]], {
      radius: size,
      fillColor: color,
      color: color,
      weight: 2,
      opacity: 0.8,
      fillOpacity: 0.6
    }).addTo(map);
    
    // Create pulse circle
    const newPulseCircle = L.circleMarker([position[1], position[0]], {
      radius: size,
      fillColor: color,
      color: color,
      weight: 2,
      opacity: 0.4,
      fillOpacity: 0.2
    }).addTo(map);
    
    setMarker(newMarker);
    setPulseCircle(newPulseCircle);
    
    // Animation
    let startTime = performance.now();
    let animationId: number;
    
    const animate = () => {
      const elapsed = (performance.now() - startTime) / 1000; // seconds
      const progress = (elapsed % pulseDuration) / pulseDuration;
      
      // Calculate current pulse size
      const currentSize = size + (pulseSize - size) * progress;
      
      // Calculate opacity based on progress
      const currentOpacity = Math.max(0, 0.4 - progress * 0.4);
      const currentFillOpacity = Math.max(0, 0.2 - progress * 0.2);
      
      if (newPulseCircle) {
        newPulseCircle.setRadius(currentSize);
        newPulseCircle.setStyle({
          opacity: currentOpacity,
          fillOpacity: currentFillOpacity
        });
      }
      
      animationId = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      cancelAnimationFrame(animationId);
      if (newMarker) newMarker.remove();
      if (newPulseCircle) newPulseCircle.remove();
    };
  }, [map, position, color, size, pulseSize, pulseDuration, visible]);
  
  return null;
}; 