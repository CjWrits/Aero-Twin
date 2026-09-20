import React from 'react';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  width = 65,
  height = 18,
  color = '#2563eb'
}) => {
  if (!data || data.length < 2) {
    return (
      <svg width={width} height={height} className="sparkline-svg">
        <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="#cbd5e1" strokeDasharray="2,2" />
      </svg>
    );
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((val, idx) => {
      const x = (idx / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const lastX = width;
  const lastY = height - ((data[data.length - 1] - min) / range) * (height - 4) - 2;

  return (
    <svg width={width} height={height} className="sparkline-svg" style={{ overflow: 'visible' }}>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
      <circle cx={lastX} cy={lastY} r="2" fill={color} />
    </svg>
  );
};
