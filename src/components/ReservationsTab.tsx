import React, { useState } from 'react';
import { Calendar, Plus, Users, Clock, MapPin, CheckCircle2, XCircle, ChevronRight, Check } from 'lucide-react';
import { Reservation, Table } from '../types';

interface ReservationsTabProps {
  reservations: Reservation[];
  tables: Table[];
  onRefresh: () => void;
}

export default function ReservationsTab({ reservations, tables, onRefresh }: ReservationsTabProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientTel, setClientTel] = useState('');
  const [resDate, setResDate] = useState('');
  const [resTime, setResTime] = useState('');
  const [resPax, setResPax] = useState(2);
  const [resTableId, setResTableId] = useState('');

  const handleCreateReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !resDate || !resTime) return;

    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre_cliente: clientName,
          telefono: clientTel,
          fecha: resDate,
          hora: resTime,
          pax: Number(resPax),
          mesa_id: resTableId || undefined
        })
      });
      if (res.ok) {
        onRefresh();
        setShowAdd(false);
        setClientName('');
        setClientTel('');
        setResTime('');
        setResTableId('');
      }
    } catch (e) {}
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/reservations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: status })
      });
      if (res.ok) onRefresh();
    } catch (e) {}
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-zinc-200 font-bold text-sm uppercase tracking-wide flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-[#FF00FF]" />
            <span>Sistema Integrado de Reservas de Mesas</span>
          </h2>
          <p className="text-zinc-500 text-xs mt-0.5">Control de pre-asignación, recepción de comensales, anulaciones y ocupación automática</p>
        </div>

        <button
          onClick={() => setShowAdd(true)}
          className="bg-[#FF00FF] text-black px-4 py-2 text-xs font-mono font-black uppercase tracking-tighter flex items-center space-x-1 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nueva Reserva</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reservations.map(r => {
          const table = tables.find(t => t.id === r.mesa_id);
          return (
            <div 
              key={r.id} 
              className={`p-4 bg-zinc-950 border rounded-2xl relative transition-all ${
                r.estado === 'Sentado' 
                  ? 'border-emerald-900/40 bg-emerald-950/5' 
                  : r.estado === 'Cancelada' 
                  ? 'border-red-950/20 opacity-50'
                  : 'border-zinc-900 hover:border-zinc-800'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-white font-bold text-sm tracking-tight">{r.nombre_cliente}</h3>
                  <p className="text-zinc-500 text-xs font-mono mt-0.5">{r.telefono}</p>
                </div>

                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border font-mono ${
                  r.estado === 'Confirmada'
                    ? 'bg-blue-950/40 border-blue-900/30 text-blue-400'
                    : r.estado === 'Sentado'
                    ? 'bg-emerald-950/40 border-emerald-900/30 text-emerald-400'
                    : r.estado === 'Cancelada'
                    ? 'bg-red-950/40 border-red-900/30 text-red-400'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                }`}>
                  {r.estado}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[10px] font-mono border-t border-zinc-900 pt-3">
                <div className="bg-black p-1.5 rounded-xl">
                  <span className="text-zinc-500 block uppercase">Pax</span>
                  <span className="text-zinc-200 font-bold flex items-center justify-center gap-1 mt-0.5">
                    <Users className="w-3 h-3 text-sky-400" />
                    {r.pax}
                  </span>
                </div>

                <div className="bg-black p-1.5 rounded-xl col-span-2">
                  <span className="text-zinc-500 block uppercase">Horario</span>
                  <span className="text-zinc-200 font-bold flex items-center justify-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3 text-[#FF00FF]" />
                    {r.fecha} a las {r.hora}
                  </span>
                </div>
              </div>

              {table && (
                <div className="mt-2 text-center p-1 px-3 bg-[#FF00FF]/5 border border-[#FF00FF]/15 rounded-xl flex items-center justify-center gap-1.5 text-[10px] font-mono text-[#FF00FF]">
                  <MapPin className="w-3 h-3 text-[#FF00FF]" />
                  <span>Mesa pre-asignada: <b>Mesa {table.number} ({table.zona})</b></span>
                </div>
              )}

              {/* Action Buttons */}
              {r.estado === 'Pendiente' && (
                <div className="mt-4 flex space-x-1 pt-2 border-t border-zinc-900/40">
                  <button
                    onClick={() => handleUpdateStatus(r.id, 'Confirmada')}
                    className="flex-1 border border-blue-900/50 bg-blue-950/10 hover:bg-blue-950/30 text-blue-400 py-1 rounded text-[10px] uppercase font-bold tracking-tight flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Confirmar
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(r.id, 'Cancelada')}
                    className="flex-1 border border-red-900/50 bg-red-950/10 hover:bg-red-950/30 text-red-400 py-1 rounded text-[10px] uppercase font-bold tracking-tight flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Anular
                  </button>
                </div>
              )}

              {r.estado === 'Confirmada' && (
                <div className="mt-4 pt-2 border-t border-zinc-900/40">
                  <button
                    onClick={() => handleUpdateStatus(r.id, 'Sentado')}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-black py-1 px-3 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 rounded transition-all cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    Acomodar / Sentar
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* MODAL RESERVAS */}
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-[#FF00FF] rounded-2xl w-full max-w-sm p-6 relative">
            <h3 className="text-white font-black uppercase text-sm tracking-widest border-b border-zinc-900 pb-3 mb-4">
              ➕ Agendar Nueva Reserva
            </h3>
            <form onSubmit={handleCreateReservation} className="space-y-4">
              <div>
                <label className="text-[10px] font-mono text-zinc-400 uppercase block mb-1">Nombre de Cliente</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Elena Rovira"
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF00FF] font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-mono text-zinc-400 uppercase block mb-1">Móvil de Contacto</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: 698765432"
                    value={clientTel}
                    onChange={e => setClientTel(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF00FF] font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-zinc-400 uppercase block mb-1">N. Pax (Comensales)</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={resPax}
                    onChange={e => setResPax(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF00FF] font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-mono text-zinc-400 uppercase block mb-1">Fecha</label>
                  <input
                    type="date"
                    required
                    value={resDate}
                    onChange={e => setResDate(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF00FF] font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-zinc-400 uppercase block mb-1">Hora</label>
                  <input
                    type="time"
                    required
                    value={resTime}
                    onChange={e => setResTime(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF00FF] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono text-zinc-400 uppercase block mb-1">Mesa Pre-Asignar (Opcional)</label>
                <select
                  value={resTableId}
                  onChange={e => setResTableId(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:border-[#FF00FF] font-mono"
                >
                  <option value="">-- Sin pre-asignación --</option>
                  {tables.map(t => (
                    <option key={t.id} value={t.id}>Mesa {t.number} ({t.zona})</option>
                  ))}
                </select>
              </div>

              <div className="flex space-x-2 pt-3 border-t border-zinc-900">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="flex-1 border border-zinc-850 bg-black text-zinc-400 py-2 text-xs font-bold uppercase cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#FF00FF] text-black py-2 text-xs font-black uppercase tracking-tighter cursor-pointer"
                >
                  Agendar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
