import { memo, useMemo } from 'react';
import { Layer, Source, Marker } from 'react-map-gl';
import { motion } from 'framer-motion';
import { SensorNode, PipeConnection, SystemStatus } from '../types';
import { colors } from '../styles/global';

interface DrainageNetworkProps {
  nodes: SensorNode[];
  connections: PipeConnection[];
}

const getStatusColor = (status: SystemStatus) => {
  switch (status) {
    case 'Normal':
      return colors.statusGood;
    case 'Warning':
      return colors.statusWarning;
    case 'Critical':
      return colors.statusCritical;
  }
};

const SensorNodeMarker = memo(({ node }: { node: SensorNode }) => {
  return (
    <Marker 
      longitude={node.position[0]} 
      latitude={node.position[1]}
      anchor="center"
    >
      <motion.div
        style={{
          width: 20,
          height: 20,
          backgroundColor: getStatusColor(node.status),
          borderRadius: '50%',
          border: '2px solid white',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.8, 1, 0.8],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </Marker>
  );
});

const DrainageNetwork = ({ nodes, connections }: DrainageNetworkProps) => {
  const pipeData = useMemo(() => ({
    type: 'FeatureCollection',
    features: connections.map(connection => {
      const startNode = nodes.find(n => n.id === connection.startNode);
      const endNode = nodes.find(n => n.id === connection.endNode);
      return {
        type: 'Feature',
        properties: {
          status: connection.status,
        },
        geometry: {
          type: 'LineString',
          coordinates: [
            startNode?.position || [0, 0],
            endNode?.position || [0, 0],
          ],
        },
      };
    }),
  }), [nodes, connections]);

  return (
    <>
      <Source type="geojson" data={pipeData}>
        <Layer
          id="pipes"
          type="line"
          layout={{
            'line-join': 'round',
            'line-cap': 'round',
          }}
          paint={{
            'line-color': ['get', ['get', 'status'], {
              'Normal': colors.statusGood,
              'Warning': colors.statusWarning,
              'Critical': colors.statusCritical,
            }],
            'line-width': 3,
            'line-opacity': 0.8,
          }}
        />
      </Source>
      {nodes.map(node => (
        <SensorNodeMarker key={node.id} node={node} />
      ))}
    </>
  );
};

export default DrainageNetwork; 