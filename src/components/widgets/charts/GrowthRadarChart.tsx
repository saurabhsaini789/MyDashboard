"use client";

import React from 'react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip
} from 'recharts';

interface GrowthRadarChartProps {
  data: any[];
}

export default function GrowthRadarChart({ data }: GrowthRadarChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
        <PolarGrid stroke="#e4e4e7" strokeDasharray="3 3" />
        <PolarAngleAxis 
          dataKey="name" 
          tick={{ fontSize: 10, fill: '#71717A', fontWeight: '500' }} 
        />
        <PolarRadiusAxis 
          angle={30} 
          domain={[0, 100]} 
          tick={false} 
          axisLine={false} 
        />
        <Radar
          name="Score"
          dataKey="score"
          stroke="#14b8a6"
          fill="#14b8a6"
          fillOpacity={0.4}
          animationDuration={1500}
        />
        <Tooltip 
           contentStyle={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.95)', 
            borderRadius: '12px', 
            border: '1px solid #e4e4e7',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            fontSize: '12px',
            fontWeight: '600'
          }} 
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
