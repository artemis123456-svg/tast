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
  Keyboard,
  Search,
  Star,
  Leaf,
  Sparkles
} from 'lucide-react';
import { Product, Order, TicketConfig, OrderItem, OrderStatus, ProductCategory, Table } from '../types';
import { createOrder, updateOrderStatus, socket } from '../lib/api';
import { queueOfflineOrder } from '../lib/offlineSync';
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

export function getProductDisplayCategory(prod: Product): ProductCategory {
  const cat = prod.categoria;
  if ([
    'Cafés', 'Tés', 'Refrescos', 'Zumos', 'Bocadillos', 
    'Tostadas', 'Pastelería', 'Bollería', 'Tapas', 'Menús', 'Postres'
  ].includes(cat)) {
    return cat as ProductCategory;
  }

  const nameLower = prod.nombre.toLowerCase();
  if (cat === 'Begudes') {
    if (nameLower.includes('caf') || nameLower.includes('tallat') || nameLower.includes('capuccino') || nameLower.includes('llet') || nameLower.includes('cortado')) {
      return 'Cafés';
    }
    if (nameLower.includes('te ') || nameLower.includes('tés') || nameLower.includes('té') || nameLower.includes('infus') || nameLower.includes('poleo') || nameLower.includes('manzanilla')) {
      return 'Tés';
    }
    if (nameLower.includes('suc') || nameLower.includes('zumo') || nameLower.includes('naranja') || nameLower.includes('taronja')) {
      return 'Zumos';
    }
    return 'Refrescos';
  }
  
  if (cat === 'Entrepans Freds' || cat === 'Entrepans Calents') {
    return 'Bocadillos';
  }
  
  if (cat === 'Torrades') {
    return 'Tostadas';
  }
  
  if (cat === 'Pastes') {
    if (nameLower.includes('croissant') || nameLower.includes('donut') || nameLower.includes('ensaïmada') || nameLower.includes('boller') || nameLower.includes('palmera')) {
      return 'Bollería';
    }
    return 'Pastelería';
  }

  return 'Tapas';
}

export function isProductPopular(prod: Product): boolean {
  const nameLower = prod.nombre.toLowerCase();
  return (
    nameLower.includes('caf') ||
    nameLower.includes('tallat') ||
    nameLower.includes('pernil') ||
    nameLower.includes('croissant') ||
    nameLower.includes('bikini') ||
    nameLower.includes('bacon') ||
    nameLower.includes('aigua') ||
    nameLower.includes('estrella') ||
    nameLower.includes('coca-cola')
  );
}

export function getCategoryStyles(category: ProductCategory): {
  bg: string;
  text: string;
  border: string;
  accent: string;
  glow: string;
} {
  switch (category) {
    case 'Cafés':
      return {
        bg: 'bg-amber-950/20 hover:bg-amber-950/40',
        text: 'text-amber-400',
        border: 'border-amber-900/50',
        accent: 'bg-amber-500',
        glow: 'shadow-[0_0_12px_rgba(245,158,11,0.2)]'
      };
    case 'Tés':
      return {
        bg: 'bg-emerald-950/20 hover:bg-emerald-950/40',
        text: 'text-emerald-400',
        border: 'border-emerald-900/50',
        accent: 'bg-emerald-500',
        glow: 'shadow-[0_0_12px_rgba(16,185,129,0.2)]'
      };
    case 'Refrescos':
      return {
        bg: 'bg-sky-950/20 hover:bg-sky-950/40',
        text: 'text-sky-400',
        border: 'border-sky-900/50',
        accent: 'bg-sky-500',
        glow: 'shadow-[0_0_12px_rgba(14,165,233,0.2)]'
      };
    case 'Zumos':
      return {
        bg: 'bg-yellow-950/20 hover:bg-yellow-950/40',
        text: 'text-yellow-400',
        border: 'border-yellow-900/50',
        accent: 'bg-yellow-500',
        glow: 'shadow-[0_0_12px_rgba(234,179,8,0.2)]'
      };
    case 'Bocadillos':
      return {
        bg: 'bg-orange-950/20 hover:bg-orange-950/40',
        text: 'text-orange-400',
        border: 'border-orange-900/50',
        accent: 'bg-orange-500',
        glow: 'shadow-[0_0_12px_rgba(249,115,22,0.2)]'
      };
    case 'Tostadas':
      return {
        bg: 'bg-amber-900/10 hover:bg-amber-900/20',
        text: 'text-amber-300',
        border: 'border-amber-900/30',
        accent: 'bg-amber-400',
        glow: 'shadow-[0_0_12px_rgba(251,191,36,0.15)]'
      };
    case 'Pastelería':
      return {
        bg: 'bg-fuchsia-950/20 hover:bg-fuchsia-950/40',
        text: 'text-fuchsia-400',
        border: 'border-fuchsia-900/50',
        accent: 'bg-fuchsia-500',
        glow: 'shadow-[0_0_12px_rgba(217,70,239,0.2)]'
      };
    case 'Bollería':
      return {
        bg: 'bg-rose-950/20 hover:bg-rose-950/40',
        text: 'text-rose-400',
        border: 'border-rose-900/50',
        accent: 'bg-rose-500',
        glow: 'shadow-[0_0_12px_rgba(244,63,94,0.2)]'
      };
    case 'Tapas':
      return {
        bg: 'bg-red-950/20 hover:bg-red-950/40',
        text: 'text-red-400',
        border: 'border-red-900/50',
        accent: 'bg-red-500',
        glow: 'shadow-[0_0_12px_rgba(239,68,68,0.2)]'
      };
    case 'Menús':
      return {
        bg: 'bg-cyan-950/20 hover:bg-cyan-950/40',
        text: 'text-cyan-400',
        border: 'border-cyan-900/50',
        accent: 'bg-cyan-500',
        glow: 'shadow-[0_0_12px_rgba(6,182,212,0.2)]'
      };
    case 'Postres':
      return {
        bg: 'bg-violet-950/20 hover:bg-violet-950/40',
        text: 'text-violet-400',
        border: 'border-violet-900/50',
        accent: 'bg-violet-500',
        glow: 'shadow-[0_0_12px_rgba(139,92,246,0.2)]'
      };
    default:
      return {
        bg: 'bg-zinc-950/20 hover:bg-zinc-950/40',
        text: 'text-zinc-400',
        border: 'border-zinc-900/50',
        accent: 'bg-zinc-500',
        glow: 'shadow-[0_0_12px_rgba(113,113,122,0.2)]'
      };
  }
}

