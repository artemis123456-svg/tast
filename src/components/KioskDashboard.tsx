/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  Snowflake, 
  Grid, 
  Coffee, 
  Utensils, 
  Printer, 
  Clock, 
  Check, 
  AlertCircle, 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingBag, 
  Coins, 
  User, 
  BadgeAlert, 
  Volume2, 
  VolumeX,
  CreditCard,
  DollarSign,
  Keyboard
} from 'lucide-react';
import { Product, Order, TicketConfig, OrderItem, OrderStatus, ProductCategory, Table } from '../types';
import { createOrder, updateOrderStatus, socket } from '../lib/api';
import ManualKeypadModal from './ManualKeypadModal';
import CashRegisterModal from './CashRegisterModal';

export function getProductImage(prod: Product): string {
  if (prod.imagen_url && prod.imagen_url.trim() !== '') {
    return prod.imagen_url;
  }
  
  const nameLower = prod.nombre.toLowerCase();
  
  if (nameLower.includes('pernil salat') || nameLower.includes('salat')) {
    return 'https://images.unsplash.com/photo-1553909489-cd47e0907980?auto=format&fit=crop&w=120&h=120&q=80';
  }
  if (nameLower.includes('pernil') || nameLower.includes('formatge') || nameLower.includes('bikini')) {
    return 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=120&h=120&q=80';
  }
  if (nameLower.includes('tonyina') || nameLower.includes('anxoves') || nameLower.includes('pescado')) {
    return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=120&h=120&q=80';
  }
  if (nameLower.includes('llonganissa') || nameLower.includes('xoriço') || nameLower.includes('fuet') || nameLower.includes('butifarra')) {
    return 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=120&h=120&q=80';
  }
  if (nameLower.includes('bacon') || nameLower.includes('llom')) {
    return 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?auto=format&fit=crop&w=120&h=120&q=80';
  }
  if (nameLower.includes('frankfurt')) {
    return 'https://images.unsplash.com/photo-1541232264-8066f8e4b2c7?auto=format&fit=crop&w=120&h=120&q=80';
  }
  if (nameLower.includes('truita') || nameLower.includes('tortilla')) {
    return 'https://images.unsplash.com/photo-1518492104633-130d0cc84637?auto=format&fit=crop&w=120&h=120&q=80';
  }
  
  if (prod.categoria === 'Entrepans Freds') {
    return 'https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=120&h=120&q=80';
  }
  if (prod.categoria === 'Entrepans Calents') {
    return 'https://images.unsplash.com/photo-1541532713592-79a0317b6b77?auto=format&fit=crop&w=120&h=120&q=80';
  }
  if (prod.categoria === 'Torrades') {
    return 'https://images.unsplash.com/photo-1484723091739-30a097e8f929?auto=format&fit=crop&w=120&h=120&q=80';
  }
  if (prod.categoria === 'Pastes') {
    if (nameLower.includes('croissant')) {
      return 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=120&h=120&q=80';
    }
    if (nameLower.includes('donut')) {
      return 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=120&h=120&q=80';
    }
    return 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=120&h=120&q=80';
  }
  if (prod.categoria === 'Begudes') {
    if (nameLower.includes('caf') || nameLower.includes('tallat') || nameLower.includes('capuccino')) {
      return 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=120&h=120&q=80';
    }
    if (nameLower.includes('aigua') || nameLower.includes('agua')) {
      return 'https://images.unsplash.com/photo-1560023907-5f676936ee3d?auto=format&fit=crop&w=120&h=120&q=80';
    }
    if (nameLower.includes('cervesa') || nameLower.includes('estrella') || nameLower.includes('cerveza')) {
      return 'https://images.unsplash.com/photo-1623855244697-5d8f93458923?auto=format&fit=crop&w=120&h=120&q=80';
    }
    return 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=120&h=120&q=80';
  }
  
  return 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=120&h=120&q=80';
}

interface KioskDashboardProps {
  products: Product[];
  orders: Order[];
  tables: Table[];
  config: { ticket: TicketConfig };
  onRefreshOrders: () => void;
  onRefreshProducts: () => void;
  activeStaffId: string;
}

