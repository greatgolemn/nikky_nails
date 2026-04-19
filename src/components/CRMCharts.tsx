import React from 'react';
import { motion } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell 
} from 'recharts';

interface CRMChartsProps {
  data: any[];
  type: 'visits' | 'revenue' | 'tiers';
}

const COLORS = ['#D9A6A6', '#1F2937', '#E5E7EB'];

export const CRMCharts: React.FC<CRMChartsProps> = ({ data, type }) => {
  return (
    <div className="h-[300px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        {type === 'revenue' ? (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip 
              contentStyle={{ background: '#fff', border: 'none', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.05)' }}
            />
            <Bar dataKey="revenue" fill="#D9A6A6" radius={[6, 6, 0, 0]} />
          </BarChart>
        ) : type === 'visits' ? (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip 
              contentStyle={{ background: '#fff', border: 'none', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.05)' }}
            />
            <Line type="monotone" dataKey="visits" stroke="#1F2937" strokeWidth={3} dot={{ fill: '#D9A6A6', r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        ) : (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};
