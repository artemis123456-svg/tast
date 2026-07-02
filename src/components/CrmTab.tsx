import React, { useState } from 'react';
import { Users, Plus, Star, Award, Phone, Mail, History, Search } from 'lucide-react';
import { Customer } from '../types';

interface CrmTabProps {
  customers: Customer[];
  onRefresh: () => void;
}

export default function CrmTab({ customers, onRefresh }: CrmTabProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const [custName, setCustName] = useState('');
  const [custTel, setCustTel] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custBirth, setCustBirth] = useState('');

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName || !custTel) return;
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: custName,
          telefono: custTel,
          email: custEmail,
          fecha_nacimiento: custBirth,
          puntos: 10 // welcome 10 points bonus!
        })
      });
      if (res.ok) {
        onRefresh();
        setShowAdd(false);
        setCustName('');
        setCustTel('');
        setCustEmail('');
        setCustBirth('');
      }
    } catch (e) {}
  };

  const isTodayBirthday = (birthDateStr?: string) => {
    if (!birthDateStr) return false;
    const today = new Date();
    const bDate = new Date(birthDateStr);
    return today.getDate() === bDate.getDate() && today.getMonth() === bDate.getMonth();
  };

  const filtered = customers.filter(c => 
    c.nombre.toLowerCase().includes(search.toLowerCase()) || 
    c.telefono.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-zinc-200 font-bold text-sm uppercase tracking-wide flex items-center space-x-2">
            <Users className="w-4 h-4 text-[#FF00FF]" />
            <span>Fidelización de Clientes (CRM El Tast)</span>
          </h2>
          <p className="text-zinc-500 text-xs mt-0.5">Gestión de puntos de fidelidad, aniversarios, regalos y cupones promocionales</p>
        </div>

        <div className="flex space-x-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64 bg-[#050505] border border-zinc-900 rounded-xl px-3 py-1.5 flex items-center">
            <Search className="w-4 h-4 text-zinc-650 mr-2" />
            <input
              type="text"
              placeholder="Buscar por nombre o tlf..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent text-xs text-white focus:outline-none w-full font-mono"
            />
          </div>

          <button
            onClick={() => setShowAdd(true)}
            className="bg-[#FF00FF] text-black px-4 py-1.5 text-xs font-mono font-black uppercase tracking-tighter flex items-center space-x-1 whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Registrar Cliente</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(c => {
          const birthday = isTodayBirthday(c.fecha_nacimiento);
          return (
            <div key={c.id} className="p-4 bg-zinc-950 border border-zinc-900 rounded-2xl relative overflow-hidden">
              
              {/* Highlight Birthday client */}
              {birthday && (
                <div className="absolute top-0 right-0 bg-amber-500 text-black px-3 py-1 text-[8px] font-mono font-black uppercase tracking-widest rounded-bl-xl animate-bounce flex items-center gap-1">
                  <Star className="w-2.5 h-2.5 fill-black" /> ¡CUMPLEAÑOS HOY!
                </div>
              )}

              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-white font-bold text-sm tracking-tight flex items-center gap-1.5">
                    {c.nombre}
                    {c.puntos >= 100 && (
                      <span title="Cliente VIP">
                        <Award className="w-4 h-4 text-amber-400" />
                      </span>
                    )}
                  </h3>
                  <div className="mt-2.5 space-y-1 text-xs font-mono text-zinc-500">
                    <p className="flex items-center space-x-1.5">
                      <Phone className="w-3.5 h-3.5 text-zinc-600" />
                      <span>{c.telefono}</span>
                    </p>
                    {c.email && (
                      <p className="flex items-center space-x-1.5">
                        <Mail className="w-3.5 h-3.5 text-zinc-600" />
                        <span className="truncate max-w-[180px] block">{c.email}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-center p-2 px-3 bg-[#FF00FF]/10 border border-[#FF00FF]/30 rounded-2xl">
                  <span className="text-zinc-400 text-[8px] block uppercase font-mono">Puntos</span>
                  <span className="text-lg font-mono font-black text-[#FF00FF]">{c.puntos}</span>
                </div>
              </div>

              {/* Consumption summary */}
              <div className="mt-4 pt-3 border-t border-zinc-900 flex justify-between items-center text-[10px] font-mono">
                <span className="text-zinc-500 uppercase flex items-center gap-1">
                  <History className="w-3.5 h-3.5 text-zinc-600" />
                  <span>Historial: {c.historial_consumo?.length || 0} compras</span>
                </span>
                
                {c.puntos >= 50 ? (
                  <span className="text-emerald-400 font-bold uppercase bg-emerald-950/40 border border-emerald-900/40 px-2 py-0.5 rounded">
                    🎁 Cupón 5€ disponible
                  </span>
                ) : (
                  <span className="text-zinc-500 uppercase">Faltan {50 - c.puntos} pts para cupón</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL REGISTRAR */}
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-[#FF00FF] rounded-2xl w-full max-w-sm p-6 relative">
            <h3 className="text-white font-black uppercase text-sm tracking-widest border-b border-zinc-900 pb-3 mb-4">
              ➕ Registrar Cliente en CRM
            </h3>
            <form onSubmit={handleCreateCustomer} className="space-y-4">
              <div>
                <label className="text-[10px] font-mono text-zinc-400 uppercase block mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Andrés Villalobos"
                  value={custName}
                  onChange={e => setCustName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF00FF] font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-mono text-zinc-400 uppercase block mb-1">Móvil / Teléfono</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: 612345678"
                    value={custTel}
                    onChange={e => setCustTel(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF00FF] font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-zinc-400 uppercase block mb-1">Cumpleaños</label>
                  <input
                    type="date"
                    value={custBirth}
                    onChange={e => setCustBirth(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF00FF] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono text-zinc-400 uppercase block mb-1">Email</label>
                <input
                  type="email"
                  placeholder="Ej: andres@gmail.com"
                  value={custEmail}
                  onChange={e => setCustEmail(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF00FF] font-mono text-left"
                />
              </div>

              <p className="text-[9px] font-mono text-zinc-500 leading-normal bg-black/40 p-2 border border-zinc-900/60 rounded-xl">
                🎁 Al registrarse, el cliente recibirá automáticamente un bono de bienvenida de <b>10 puntos de fidelización</b>.
              </p>

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
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
