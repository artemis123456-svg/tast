import React, { useState } from 'react';
import { Users, Plus, Shield, Clock, TrendingUp, DollarSign, Trash2, Power } from 'lucide-react';
import { Waiter } from '../types';

interface WaitersTabProps {
  waiters: Waiter[];
  onRefresh: () => void;
}

export default function WaitersTab({ waiters, onRefresh }: WaitersTabProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newNombre, setNewNombre] = useState('');
  const [newPin, setNewPin] = useState('');
  const [newColor, setNewColor] = useState('#FF00FF');
  const [newFoto, setNewFoto] = useState('');

  const handleAddWaiter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNombre || !newPin) return;

    try {
      const res = await fetch('/api/waiters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: newNombre,
          pin: newPin,
          color: newColor,
          foto_url: newFoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&fit=crop&q=80',
          activo: true
        })
      });

      if (res.ok) {
        onRefresh();
        setShowAddModal(false);
        setNewNombre('');
        setNewPin('');
        setNewFoto('');
      } else {
        const err = await res.json();
        alert(err.error);
      }
    } catch (e) {
      alert('Error de conexión');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Seguro que deseas dar de baja o eliminar a este camarero?')) return;
    try {
      const res = await fetch(`/api/waiters/${id}`, { method: 'DELETE' });
      if (res.ok) onRefresh();
    } catch (e) {
      alert('Error de conexión');
    }
  };

  const handleToggleActive = async (waiter: Waiter) => {
    try {
      const res = await fetch(`/api/waiters/${waiter.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: !waiter.activo })
      });
      if (res.ok) onRefresh();
    } catch (e) {
      alert('Error de conexión');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-zinc-200 font-bold text-sm uppercase tracking-wide flex items-center space-x-2">
            <Users className="w-4 h-4 text-[#FF00FF]" />
            <span>Gestión de Camareros y Registro de Turnos</span>
          </h2>
          <p className="text-zinc-500 text-xs mt-0.5">Control de PIN, turnos de trabajo, ventas acumuladas y propinas por camarero</p>
        </div>
        
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-[#FF00FF] hover:bg-[#FF00FF]/90 text-black px-4 py-2 text-xs font-black uppercase tracking-tighter flex items-center space-x-1.5 transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          <span>Contratar Personal</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {waiters.map(w => (
          <div 
            key={w.id} 
            className={`p-4 bg-zinc-950 border rounded-2xl relative overflow-hidden transition-all ${
              w.activo ? 'border-zinc-850 hover:border-[#FF00FF]/50' : 'border-zinc-900 opacity-60'
            }`}
          >
            {/* Color Accent Badge */}
            <div className="absolute top-0 left-0 w-full h-1.5" style={{ backgroundColor: w.color }} />

            <div className="flex items-start justify-between mt-1">
              <div className="flex items-center space-x-3">
                <img 
                  src={w.foto_url} 
                  alt={w.nombre} 
                  className="w-12 h-12 rounded-full object-cover border-2"
                  style={{ borderColor: w.color }}
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                    {w.nombre}
                    {!w.activo && <span className="text-[8px] px-1.5 py-0.2 bg-zinc-800 text-zinc-500 rounded font-mono uppercase">Inactivo</span>}
                  </h3>
                  <p className="text-zinc-500 text-xs font-mono flex items-center space-x-1">
                    <Shield className="w-3 h-3 text-zinc-600" />
                    <span>PIN: {w.pin}</span>
                  </p>
                </div>
              </div>

              <div className="flex space-x-1">
                <button
                  onClick={() => handleToggleActive(w)}
                  title={w.activo ? 'Dar de baja temporal' : 'Reactivar camarero'}
                  className={`p-1.5 border rounded-lg transition-colors cursor-pointer ${
                    w.activo ? 'border-zinc-800 text-zinc-400 hover:text-red-400' : 'border-zinc-800 text-zinc-600 hover:text-emerald-400'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(w.id)}
                  title="Eliminar registro"
                  className="p-1.5 border border-zinc-800 text-zinc-400 hover:text-red-500 hover:border-red-950/40 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Shift Indicators */}
            <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-zinc-900 text-center">
              <div className="p-2 bg-black rounded-xl">
                <span className="text-zinc-500 text-[9px] block uppercase font-mono">Horas</span>
                <span className="text-xs font-mono font-bold text-zinc-200 flex items-center justify-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3 text-sky-400" />
                  {w.horas_trabajadas || 0}h
                </span>
              </div>
              <div className="p-2 bg-black rounded-xl">
                <span className="text-zinc-500 text-[9px] block uppercase font-mono">Ventas</span>
                <span className="text-xs font-mono font-bold text-zinc-200 flex items-center justify-center gap-1 mt-0.5">
                  <TrendingUp className="w-3 h-3 text-emerald-400" />
                  {(w.ventas_totales || 0).toFixed(1)}€
                </span>
              </div>
              <div className="p-2 bg-black rounded-xl">
                <span className="text-zinc-500 text-[9px] block uppercase font-mono">Propinas</span>
                <span className="text-xs font-mono font-bold text-[#FF00FF] flex items-center justify-center gap-1 mt-0.5">
                  <DollarSign className="w-3 h-3 text-pink-400" />
                  {(w.propinas_totales || 0).toFixed(1)}€
                </span>
              </div>
            </div>

            {/* Active Turn/Shift indicator */}
            {w.turnos?.some(t => t.activo) ? (
              <div className="mt-3 text-center p-1 px-3 bg-emerald-950/30 border border-emerald-900/60 rounded-xl">
                <span className="text-[10px] font-mono font-bold text-emerald-400 animate-pulse uppercase tracking-widest block">
                  🟢 Turno Abierto Actualmente
                </span>
              </div>
            ) : (
              <div className="mt-3 text-center p-1 px-3 bg-zinc-900/40 border border-zinc-900/40 rounded-xl">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">
                  Fuera de Turno
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Waiter Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-[#FF00FF] rounded-2xl w-full max-w-md p-6 relative shadow-[0_0_30px_rgba(255,0,255,0.1)]">
            <h3 className="text-white font-black uppercase text-sm tracking-widest border-b border-zinc-900 pb-3 mb-4">
              ➕ Dar de Alta Nuevo Camarero
            </h3>

            <form onSubmit={handleAddWaiter} className="space-y-4">
              <div>
                <label className="text-[10px] font-mono text-zinc-400 uppercase block mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Laura Martínez"
                  value={newNombre}
                  onChange={e => setNewNombre(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF00FF] font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono text-zinc-400 uppercase block mb-1">PIN Acceso (4 dígitos)</label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    placeholder="Ej: 1111"
                    value={newPin}
                    onChange={e => setNewPin(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF00FF] font-mono tracking-[4px]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-zinc-400 uppercase block mb-1">Color Identificativo</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={newColor}
                      onChange={e => setNewColor(e.target.value)}
                      className="w-10 h-8 bg-zinc-900 border border-zinc-800 rounded cursor-pointer"
                    />
                    <span className="text-xs font-mono text-zinc-450 uppercase">{newColor}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono text-zinc-400 uppercase block mb-1">URL Fotografía Personal (Opcional)</label>
                <input
                  type="url"
                  placeholder="Dejar vacío para avatar por defecto"
                  value={newFoto}
                  onChange={e => setNewFoto(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF00FF] font-mono text-left"
                />
              </div>

              <div className="flex space-x-2 pt-3 border-t border-zinc-900 mt-5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 border border-zinc-850 bg-black text-zinc-400 hover:text-white py-2 text-xs font-bold uppercase cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#FF00FF] hover:bg-[#FF00FF]/90 text-black py-2 text-xs font-black uppercase tracking-tighter cursor-pointer"
                >
                  Confirmar Contrato
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