export default function KioskDashboard({ 
  products, 
  orders, 
  tables = [],
  config, 
  onRefreshOrders, 
  onRefreshProducts,
  activeStaffId 
}: KioskDashboardProps) {
  
  // Audio chime state
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  // Real-time Order list
  const [localOrders, setLocalOrders] = useState<Order[]>(orders);
  
  // Ordering panel states
  const [activeCategory, setActiveCategory] = useState<ProductCategory>('Entrepans Freds');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'Efectivo' | 'Bizum'>('Efectivo');
  const [tableNumber, setTableNumber] = useState('Barra');
  const [isOrdering, setIsOrdering] = useState(false);
  const [showTableSelection, setShowTableSelection] = useState(true);
  const [activeTablesZona, setActiveTablesZona] = useState<'Interior' | 'Exterior'>('Interior');
  
  // Printer ticket preview modal
  const [selectedTicketOrder, setSelectedTicketOrder] = useState<Order | null>(null);

  // Cash Register / Cambio € calculator states
  const [isCashRegisterOpen, setIsCashRegisterOpen] = useState(false);
  const [cashRegisterTotal, setCashRegisterTotal] = useState(0);
  const [onCashRegisterConfirm, setOnCashRegisterConfirm] = useState<
    (amountPaid: number, change: number, method: 'Efectivo' | 'Bizum') => Promise<void>
  >(() => async () => {});

  // Dynamic clock now to calculate elapsed times in kitchen correctly
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timerId = setInterval(() => {
      setNow(Date.now());
    }, 5000); // update every 5 seconds for great responsiveness
    return () => clearInterval(timerId);
  }, []);

  // Manual keypad state
  const [showManualKeypad, setShowManualKeypad] = useState(false);

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
      camarero_id: `${activeStaffId || 'PC_Terminal'} (${tableNumber})`
    });
    playChime();
    onRefreshOrders();
  };

  // Play a gorgeous high-frequency sound chime on new incoming orders or status transitions
  const playChime = () => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // High A key
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.15); // E key
      
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      console.warn('Audio chime unsupported:', e);
    }
  };

  // Sync state with incoming socket.io broadcasts
  useEffect(() => {
    setLocalOrders(orders);
  }, [orders]);

  useEffect(() => {
    // Escuchar cambios de pedidos por websocket
    socket.on('orders-changed', (updatedOrders: Order[]) => {
      setLocalOrders(updatedOrders);
      playChime();
      onRefreshOrders();
    });

    socket.on('products-changed', () => {
      onRefreshProducts();
    });

    return () => {
      socket.off('orders-changed');
      socket.off('products-changed');
    };
  }, []);

  // Automatically trigger simulated thermal print on setting selectedTicketOrder
  useEffect(() => {
    if (selectedTicketOrder) {
      const timer = setTimeout(() => {
        try {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(160, ctx.currentTime);
          gain.gain.setValueAtTime(0.03, ctx.currentTime);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          setTimeout(() => osc.stop(), 600);
        } catch (e) {
          console.log('Audio print buzz unsupported');
        }
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [selectedTicketOrder]);

  const handleStatusChange = async (orderId: string, nextStatus: OrderStatus) => {
    try {
      await updateOrderStatus(orderId, nextStatus);
      onRefreshOrders();
    } catch (e) {
      alert('Error al actualizar el estado del pedido');
    }
  };

  const getCategoryIcon = (category: ProductCategory) => {
    switch (category) {
      case 'Entrepans Freds': return <Snowflake className="w-5 h-5 text-sky-400" />;
      case 'Entrepans Calents': return <Flame className="w-5 h-5 text-amber-500" />;
      case 'Torrades': return <Grid className="w-5 h-5 text-yellow-600" />;
      case 'Pastes': return <Utensils className="w-5 h-5 text-[#FF00FF]" />;
      case 'Begudes': return <Coffee className="w-5 h-5 text-emerald-400" />;
      default: return <Utensils className="w-5 h-5" />;
    }
  };

  // Add item to quick sales cart
  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      alert(`⚠️ ¡Atención! No hay stock disponible para ${product.nombre}`);
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
        id: `cart-item-${Date.now()}-${product.id}`,
        productId: product.id,
        nombre: product.nombre,
        precio: product.precio,
        quantity: 1
      }];
    });
  };

  const updateCartQty = (productId: string, delta: number) => {
    setCart((prev) => prev.map(item => {
      if (item.productId === productId) {
        const nextQty = item.quantity + delta;
        return nextQty > 0 ? { ...item, quantity: nextQty } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter(item => item.productId !== productId));
  };

  const calculateCartTotal = () => {
    return Number(cart.reduce((sum, item) => sum + (item.precio * item.quantity), 0).toFixed(2));
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setCashRegisterTotal(calculateCartTotal());
    setOnCashRegisterConfirm(() => async (amountPaid: number, change: number, method: 'Efectivo' | 'Bizum') => {
      setIsOrdering(true);
      try {
        const response = await createOrder({
          items: cart,
          metodo_pago: method,
          camarero_id: `${activeStaffId || 'PC_Terminal'} (${tableNumber})`
        });
        // Clear Cart
        setCart([]);
        setTableNumber('Barra');
        setShowTableSelection(true);
        playChime();
        // Automatically open the printed receipt ticket preview modal!
        setSelectedTicketOrder(response);
      } catch (e: any) {
        alert(`Error al colocar pedido: ${e.message}`);
      } finally {
        setIsOrdering(false);
      }
    });
    setIsCashRegisterOpen(true);
  };

  const handleSendToKitchen = async () => {
    if (cart.length === 0) return;
    setIsOrdering(true);
    try {
      const response = await createOrder({
        items: cart,
        metodo_pago: 'Efectivo',
        camarero_id: `${activeStaffId || 'PC_Terminal'} (${tableNumber})`
      });
      // Clear Cart
      setCart([]);
      setTableNumber('Barra');
      setShowTableSelection(true);
      playChime();
      alert('🔥 ¡Comanda enviada a cocina con éxito! Mesa ocupada en el Monitor y Dispositivo de Camareros.');
    } catch (e: any) {
      alert(`Error al mandar a cocina: ${e.message}`);
    } finally {
      setIsOrdering(false);
    }
  };

  const handleOpenOrderCheckoutClick = (order: Order) => {
    setCashRegisterTotal(order.total);
    setOnCashRegisterConfirm(() => async (amountPaid: number, change: number, method: 'Efectivo' | 'Bizum') => {
      try {
        const response = await updateOrderStatus(order.id, 'Pagado');
        onRefreshOrders();
        playChime();
        // Set selectedTicketOrder to trigger simulated printed receipt popup
        setSelectedTicketOrder({
          ...response,
          metodo_pago: method
        });
      } catch (e: any) {
        alert(`Error al cobrar el pedido: ${e.message}`);
      }
    });
    setIsCashRegisterOpen(true);
  };

  // Filter products by category and active flag
  const filteredProducts = products.filter(p => p.categoria === activeCategory && p.activo);

  // Compile Set of busy tables dynamically from outstanding unresolved orders
  const busyTableNumbers = new Set(
    localOrders
      .filter(o => o.estado === 'Pendiente' || o.estado === 'Preparado')
      .map(o => {
        const match = o.camarero_id.match(/\((.*?)\)/);
        if (!match) return '';
        let val = match[1];
        if (val.toLowerCase().startsWith('mesa ')) {
          val = val.substring(5);
        }
        return val.trim();
      })
      .filter(Boolean)
  );

  if (showTableSelection) {
    return (
      <div className="bg-black border-2 border-[#FF00FF] p-6 shadow-[0_0_30px_rgba(255,0,255,0.1)] rounded-3xl space-y-6 max-w-5xl mx-auto animate-fadeIn text-left min-h-[480px]">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#FF00FF]/40 pb-4">
          <div>
            <h2 className="text-xl font-black tracking-widest text-[#FF00FF] font-mono uppercase italic flex items-center space-x-2">
              <Grid className="w-5 h-5 text-[#FF00FF] animate-pulse" />
              <span>DISPOSICIÓN DE MESAS - SERVICIO TÁCTIL</span>
            </h2>
            <p className="text-zinc-450 text-xs font-mono mt-1">
              Selecciona una mesa en el plano para iniciar la comanda. Las mesas ocupadas se muestran con iluminación en naranja.
            </p>
          </div>

          {/* Quick Zone toggle */}
          <div className="flex bg-[#0a0a0a] border border-[#FF00FF]/40 p-1 rounded-xl shrink-0">
            <button
              type="button"
              onClick={() => setActiveTablesZona('Interior')}
              className={`px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                activeTablesZona === 'Interior'
                  ? 'bg-[#FF00FF] text-black font-black'
                  : 'text-zinc-500 hover:text-white'
              }`}
            >
              Interior del Local
            </button>
            <button
              type="button"
              onClick={() => setActiveTablesZona('Exterior')}
              className={`px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                activeTablesZona === 'Exterior'
                  ? 'bg-[#FF00FF] text-black font-black'
                  : 'text-zinc-500 hover:text-white'
              }`}
            >
              Exterior (Terraza)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Visual Floor Map */}
          <div className="lg:col-span-8 flex flex-col space-y-2">
            <span className="text-[10px] font-mono text-zinc-550 uppercase tracking-widest block">MAPA DE SALA ({activeTablesZona.toUpperCase()})</span>
            
            <div className="relative h-[430px] bg-zinc-950/80 rounded-3xl border border-zinc-900 overflow-hidden shadow-[inset_0_0_35px_rgba(0,0,0,0.85)] bg-[radial-gradient(#ffffff04_1px,transparent_1px)] [background-size:20px_20px]">
              
              {/* Floor guides */}
              <div className="absolute inset-x-0 bottom-4 flex justify-between px-6 text-[8px] font-mono text-zinc-700 select-none uppercase pointer-events-none">
                <span>← Cocina / Barra de Servicio Principal</span>
                <span>Puerta de Cristal Exterior →</span>
              </div>

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
                        playChime();
                      }}
                      style={{
                        left: `${t.x}%`,
                        top: `${t.y}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                      className={`absolute w-14 h-14 rounded-full border-2 flex flex-col items-center justify-center font-mono active:scale-95 transition-all text-xs ${
                        isBusy
                          ? 'bg-amber-500/10 border-amber-500 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.25)] hover:bg-amber-500/30'
                          : 'bg-zinc-900 border-zinc-800 hover:border-[#FF00FF] hover:text-white text-zinc-300 shadow-md hover:shadow-[0_0_15px_rgba(255,0,255,0.2)]'
                      }`}
                    >
                      <span className="text-[8px] uppercase tracking-wider text-zinc-550 leading-none">Mesa</span>
                      <span className="text-sm font-black mt-0.5 leading-none">{t.number}</span>
                      <span className={`text-[7px] font-mono uppercase mt-0.5 leading-none ${isBusy ? 'text-amber-500 font-bold' : 'text-zinc-500'}`}>
                        {isBusy ? 'Ocupada' : 'Libre'}
                      </span>
                    </button>
                  );
                })}

              {tables.filter(t => t.zona === activeTablesZona).length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 text-zinc-600 font-mono text-xs italic">
                  No hay mesas definidas en la zona {activeTablesZona}.
                  <span className="text-[10px] text-zinc-700 mt-2 block">Personalízalas en el apartado⚙️ Oficina &gt; Distribución de Mesas</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick list sidebar */}
          <div className="lg:col-span-4 space-y-4 flex flex-col justify-between">
            <div className="space-y-3 bg-[#080808] border border-zinc-900 rounded-2xl p-4 flex-1">
              <span className="text-[10px] font-mono text-zinc-500 uppercase block tracking-wider font-bold">Listado de Mesas</span>
              
              <div className="space-y-1.5 max-h-[290px] overflow-y-auto pr-1">
                {tables.map(t => {
                  const isBusy = busyTableNumbers.has(t.number);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setTableNumber(t.number);
                        setShowTableSelection(false);
                        playChime();
                      }}
                      className={`w-full p-2.5 rounded-xl text-left flex justify-between items-center text-xs font-mono border transition-all ${
                        isBusy
                          ? 'bg-amber-500/5 border-amber-500/30 text-amber-400 hover:bg-amber-500/10'
                          : 'bg-zinc-950 border-zinc-900 hover:border-zinc-800 text-zinc-300'
                      }`}
                    >
                      <div className="font-bold flex items-center space-x-2">
                        <span className={`w-2 h-2 rounded-full ${isBusy ? 'bg-amber-500 animate-pulse' : 'bg-transparent border border-zinc-500'}`} />
                        <span>Mesa {t.number} <span className="text-[8px] text-zinc-550 italic uppercase">({t.zona})</span></span>
                      </div>
                      <span className="text-[9px] uppercase font-bold">{isBusy ? 'Ocupada' : 'Libre'}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Default service options */}
            <div className="space-y-2">
              <span className="text-[9px] text-zinc-550 uppercase font-mono tracking-widest block text-center">Otras Opciones Rápidas</span>
              <button
                type="button"
                onClick={() => {
                  setTableNumber('Barra');
                  setShowTableSelection(false);
                  playChime();
                }}
                className="w-full py-3 bg-[#FF00FF]/10 border-2 border-dashed border-[#FF00FF]/50 text-[#FF00FF] font-black font-mono text-xs uppercase rounded-2xl cursor-pointer hover:bg-[#FF00FF] hover:text-black transition-all"
              >
                ☕ Servicio de Barra (Rápido)
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[calc(100vh-120px)] text-white animate-fadeIn">
      
      {/* LEFT SECTION (POS Ordering Terminal Card Screen) -> Columns (lg: 7) */}
      <div className="lg:col-span-7 flex flex-col space-y-4 bg-black border border-[#FF00FF] p-4 shadow-[0_0_20px_rgba(255,0,255,0.05)]">
        
        {/* Category Header Controls */}
        <div className="flex items-center justify-between border-b border-[#FF00FF]/40 pb-3">
          <div className="flex items-center space-x-2">
            <ShoppingBag className="w-5 h-5 text-[#FF00FF]" />
            <h2 className="text-xs font-black uppercase tracking-widest text-zinc-350 font-display">
              Comanda: <button onClick={() => setShowTableSelection(true)} className="px-2.5 py-0.5 rounded bg-zinc-900 border border-[#FF00FF]/40 hover:border-[#FF00FF] hover:bg-[#FF00FF]/10 hover:text-[#FF00FF] transition-all text-xs font-mono mx-1 uppercase font-black text-[#FF00FF]">{tableNumber || 'Sin Mesa'}</button>
            </h2>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowManualKeypad(true)}
              className="px-2.5 py-1 bg-[#FF00FF] hover:bg-white text-black border border-[#FF00FF] text-[9px] font-black uppercase tracking-wider flex items-center space-x-1.5 transition-all cursor-pointer mr-1"
              title="Cobro manual / Venta Express"
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span>Teclado Manual</span>
            </button>

            <button 
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 border border-zinc-800 bg-black/40 text-zinc-400 cursor-pointer"
              title="Alternar sonido"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-[#FF00FF]" /> : <VolumeX className="w-4 h-4 text-zinc-600" />}
            </button>
            <span className="text-[9px] bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono px-2 py-0.5 rounded font-black tracking-widest uppercase">
              Operario: {activeStaffId || 'Terminal PC'}
            </span>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex bg-[#0a0a0a] border border-[#FF00FF]/40">
          {['Entrepans Freds', 'Entrepans Calents', 'Torrades', 'Pastes', 'Begudes'].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat as ProductCategory)}
              className={`flex-1 py-3 text-[9px] font-black uppercase tracking-tighter border-r border-[#FF00FF]/40 last:border-r-0 transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
                activeCategory === cat 
                  ? 'bg-[#FF00FF] text-black italic font-black' 
                  : 'hover:bg-[#330033] text-[#FF00FF]'
              }`}
            >
              <span className={activeCategory === cat ? 'text-black' : ''}>{getCategoryIcon(cat as ProductCategory)}</span>
              <span className="truncate">{cat}</span>
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-1 p-1 bg-[#FF00FF]/15 border border-[#FF00FF]/30 overflow-y-auto max-h-[500px] pr-1">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full py-12 text-center text-zinc-500 font-mono text-xs">
              No hay productos registrados en esta categoría
            </div>
          ) : (
            filteredProducts.map((prod) => (
              <button
                key={prod.id}
                onClick={() => addToCart(prod)}
                className="bg-black border border-[#FF00FF]/40 p-2 flex flex-row items-center gap-2.5 hover:border-[#FF00FF] hover:bg-[#330033]/15 text-left transition-colors relative h-24 cursor-pointer outline-none group overflow-hidden"
              >
                {/* Small square product picture */}
                <div className="w-16 h-16 bg-zinc-900 border border-[#FF00FF]/25 shrink-0 overflow-hidden relative">
                  <img 
                    src={getProductImage(prod)} 
                    alt={prod.nombre} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                
                <div className="flex-1 flex flex-col justify-between h-full min-w-0">
                  <div className="w-full">
                    <div className="flex justify-between items-start gap-1">
                      <span className="text-[8px] font-mono text-[#FF00FF] truncate">#{prod.id.slice(-4).toUpperCase()}</span>
                      <span className="bg-[#FF00FF] text-black text-[8px] font-black px-1 uppercase shrink-0 leading-tight">
                        STOCK: {prod.stock}
                      </span>
                    </div>
                    <h3 className="text-zinc-100 font-extrabold uppercase text-[11px] tracking-tight line-clamp-2 mt-1 leading-tight group-hover:text-[#FF00FF] break-words">
                      {prod.nombre}
                    </h3>
                  </div>
                  
                  <div className="flex items-end justify-between border-t border-zinc-900/50 pt-0.5 mt-0.5">
                    {prod.alergenos && prod.alergenos.length > 0 ? (
                      <span className="text-[8px] text-[#FF00FF] font-sans font-black" title={prod.alergenos.join(', ')}>⚠️ ALÉRG.</span>
                    ) : <span />}
                    <span className="text-base font-mono text-[#FF00FF] tracking-tighter font-black">
                      {prod.precio.toFixed(2)}€
                    </span>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* PC Terminal Cart Checkout Panel */}
        <div className="border-t border-[#FF00FF]/40 pt-3">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            
            {/* Cart preview */}
            <div className="md:col-span-5">
              <span className="text-[10px] text-[#FF00FF] font-mono block mb-1 uppercase font-black tracking-widest">
                Comanda Activa ({cart.reduce((s, i) => s + i.quantity, 0)} ítems)
              </span>
              <div className="bg-black border border-[#FF00FF]/40 rounded max-h-24 overflow-y-auto p-1.5 space-y-1">
                {cart.length === 0 ? (
                  <span className="text-[10px] text-zinc-600 block text-center py-4 italic">El carrito está vacío</span>
                ) : (
                  cart.map(item => (
                    <div key={item.id} className="flex justify-between items-center text-[11px] font-mono bg-zinc-950 p-1 border border-zinc-900 rounded">
                      <span className="truncate text-zinc-350 max-w-[120px] uppercase font-bold">{item.nombre}</span>
                      <div className="flex items-center space-x-1.5">
                        <button onClick={() => updateCartQty(item.productId, -1)} className="p-0.5 rounded text-zinc-500 hover:bg-zinc-800"><Minus className="w-2.5 h-2.5" /></button>
                        <span className="text-[#FF00FF] font-black">{item.quantity}</span>
                        <button onClick={() => updateCartQty(item.productId, 1)} className="p-0.5 rounded text-[#FF00FF] hover:bg-zinc-850"><Plus className="w-2.5 h-2.5" /></button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick configuration parameters */}
            <div className="md:col-span-4 flex flex-col space-y-1.5">
              <div>
                <label className="text-[9px] text-[#FF00FF] font-mono block uppercase font-bold tracking-wider">MÉTODO DE PAGO</label>
                <div className="flex gap-1.5 mt-0.5">
                  {(['Efectivo', 'Bizum'] as const).map(metodo => (
                    <button
                      key={metodo}
                      onClick={() => setPaymentMethod(metodo)}
                      className={`flex-1 py-1 border font-mono text-[10px] font-black uppercase tracking-wider cursor-pointer ${
                        paymentMethod === metodo 
                          ? 'bg-[#FF00FF] text-black border-[#FF00FF]' 
                          : 'bg-black border-zinc-800 text-zinc-500 hover:text-white'
                      }`}
                    >
                      {metodo}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="text-[9px] text-[#FF00FF] font-mono block uppercase font-bold tracking-wider">MESA / NOTA</label>
                <input
                  type="text"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="Ej. Mesa 4 o Barra"
                  className="w-full bg-black border border-zinc-800 rounded px-2 py-1 text-xs text-white uppercase font-bold focus:outline-none focus:border-[#FF00FF] font-mono mt-0.5"
                />
              </div>
            </div>

            {/* Total / Submit Action */}
            <div className="md:col-span-3 flex flex-col justify-end text-right h-full space-y-1.5">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider font-bold">Total Estimado</span>
              <span className="text-2xl font-mono font-black text-[#FF00FF] block leading-none py-0.5">
                {calculateCartTotal().toFixed(2)} €
              </span>
              <div className="flex flex-col gap-1 w-full">
                <button
                  type="button"
                  onClick={handleSendToKitchen}
                  disabled={cart.length === 0 || isOrdering}
                  className="w-full bg-[#111] hover:bg-[#ffaa00]/10 disabled:bg-zinc-950 disabled:text-zinc-850 disabled:border-zinc-900 text-amber-500 border border-amber-600/60 hover:border-amber-400 py-1.5 rounded text-[10px] font-bold font-mono uppercase tracking-wider transition-all cursor-pointer active:scale-95 flex items-center justify-center space-x-1"
                >
                  <span>🔥 Mandar a Cocina</span>
                </button>
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={cart.length === 0 || isOrdering}
                  className="w-full bg-[#FF00FF] hover:bg-white disabled:bg-zinc-900 disabled:text-zinc-650 disabled:border-zinc-800 text-black py-2 rounded text-xs font-black font-mono uppercase tracking-widest transition-all cursor-pointer active:scale-95 flex items-center justify-center space-x-1 border-2 border-[#FF00FF]"
                >
                  <span>Cobrar Pedido</span>
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* RIGHT SECTION (Incoming Active Orders Queue) -> Columns (lg: 5) */}
      <div className="lg:col-span-5 flex flex-col bg-[#050505] border border-[#FF00FF] p-4 shadow-[0_0_20px_rgba(255,0,255,0.05)]">
        
        <div className="p-3 border-b border-[#FF00FF]/40 bg-[#111] -mx-4 -mt-4 mb-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-[#FF00FF] animate-pulse" />
            <h2 className="text-xs font-black uppercase tracking-widest text-[#FF00FF]">Monitor Cocina / Pedidos</h2>
          </div>
          
          <span className="text-[10px] bg-[#FF00FF] text-black font-mono font-black italic px-2 py-0.5 uppercase">
            {localOrders.filter(o => o.estado !== 'Pagado').length} ACTIVOS
          </span>
        </div>

        {/* Order queue cards lists */}
        <div className="space-y-3 overflow-y-auto max-h-[600px] pr-1">
          {localOrders.length === 0 ? (
            <div className="py-24 text-center text-zinc-600 font-mono text-xs flex flex-col items-center justify-center">
              <BadgeAlert className="w-8 h-8 mb-2 text-zinc-700" />
              <span>Ningún pedido activo registrado actualmente</span>
            </div>
          ) : (
            // Sort by state (Pendiente -> Preparado -> Pagado) and timestamp (newest first)
            localOrders
              .slice()
              .sort((a, b) => {
                const orderMap: Record<OrderStatus, number> = { 'Pendiente': 0, 'Preparado': 1, 'Pagado': 2 };
                if (orderMap[a.estado] !== orderMap[b.estado]) {
                  return orderMap[a.estado] - orderMap[b.estado];
                }
                return b.timestamp - a.timestamp;
              })
              .map((order) => {
                const orderTime = new Date(order.timestamp).toLocaleTimeString('es-ES', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  second: '2-digit' 
                });

                const elapsedMs = now - order.timestamp;
                const elapsedMin = Math.floor(elapsedMs / 60000);
                const isOrange = order.estado === 'Pendiente' && elapsedMin > 10 && elapsedMin <= 15;
                const isRedBrilliant = order.estado === 'Pendiente' && elapsedMin > 15;

                let borderStyle = 'border-yellow-500';
                let bgStyle = 'bg-[#111]';
                let shadowStyle = '';
                let animationStyle = '';

                if (order.estado === 'Pendiente') {
                  if (isRedBrilliant) {
                    borderStyle = 'border-red-500';
                    bgStyle = 'bg-red-950/20';
                    shadowStyle = 'shadow-[0_0_15px_rgba(239,68,68,0.3)]';
                    animationStyle = 'animate-[pulse_2s_infinite]';
                  } else if (isOrange) {
                    borderStyle = 'border-orange-500';
                    bgStyle = 'bg-orange-950/10';
                    shadowStyle = 'shadow-[0_0_10px_rgba(249,115,22,0.15)]';
                  } else {
                    borderStyle = 'border-yellow-500';
                  }
                } else if (order.estado === 'Preparado') {
                  borderStyle = 'border-[#FF00FF]';
                } else {
                  borderStyle = 'border-green-500 opacity-60';
                }

                return (
                  <div 
                    key={order.id} 
                    className={`border-l-4 p-3 transition-all flex flex-col justify-between ${borderStyle} ${bgStyle} ${shadowStyle} ${animationStyle}`}
                  >
                    
                    {/* Header Row */}
                    <div className="flex items-center justify-between border-b border-zinc-900 pb-2 mb-2">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-mono text-xs font-bold text-white uppercase">{order.id}</span>
                        <span className="text-[9px] text-zinc-500 font-mono">@{orderTime}</span>
                        {order.estado !== 'Pagado' && (
                          <span className={`text-[9px] font-mono font-black tracking-tighter px-1 rounded ml-1 flex items-center ${
                            elapsedMin > 15 
                              ? 'bg-red-500 text-white animate-pulse' 
                              : elapsedMin > 10 
                                ? 'bg-orange-500 text-black' 
                                : 'bg-zinc-800 text-zinc-300'
                          }`}>
                            ⏱️ {elapsedMin}m
                          </span>
                        )}
                      </div>
                      
                      {/* State Pills switches */}
                      <div className="flex items-center space-x-1">
                        {order.estado === 'Pendiente' && (
                          <button
                            onClick={() => handleStatusChange(order.id, 'Preparado')}
                            className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/40 border border-amber-500/50 px-2 py-0.5 rounded text-[10px] font-mono cursor-pointer uppercase font-bold animate-pulse"
                          >
                            MARCAR EN COCINA
                          </button>
                        )}
                        {order.estado === 'Preparado' && (
                          <button
                            onClick={() => handleOpenOrderCheckoutClick(order)}
                            className="bg-[#FF00FF]/25 text-[#FF00FF] hover:bg-white hover:text-black border border-[#FF05FF]/60 px-2.5 py-0.5 rounded text-[10px] font-mono cursor-pointer uppercase font-black transition-all"
                          >
                            💶 COBRAR CUENTA
                          </button>
                        )}
                        {order.estado === 'Pagado' && (
                          <span className="bg-emerald-950/40 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded text-[9px] font-mono font-bold flex items-center gap-1 uppercase">
                            <Check className="w-3 h-3" /> COBRADO
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Waiter metadata */}
                    <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono mb-2">
                      <span className="flex items-center space-x-1">
                        <User className="w-3 h-3 text-zinc-650" />
                        <span>{order.camarero_id}</span>
                      </span>
                      <span className="flex items-center gap-1 font-bold text-zinc-400">
                        {order.metodo_pago === 'Efectivo' ? (
                          <span className="text-emerald-400 flex items-center bg-emerald-950/20 px-1 border border-emerald-900/50 rounded text-[9px]">EFECTIVO</span>
                        ) : (
                          <span className="text-indigo-400 flex items-center bg-indigo-950/20 px-1 border border-indigo-900/50 rounded text-[9px]">BIZUM</span>
                        )}
                      </span>
                    </div>

                    {/* Item lines list */}
                    <div className="space-y-1 bg-zinc-950 border border-zinc-900/70 rounded-lg p-2 max-h-32 overflow-y-auto mb-2">
                      {order.items.map((line, lid) => (
                        <div key={lid} className="flex justify-between text-xs font-mono">
                          <div className="text-zinc-300">
                            <span className="text-[#FF00FF] font-semibold">{line.quantity}x</span> {line.nombre}
                          </div>
                          <span className="text-zinc-500">{(line.precio * line.quantity).toFixed(2)}€</span>
                        </div>
                      ))}
                    </div>

                    {/* Footer price / Thermal printer preview button */}
                    <div className="flex justify-between items-center pt-1">
                      <button
                        onClick={() => setSelectedTicketOrder(order)}
                        className="bg-zinc-900 hover:bg-[#FF00FF]/10 text-zinc-405 hover:text-[#FF00FF] border border-zinc-800 hover:border-[#FF00FF] px-2 py-1 rounded-lg text-[11px] font-mono flex items-center space-x-1.5 transition-all cursor-pointer outline-none"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Ver Ticket</span>
                      </button>
                      
                      <div className="text-right">
                        <span className="text-[9px] font-mono text-zinc-500 block leading-none">Total Pagado:</span>
                        <span className="text-base font-mono font-extrabold text-[#FF00FF] tracking-tight">
                          {order.total.toFixed(2)} €
                        </span>
                      </div>
                    </div>

                  </div>
                );
              })
          )}
        </div>

      </div>

      {/* TICKET PREVIEW MODAL - High-fidelity B/W simulator */}
      {selectedTicketOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-black border border-zinc-800 rounded-2xl max-w-sm w-full overflow-hidden flex flex-col shadow-2xl">
            
            {/* Modal action bar */}
            <div className="bg-zinc-950 py-3 px-4 border-b border-zinc-900 flex justify-between items-center">
              <span className="text-xs font-mono font-bold text-zinc-400 uppercase">Previsualización Térmica 80mm</span>
              <button 
                onClick={() => setSelectedTicketOrder(null)}
                className="text-zinc-550 hover:text-white font-bold cursor-pointer font-sans"
              >
                ✕
              </button>
            </div>

            {/* Thermal ticket core page container (White/black classic simulator) */}
            <div className="p-4 bg-zinc-900 flex justify-center">
              <div className="bg-white text-black p-5 max-w-[280px] w-full shadow-lg font-mono text-[10px] space-y-3 relative leading-tight border border-zinc-300">
                
                {/* Visual Stamp indicating automatic printing completed */}
                <div className="absolute top-8 right-2 border-2 border-emerald-500 text-emerald-600 font-extrabold rotate-12 text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider animate-pulse select-none pointer-events-none opacity-80">
                  🖨️ IMPRESO
                </div>

                {/* Visual decoration side marks */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-zinc-200 border-b border-dashed border-zinc-500"></div>

                <div className="text-center font-bold text-sm uppercase mt-1 leading-tight select-none">
                  {config.ticket.header || 'EL TAST'}
                </div>
                
                <div className="text-center text-[8px] border-b border-dashed border-zinc-500 pb-3 leading-loose">
                  <div>DIR: {config.ticket.direccion}</div>
                  <div>TEL: {config.ticket.telefono}</div>
                  <div>N.I.F: {config.ticket.cif}</div>
                </div>

                <div className="space-y-1 py-1">
                  <div className="flex justify-between font-bold">
                    <span>Ticket ID:</span>
                    <span>{selectedTicketOrder.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Camarero:</span>
                    <span>{selectedTicketOrder.camarero_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fecha:</span>
                    <span>{new Date(selectedTicketOrder.timestamp).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Hora:</span>
                    <span>{new Date(selectedTicketOrder.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>

                {/* Line Separator */}
                <div className="border-b border-dashed border-zinc-500 my-2"></div>

                {/* Ticket items table */}
                <table className="w-full text-[9px]">
                  <thead>
                    <tr className="border-b border-dashed border-zinc-500 text-left font-bold">
                      <th className="pb-1">Cant.</th>
                      <th className="pb-1 pl-2">Descripción</th>
                      <th className="pb-1 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedTicketOrder.items.map((line, idx) => (
                      <tr key={idx} className="border-b border-zinc-100">
                        <td className="py-1 font-bold">{line.quantity}x</td>
                        <td className="py-1 pl-2">{line.nombre}</td>
                        <td className="py-1 text-right">{(line.precio * line.quantity).toFixed(2)}€</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Base Tax and totals values */}
                <div className="border-t border-dashed border-zinc-500 pt-2 space-y-1">
                  
                  {(() => {
                    const rate = 10; // defaults 10 percent
                    const totalsVal = selectedTicketOrder.total;
                    const baseVal = totalsVal / (1 + (rate / 100));
                    const taxVal = totalsVal - baseVal;
                    return (
                      <>
                        <div className="flex justify-between text-[8px]">
                          <span>Base Imponible 10%:</span>
                          <span>{baseVal.toFixed(2)}€</span>
                        </div>
                        <div className="flex justify-between text-[8px]">
                          <span>IVA Incluido (10%):</span>
                          <span>{taxVal.toFixed(2)}€</span>
                        </div>
                      </>
                    );
                  })()}

                  <div className="flex justify-between font-extrabold text-[12px] pt-1 border-t border-solid border-zinc-400">
                    <span>TOTAL:</span>
                    <span>{selectedTicketOrder.total.toFixed(2)} €</span>
                  </div>
                  
                  <div className="flex justify-between text-[8px] font-bold">
                    <span>Método pago:</span>
                    <span>{selectedTicketOrder.metodo_pago}</span>
                  </div>
                </div>

                {/* Disclaimer */}
                <div className="text-center text-[7px] text-zinc-500 pt-3 border-t border-dashed border-zinc-500 leading-normal uppercase">
                  {config.ticket.pie_pagina || 'Gràcies per la vostra visita!\nFins aviat!'}
                </div>
                
                {/* Fake paper tear cutout */}
                <div className="absolute -bottom-1 left-0 right-0 h-3 bg-white border-t border-dashed border-zinc-400">
                  <div className="flex select-none py-0.5 justify-center text-zinc-300 text-[6px]">
                  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                  </div>
                </div>

              </div>
            </div>

            {/* Print trigger simulator footer */}
            <div className="bg-zinc-950 p-4 border-t border-zinc-900 flex justify-end space-x-2">
              <button
                onClick={() => setSelectedTicketOrder(null)}
                className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  alert(`🖨️ Comando de Impresión ESC/POS transmitido a ${config.ticket.header || 'Cafetería'} en puerto USB001. ¡Impresora térmica de tickets ejecutada con éxito!`);
                  setSelectedTicketOrder(null);
                }}
                className="bg-[#FF00FF] hover:bg-fuchsia-700 text-black px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center space-x-1"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Ticket</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Cash Register & Change Calculator Modal */}
      <CashRegisterModal
        isOpen={isCashRegisterOpen}
        onClose={() => setIsCashRegisterOpen(false)}
        totalAmount={cashRegisterTotal}
        onConfirm={onCashRegisterConfirm}
      />

      {/* Manual Keypad Modal */}
      <ManualKeypadModal
        isOpen={showManualKeypad}
        onClose={() => setShowManualKeypad(false)}
        activeStaffId={activeStaffId || 'PC_Terminal'}
        onAddCustomItemToCart={handleManualAddCart}
        onDirectCheckout={handleManualDirectCheckout}
      />

    </div>
  );
}
