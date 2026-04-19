"use client";

import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

interface GrowthTrendChartProps {
  data: any[];
}

export default function GrowthTrendChart({ data }: GrowthTrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.1}/>
            <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" opacity={0.5} />
        <XAxis 
          dataKey="name" 
          axisLine={false} 
          tickLine={false} 
          tick={{ fontSize: 10, fill: '#A1A1AA' }}
          dy={10}
        />
        <YAxis 
          domain={[0, 100]} 
          axisLine={false} 
          tickLine={false} 
          tick={{ fontSize: 10, fill: '#A1A1AA' }}
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
          itemStyle={{ color: '#14b8a6' }}
          cursor={{ stroke: '#14b8a6', strokeWidth: 1, strokeDasharray: '4 4' }}
        />
        <Line 
          type="monotone" 
          dataKey="score" 
          stroke="#14b8a6" 
          strokeWidth={3} 
          dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} 
          activeDot={{ r: 6, strokeWidth: 0 }}
          animationDuration={1500}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
