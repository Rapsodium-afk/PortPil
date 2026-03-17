'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface TrendChartProps {
  data: any[];
}

export function TrendChart({ data }: TrendChartProps) {
  // Detect if data is un-pivoted (multi-terminal) or aggregate (single value)
  const isAggregate = data.length > 0 && !('terminal_id' in data[0]);

  // Pivot mapping: transform data from [{label, terminal_id, ocupacion}] to [{label, T1: 10, T2: 20}]
  const pivotedData = isAggregate ? data : data.reduce((acc: any[], curr) => {
    const existing = acc.find(item => item.label === curr.label);
    const val = curr.ocupacion ?? curr.value; // Handle both occupancy and volume
    if (existing) {
      existing[curr.terminal_id] = val;
    } else {
      acc.push({ label: curr.label, [curr.terminal_id]: val });
    }
    return acc;
  }, []);

  // Extract unique terminal IDs for lines
  const terminals = isAggregate ? [] : Array.from(new Set(data.map(d => d.terminal_id)));
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <Card className="col-span-1 lg:col-span-2 shadow-lg border-none bg-white/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-slate-800">Evolución Detallada</CardTitle>
        <CardDescription>Tendencia histórica para optimización de flujo</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={pivotedData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="label" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 10 }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 10 }} 
              />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '20px' }} />
              
              {isAggregate ? (
                <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#3b82f6" 
                    strokeWidth={4}
                    dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                    activeDot={{ r: 6 }}
                    name="Total"
                />
              ) : (
                terminals.map((id, index) => (
                    <Line 
                      key={id}
                      type="monotone" 
                      dataKey={id} 
                      stroke={colors[index % colors.length]} 
                      strokeWidth={3}
                      dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                      activeDot={{ r: 6 }}
                      name={`Terminal ${id}`}
                    />
                ))
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
