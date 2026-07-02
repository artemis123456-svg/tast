import React, { useState } from 'react';
import { Percent, Plus, Tag, HelpCircle, Activity, Star } from 'lucide-react';
import { Promo, ProductCategory, Product } from '../types';

interface PromosTabProps {
  promos: Promo[];
  products: Product[];
  onRefresh: () => void;
}

export default function PromosTab({ promos, products, onRefresh }: PromosTabProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState<'2x1' | 'HappyHour' | 'Descuento' | 'Menu'>('HappyHour');
  const [discountPct, setDiscountPct] = useState(20);
  const [category, setCategory] = useState<ProductCategory | ''>('');
  const [prodId, setProdId] = useState('');

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre) return;
    try {
      const res = await fetch('/api/promos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre,
          tipo,
          config: {
            categoria: category || undefined,
            productoId: prodId || undefined,
            descuento_pct: tipo === 'HappyHour' || tipo === 'Descuento' ? Number(discountPct) : undefined
          },
          activo: true
        })
      });
      if (res.ok) {
        onRefresh();
        setShowAdd(false);
        setNombre('');
        setCategory('');
        setProdId('');
      }
    } catch (e) {}
  };

  const handleTogglePromo = async (promo: Promo) => {
    try {
      const res = await fetch(`/api/promos/${promo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: !promo.activo })
      });
      if (res.ok) onRefresh();
    } catch (e) {}
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-zinc-200 font-bold text-sm uppercase tracking-wide flex items-center space-x-2">
            <Percent className="w-4 h-4 text-[#FF00FF]" />
            <span>Motor de Promociones y Packs Automáticos</span>
          </h2>
          <p className="text-zinc-500 text-xs mt-0.5">Campañas activas de descuento cruzado, combos (2x1) y franjas horarias felices</p>
        </div>

        <button
          onClick={() => setShowAdd(true)}
          className="bg-[#FF00FF] text-black px-4 py-2 text-xs font-mono font-black uppercase tracking-tighter flex items-center space-x-1 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Configurar Campaña</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {promos.map(p => (
          <div 
            key={p.id} 
            className={`p-4 bg-zinc-950 border rounded-2xl relative transition-all ${
              p.activo ? 'border-[#FF00FF]/30 shadow-[0_0_15px_rgba(255,0,255,0.02)]' : 'border-zinc-900 opacity-55'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] font-mono text-[#FF00FF] uppercase tracking-widest bg-[#FF00FF]/10 px-2 py-0.5 rounded border border-[#FF00FF]/25">
                  {p.tipo}
                </span>
                <h3 className="text-white font-bold text-sm tracking-tight mt-2.5">{p.nombre}</h3>
              </div>

              {/* Toggle switch */}
              <button 
                onClick={() => handleTogglePromo(p)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  p.activo ? 'bg-[#FF00FF]' : 'bg-zinc-800'
                }`}
              >
                <span 
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-black shadow ring-0 transition duration-200 ease-in-out ${
                    p.activo ? 'translate-x-4' : 'translate-x-0'
                  }`} 
                />
              </button>
            </div>

            <div className="mt-4 pt-3 border-t border-zinc-900/60 text-[11px] font-mono text-zinc-400 space-y-1">
              {p.config.categoria && <p>• Aplica a categoría: <b>{p.config.categoria}</b></p>}
              {p.config.productoId && (
                <p>• Aplica al producto: <b>{products.find(prod => prod.id === p.config.productoId)?.nombre || p.config.productoId}</b></p>
              )}
              {p.config.descuento_pct && <p>• Porcentaje Descuento: <b className="text-emerald-400">{p.config.descuento_pct}%</b></p>}
              <p className="text-zinc-500 text-[9px] mt-2 flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-zinc-650" />
                <span>Aplicado y auditado por el motor interno en tiempo real</span>
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL CAMPAÑAS */}
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-[#FF00FF] rounded-2xl w-full max-w-sm p-6 relative">
            <h3 className="text-white font-black uppercase text-sm tracking-widest border-b border-zinc-900 pb-3 mb-4">
              ➕ Crear Regla de Descuento
            </h3>
            <form onSubmit={handleCreatePromo} className="space-y-4">
              <div>
                <label className="text-[10px] font-mono text-zinc-400 uppercase block mb-1">Nombre Descriptivo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Promo 2x1 en Cervezas"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF00FF] font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-mono text-zinc-400 uppercase block mb-1">Tipo de Campaña</label>
                  <select
                    value={tipo}
                    onChange={e => setTipo(e.target.value as any)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:border-[#FF00FF] font-mono"
                  >
                    <option value="HappyHour">Happy Hour</option>
                    <option value="2x1">2x1 Combos</option>
                    <option value="Descuento">Descuento Global</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-mono text-zinc-400 uppercase block mb-1">Descuento (%)</label>
                  <input
                    type="number"
                    min={5}
                    max={100}
                    disabled={tipo === '2x1'}
                    value={discountPct}
                    onChange={e => setDiscountPct(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF00FF] font-mono disabled:opacity-40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-mono text-zinc-400 uppercase block mb-1">Por Categoría</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as any)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:border-[#FF00FF] font-mono"
                  >
                    <option value="">-- Toda la carta --</option>
                    <option value="Entrepans Freds">Entrepans Freds</option>
                    <option value="Entrepans Calents">Entrepans Calents</option>
                    <option value="Torrades">Torrades</option>
                    <option value="Pastes">Pastes</option>
                    <option value="Begudes">Begudes</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-mono text-zinc-400 uppercase block mb-1">Por Producto Específico</label>
                  <select
                    value={prodId}
                    onChange={e => setProdId(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:border-[#FF00FF] font-mono"
                  >
                    <option value="">-- Ninguno --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <p className="text-[9px] font-mono text-zinc-500 leading-normal bg-black/40 p-2 border border-zinc-900/60 rounded-xl">
                ℹ️ Las promociones de tipo <b>2x1</b> cobrarán automáticamente 1 unidad de cada 2 añadidas al carrito de la misma referencia.
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
                  Activar Regla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
