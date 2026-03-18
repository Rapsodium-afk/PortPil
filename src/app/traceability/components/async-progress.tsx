'use client';

import React, { useState, useEffect } from 'react';
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { getReportStatusAction } from '@/lib/traceability';

interface AsyncProgressProps {
  jobId: string;
  onComplete: (result: any) => void;
  title: string;
}

export function AsyncProgress({ jobId, onComplete, title }: AsyncProgressProps) {
  const [status, setStatus] = useState<string>('waiting');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const checkStatus = async () => {
      try {
        const data = await getReportStatusAction(jobId);
        
        if (data.status === 'completed') {
          setStatus('completed');
          setProgress(100);
          clearInterval(interval);
          onComplete(data.result);
        } else if (data.status === 'failed') {
          setStatus('failed');
          setError('El proceso ha fallado.');
          clearInterval(interval);
        } else {
          setStatus(data.status || 'processing');
          setProgress(Number(data.progress) || 0);
        }
      } catch (err) {
        console.error('Error checking report status:', err);
      }
    };

    interval = setInterval(checkStatus, 1500);
    checkStatus();

    return () => clearInterval(interval);
  }, [jobId, onComplete]);

  return (
    <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
          {status === 'completed' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          ) : status === 'failed' ? (
            <AlertCircle className="h-4 w-4 text-rose-500" />
          ) : (
            <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
          )}
          {title}
        </h4>
        <Badge variant="outline" className="bg-white text-[10px] font-bold uppercase">
          {status} {progress}%
        </Badge>
      </div>
      
      <Progress value={progress} className="h-2 bg-blue-100" />
      
      {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
      {status !== 'completed' && status !== 'failed' && (
        <p className="text-[10px] text-slate-400 font-medium italic">
          Procesando grandes volúmenes de datos (+1M registros)...
        </p>
      )}
    </div>
  );
}
