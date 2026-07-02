import React, { useState } from 'react';
import { Box, Plus, AlertTriangle, Truck, Tag, TrendingUp, Sliders, Layers, Calendar, Trash2 } from 'lucide-react';
import { Ingredient, Supplier, Batch, Product } from '../types';

interface InventoryTabProps {
  ingredients: Ingredient[];
  suppliers: Supplier[];
  batches: Batch[];
  products: Product[];
  onRefresh: () => void;
}

export default function InventoryTab({ ingredients, suppliers, batches, products, onRefresh }: InventoryTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'ingredients' | 'suppliers' | 'batches' | 'recipes'>('ingredients');
  const [showAddIng, setShowAddIng] = useState(false);
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [showAddBatch, setShowAddBatch] = useState(false);

  // Ingredient Form State
  const [ingName, setIngName] = useState('');
  const [ingStock, setIngStock] = useState(0);
  const [ingMin, setIngMin] = useState(10);
  const [ingUnit, setIngUnit] = useState<'g' | 'ml' | 'u' | 'kg' | 'l'>('g');

  // Supplier Form State
  const [supName, setSupName] = useState('');
  const [supTel, setSupTel] = useState('');
  const [supEmail, setSupEmail] = useState('');
  const [supDir, setSupDir] = useState('');

  // Batch Form State
  const [batchIngId, setBatchIngId] = useState('');
  const [batchLote, setBatchLote] = useState('');
  const [batchStock, setBatchStock] = useState(100);
  const [batchCaducidad, setBatchCaducidad] = useState('');

  const handleAddIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingName) return;
    try {
      const res = await fetch('/api/ingredients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: ingName, stock: Number(ingStock), unidad: ingUnit, stock_minimo: Number(ingMin) })
      });
      if (res.ok) {
        onRefresh();
        setShowAddIng(false);
        setIngName('');
        setIngStock(0);
      }
    } catch (e) {
      alert('Error de red');
    }
  };

  const handleAddSupplierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName) return;
    try {
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: supName, telefono: supTel, email: supEmail, direccion: supDir })
      });
      if (res.ok) {
        onRefresh();
        setShowAddSupplier(false);
        setSupName('');
        setSupTel('');
        setSupEmail('');
      }
    } catch (e) {
      alert('Error de red');
    }
  };

  const handleAddBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchIngId || !batchLote || !batchCaducidad) return;
    try {
      const res = await fetch('/api/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredient_id: batchIngId, lote: batchLote, stock: Number(batchStock), caducidad: batchCaducidad })
      });
      if (res.ok) {
        onRefresh();
        setShowAddBatch(false);
        setBatchLote('');
        setBatchCaducidad('');
      }
    } catch (e) {
      alert('Error de red');
    }
  };

  const handleDeleteIngredient = async (id: string) => {
    if (!confirm('¿Eliminar ingrediente del stock?')) return;
    try {
      await fetch(`/api/ingredients/${id}`, { method: 'DELETE' });
      onRefresh();
    } catch (e) {}
  };

  return (
    <div className="space-y-6">
      
      {/* Upper sub-navigation rails */}
      <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
        <div className="flex space-x-2">
          {[
            { id: 'ingredients', label: 'Materias Primas / Stock', icon: <Box className="w-3.5 h-3.5" /> },
            { id: 'recipes', label: 'Escandallos / Recetas', icon: <Layers className="w-3.5 h-3.5" /> },
            { id: 'batches', label: 'Lotes y Caducidad', icon: <Calendar className="w-3.5 h-3.5" /> },
            { id: 'suppliers', label: 'Proveedores', icon: <Truck className="w-3.5 h-3.5" /> }
          ].map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSubTab(s.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-black uppercase tracking-tight flex items-center space-x-1.5 transition-colors cursor-pointer ${
                activeSubTab === s.id 
                  ? 'bg-[#FF00FF]/15 text-[#FF00FF] border border-[#FF00FF]/40' 
                  : 'text-zinc-550 border border-transparent hover:text-white'
              }`}
            >
              {s.icon}
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        {activeSubTab === 'ingredients' && (
          <button
            onClick={() => setShowAddIng(true)}
            className="bg-[#FF00FF] hover:bg-[#FF00FF]/90 text-black px-3 py-1 text-xs font-mono font-black uppercase tracking-tighter cursor-pointer"
          >
            + Añadir Ingrediente
          </button>
        )}
        {activeSubTab === 'suppliers' && (
          <button
            onClick={() => setShowAddSupplier(true)}
            className="bg-[#FF00FF] hover:bg-[#FF00FF]/90 text-black px-3 py-1 text-xs font-mono font-black uppercase tracking-tighter cursor-pointer"
          >
            + Añadir Proveedor
          </button>
        )}
        {activeSubTab === 'batches' && (
          <button
            onClick={() => setShowAddBatch(true)}
            className="bg-[#FF00FF] hover:bg-[#FF00FF]/90 text-black px-3 py-1 text-xs font-mono font-black uppercase tracking-tighter cursor-pointer"
          >
            + Ingresar Lote
          </button>
        )}
      </div>

      {/* SUB-TAB: INGREDIENTS */}
      {activeSubTab === 'ingredients' && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-400 font-mono">
            <thead className="bg-[#0b0b0b] text-zinc-500 uppercase text-[10px] tracking-wider border-b border-zinc-900">
              <tr>
                <th className="py-3 px-4">Ingrediente</th>
                <th className="py-3 px-4 text-center">Stock Actual</th>
                <th className="py-3 px-4 text-center">Mínimo Crítico</th>
                <th className="py-3 px-4 text-center">Estado Alarma</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {ingredients.map(ing => {
                const isUnderMin = ing.stock <= ing.stock_minimo;
                const isCritical = ing.stock <= ing.stock_minimo * 0.5;
                
                return (
                  <tr key={ing.id} className="hover:bg-zinc-950/40">
                    <td className="py-3 px-4 font-bold text-white">{ing.nombre}</td>
                    <td className="py-3 px-4 text-center font-bold text-zinc-350">
                      {ing.stock} {ing.unidad}
                    </td>
                    <td className="py-3 px-4 text-center text-zinc-500">
                      {ing.stock_minimo} {ing.unidad}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {isCritical ? (
                        <span className="px-2 py-0.5 rounded-full bg-red-950/40 text-red-500 border border-red-900/30 text-[9px] font-black animate-pulse">
                          🚨 CRÍTICO EXTREMO
                        </span>
                      ) : isUnderMin ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-950/40 text-amber-500 border border-amber-900/30 text-[9px] font-black">
                          ⚠️ REABASTECER
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-950/40 text-emerald-500 border border-emerald-900/30 text-[9px]">
                          ✅ ÓPTIMO
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button 
                        onClick={() => handleDeleteIngredient(ing.id)}
                        className="p-1 text-zinc-600 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* SUB-TAB: SUPPLIERS */}
      {activeSubTab === 'suppliers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {suppliers.map(s => (
            <div key={s.id} className="p-4 bg-zinc-950 border border-zinc-900 rounded-2xl">
              <h3 className="text-white font-bold text-sm tracking-tight">{s.nombre}</h3>
              <p className="text-zinc-500 text-xs mt-1">📍 {s.direccion}</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="bg-black/40 p-1.5 rounded-xl border border-zinc-900 text-center">
                  <span className="text-zinc-500 block text-[9px]">Teléfono</span>
                  <span className="text-zinc-200">{s.telefono}</span>
                </div>
                <div className="bg-black/40 p-1.5 rounded-xl border border-zinc-900 text-center">
                  <span className="text-zinc-500 block text-[9px]">Email</span>
                  <span className="text-zinc-200 truncate block">{s.email}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SUB-TAB: BATCHES */}
      {activeSubTab === 'batches' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {batches.map(b => {
            const ing = ingredients.find(i => i.id === b.ingredient_id);
            const isExpired = new Date(b.caducidad).getTime() < Date.now();
            
            return (
              <div key={b.id} className="p-4 bg-zinc-950 border border-zinc-900 rounded-2xl relative">
                <span className="text-[10px] font-mono text-zinc-500 block uppercase font-bold">Lote: {b.lote}</span>
                <h3 className="text-white font-bold text-sm tracking-tight mt-0.5">{ing ? ing.nombre : 'Ingrediente Desconocido'}</h3>
                
                <div className="mt-4 flex justify-between items-center pt-3 border-t border-zinc-900 text-xs font-mono">
                  <div>
                    <span className="text-[9px] text-zinc-500 block uppercase">Cantidad</span>
                    <span className="font-bold text-zinc-350">{b.stock} {ing?.unidad}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-zinc-500 block uppercase">Vence el</span>
                    <span className={`font-bold ${isExpired ? 'text-red-500 animate-pulse' : 'text-zinc-350'}`}>{b.caducidad}</span>
                  </div>
                </div>

                {isExpired && (
                  <div className="absolute top-2 right-2 bg-red-950 border border-red-900 px-2 py-0.5 rounded text-[8px] text-red-400 font-bold uppercase tracking-widest">
                    Vencido
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* SUB-TAB: RECIPES */}
      {activeSubTab === 'recipes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {products.filter(p => p.receta && p.receta.length > 0).map(p => (
            <div key={p.id} className="p-4 bg-zinc-950 border border-zinc-900 rounded-2xl">
              <div className="flex justify-between items-center">
                <h3 className="text-white font-bold text-sm tracking-tight flex items-center space-x-2">
                  <Tag className="w-3.5 h-3.5 text-[#FF00FF]" />
                  <span>{p.nombre}</span>
                </h3>
                <span className="text-[10px] font-mono text-zinc-500 uppercase">{p.categoria}</span>
              </div>
              
              <div className="mt-3 space-y-1.5 border-t border-zinc-900 pt-3 text-xs font-mono">
                {p.receta?.map((rec, idx) => {
                  const ing = ingredients.find(i => i.id === rec.ingredient_id);
                  return (
                    <div key={idx} className="flex justify-between text-zinc-400">
                      <span>• {ing ? ing.nombre : rec.ingredient_id}</span>
                      <span className="font-bold text-[#FF00FF]">{rec.cantidad} {ing?.unidad || 'u'}</span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 pt-2.5 border-t border-dashed border-zinc-900 flex justify-between text-[11px] font-mono">
                <span className="text-zinc-500">Costo Elaboración Estimado:</span>
                <span className="text-emerald-400 font-bold">{(p.costo_elaboracion || p.precio * 0.35).toFixed(2)} €</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL INGREDIENT */}
      {showAddIng && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-[#FF00FF] rounded-2xl w-full max-w-sm p-6 relative shadow-[0_0_30px_rgba(255,0,255,0.1)]">
            <h3 className="text-white font-black uppercase text-sm tracking-widest border-b border-zinc-900 pb-3 mb-4">
              ➕ Incorporar Materia Prima
            </h3>
            <form onSubmit={handleAddIngredient} className="space-y-4">
              <div>
                <label className="text-[10px] font-mono text-zinc-400 uppercase block mb-1">Nombre Comercial</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Jamón Ibérico"
                  value={ingName}
                  onChange={e => setIngName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF00FF] font-mono"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-mono text-zinc-400 uppercase block mb-1">Stock Inicial</label>
                  <input
                    type="number"
                    value={ingStock}
                    onChange={e => setIngStock(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF00FF] font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-zinc-400 uppercase block mb-1">Mínimo Alerta</label>
                  <input
                    type="number"
                    value={ingMin}
                    onChange={e => setIngMin(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF00FF] font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-zinc-400 uppercase block mb-1">Unidad Medida</label>
                  <select
                    value={ingUnit}
                    onChange={e => setIngUnit(e.target.value as any)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:border-[#FF00FF] font-mono"
                  >
                    <option value="g">gramos (g)</option>
                    <option value="ml">militros (ml)</option>
                    <option value="u">unidades (u)</option>
                    <option value="kg">kilogramos (kg)</option>
                    <option value="l">litros (l)</option>
                  </select>
                </div>
              </div>

              <div className="flex space-x-2 pt-3 border-t border-zinc-900">
                <button
                  type="button"
                  onClick={() => setShowAddIng(false)}
                  className="flex-1 border border-zinc-850 bg-black text-zinc-400 py-2 text-xs font-bold uppercase cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#FF00FF] text-black py-2 text-xs font-black uppercase tracking-tighter cursor-pointer"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SUPPLIER */}
      {showAddSupplier && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-[#FF00FF] rounded-2xl w-full max-w-sm p-6 relative">
            <h3 className="text-white font-black uppercase text-sm tracking-widest border-b border-zinc-900 pb-3 mb-4">
              ➕ Crear Registro Proveedor
            </h3>
            <form onSubmit={handleAddSupplierSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-mono text-zinc-400 uppercase block mb-1">Nombre Comercial</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Girona Lactis S.L."
                  value={supName}
                  onChange={e => setSupName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF00FF] font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-mono text-zinc-400 uppercase block mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={supTel}
                    onChange={e => setSupTel(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF00FF] font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-zinc-400 uppercase block mb-1">Email</label>
                  <input
                    type="email"
                    value={supEmail}
                    onChange={e => setSupEmail(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF00FF] font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-mono text-zinc-400 uppercase block mb-1">Dirección Física / Almacén</label>
                <input
                  type="text"
                  value={supDir}
                  onChange={e => setSupDir(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF00FF] font-mono"
                />
              </div>
              <div className="flex space-x-2 pt-3 border-t border-zinc-900">
                <button
                  type="button"
                  onClick={() => setShowAddSupplier(false)}
                  className="flex-1 border border-zinc-850 bg-black text-zinc-400 py-2 text-xs font-bold uppercase cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#FF00FF] text-black py-2 text-xs font-black uppercase tracking-tighter cursor-pointer"
                >
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL BATCH / LOTE */}
      {showAddBatch && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-[#FF00FF] rounded-2xl w-full max-w-sm p-6 relative">
            <h3 className="text-white font-black uppercase text-sm tracking-widest border-b border-zinc-900 pb-3 mb-4">
              📦 Ingreso de Lote y Caducidad
            </h3>
            <form onSubmit={handleAddBatchSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-mono text-zinc-400 uppercase block mb-1">Seleccionar Ingrediente</label>
                <select
                  required
                  value={batchIngId}
                  onChange={e => setBatchIngId(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:border-[#FF00FF] font-mono"
                >
                  <option value="">-- Elige Ingrediente --</option>
                  {ingredients.map(i => (
                    <option key={i.id} value={i.id}>{i.nombre} ({i.unidad})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-mono text-zinc-400 uppercase block mb-1">Código de Lote</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: L-240702-B"
                    value={batchLote}
                    onChange={e => setBatchLote(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF00FF] font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-zinc-400 uppercase block mb-1">Cantidad Recibida</label>
                  <input
                    type="number"
                    required
                    value={batchStock}
                    onChange={e => setBatchStock(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF00FF] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono text-zinc-400 uppercase block mb-1">Fecha de Caducidad</label>
                <input
                  type="date"
                  required
                  value={batchCaducidad}
                  onChange={e => setBatchCaducidad(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF00FF] font-mono"
                />
              </div>

              <div className="flex space-x-2 pt-3 border-t border-zinc-900">
                <button
                  type="button"
                  onClick={() => setShowAddBatch(false)}
                  className="flex-1 border border-zinc-850 bg-black text-zinc-400 py-2 text-xs font-bold uppercase cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#FF00FF] text-black py-2 text-xs font-black uppercase tracking-tighter cursor-pointer"
                >
                  Ingresar Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
