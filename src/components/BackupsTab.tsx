import React, { useState, useEffect } from 'react';
import { Database, Plus, RefreshCw, HardDrive, Shield, AlertTriangle, FileCheck } from 'lucide-react';
import { Backup } from '../types';

export default function BackupsTab() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchBackups = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/backups');
      if (res.ok) {
        const list = await res.json();
        setBackups(list);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const handleCreateBackup = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/backups/create', { method: 'POST' });
      if (res.ok) {
        alert('✅ Copia de seguridad generada con éxito y firmada en el disco.');
        fetchBackups();
      }
    } catch (e) {
      alert('Error al instanciar copia de seguridad');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreBackup = async (id: string) => {
    if (!confirm('⚠️ ¿ESTÁS SEGURO? Esta acción reemplazará la base de datos de ventas actual con este punto de restauración. El servidor se reiniciará inmediatamente.')) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/backups/restore', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: id })
      });
      if (res.ok) {
        alert('✅ Base de datos restaurada satisfactoriamente. Recargando aplicación...');
        window.location.reload();
      } else {
        alert('Error al re-escribir el backup seleccionado.');
      }
    } catch (e) {
      alert('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-zinc-200 font-bold text-sm uppercase tracking-wide flex items-center space-x-2">
            <Database className="w-4 h-4 text-[#FF00FF]" />
            <span>Copias de Seguridad Automatizadas (Disaster Recovery)</span>
          </h2>
          <p className="text-zinc-500 text-xs mt-0.5">Instantáneas de la base de datos con recuperación inmutable en un solo clic</p>
        </div>

        <button
          onClick={handleCreateBackup}
          disabled={isLoading}
          className="bg-[#FF00FF] hover:bg-[#FF00FF]/95 disabled:opacity-50 text-black px-4 py-2 text-xs font-mono font-black uppercase tracking-tighter flex items-center space-x-1.5 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Crear Punto Restauración</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: List of Backup Points */}
        <div className="lg:col-span-8 space-y-3">
          {isLoading && (
            <div className="text-center py-6 text-[#FF00FF] font-mono text-xs animate-pulse">
              Consultando base de copias físicas...
            </div>
          )}

          {!isLoading && backups.length === 0 ? (
            <div className="p-6 bg-zinc-950 border border-zinc-900 rounded-2xl text-center text-zinc-550 font-mono text-xs">
              No hay backups registrados. Pulsa "Crear Punto Restauración" para registrar el primero.
            </div>
          ) : (
            backups.map(b => (
              <div 
                key={b.id} 
                className="p-4 bg-zinc-950 border border-zinc-900 hover:border-zinc-800 rounded-2xl flex items-center justify-between transition-colors font-mono text-xs"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-xl">
                    <HardDrive className="w-4 h-4 text-zinc-450" />
                  </div>
                  <div>
                    <span className="text-white font-bold block">{b.nombre}</span>
                    <span className="text-[10px] text-zinc-550 block mt-0.5">
                      Firma temporal: {new Date(b.timestamp).toLocaleString('es-ES')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <span className="text-[10px] px-2 py-0.5 bg-zinc-900 text-zinc-400 rounded-lg border border-zinc-800">
                    {b.tamano || '4.2 KB'}
                  </span>
                  
                  <button
                    onClick={() => handleRestoreBackup(b.id)}
                    className="bg-[#FF00FF]/10 text-[#FF00FF] border border-[#FF00FF]/40 hover:bg-[#FF00FF] hover:text-black py-1 px-3 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all cursor-pointer"
                  >
                    Restaurar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right Column: Security policies card */}
        <div className="lg:col-span-4 p-4 bg-zinc-950 border border-zinc-900 rounded-2xl space-y-4">
          <h3 className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Políticas de Recuperación</span>
          </h3>

          <div className="space-y-3 text-[11px] text-zinc-500 font-mono leading-relaxed">
            <p>
              ✔ <b>Aislamiento Físico:</b> Las instantáneas se graban en un directorio físico persistente del servidor Linux central.
            </p>
            <p>
              ✔ <b>Verificación Cíclica:</b> Cada backup consolida ventas, comensales, auditorías y recetas, protegiendo al local ante cortes de red o pérdidas de caché.
            </p>
            <p className="bg-amber-950/10 border border-amber-900/30 p-2.5 rounded-xl text-amber-500 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span><b>ADVERTENCIA:</b> Restaurar una copia de seguridad sobrescribe las ventas no guardadas de hoy. Asegúrate de cerrar caja antes de proceder.</span>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
