import React from 'react';
import styled from '@emotion/styled';
import { colors } from '../styles/global';

const emirates = [
  { name: 'Dubai', coordinates: { longitude: 55.2708, latitude: 25.2048, zoom: 11.5 } },
  { name: 'Abu Dhabi', coordinates: { longitude: 54.3770, latitude: 24.4539, zoom: 11.5 } },
  { name: 'Sharjah', coordinates: { longitude: 55.4033, latitude: 25.3463, zoom: 11.5 } },
  { name: 'Ajman', coordinates: { longitude: 55.5136, latitude: 25.4052, zoom: 12 } },
  { name: 'Umm Al Quwain', coordinates: { longitude: 55.5552, latitude: 25.5653, zoom: 12 } },
  { name: 'Ras Al Khaimah', coordinates: { longitude: 55.9432, latitude: 25.7895, zoom: 11.5 } },
  { name: 'Fujairah', coordinates: { longitude: 56.3327, latitude: 25.1288, zoom: 11.5 } }
];

const Select = styled.select`
  position: absolute;
  top: 20px;
  left: 10px;
  z-index: 1000;
  padding: 10px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background: white;
  color: ${colors.textPrimary};
  font-size: 14px;
  cursor: pointer;
  outline: none;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: ${colors.primary};
  }
  
  &:focus {
    border-color: ${colors.primary};
    box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.1);
  }
`;

interface EmiratesSelectorProps {
  onEmirateChange: (coordinates: { longitude: number; latitude: number; zoom: number }) => void;
}

export function EmiratesSelector({ onEmirateChange }: EmiratesSelectorProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedEmirate = emirates.find(emirate => emirate.name === e.target.value);
    if (selectedEmirate) {
      onEmirateChange(selectedEmirate.coordinates);
    }
  };

  return (
    <Select defaultValue="Dubai" onChange={handleChange}>
      {emirates.map(emirate => (
        <option key={emirate.name} value={emirate.name}>
          {emirate.name}
        </option>
      ))}
    </Select>
  );
} 