import { memo, useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { colors } from '../styles/global';
import { motion } from 'framer-motion';

interface RiskOverviewProps {
  riskPercentage: number;
}

const RiskBar = styled.div`
  width: 100%;
  height: 20px;
  background-color: #eee;
  border-radius: 10px;
  overflow: hidden;
  margin-top: 1rem;
`;

const RiskFill = styled(motion.div)<{ percentage: number }>`
  height: 100%;
  width: ${props => props.percentage}%;
  background-color: ${props => 
    props.percentage < 30 ? colors.statusGood :
    props.percentage < 70 ? colors.statusWarning :
    colors.statusCritical
  };
`;

const RiskValue = styled.div<{ percentage: number }>`
  font-size: 2rem;
  font-weight: bold;
  color: ${props => 
    props.percentage < 30 ? colors.statusGood :
    props.percentage < 70 ? colors.statusWarning :
    colors.statusCritical
  };
  margin-top: 0.5rem;
`;

const RiskOverview = memo(({ riskPercentage }: RiskOverviewProps) => {
  // Use a separate smoothed state for display
  const [smoothValue, setSmoothValue] = useState(riskPercentage);
  
  // Update the smoothed value whenever the raw value changes
  useEffect(() => {
    // Animate to the new value
    const animation = { 
      start: smoothValue,
      end: riskPercentage,
      duration: 1000, // 1 second animation
      startTime: performance.now()
    };
    
    // Smooth animation frame
    const animateValue = (timestamp: number) => {
      const elapsed = timestamp - animation.startTime;
      const progress = Math.min(elapsed / animation.duration, 1);
      // Use easeOutQuad easing for smoother feel
      const easedProgress = 1 - (1 - progress) * (1 - progress);
      const current = animation.start + (animation.end - animation.start) * easedProgress;
      
      setSmoothValue(current);
      
      if (progress < 1) {
        requestAnimationFrame(animateValue);
      }
    };
    
    const animationFrame = requestAnimationFrame(animateValue);
    
    return () => cancelAnimationFrame(animationFrame);
  }, [riskPercentage]);
  
  // Format to two decimal places for display
  const formattedValue = smoothValue.toFixed(2);
  
  return (
    <div>
      <h2>Flooding Risk Overview</h2>
      <RiskValue percentage={smoothValue}>
        {formattedValue}%
      </RiskValue>
      <RiskBar>
        <RiskFill
          percentage={smoothValue}
          initial={{ width: 0 }}
          animate={{ width: `${smoothValue}%` }}
          transition={{ duration: 0.5 }}
        />
      </RiskBar>
    </div>
  );
});

export default RiskOverview; 