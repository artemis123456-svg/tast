/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingBag, 
  Check, 
  Wifi, 
  AlertCircle, 
  Bookmark, 
  ChevronRight,
  TrendingUp,
  Snowflake,
  Flame,
  Grid as GridIcon,
  Utensils,
  Coffee,
  Keyboard
} from 'lucide-react';
import { Product, OrderItem, ProductCategory, Table } from '../types';
import { createOrder, socket, fetchOrders } from '../lib/api';
import ManualKeypadModal from './ManualKeypadModal';
import { getProductImage } from './KioskDashboard';

interface MobileWaiterProps {
  products: Product[];
  tables: Table[];
  onRefreshOrders: () => void;
  staffName: string;
  onLogout: () => void;
}

export default function MobileWaiter({ 
  products, 
  tables = [],
  onRefreshOrders, 
  staffName, 
  onLogout 
}: MobileWaiterProps) {
  
  const [activeCategory, setActiveCategory] = useState<ProductCategory>('Entrepans Freds');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'Efectivo' | 'Bizum'>('Efectivo');
  const [tableNumber, setTableNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [showManualKeypad, setShowManualKeypad] = useState(false);
  const [isSocketConnected, setIsSocketConnected] = useState(socket.connected);
  const [showTableSelection, setShowTableSelection] = useState(true);
  const [activeTablesZona, setActiveTablesZona] = useState<'Interior' | 'Exterior'>('Interior');
  const [allOrders, setAllOrders] = useState<any[]>([]);

  useEffect(() => {
    // Initial load
    fetchOrders().then(o => setAllOrders(o)).catch(() => {});

    const handleConnect = () => setIsSocketConnected(true);
    const handleDisconnect = () => setIsSocketConnected(false);
    const handleOrdersChanged = (updatedOrders: any[]) => {
      setAllOrders(updatedOrders);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('orders-changed', handleOrdersChanged);

    // Sync initial state
    setIsSocketConnected(socket.connected);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('orders-changed', handleOrdersChanged);
    };
  }, []);

  const handleManualAddCart = (nombre: string, precio: number) => {
    setCart((prev) => [
      ...prev,
      {
        id: `manual-item-${Date.now()}`,
        productId: `manual-${Date.now()}`,
        nombre: nombre,
        precio: precio,
        quantity: 1
      }
    ]);
  };

  const handleManualDirectCheckout = async (amount: number, paymentMethod: 'Efectivo' | 'Bizum', concept: string) => {
    await createOrder({
      items: [
        {
          productId: `manual-prod-${Date.now()}`,
          nombre: concept,
          precio: amount,
          quantity: 1
        }
      ],
      metodo_pago: paymentMethod,
      camarero_id: `${staffName} (${tableNumber || 'Sin mesa'})`
    });
    setSuccessMsg(true);
    setTimeout(() => setSuccessMsg(false), 2000);
    onRefreshOrders();
  };

  const getCategoryIcon = (category: ProductCategory) => {
    switch (category) {
      case 'Entrepans Freds': return <Snowflake className="w-4 h-4 text-sky-400" />;
      case 'Entrepans Calents': return <Flame className="w-4 h-4 text-amber-500" />;
      case 'Torrades': return <GridIcon className="w-4 h-4 text-amber-600" />;
      case 'Pastes': return <Utensils className="w-4 h-4 text-[#FF00FF]" />;
      case 'Begudes': return <Coffee className="w-4 h-4 text-emerald-400" />;
    }
  };

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      alert(`⚠️ ¡Sin existencias! ${product.nombre} no tiene stock.`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, {
        id: `m-cart-${Date.now()}-${product.id}`,
        productId: product.id,
        nombre: product.nombre,
        precio: product.precio,
        quantity: 1
      }];
    });
  };

  const adjustQty = (productId: string, val: number) => {
    setCart(prev => 
      prev.map(item => {
        if (item.productId === productId) {
          const nextQ = item.quantity + val;
          return nextQ > 0 ? { ...item, quantity: nextQ } : item;
        }
        return item;
      }).filter(item => item.quantity > 0)
    );
  };

  const calculateTotal = () => {
    return Number(cart.reduce((sum, item) => sum + (item.precio * item.quantity), 0).toFixed(2));
  };

  const handleSendOrder = async () => {
    if (cart.length === 0) return;
    const finalTable = tableNumber.trim() || 'Barra';
    setIsSubmitting(true);
    try {
      await createOrder({
        items: cart,
        metodo_pago: paymentMethod,
        camarero_id: `Móvil: ${staffName || 'Camarero'} (Mesa ${finalTable})`
      });

      // Show success animation overlay
      setSuccessMsg(true);
      setCart([]);
      setTableNumber('');
      setShowTableSelection(true);
      onRefreshOrders();
      
      // Auto-dismiss success notify
      setTimeout(() => setSuccessMsg(false), 2200);
    } catch (e: any) {
      alert(`Error de sincronización con servidor de red: ${e.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeProducts = products.filter(p => p.categoria === activeCategory && p.activo);

  // Compile Set of busy tables dynamically from outstanding unresolved orders in Mobile
  const busyTableNumbers = new Set(
    allOrders
      .filter(o => o.estado === 'Pendiente' || o.estado === 'Preparado')
      .map(o => {
        const match = o.camarero_id.match(/\((.*?)\)/);
        if (!match) return '';
        let val = match[1];
        // Remove "Mesa " prefix if there is one, to match plain numbers like "3"
        if (val.startsWith('Mesa ')) {
          val = val.substring(5);
        }
        return val.trim();
      })
      .filter(Boolean)
  );

  return (
    <div className="w-full max-w-[440px] mx-auto bg-black border-4 border-[#FF00FF] min-h-[calc(100vh-140px)] flex flex-col justify-between overflow-hidden relative shadow-[0_0_20px_rgba(255,0,255,0.05)] pb-4">
      
      {/* Top Mobile Bar Status Row */}
      <div className="bg-[#111] px-4 py-3 border-b border-[#FF00FF]/40 flex justify-between items-center text-xs font-mono select-none">
        <div className="flex items-center space-x-2 text-[#FF00FF]">
          <span className={`w-1.5 h-1.5 rounded-full ${isSocketConnected ? 'bg-[#FF00FF] animate-pulse' : 'bg-amber-500 animate-ping'}`} />
          <Wifi className="w-3.5 h-3.5" />
          <span className="font-extrabold uppercase tracking-widest text-[10px]">
            {isSocketConnected ? 'TPV SINC. OK' : 'RED LOCAL (SIN SINC)'}
          </span>
        </div>
        
        <div className="flex items-center space-x-1.5">
          {tableNumber && (
            <button 
              onClick={() => setShowTableSelection(true)}
              className="text-[9px] font-black border border-[#FF00FF]/40 bg-zinc-950/80 hover:bg-[#FF00FF]/15 text-[#FF00FF] px-2 py-0.5 rounded cursor-pointer uppercase font-mono mr-1"
            >
              Mesa {tableNumber} 🔄
            </button>
          )}
          <span className="text-[10px] text-zinc-400">Camarero: <b className="text-white uppercase font-black">{staffName}</b></span>
          <button 
            onClick={onLogout}
            className="text-[9px] font-black border border-zinc-805 bg-black hover:bg-[#330033] text-[#FF00FF] px-2 py-0.5 rounded cursor-pointer"
          >
            S.
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {showTableSelection ? (
        <div className="flex-1 p-3 flex flex-col space-y-3 overflow-hidden animate-fadeIn text-left">
          <div className="flex items-center justify-between border-b border-[#FF00FF]/30 pb-2">
            <div>
              <h3 className="text-xs font-black tracking-widest text-[#FF00FF] font-mono uppercase">DISPOSICIÓN DE MESAS</h3>
              <p className="text-[9px] text-zinc-500 font-mono">Seleccione mesa para firmar comanda</p>
            </div>
            
            {/* Short Zone selector segment control */}
            <div className="flex bg-[#0d0d0d] border border-zinc-900 p-0.5 rounded text-[10px]">
              <button
                type="button"
                onClick={() => setActiveTablesZona('Interior')}
                className={`px-2 py-1 font-mono font-bold uppercase rounded cursor-pointer ${activeTablesZona === 'Interior' ? 'bg-[#FF00FF] text-black font-black' : 'text-zinc-500'}`}
              >
                Int.
              </button>
              <button
                type="button"
                onClick={() => setActiveTablesZona('Exterior')}
                className={`px-2 py-1 font-mono font-bold uppercase rounded cursor-pointer ${activeTablesZona === 'Exterior' ? 'bg-[#FF00FF] text-black font-black' : 'text-zinc-500'}`}
              >
                Ext.
              </button>
            </div>
          </div>

          {/* Compact visual map of the current floor plan */}
          <div className="relative h-[220px] bg-zinc-950 rounded-2xl border border-zinc-900 overflow-hidden shadow-[inset_0_0_20px_rgba(0,0,0,0.85)] bg-[radial-gradient(#ffffff03_1px,transparent_1px)] [background-size:15px_15px] shrink-0">
            {tables
              .filter(t => t.zona === activeTablesZona)
              .map(t => {
                const isBusy = busyTableNumbers.has(t.number);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setTableNumber(t.number);
                      setShowTableSelection(false);
                    }}
                    style={{
                      left: `${t.x}%`,
                      top: `${t.y}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    className={`absolute w-10 h-10 rounded-full border flex flex-col items-center justify-center font-mono active:scale-95 transition-all text-[9px] cursor-pointer ${
                      isBusy
                        ? 'bg-amber-500/10 border-amber-500 text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.2)] hover:bg-amber-500/20'
                        : 'bg-zinc-900 border-zinc-800 hover:border-[#FF00FF] text-zinc-300 shadow-sm'
                    }`}
                  >
                    <span className="text-[7px] text-zinc-550 leading-none font-mono">M</span>
                    <span className="text-[11px] font-black leading-none">{t.number}</span>
                  </button>
                );
              })}

            {tables.filter(t => t.zona === activeTablesZona).length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 text-zinc-650 font-mono text-[9px] italic">
                Ninguna mesa para {activeTablesZona}.
              </div>
            )}
          </div>

          {/* Scrolling speed list of tables underneath */}
          <div className="flex-1 flex flex-col space-y-2 overflow-hidden">
            <span className="text-[8px] font-mono text-zinc-550 uppercase block tracking-wider font-bold">Listado de Sala</span>
            
            <div className="flex-1 overflow-y-auto space-y-1.5 max-h-[160px] pr-1 scrollbar-none">
              {tables.map(t => {
                const isBusy = busyTableNumbers.has(t.number);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setTableNumber(t.number);
                      setShowTableSelection(false);
                    }}
                    className={`w-full p-2 rounded-lg text-left flex justify-between items-center text-[10px] font-mono border transition-all cursor-pointer ${
                      isBusy
                        ? 'bg-amber-505/5 border-amber-500/20 text-amber-400'
                        : 'bg-zinc-950 border-zinc-900 hover:border-zinc-850 text-zinc-300'
                    }`}
                  >
                    <div className="font-extrabold flex items-center space-x-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${isBusy ? 'bg-amber-550 animate-pulse' : 'bg-transparent border border-zinc-700'}`} />
                      <span>Mesa {t.number} <span className="text-[8px] text-zinc-500 uppercase font-mono">({t.zona})</span></span>
                    </div>
                    <span className="text-[8px] uppercase font-black">{isBusy ? 'Ocupada' : 'Libre'}</span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => {
                setTableNumber('Barra');
                setShowTableSelection(false);
              }}
              className="w-full py-2 bg-[#FF00FF]/5 hover:bg-[#FF00FF]/15 border border-dashed border-[#FF00FF]/40 text-[#FF00FF] font-black font-mono text-[10px] uppercase rounded-xl transition-all cursor-pointer"
            >
              ☕ Venta Express en Barra
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 p-3 flex flex-col space-y-3 overflow-hidden">
          
          {/* Categories Fast Horizontal Scroll Grid */}
          <div className="grid grid-cols-5 bg-[#0a0a0a] border border-[#FF00FF]/40">
            {(['Entrepans Freds', 'Entrepans Calents', 'Torrades', 'Pastes', 'Begudes'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`p-2 border-r border-[#FF00FF]/30 last:border-r-0 flex flex-col items-center justify-center space-y-1 text-center transition-all cursor-pointer ${
                  activeCategory === cat 
                    ? 'bg-[#FF00FF] text-black italic font-black' 
                    : 'bg-black text-[#FF00FF] hover:bg-[#330033]/30'
                }`}
              >
                <span className={activeCategory === cat ? 'text-black' : ''}>{getCategoryIcon(cat)}</span>
                <span className="text-[8px] font-bold uppercase truncate max-w-full">
                  {cat.split(' ')[0]}
                </span>
              </button>
            ))}
          </div>

          {/* Quick action: Manual charging keypad */}
          <button
            onClick={() => setShowManualKeypad(true)}
            className="w-full bg-[#330033]/25 hover:bg-[#FF00FF] hover:text-black text-[#FF00FF] border border-[#FF00FF]/50 py-1.5 text-[9px] font-black uppercase tracking-widest flex items-center justify-center space-x-1 transition-all cursor-pointer rounded"
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>⌨️ Cobrar Importe Manual</span>
          </button>

          {/* Compact Grid Lists of Touch-Targets (Min 48px height) */}
          <div className="flex-1 overflow-y-auto max-h-[350px] space-y-1.5 scrollbar-none pr-0.5">
            {activeProducts.length === 0 ? (
              <p className="text-center py-10 font-mono text-[11px] text-zinc-500">No hay productos en esta divisiónv.</p>
            ) : (
              activeProducts.map(p => (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className="w-full flex items-center p-2 bg-black border border-[#FF00FF]/30 hover:border-[#FF00FF] hover:bg-[#330033]/15 transition-all cursor-pointer active:scale-[0.99] text-left outline-none min-h-[54px] h-16 group gap-3.5"
                >
                  {/* Thin, compact image thumbnail */}
                  <div className="w-11 h-11 bg-zinc-900 border border-[#FF00FF]/25 shrink-0 overflow-hidden relative">
                    <img 
                      src={getProductImage(p)} 
                      alt={p.nombre} 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  <div className="flex-1 flex flex-col justify-center min-w-0 h-full">
                    <span className="text-xs font-extrabold text-zinc-100 uppercase tracking-tight group-hover:text-[#FF00FF] truncate block">
                      {p.nombre}
                    </span>
                    {p.alergenos && p.alergenos.length > 0 ? (
                      <span className="text-[8px] text-[#FF00FF] font-mono uppercase tracking-wider truncate block leading-none mt-1">
                        ⚠️ {p.alergenos.join(', ')}
                      </span>
                    ) : (
                      <span className="text-[8px] text-zinc-500 font-mono block leading-none mt-1">
                        STOCK: {p.stock} UNI
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <span className="text-sm font-mono font-black text-[#FF00FF]">
                      {p.precio.toFixed(2)}€
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Dynamic checkout drawer client panel */}
          <div className="bg-[#111] border border-[#FF00FF]/40 p-3 space-y-2">
            
            {/* Table index input and Payment speed options */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[8px] font-mono font-bold text-[#FF00FF] block tracking-wider">Nº DE MESA *</label>
                <input
                  type="text"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="Ej. 12"
                  className="w-full bg-black border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-white uppercase font-bold focus:outline-none focus:border-[#FF00FF] font-mono mt-0.5"
                />
              </div>

              <div>
                <label className="text-[8px] font-mono font-bold text-[#FF00FF] block tracking-wider">PAGO RÁPIDO</label>
                <div className="flex gap-1 mt-0.5">
                  {(['Efectivo', 'Bizum'] as const).map(met => (
                    <button
                      key={met}
                      onClick={() => setPaymentMethod(met)}
                      className={`flex-1 py-1 px-1 border font-mono text-[9px] font-black uppercase cursor-pointer ${
                        paymentMethod === met 
                          ? 'bg-[#FF00FF] text-black border-[#FF00FF]' 
                          : 'bg-black border-zinc-805 text-zinc-500 hover:text-white'
                      }`}
                    >
                      {met}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Cart Breakdown preview inside cell */}
            {cart.length > 0 && (
              <div className="bg-black border border-[#FF00FF]/30 rounded p-1.5 space-y-1 max-h-24 overflow-y-auto">
                {cart.map(i => (
                  <div key={i.id} className="flex justify-between items-center text-[10px] font-mono text-zinc-300">
                    <span className="truncate max-w-[120px] uppercase font-bold text-zinc-400">{i.nombre}</span>
                    <div className="flex items-center space-x-2">
                      <button onClick={() => adjustQty(i.productId, -1)} className="p-0.5 bg-black border border-zinc-805 rounded p-0 text-center flex items-center justify-center w-3 h-3"><Minus className="w-2 h-2 text-zinc-500 hover:text-white" /></button>
                      <span className="font-extrabold text-[#FF00FF]">{i.quantity}</span>
                      <button onClick={() => adjustQty(i.productId, 1)} className="p-0.5 bg-black border border-zinc-805 rounded p-0 text-center flex items-center justify-center w-3 h-3"><Plus className="w-2 h-2 text-[#FF00FF]" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Action trigger button */}
            <div className="flex justify-between items-center pt-1 border-t border-[#FF00FF]/30">
              <div className="text-left">
                <span className="text-[8px] font-mono text-zinc-500 uppercase block tracking-wider font-bold">Monto Cuenta</span>
                <span className="text-lg font-mono font-black text-[#FF00FF] leading-none">
                  {calculateTotal().toFixed(2)} €
                </span>
              </div>

              <button
                onClick={handleSendOrder}
                disabled={cart.length === 0 || isSubmitting}
                className="px-4 py-2 bg-[#FF00FF] hover:bg-white disabled:bg-zinc-900 disabled:text-zinc-650 disabled:border-zinc-800 border-2 border-[#FF00FF] text-black rounded text-xs font-black font-mono tracking-widest uppercase transition-all flex items-center gap-1 cursor-pointer active:scale-95"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Enviar Pedido</span>
              </button>
            </div>

          </div>

        </div>
      )}

      {/* Success notification sliding overlay */}
      {successMsg && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6 transition-all duration-300">
          <div className="w-16 h-16 rounded-full border border-emerald-500/50 bg-emerald-950/30 flex items-center justify-center text-emerald-400 mb-4 animate-bounce shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            <Check className="w-8 h-8" />
          </div>
          <h3 className="text-zinc-100 font-bold font-mono text-sm uppercase tracking-wider">¡ENVIADO CORRECTAMENTE!</h3>
          <p className="text-zinc-500 font-mono text-[10px] text-center mt-1">
            Comanda transferida con éxito al TPV del PC central.
          </p>
        </div>
      )}

      {/* Manual numerical payment keyboard */}
      <ManualKeypadModal
        isOpen={showManualKeypad}
        onClose={() => setShowManualKeypad(false)}
        activeStaffId={staffName || 'Camarero'}
        onAddCustomItemToCart={handleManualAddCart}
        onDirectCheckout={handleManualDirectCheckout}
      />

    </div>
  );
}
