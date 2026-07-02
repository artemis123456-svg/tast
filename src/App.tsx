/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Terminal, 
  Smartphone, 
  Sliders, 
  Sun, 
  Moon, 
  HelpCircle,
  Clock,
  Wifi,
  Coffee,
  Database,
  Lock,
  Unlock,
  RefreshCw,
  LogOut
} from 'lucide-react';
import { 
  Product, 
  Order, 
  AppConfig, 
  Table,
  Waiter,
  Ingredient,
  Supplier,
  Batch,
  Customer,
  Reservation,
  Promo,
  CashSession,
  AuditLog
} from './types';
import { fetchProducts, fetchOrders, fetchConfig, fetchTables, socket } from './lib/api';

// Components
import LoginModal from './components/LoginModal';
import KioskDashboard from './components/KioskDashboard';
import MobileWaiter from './components/MobileWaiter';
import AdminPanel from './components/AdminPanel';

export default function App() {
  
  // Theme state: 'dark' (Negro/Fucsia) or 'light' (Blanco/Grip)
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>('dark');
  
  // Device mode switcher: 'pc' (Kiosk PC Terminal) | 'mobile' (Waiter Smartphone) | 'admin' (Admin / Reports Panel)
  const [activeDevice, setActiveDevice] = useState<'pc' | 'mobile' | 'admin'>('pc');

  // Authentication statuses
  const [authToken, setAuthToken] = useState<string | null>(null);
  
  // Waiter identity for mobile mode
  const [waiterStaffName, setWaiterStaffName] = useState('Artemis');

  // Core POS states
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // Extended POS states
  const [waiters, setWaiters] = useState<Waiter[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [promos, setPromos] = useState<Promo[]>([]);
  const [cashSessions, setCashSessions] = useState<CashSession[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Clock
  const [currentTime, setCurrentTime] = useState(new Date());

  // Socket state tracking
  const [isSocketConnected, setIsSocketConnected] = useState(socket.connected);

  // Load all configurations & data on start
  const loadPOSData = async () => {
    setIsDataLoading(true);
    setErrorMessage('');
    try {
      const [prodsData, ordersData, configData, tablesData] = await Promise.all([
        fetchProducts(),
        fetchOrders(),
        fetchConfig(),
        fetchTables().catch(() => [])
      ]);
      setProducts(prodsData);
      setOrders(ordersData);
      setTables(tablesData);
      // Construct full AppConfig matching default key structure
      setConfig({
        ticket: configData.ticket,
        printer: configData.printer,
        authPin: '1234' // local helper
      });

      // Lazy load extended parameters
      const [waitersRes, ingRes, supRes, batchRes, custRes, resvRes, promoRes, auditRes] = await Promise.all([
        fetch('/api/waiters').then(r => r.json()).catch(() => []),
        fetch('/api/ingredients').then(r => r.json()).catch(() => []),
        fetch('/api/suppliers').then(r => r.json()).catch(() => []),
        fetch('/api/batches').then(r => r.json()).catch(() => []),
        fetch('/api/customers').then(r => r.json()).catch(() => []),
        fetch('/api/reservations').then(r => r.json()).catch(() => []),
        fetch('/api/promos').then(r => r.json()).catch(() => []),
        fetch('/api/audit').then(r => r.json()).catch(() => [])
      ]);

      setWaiters(waitersRes);
      setIngredients(ingRes);
      setSuppliers(supRes);
      setBatches(batchRes);
      setCustomers(custRes);
      setReservations(resvRes);
      setPromos(promoRes);
      setAuditLogs(auditRes);

    } catch (e: any) {
      setErrorMessage('Aviso: Conectando con el PC central... ' + (e.message || ''));
      console.warn('Backend unavailable, using default mockup values:', e);
    } finally {
      setIsDataLoading(false);
    }
  };

  useEffect(() => {
    loadPOSData();

    // Clock ticker
    const clockTimer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    const handleConnect = () => {
      setIsSocketConnected(true);
      console.log('Socket link established for device telemetry');
    };

    const handleDisconnect = () => {
      setIsSocketConnected(false);
    };

    const handleTablesChanged = (newTables: Table[]) => {
      setTables(newTables);
    };

    const handleOrdersChanged = (newOrders: Order[]) => {
      setOrders(newOrders);
    };

    const handleProductsChanged = (newProducts: Product[]) => {
      setProducts(newProducts);
    };

    // Socket listeners for extended collections
    const handleInitialSync = (payload: any) => {
      if (payload.products) setProducts(payload.products);
      if (payload.orders) setOrders(payload.orders);
      if (payload.tables) setTables(payload.tables);
      if (payload.waiters) setWaiters(payload.waiters);
      if (payload.ingredients) setIngredients(payload.ingredients);
      if (payload.suppliers) setSuppliers(payload.suppliers);
      if (payload.batches) setBatches(payload.batches);
      if (payload.customers) setCustomers(payload.customers);
      if (payload.reservations) setReservations(payload.reservations);
      if (payload.promos) setPromos(payload.promos);
      if (payload.cashSessions) setCashSessions(payload.cashSessions);
      if (payload.auditLogs) setAuditLogs(payload.auditLogs);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('tables-changed', handleTablesChanged);
    socket.on('orders-changed', handleOrdersChanged);
    socket.on('products-changed', handleProductsChanged);
    
    // Bind all dynamic real-time updates
    socket.on('initial-sync', handleInitialSync);
    socket.on('waiters-changed', (data) => setWaiters(data));
    socket.on('ingredients-changed', (data) => setIngredients(data));
    socket.on('suppliers-changed', (data) => setSuppliers(data));
    socket.on('batches-changed', (data) => setBatches(data));
    socket.on('customers-changed', (data) => setCustomers(data));
    socket.on('reservations-changed', (data) => setReservations(data));
    socket.on('promos-changed', (data) => setPromos(data));
    socket.on('cash-changed', (data) => setCashSessions(data));
    socket.on('audit-changed', (data) => setAuditLogs(data));

    socket.on('config-changed', (newConfig) => {
      setConfig(prev => prev ? { ...prev, ...newConfig } : { ticket: newConfig.ticket, printer: newConfig.printer, authPin: '1234' });
    });

    // Sync initial state
    setIsSocketConnected(socket.connected);

    // Smart periodic polling backup inside iframe (every 6 seconds) to guarantee real-time sync if Websocket is throttled by sandbox proxies
    const fallbackSyncPoll = setInterval(() => {
      silentSync();
    }, 6000);

    return () => {
      clearInterval(clockTimer);
      clearInterval(fallbackSyncPoll);
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('tables-changed', handleTablesChanged);
      socket.off('orders-changed', handleOrdersChanged);
      socket.off('products-changed', handleProductsChanged);
      socket.off('initial-sync', handleInitialSync);
      socket.off('waiters-changed');
      socket.off('ingredients-changed');
      socket.off('suppliers-changed');
      socket.off('batches-changed');
      socket.off('customers-changed');
      socket.off('reservations-changed');
      socket.off('promos-changed');
      socket.off('cash-changed');
      socket.off('audit-changed');
      socket.off('config-changed');
    };
  }, []);

  // Silent sync to update screens in background
  const silentSync = async () => {
    try {
      const [prods, ords] = await Promise.all([
        fetchProducts(),
        fetchOrders()
      ]);
      setProducts(prods);
      setOrders(ords);
    } catch (e) {
      // ignore silent fetch failures
    }
  };

  const handleAuthSuccess = (token: string) => {
    setAuthToken(token);
    setErrorMessage('');
  };

  const handleLogout = () => {
    setAuthToken(null);
  };

  // Quick preset login bypass for easier review of both profiles
  const handleSwapDeviceModeWithoutLogout = (mode: 'pc' | 'mobile' | 'admin') => {
    setActiveDevice(mode);
    // PC mode doesn't necessarily require PIN, but Waiter/Admin does. Let's keep it user friendly:
    // If transitioning to Admin or Mobile, the user can type standard pin '1234' or it auto-authenticates if they previously logged in.
  };

  const timeString = currentTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div className={`min-h-screen transition-all duration-350 no-select flex flex-col justify-between ${
      themeMode === 'dark' 
        ? 'bg-[#000000] text-[#FFFFFF] font-sans selection:bg-[#FF00FF] selection:text-black border-4 border-[#FF00FF]' 
        : 'bg-[#FAFAFA] text-[#111111] font-sans selection:bg-[#FF00FF]/35 border-4 border-zinc-300'
    }`}>
      
      {/* GLOBAL SYSTEM BAR / TOP NAVIGATION CONTROLLER */}
      <header className={`h-16 border-b flex items-center justify-between px-6 transition-colors ${
        themeMode === 'dark' ? 'bg-[#111] border-[#FF00FF]' : 'bg-white border-zinc-300 shadow-sm'
      }`}>
        <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-3">
          
          {/* Logo Brand Brandings */}
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded flex items-center justify-center font-black text-xl italic underline ${
              themeMode === 'dark' ? 'bg-[#FF00FF] text-black' : 'bg-black text-white'
            }`}>
              TF
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-black italic tracking-tighter text-[#FF00FF]">TOUCH-FLOW</span>
                <span className="font-mono text-[9px] px-1.5 py-0.2 rounded font-black tracking-widest bg-zinc-900 border border-zinc-800 text-zinc-400">
                  v2.4
                </span>
              </div>
              <h1 className="text-xs uppercase font-semibold tracking-[3px] text-zinc-450">
                {config?.ticket?.header || 'EL TAST CAFETERIA'}
              </h1>
            </div>
          </div>

          {/* DEVICE SIMULATOR / CONTROLLER CAPABILITIES (Central PC, Mobile Waiter, Admin) */}
          <div className="flex p-0.5 bg-black border border-[#FF00FF]/30 rounded">
            {[
              { id: 'pc', label: '🖥️ PC KIOSCO', tooltip: 'Dashboard táctil central para caja y cocina' },
              { id: 'mobile', label: '📱 CÁMARA', tooltip: 'Pedido rápido optimizado para Wi-Fi' },
              { id: 'admin', label: '⚙️ OFICINA', tooltip: 'Configuraciones, CRUD inventario e informes PDF' }
            ].map((device) => (
              <button
                key={device.id}
                onClick={() => handleSwapDeviceModeWithoutLogout(device.id as any)}
                title={device.tooltip}
                className={`px-3 py-1.5 font-mono text-[10px] font-black uppercase tracking-tighter transition-all cursor-pointer whitespace-nowrap ${
                  activeDevice === device.id
                    ? 'bg-[#FF00FF] text-black italic font-black'
                    : 'text-zinc-500 hover:text-white hover:bg-zinc-900/45'
                }`}
              >
                {device.label.split(' ')[0]} <span className="hidden sm:inline">{device.label.substring(2)}</span>
              </button>
            ))}
          </div>

          {/* TELEMETRY, CLOCK & SWITCH DESIGN THEME */}
          <div className="flex items-center space-x-3.5 self-stretch md:self-auto justify-between md:justify-end">
            
            {/* Network LED Indicator */}
            <div 
              className="flex items-center space-x-1.5 px-2 py-1 rounded bg-black/40 border border-zinc-900/60" 
              title={isSocketConnected ? "Servidor Conectado (Websocket Sincronizado)" : "Reconectando con el TPV central..."}
            >
              <span className={`w-2 h-2 rounded-full ${isSocketConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.75)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.75)] animate-pulse'}`} />
              <span className="text-[10px] font-mono font-black text-zinc-400">
                {isSocketConnected ? 'ONLINE' : 'RECONN'}
              </span>
            </div>

            {/* Clock */}
            <div className="flex items-center space-x-1.5 text-zinc-400 font-mono text-[11px] font-bold">
              <Clock className="w-3.5 h-3.5 text-[#FF00FF]" />
              <span>{timeString}</span>
            </div>

            {/* Sync trigger */}
            <button 
              onClick={loadPOSData}
              title="Sincronizar base de datos"
              className="p-1.5 border border-zinc-850 bg-black/40 text-zinc-400 cursor-pointer hover:text-white transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isDataLoading ? 'animate-spin text-[#FF00FF]' : ''}`} />
            </button>

            {/* Theme switcher */}
            <button
              onClick={() => setThemeMode(prev => prev === 'dark' ? 'light' : 'dark')}
              className="p-1.5 border border-zinc-850 bg-black/40 cursor-pointer text-[#FF00FF]"
              title={themeMode === 'dark' ? 'Modo Día (Claro)' : 'Modo Noche (Oscuro / Fucsia)'}
            >
              {themeMode === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#FF00FF]" />}
            </button>

            {/* Active Pin lock status */}
            {authToken ? (
              <button 
                onClick={handleLogout}
                className="flex items-center space-x-1 border border-red-500/30 hover:border-red-500 bg-red-950/25 hover:bg-red-950/50 px-2.5 py-1 text-[10px] font-mono font-bold uppercase text-red-400 cursor-pointer"
                title="Cerrar sesión de personal"
              >
                <LogOut className="w-3 h-3" />
                <span className="hidden sm:inline">Trancar</span>
              </button>
            ) : (
              <span className="text-[9px] font-mono font-bold bg-[#000000] border border-zinc-800 text-amber-500 px-2 py-1 flex items-center gap-1">
                <Lock className="w-3 h-3" /> CERRADO
              </span>
            )}

          </div>

        </div>
      </header>

      {/* SYSTEM OFFLINE & WARNING BANNER */}
      {errorMessage && (
        <div className="bg-[#FF00FF]/15 border-b border-[#FF00FF] px-4 py-2 text-center text-xs font-mono text-[#FF00FF] animate-pulse">
          ⚠️ {errorMessage}
        </div>
      )}

      {/* CORE DISPLAY WINDOW - REQUIRES ACTIVE AUTH PIN UNLESS BYPASSED */}
      <main className="max-w-7xl mx-auto px-4 py-4 flex-1 w-full">

        {isDataLoading && products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-36 space-y-4">
            <div className="w-10 h-10 border-4 border-t-[#FF00FF] border-r-transparent border-dashed border-[#FF00FF]/20 rounded-full animate-spin" />
            <p className="font-mono text-zinc-500 text-xs animate-pulse">
              CONECTANDO CON EL TPV CENTRAL EN LA RED LOCAL...
            </p>
          </div>
        ) : (
          (() => {
            // Mandate: "Móviles requieren PIN o biometría". 
            // Admin Panel always requires authorization. Let's make it so Kiosk is open but placing orders / admin requires PIN!
            // To provide a pristine flow, if authToken is missing and device is 'mobile' or 'admin', render security Login screen.
            const needsAuth = !authToken && (activeDevice === 'mobile' || activeDevice === 'admin');
            
            if (needsAuth) {
              return (
                <div className="max-w-md mx-auto">
                  <LoginModal 
                    onSuccess={handleAuthSuccess}
                    title={activeDevice === 'admin' ? "Acceso Director" : "Acceso Camarero"}
                    subtitle={activeDevice === 'admin' ? "Ingrese PIN de 4 dígitos administrativo para auditar reportes" : `Ingrese PIN de 4 dígitos para firmar comandas de ${waiterStaffName}`}
                  />
                  
                  {/* Demo Helper box */}
                  <div className="mt-4 p-4 rounded-2xl bg-zinc-950 border border-dashed border-zinc-900/60 text-center max-w-sm mx-auto">
                    <p className="text-[10px] font-mono text-zinc-500 leading-normal">
                      💡 <b>CONSEJO DE AUDITORÍA:</b> Use el código PIN <b>1234</b> en la terminal numérica (o haga clic en "Acceso Rápido Biométrico") para iniciar sesión.
                    </p>
                  </div>
                </div>
              );
            }

            // Render safe viewports based on device mode selection
            switch (activeDevice) {
              case 'pc':
                return (
                  <KioskDashboard 
                    products={products}
                    orders={orders}
                    tables={tables}
                    config={{ ticket: config?.ticket || DEFAULT_FALLBACK_TICKET }}
                    onRefreshOrders={loadPOSData}
                    onRefreshProducts={loadPOSData}
                    activeStaffId={authToken ? 'Cajero Principal' : 'Terminal PC'}
                    themeMode={themeMode}
                  />
                );

              case 'mobile':
                return (
                  <MobileWaiter 
                    products={products}
                    tables={tables}
                    onRefreshOrders={loadPOSData}
                    staffName={waiterStaffName}
                    onLogout={handleLogout}
                  />
                );

              case 'admin':
                return (
                  <AdminPanel 
                    products={products}
                    config={{ 
                      ticket: config?.ticket || DEFAULT_FALLBACK_TICKET, 
                      printer: config?.printer || DEFAULT_FALLBACK_PRINTER 
                    }}
                    onRefreshProducts={loadPOSData}
                    onRefreshConfig={loadPOSData}
                    orders={orders}
                    tables={tables}
                    waiters={waiters}
                    ingredients={ingredients}
                    suppliers={suppliers}
                    batches={batches}
                    customers={customers}
                    reservations={reservations}
                    promos={promos}
                    cashSessions={cashSessions}
                    auditLogs={auditLogs}
                  />
                );

              default:
                return (
                  <div className="py-24 text-center text-zinc-500 font-mono text-xs">
                    Error de selección de consola
                  </div>
                );
            }
          })()
        )}

      </main>

      {/* Bottom Status Footer */}
      <footer className="h-8 bg-[#FF00FF] text-black px-6 flex items-center justify-between text-[10px] font-bold uppercase select-none">
        <div className="flex space-x-6">
          <span className="hidden sm:inline">Terminal: PC-SERVER-01</span>
          <span>Usuario: {authToken ? 'ADMIN' : 'INVITADO'}</span>
          <span className="truncate max-w-[150px] md:max-w-none text-[9px] lowercase italic">🌐 {window.location.hostname}</span>
        </div>
        <div className="flex items-center space-x-4">
          <span>DISK: 82%</span>
          <span className="flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${isSocketConnected ? 'bg-black animate-pulse' : 'bg-red-700 animate-ping'}`} />
            <span className="italic">{isSocketConnected ? 'CONECTADO MULTI-PC' : 'RED LOCAL (PULL)'}</span>
          </span>
        </div>
      </footer>

    </div>
  );
}

// Fallback values if backend config fails to load during init sequence
const DEFAULT_FALLBACK_TICKET = {
  header: 'EL TAST CAFETERIA',
  direccion: 'Carrer de la Rutlla, 45, Girona',
  telefono: '+34 972 55 88 22',
  cif: 'B-12345678A',
  pie_pagina: 'Gràcies per la vostra visita!\nFins aviat!',
  iva: 10
};

const DEFAULT_FALLBACK_PRINTER = {
  port: 'USB001',
  name: 'Thermal Printer 80mm (ESPON T88)',
  type: 'USB' as const,
  status: 'Conectado' as const
};