interface KioskDashboardProps {
  products: Product[];
  orders: Order[];
  tables: Table[];
  config: { ticket: TicketConfig };
  onRefreshOrders: () => void;
  onRefreshProducts: () => void;
  activeStaffId: string;
  themeMode?: 'dark' | 'light';
}

export default function KioskDashboard({ 
  products, 
  orders, 
  tables = [],
  config, 
  onRefreshOrders, 
  onRefreshProducts,
  activeStaffId,
  themeMode = 'dark'
}: KioskDashboardProps) {
  
  const isDark = themeMode === 'dark';
  
  // Audio chime state
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  // Real-time Order list
  const [localOrders, setLocalOrders] = useState<Order[]>(orders);
  const [isSocketConnected, setIsSocketConnected] = useState(socket.connected);
  
  // Ordering panel states
  const [activeCategory, setActiveCategory] = useState<ProductCategory>('Cafés');
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
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
    const handleConnect = () => setIsSocketConnected(true);
    const handleDisconnect = () => setIsSocketConnected(false);

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    // Escuchar cambios de pedidos por websocket
    socket.on('orders-changed', (updatedOrders: Order[]) => {
      setLocalOrders(updatedOrders);
      playChime();
      onRefreshOrders();
    });

    socket.on('products-changed', () => {
      onRefreshProducts();
    });

    setIsSocketConnected(socket.connected);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
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
      case 'Cafés': return <Coffee className="w-5 h-5 text-amber-400" />;
      case 'Tés': return <Leaf className="w-5 h-5 text-emerald-400" />;
      case 'Refrescos': return <Flame className="w-5 h-5 text-sky-400 animate-pulse" />;
      case 'Zumos': return <Grid className="w-5 h-5 text-yellow-400" />;
      case 'Bocadillos': return <Flame className="w-5 h-5 text-orange-400" />;
      case 'Tostadas': return <Grid className="w-5 h-5 text-amber-300" />;
      case 'Pastelería': return <Sparkles className="w-5 h-5 text-fuchsia-400" />;
      case 'Bollería': return <Coffee className="w-5 h-5 text-rose-400" />;
      case 'Tapas': return <Utensils className="w-5 h-5 text-red-400" />;
      case 'Menús': return <Sparkles className="w-5 h-5 text-cyan-400" />;
      case 'Postres': return <Sparkles className="w-5 h-5 text-violet-400" />;
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

  const [selectedCartItemId, setSelectedCartItemId] = useState<string | null>(null);

  const updateCartOptions = (itemId: string, option: string) => {
    setCart((prev) => prev.map(item => {
      if (item.id === itemId) {
        const currentOptions = item.options ? item.options.split(', ') : [];
        let nextOptions: string[];
        if (currentOptions.includes(option)) {
          nextOptions = currentOptions.filter(o => o !== option);
        } else {
          nextOptions = [...currentOptions, option];
        }
        return { ...item, options: nextOptions.join(', ') || undefined };
      }
      return item;
    }));
  };

  const updateCartCustomNote = (itemId: string, note: string) => {
    setCart((prev) => prev.map(item => {
      if (item.id === itemId) {
        const PREDEFINED_MODIFIERS = [
          'Leche de Soja', 'Leche de Avena', 'Descafeinado', 'Sacarina', 'Con Hielo',
          'Extra Queso', 'Sin Tomate', 'Para Llevar', 'Bien Tostado', 'Sin Gluten'
        ];
        const currentOptions = item.options ? item.options.split(', ') : [];
        const nextOptions = currentOptions.filter(o => PREDEFINED_MODIFIERS.includes(o));
        if (note.trim() !== '') {
          nextOptions.push(note.trim());
        }
        return { ...item, options: nextOptions.join(', ') || undefined };
      }
      return item;
    }));
  };

  const calculateCartTotal = () => {
    return Number(cart.reduce((sum, item) => sum + (item.precio * item.quantity), 0).toFixed(2));
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setCashRegisterTotal(calculateCartTotal());
    setOnCashRegisterConfirm(() => async (amountPaid: number, change: number, method: 'Efectivo' | 'Bizum') => {
      setIsOrdering(true);
      const cartCopy = [...cart];
      const tableNumberCopy = tableNumber;
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
        console.warn('Network or server unreachable during checkout. Queuing order offline.', e);
        try {
          const offlineOrder = queueOfflineOrder({
            items: cartCopy,
            metodo_pago: method,
            camarero_id: `${activeStaffId || 'PC_Terminal'} (${tableNumberCopy})`
          });
          setCart([]);
          setTableNumber('Barra');
          setShowTableSelection(true);
          playChime();
          
          setSelectedTicketOrder({
            id: offlineOrder.id,
            camarero_id: offlineOrder.camarero_id,
            items: offlineOrder.items as any,
            total: calculateCartTotal(),
            metodo_pago: offlineOrder.metodo_pago,
            estado: 'Pendiente',
            timestamp: offlineOrder.timestamp
          });
          
          alert('🛜 CONEXIÓN OFFLINE: El TPV ha guardado el pedido de forma segura en la memoria interna local (Cola Offline). Se sincronizará automáticamente con la red en segundo plano.');
        } catch (offlineErr: any) {
          alert(`Error crítico al registrar comanda: ${offlineErr.message}`);
        }
      } finally {
        setIsOrdering(false);
      }
    });
    setIsCashRegisterOpen(true);
  };

  const handleSendToKitchen = async () => {
    if (cart.length === 0) return;
    setIsOrdering(true);
    const cartCopy = [...cart];
    const tableNumberCopy = tableNumber;
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
      console.warn('Network or server unreachable during kitchen order. Queuing order offline.', e);
      try {
        queueOfflineOrder({
          items: cartCopy,
          metodo_pago: 'Efectivo',
          camarero_id: `${activeStaffId || 'PC_Terminal'} (${tableNumberCopy})`
        });
        setCart([]);
        setTableNumber('Barra');
        setShowTableSelection(true);
        playChime();
        alert('🛜 CONEXIÓN OFFLINE: La comanda para Cocina ha sido registrada localmente en la cola offline y se transmitirá automáticamente.');
      } catch (offlineErr: any) {
        alert(`Error al colocar pedido en cocina offline: ${offlineErr.message}`);
      }
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

  // Filter products by category, search query, favorites toggle and active flag
  const filteredProducts = products.filter(p => {
    if (!p.activo) return false;
    
    if (showOnlyFavorites && !isProductPopular(p)) return false;
    
    const displayCategory = getProductDisplayCategory(p);
    
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const nameMatch = p.nombre.toLowerCase().includes(q);
      const catMatch = displayCategory.toLowerCase().includes(q);
      const idMatch = p.id.toLowerCase().includes(q);
      return nameMatch || catMatch || idMatch;
    }
    
    return displayCategory === activeCategory;
  });

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
                  const isBusy = busyTableNumbers.has(t.number) || t.status === 'busy';
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
                  const isBusy = busyTableNumbers.has(t.number) || t.status === 'busy';
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
    <div className={`grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[calc(100vh-120px)] ${isDark ? 'text-white' : 'text-zinc-900'} animate-fadeIn`}>
      
      {/* LEFT SECTION (POS Ordering Terminal Card Screen) -> Columns (lg: 7) */}
      <div className={`lg:col-span-7 flex flex-col space-y-4 p-4 rounded-2xl border transition-all ${isDark ? 'bg-black border-[#FF00FF] shadow-[0_0_20px_rgba(255,0,255,0.05)]' : 'bg-white border-zinc-200 shadow-lg'}`}>
        
        {/* Category Header Controls */}
        <div className={`flex items-center justify-between border-b pb-3 ${isDark ? 'border-[#FF00FF]/40' : 'border-zinc-200'}`}>
          <div className="flex items-center space-x-2">
            <ShoppingBag className="w-5 h-5 text-[#FF00FF]" />
            <h2 className={`text-xs font-black uppercase tracking-widest font-display ${isDark ? 'text-zinc-350' : 'text-zinc-600'}`}>
              Comanda: <button onClick={() => setShowTableSelection(true)} className={`px-2.5 py-0.5 rounded transition-all text-xs font-mono mx-1 uppercase font-black border ${isDark ? 'bg-zinc-900 border-[#FF00FF]/40 hover:border-[#FF00FF] hover:bg-[#FF00FF]/10 text-[#FF00FF]' : 'bg-zinc-100 border-zinc-300 hover:bg-zinc-200 text-zinc-800'}`}>{tableNumber || 'Sin Mesa'}</button>
            </h2>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* LED de Conectividad de Red */}
            <div 
              className={`flex items-center space-x-1.5 px-2 py-1 rounded mr-1 border ${isDark ? 'bg-zinc-950 border-zinc-900' : 'bg-zinc-50 border-zinc-200'}`}
              title={isSocketConnected ? "Servidor Online (Websocket Activo)" : "Reconectando con el TPV central..."}
            >
              <span className={`w-2 h-2 rounded-full ${isSocketConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.7)] animate-pulse'}`} />
              <span className={`text-[9px] font-mono font-bold ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                {isSocketConnected ? 'RED: OK' : 'RED: DISCO'}
              </span>
            </div>

            <button
              onClick={() => setShowManualKeypad(true)}
              className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider flex items-center space-x-1.5 transition-all cursor-pointer mr-1 ${isDark ? 'bg-[#FF00FF] hover:bg-white text-black border border-[#FF00FF]' : 'bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-900'}`}
              title="Cobro manual / Venta Express"
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span>Teclado Manual</span>
            </button>

            <button 
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-1.5 border cursor-pointer rounded transition-all ${isDark ? 'border-zinc-800 bg-black/40 text-zinc-400' : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100'}`}
              title="Alternar sonido"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-[#FF00FF]" /> : <VolumeX className="w-4 h-4 text-zinc-600" />}
            </button>
            <span className={`text-[9px] border font-mono px-2 py-0.5 rounded font-black tracking-widest uppercase ${isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-400' : 'bg-zinc-50 border-zinc-200 text-zinc-500'}`}>
              Operario: {activeStaffId || 'Terminal PC'}
            </span>
          </div>
        </div>

        {/* Search & Favorites Quick Access Bar */}
        <div className={`grid grid-cols-1 md:grid-cols-12 gap-2 p-2 border rounded-xl ${isDark ? 'bg-zinc-950 border-zinc-900' : 'bg-zinc-50 border-zinc-200'}`}>
          {/* Search Input block */}
          <div className="md:col-span-8 relative flex items-center">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 Buscar café, bocadillo, refresco..."
              className={`w-full border rounded-lg pl-9 pr-8 py-2 text-xs focus:outline-none focus:border-[#FF00FF] font-mono transition-all ${isDark ? 'bg-black border-zinc-850 text-white placeholder-zinc-650' : 'bg-white border-zinc-250 text-zinc-900 placeholder-zinc-400'}`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className={`absolute right-3 font-black text-xs font-sans cursor-pointer ${isDark ? 'text-zinc-550 hover:text-white' : 'text-zinc-400 hover:text-zinc-700'}`}
              >
                ✕
              </button>
            )}
          </div>

          {/* Favorites Star Toggle */}
          <button
            onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
            className={`md:col-span-4 py-2 px-3 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider flex items-center justify-center space-x-1.5 border transition-all cursor-pointer ${
              showOnlyFavorites 
                ? 'bg-yellow-500 text-black border-yellow-500 font-extrabold shadow-[0_0_15px_rgba(234,179,8,0.35)]'
                : isDark ? 'bg-black border-zinc-800 text-zinc-400 hover:text-white' : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${showOnlyFavorites ? 'fill-current' : ''}`} />
            <span>★ Mas Vendidos</span>
          </button>
        </div>

        {/* Categories Bar */}
        <div className={`flex border overflow-x-auto scrollbar-none gap-1.5 p-1.5 rounded-xl w-full scroll-smooth ${isDark ? 'bg-[#070707] border-[#FF00FF]/40' : 'bg-zinc-100 border-zinc-200'}`}>
          {[
            'Cafés',
            'Tés',
            'Refrescos',
            'Zumos',
            'Bocadillos',
            'Tostadas',
            'Pastelería',
            'Bollería',
            'Tapas',
            'Menús',
            'Postres'
          ].map((cat) => {
            const styles = getCategoryStyles(cat as ProductCategory);
            const isSelected = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat as ProductCategory);
                  setSearchQuery('');
                }}
                className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 border ${
                  isSelected 
                    ? `bg-[#FF00FF] text-black font-black border-[#FF00FF] ${styles.glow}` 
                    : isDark ? `${styles.bg} ${styles.text} ${styles.border}` : 'bg-white text-zinc-750 hover:bg-zinc-50 border-zinc-200 hover:border-zinc-350'
                }`}
              >
                <span className={isSelected ? 'text-black' : ''}>{getCategoryIcon(cat as ProductCategory)}</span>
                <span className="truncate">{cat}</span>
              </button>
            );
          })}
          {/* Safety spacer to prevent the last category tab from being cut off at the scroll boundary */}
          <div className="w-5 shrink-0" />
        </div>

        {/* Products Grid */}
        <div className={`grid grid-cols-2 md:grid-cols-3 gap-1.5 p-1.5 border overflow-y-auto max-h-[500px] pr-1 rounded-xl transition-all ${isDark ? 'bg-[#FF00FF]/15 border-[#FF00FF]/30' : 'bg-zinc-50 border-zinc-200'}`}>
          {filteredProducts.length === 0 ? (
            <div className="col-span-full py-16 text-center text-zinc-500 font-mono text-xs flex flex-col items-center justify-center space-y-2">
              <span className="text-xl">🔍</span>
              <span>No se han encontrado productos registrados</span>
            </div>
          ) : (
            filteredProducts.map((prod) => {
              const displayCat = getProductDisplayCategory(prod);
              const catStyle = getCategoryStyles(displayCat);
              return (
                <button
                  key={prod.id}
                  onClick={() => addToCart(prod)}
                  className={`border p-2 flex flex-row items-center gap-2 text-left transition-all duration-200 rounded-xl relative h-24 cursor-pointer outline-none group overflow-hidden ${isDark ? `bg-[#050505] ${catStyle.border} hover:border-[#FF00FF] hover:bg-[#FF00FF]/5 ${catStyle.glow}` : 'bg-white border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50 shadow-sm'}`}
                >
                  {/* Small square product picture */}
                  <div className={`w-14 h-14 border shrink-0 overflow-hidden relative rounded-lg shadow-inner ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-100 border-zinc-200'}`}>
                    <img 
                      src={getProductImage(prod)} 
                      alt={prod.nombre} 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-between h-full min-w-0">
                    <div className="w-full">
                      <div className="flex justify-between items-center gap-1">
                        <span className={`text-[8px] font-mono uppercase font-bold px-1 rounded truncate max-w-[55px] ${isDark ? `bg-[#111] ${catStyle.text}` : 'bg-zinc-100 text-zinc-650'}`}>
                          {displayCat}
                        </span>
                        <span className={`text-[8.5px] font-mono font-black shrink-0 ${prod.stock <= 5 ? 'text-red-500 animate-pulse' : 'text-zinc-550'}`}>
                          STK: {prod.stock}
                        </span>
                      </div>
                      <h3 className={`font-extrabold uppercase text-[10px] tracking-tight line-clamp-2 mt-1 leading-tight group-hover:text-[#FF00FF] break-words transition-colors ${isDark ? 'text-zinc-100' : 'text-zinc-850'}`}>
                        {prod.nombre}
                      </h3>
                    </div>
                    
                    <div className={`flex items-end justify-between border-t pt-1 mt-0.5 ${isDark ? 'border-zinc-900/50' : 'border-zinc-100'}`}>
                      {prod.alergenos && prod.alergenos.length > 0 ? (
                        <span className="text-[8px] text-zinc-500 font-sans font-bold" title={prod.alergenos.join(', ')}>⚠️ ALÉRG</span>
                      ) : <span />}
                      <span className={`text-sm font-mono tracking-tighter font-black ${isDark ? catStyle.text : 'text-zinc-900'}`}>
                        {prod.precio.toFixed(2)}€
                      </span>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* PC Terminal Cart Checkout Panel */}
        <div className={`border-t pt-3 ${isDark ? 'border-[#FF00FF]/40' : 'border-zinc-200'}`}>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            
            {/* Cart preview */}
            <div className="md:col-span-5">
              <span className="text-[10px] text-[#FF00FF] font-mono block mb-1 uppercase font-black tracking-widest">
                Comanda Activa ({cart.reduce((s, i) => s + i.quantity, 0)} ítems)
              </span>
              <div className={`rounded max-h-48 overflow-y-auto p-1.5 space-y-1.5 border transition-all ${isDark ? 'bg-black border-[#FF00FF]/40' : 'bg-white border-zinc-200'}`}>
                {cart.length === 0 ? (
                  <span className="text-[10px] text-zinc-500 block text-center py-6 italic">El carrito está vacío</span>
                ) : (
                  cart.map(item => {
                    const isSelected = selectedCartItemId === item.id;
                    const optionsList = item.options ? item.options.split(', ') : [];
                    
                    return (
                      <div key={item.id} className={`flex flex-col p-1.5 border rounded space-y-1 transition-all ${isDark ? 'bg-zinc-950 border-zinc-900' : 'bg-zinc-50 border-zinc-150'}`}>
                        <div className="flex justify-between items-center text-[11px] font-mono">
                          <button 
                            type="button"
                            onClick={() => setSelectedCartItemId(isSelected ? null : item.id)}
                            className={`text-left truncate max-w-[125px] uppercase font-bold hover:text-[#FF00FF] transition-all cursor-pointer flex items-center space-x-1 ${isDark ? 'text-zinc-350' : 'text-zinc-750'}`}
                          >
                            <span>📝</span>
                            <span className="truncate">{item.nombre}</span>
                          </button>
                          
                          <div className="flex items-center space-x-1.5">
                            <button onClick={() => updateCartQty(item.productId, -1)} className={`p-0.5 rounded cursor-pointer ${isDark ? 'text-zinc-500 hover:bg-zinc-800' : 'text-zinc-400 hover:bg-zinc-200'}`}><Minus className="w-2.5 h-2.5" /></button>
                            <span className="text-[#FF00FF] font-black">{item.quantity}</span>
                            <button onClick={() => updateCartQty(item.productId, 1)} className={`p-0.5 rounded cursor-pointer ${isDark ? 'text-[#FF00FF] hover:bg-zinc-850' : 'text-[#FF00FF] hover:bg-zinc-200'}`}><Plus className="w-2.5 h-2.5" /></button>
                          </div>
                        </div>

                        {/* Options preview */}
                        {item.options && (
                          <div className={`text-[9px] font-mono px-1.5 py-0.5 rounded italic border ${isDark ? 'text-[#FF00FF] bg-black/40 border-[#FF00FF]/15' : 'text-zinc-650 bg-zinc-100 border-zinc-200'}`}>
                            {item.options}
                          </div>
                        )}

                        {/* Touch-flow Modifier Panel if selected */}
                        {isSelected && (
                          <div className={`p-1.5 border rounded space-y-1.5 animate-fadeIn ${isDark ? 'bg-black/60 border-zinc-900' : 'bg-zinc-150/50 border-zinc-250'}`}>
                            <span className="text-[8px] text-[#FF00FF] font-mono block uppercase font-bold">Modificadores Rápidos:</span>
                            <div className="flex flex-wrap gap-1">
                              {[
                                'Descafeinado', 'Leche de Soja', 'Leche de Avena', 'Con Hielo', 'Sacarina',
                                'Extra Queso', 'Sin Tomate', 'Para Llevar', 'Bien Tostado', 'Sin Gluten'
                              ].map(mod => {
                                const active = optionsList.includes(mod);
                                return (
                                  <button
                                    key={mod}
                                    type="button"
                                    onClick={() => updateCartOptions(item.id, mod)}
                                    className={`px-1.5 py-0.5 text-[8px] font-mono rounded cursor-pointer transition-all ${
                                      active 
                                        ? 'bg-[#FF00FF] text-black font-extrabold' 
                                        : isDark ? 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800' : 'bg-white text-zinc-650 hover:bg-zinc-200 border border-zinc-200 shadow-xs'
                                    }`}
                                  >
                                    {mod}
                                  </button>
                                );
                              })}
                            </div>
                            
                            {/* Kitchen Note text input */}
                            <input
                              type="text"
                              placeholder="Escribe nota personalizada..."
                              defaultValue={optionsList.filter(o => ![
                                'Descafeinado', 'Leche de Soja', 'Leche de Avena', 'Con Hielo', 'Sacarina',
                                'Extra Queso', 'Sin Tomate', 'Para Llevar', 'Bien Tostado', 'Sin Gluten'
                              ].includes(o))[0] || ''}
                              onChange={(e) => updateCartCustomNote(item.id, e.target.value)}
                              className={`w-full border rounded px-1.5 py-0.5 text-[9px] focus:outline-none focus:border-[#FF00FF] font-mono mt-1 ${isDark ? 'bg-black border-zinc-850 text-white placeholder-zinc-650' : 'bg-white border-zinc-250 text-zinc-850 placeholder-zinc-400'}`}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })
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
                          : isDark ? 'bg-black border-zinc-800 text-zinc-500 hover:text-white' : 'bg-white border-zinc-250 text-zinc-500 hover:text-zinc-850'
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
                  className={`w-full border rounded px-2 py-1 text-xs uppercase font-bold focus:outline-none focus:border-[#FF00FF] font-mono mt-0.5 ${isDark ? 'bg-black border-zinc-800 text-white' : 'bg-white border-zinc-250 text-zinc-850'}`}
                />
              </div>
            </div>

            {/* Total / Submit Action */}
            <div className="md:col-span-3 flex flex-col justify-end text-right h-full space-y-1.5">
              <span className={`text-[10px] font-mono uppercase tracking-wider font-bold ${isDark ? 'text-zinc-500' : 'text-zinc-650'}`}>Total Estimado</span>
              <span className="text-2xl font-mono font-black text-[#FF00FF] block leading-none py-0.5">
                {calculateCartTotal().toFixed(2)} €
              </span>
              <div className="flex flex-col gap-1 w-full">
                <button
                  type="button"
                  onClick={handleSendToKitchen}
                  disabled={cart.length === 0 || isOrdering}
                  className={`w-full disabled:bg-zinc-950 disabled:text-zinc-850 disabled:border-zinc-900 border py-1.5 rounded text-[10px] font-bold font-mono uppercase tracking-wider transition-all cursor-pointer active:scale-95 flex items-center justify-center space-x-1 ${isDark ? 'bg-[#111] hover:bg-[#ffaa00]/10 text-amber-500 border-amber-600/60 hover:border-amber-400' : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-300 hover:border-amber-400'}`}
                >
                  <span>🔥 Mandar a Cocina</span>
                </button>
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={cart.length === 0 || isOrdering}
                  className={`w-full disabled:bg-zinc-900 disabled:text-zinc-650 disabled:border-zinc-800 text-black py-2 rounded text-xs font-black font-mono uppercase tracking-widest transition-all cursor-pointer active:scale-95 flex items-center justify-center space-x-1 border-2 border-[#FF00FF] ${isDark ? 'bg-[#FF00FF] hover:bg-white' : 'bg-[#FF00FF] hover:bg-[#FF00FF]/95'}`}
                >
                  <span>Cobrar Pedido</span>
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* RIGHT SECTION (Incoming Active Orders Queue) -> Columns (lg: 5) */}
      <div className={`lg:col-span-5 flex flex-col p-4 border rounded-2xl overflow-hidden transition-all ${isDark ? 'bg-[#050505] border-[#FF00FF] shadow-[0_0_20px_rgba(255,0,255,0.05)]' : 'bg-white border-zinc-200 shadow-lg'}`}>
        
        <div className={`p-3 border-b -mx-4 -mt-4 mb-4 flex items-center justify-between transition-colors ${isDark ? 'border-[#FF00FF]/40 bg-[#111]' : 'border-zinc-200 bg-zinc-50'}`}>
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-[#FF00FF] animate-pulse" />
            <h2 className={`text-xs font-black uppercase tracking-widest ${isDark ? 'text-[#FF00FF]' : 'text-zinc-850'}`}>Monitor Cocina / Pedidos</h2>
          </div>
          
          <span className="text-[10px] bg-[#FF00FF] text-black font-mono font-black italic px-2 py-0.5 uppercase">
            {localOrders.filter(o => o.estado !== 'Pagado').length} ACTIVOS
          </span>
        </div>

        {/* Order queue cards lists */}
        <div className="space-y-3 overflow-y-auto max-h-[600px] pr-1">
          {localOrders.length === 0 ? (
            <div className="py-24 text-center text-zinc-500 font-mono text-xs flex flex-col items-center justify-center">
              <BadgeAlert className="w-8 h-8 mb-2 text-zinc-400" />
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
                let bgStyle = isDark ? 'bg-[#111]' : 'bg-zinc-50/75';
                let shadowStyle = '';
                let animationStyle = '';

                if (order.estado === 'Pendiente') {
                  if (isRedBrilliant) {
                    borderStyle = 'border-red-500';
                    bgStyle = isDark ? 'bg-red-950/20' : 'bg-red-50';
                    shadowStyle = 'shadow-[0_0_15px_rgba(239,68,68,0.3)]';
                    animationStyle = 'animate-[pulse_2s_infinite]';
                  } else if (isOrange) {
                    borderStyle = 'border-orange-500';
                    bgStyle = isDark ? 'bg-orange-950/10' : 'bg-orange-50/70';
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
                    className={`border-l-4 p-3 transition-all flex flex-col justify-between rounded-r-xl ${borderStyle} ${bgStyle} ${shadowStyle} ${animationStyle} ${!isDark ? 'border-y border-r border-zinc-200/80 shadow-xs' : ''}`}
                  >
                    
                    {/* Header Row */}
                    <div className={`flex items-center justify-between border-b pb-2 mb-2 ${isDark ? 'border-zinc-900' : 'border-zinc-200'}`}>
                      <div className="flex items-center space-x-1.5">
                        <span className={`font-mono text-xs font-bold uppercase ${isDark ? 'text-white' : 'text-zinc-800'}`}>{order.id}</span>
                        <span className="text-[9px] text-zinc-500 font-mono">@{orderTime}</span>
                        {order.estado !== 'Pagado' && (
                          <span className={`text-[9px] font-mono font-black tracking-tighter px-1 rounded ml-1 flex items-center ${
                            elapsedMin > 15 
                              ? 'bg-red-500 text-white animate-pulse' 
                              : elapsedMin > 10 
                                ? 'bg-orange-500 text-black' 
                                : isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-200 text-zinc-650'
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
                            className="bg-amber-500/20 text-amber-500 hover:bg-[#ffaa00]/15 border border-amber-500/50 px-2 py-0.5 rounded text-[10px] font-mono cursor-pointer uppercase font-bold animate-pulse"
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
                          <span className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/40 px-2 py-0.5 rounded text-[9px] font-mono font-bold flex items-center gap-1 uppercase">
                            <Check className="w-3 h-3" /> COBRADO
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Waiter metadata */}
                    <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono mb-2">
                      <span className="flex items-center space-x-1">
                        <User className="w-3 h-3 text-zinc-400" />
                        <span>{order.camarero_id}</span>
                      </span>
                      <span className="flex items-center gap-1 font-bold text-zinc-400">
                        {order.metodo_pago === 'Efectivo' ? (
                          <span className="text-emerald-500 flex items-center bg-emerald-500/10 px-1 border border-emerald-500/20 rounded text-[9px]">EFECTIVO</span>
                        ) : (
                          <span className="text-indigo-500 flex items-center bg-indigo-500/10 px-1 border border-indigo-500/20 rounded text-[9px]">BIZUM</span>
                        )}
                      </span>
                    </div>

                    {/* Item lines list */}
                    <div className={`space-y-1 rounded-lg p-2 max-h-32 overflow-y-auto mb-2 border ${isDark ? 'bg-zinc-950 border-zinc-900/70' : 'bg-white border-zinc-200'}`}>
                      {order.items.map((line, lid) => (
                        <div key={lid} className={`flex flex-col border-b last:border-b-0 pb-1 last:pb-0 mb-1 last:mb-0 ${isDark ? 'border-zinc-900/40' : 'border-zinc-100'}`}>
                          <div className="flex justify-between text-xs font-mono">
                            <div className={isDark ? 'text-zinc-300' : 'text-zinc-700'}>
                              <span className="text-[#FF00FF] font-semibold">{line.quantity}x</span> {line.nombre}
                            </div>
                            <span className="text-zinc-550">{(line.precio * line.quantity).toFixed(2)}€</span>
                          </div>
                          {line.options && (
                            <div className="text-[9px] text-amber-500 font-mono italic pl-5 mt-0.5">
                              ↳ {line.options}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Footer price / Thermal printer preview button */}
                    <div className="flex justify-between items-center pt-1">
                      <button
                        onClick={() => setSelectedTicketOrder(order)}
                        className={`hover:bg-[#FF00FF]/10 hover:text-[#FF00FF] hover:border-[#FF00FF] px-2 py-1 rounded-lg text-[11px] font-mono flex items-center space-x-1.5 transition-all cursor-pointer outline-none border ${isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-400' : 'bg-zinc-100 border-zinc-200 text-zinc-600 hover:bg-zinc-200'}`}
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
                      <React.Fragment key={idx}>
                        <tr className="border-b border-zinc-100">
                          <td className="py-1 font-bold">{line.quantity}x</td>
                          <td className="py-1 pl-2 font-semibold">{line.nombre}</td>
                          <td className="py-1 text-right">{(line.precio * line.quantity).toFixed(2)}€</td>
                        </tr>
                        {line.options && (
                          <tr>
                            <td></td>
                            <td colSpan={2} className="pl-2 pb-1 text-[8px] text-zinc-600 italic leading-none">
                              * {line.options}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
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
