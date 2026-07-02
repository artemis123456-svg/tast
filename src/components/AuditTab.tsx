import React from 'react';
import { ClipboardList, Shield, Clock, ShieldAlert, ArrowUpRight } from 'lucide-react';
import { AuditLog } from '../types';

interface AuditTabProps {
  auditLogs: AuditLog[];
}

export default function AuditTab({ auditLogs }: AuditTabProps) {
  // Sort descending by timestamp
  const sorted = [...auditLogs].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-zinc-200 font-bold text-sm uppercase tracking-wide flex items-center space-x-2">
          <ClipboardList className="w-4 h-4 text-[#FF00FF]" />
          <span>Registro de Auditoría de Operaciones (Security AuditTrail)</span>
        </h2>
        <p className="text-zinc-500 text-xs mt-0.5">Bitácora inalterable de transacciones, anulaciones, arqueos y movimientos de stock por camarero</p>
      </div>

      <div className="bg-zinc-950 border border-zinc-900 rounded-2xl overflow-hidden p-4">
        <div className="max-h-[500px] overflow-y-auto pr-2 space-y-3 scrollbar-thin">
          {sorted.length === 0 ? (
            <div className="py-12 text-center text-zinc-650 font-mono text-xs">
              No hay registros de auditoría almacenados en el servidor central
            </div>
          ) : (
            sorted.map((log) => {
              const date = new Date(log.timestamp).toLocaleString('es-ES', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                day: '2-digit',
                month: '2-digit'
              });

              const isAlert = log.accion.toLowerCase().includes('eliminar') || 
                              log.accion.toLowerCase().includes('anular') || 
                              log.accion.toLowerCase().includes('caja') ||
                              log.accion.toLowerCase().includes('diferencia');

              return (
                <div 
                  key={log.id} 
                  className={`p-3 bg-black border rounded-xl flex items-start space-x-3 transition-colors ${
                    isAlert ? 'border-amber-950/40 bg-amber-950/5' : 'border-zinc-900 hover:border-zinc-800'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg border mt-0.5 ${
                    isAlert ? 'bg-amber-950/20 text-amber-500 border-amber-900/30' : 'bg-zinc-900 text-[#FF00FF] border-zinc-800'
                  }`}>
                    {isAlert ? <ShieldAlert className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                  </div>

                  <div className="flex-1 font-mono text-xs">
                    <div className="flex justify-between items-start flex-wrap gap-2">
                      <span className="font-bold text-white uppercase tracking-tight text-[11px]">{log.accion}</span>
                      <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {date}
                      </span>
                    </div>

                    <p className="text-zinc-400 mt-1 text-[11px] leading-normal">{log.descripcion}</p>

                    <div className="mt-2 flex items-center space-x-1">
                      <span className="text-[9px] text-zinc-600 uppercase">Operario:</span>
                      <span className="text-[9px] bg-zinc-900 border border-zinc-800 text-zinc-300 font-bold px-1.5 py-0.2 rounded uppercase">
                        {log.usuario || 'Sistema'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
