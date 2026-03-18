'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StayChartProps {
  data: any[];
  benchmark?: any[];
  selectedYear?: number;
  benchmarkLabel?: string;
}

export function StayChart({ data, benchmark, selectedYear, benchmarkLabel }: StayChartProps) {
  const isComparison = benchmark && benchmark.length > 0;
  
  // Merge data for comparison
  const mergedData = data.map(item => {
    const benchmarkItem = benchmark?.find(b => b.bucket === item.bucket);
    return {
      bucket: item.bucket,
      selected: item.cantidad,
      benchmark: benchmarkItem ? benchmarkItem.cantidad : 0
    };
  });

  // Ensure all buckets from benchmark are also represented even if data doesn't have them
  if (isComparison) {
      benchmark?.forEach(b => {
          if (!mergedData.find(m => m.bucket === b.bucket)) {
              mergedData.push({
                  bucket: b.bucket,
                  selected: 0,
                  benchmark: b.cantidad
              });
          }
      });
  }

  // Soft sort buckets
  const bucketOrder = ['1 día', '2 días', '3 días', '4 días', '5 días', '7-10 días', '+10 días'];
  mergedData.sort((a, b) => bucketOrder.indexOf(a.bucket) - bucketOrder.indexOf(b.bucket));

  return (
    <Card className="col-span-1 lg:col-span-2 transition-all shadow-md border-none bg-white">
      <CardHeader className="pb-2 border-b border-slate-50">
        <CardTitle className="text-base font-black text-slate-800 flex items-center gap-2">
           <Clock className="h-4 w-4 text-blue-500" />
           Distribución de Estancia Media
        </CardTitle>
        <p className="text-xs text-slate-500">
            {isComparison 
                ? `Comparativa: Año ${selectedYear} vs ${benchmarkLabel}` 
                : `Datos consolidados de permanencia - Gestión de Slots`}
        </p>
      </CardHeader>
      <CardContent className="pt-6 h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={isComparison ? mergedData : data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
                dataKey="bucket" 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 11, fill: '#64748b', fontWeight: 'bold'}}
            />
            <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 10, fill: '#94a3b8'}}
            />
            <RechartsTooltip 
              cursor={{fill: '#f8fafc'}}
              contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
            />
            <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '20px' }} />
            
            <Bar 
                dataKey={isComparison ? "selected" : "cantidad"} 
                fill="#3b82f6"
                radius={[4, 4, 0, 0]} 
                name={isComparison ? `Año ${selectedYear}` : "Vehículos"}
                barSize={isComparison ? 30 : 50}
            />
            
            {isComparison && (
                <Bar 
                    dataKey="benchmark" 
                    fill="#e2e8f0"
                    radius={[4, 4, 0, 0]} 
                    name={benchmarkLabel}
                    barSize={30}
                />
            )}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

import { Clock } from 'lucide-react';
