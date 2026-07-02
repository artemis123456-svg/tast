/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Trash, 
  Sliders, 
  Download, 
  RefreshCw, 
  Plus, 
  Printer, 
  ClipboardList, 
  Save, 
  Search, 
  AlertTriangle, 
  FileText, 
  Check, 
  DollarSign, 
  Calendar,
  Layers,
  Box,
  MapPin,
  Grid,
  Users,
  Percent,
  Database,
  Brain,
  Clock,
  Star
} from 'lucide-react';
import { 
  Product, 
  TicketConfig, 
  PrinterConfig, 
  ProductCategory, 
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
} from '../types';
import { 
  saveConfig, 
  saveProduct, 
  deleteProduct, 
  scanPorts, 
  checkSystemUpdate, 
  triggerDailyClose, 
  fetchReportsList,
  fetchTables,
  saveTables,
  socket
} from '../lib/api';

import WaitersTab from './WaitersTab';
import InventoryTab from './InventoryTab';
import CrmTab from './CrmTab';
import ReservationsTab from './ReservationsTab';
import PromosTab from './PromosTab';
import AuditTab from './AuditTab';
import BackupsTab from './BackupsTab';
import AiConsultingTab from './AiConsultingTab';

interface AdminPanelProps {
  products: Product[];
  config: { ticket: TicketConfig; printer: PrinterConfig };
  onRefreshProducts: () => void;
  onRefreshConfig: () => void;
  orders: any[]; // For stats calculations
  tables: Table[];
  waiters: Waiter[];
  ingredients: Ingredient[];
  suppliers: Supplier[];
  batches: Batch[];
  customers: Customer[];
  reservations: Reservation[];
  promos: Promo[];
  cashSessions: CashSession[];
  auditLogs: AuditLog[];
}

export default function AdminPanel({ 
  products, 
  config, 
  onRefreshProducts, 
  onRefreshConfig,
  orders,
  tables,
  waiters,
  ingredients,
  suppliers,
  batches,
  customers,
  reservations,
  promos,
  cashSessions,
  auditLogs
}: AdminPanelProps) {
  
  // Tabs definition
  const [activeTab, setActiveTab] = useState<
    | 'ticket' 
    | 'inventory' 
    | 'waiters' 
    | 'crm' 
    | 'reservations' 
    | 'promos' 
    | 'reports' 
    | 'tables' 
    | 'audit' 
    | 'backups' 
    | 'ai' 
    | 'system'
  >('ticket');

  // Sub-mode toggle for inventory tab
  const [inventorySubMode, setInventorySubMode] = useState<'products' | 'raw'>('products');

  /* =========================================================================
     1. TICKET TEMPLATE & PRINTER CONFIG STATE
     ========================================================================= */
  const [ticketHeader, setTicketHeader] = useState('');
  const [ticketDir, setTicketDir] = useState('');
  const [ticketTel, setTicketTel] = useState('');
  const [ticketCif, setTicketCif] = useState('');
  const [ticketPie, setTicketPie] = useState('');
  const [ticketIva, setTicketIva] = useState(10);
  
  const [printerPort, setPrinterPort] = useState('');
  const [printerName, setPrinterName] = useState('');
  const [printerType, setPrinterType] = useState<'USB' | 'Serial' | 'Network' | 'Simulado'>('USB');
  
  const [isScanningPorts, setIsScanningPorts] = useState(false);
  const [scannedPorts, setScannedPorts] = useState<any[]>([]);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  /* =========================================================================
     2. INVENTORY & CRUD STATE
     ========================================================================= */
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('TODAS');
  const [newProdName, setNewProdName] = useState('');
  const [newProdCat, setNewProdCat] = useState<ProductCategory>('Entrepans Freds');
  const [newProdPrice, setNewProdPrice] = useState(0);
  const [newProdStock, setNewProdStock] = useState(20);
  const [newProdAlergenos, setNewProdAlergenos] = useState<string[]>([]);
  const [isAddingProduct, setIsAddingProduct] = useState(false);

  // Intelligent Catalog State
  const [updatingAllImages, setUpdatingAllImages] = useState(false);
  const [newProdImageOptions, setNewProdImageOptions] = useState<string[]>([]);
  const [searchingNewProdImages, setSearchingNewProdImages] = useState(false);
  const [newProdSelectedImage, setNewProdSelectedImage] = useState('');
  
  const [manualImageSelectorProduct, setManualImageSelectorProduct] = useState<Product | null>(null);
  const [manualImageOptions, setManualImageOptions] = useState<string[]>([]);
  const [searchingManualImages, setSearchingManualImages] = useState(false);
  const [selectedManualImage, setSelectedManualImage] = useState('');

  // Allergens dictionary mock helper to select checkboxes
  const AVAILABLE_ALLERGENS = [
    'Cereales', 'Apio', 'Cacahuete', 'Crustáceos', 'Frutos secos', 'Huevos', 'Lácteos',
    'Molusco', 'Mostaza', 'Pescado', 'Sésamo', 'Soja', 'Sulfito'
  ];

  /* =========================================================================
     3. HACIENDA REPORTS & FISCAL CLOSE OUT STATE
     ========================================================================= */
  const [reportsList, setReportsList] = useState<any[]>([]);
  const [isPerformingClose, setIsPerformingClose] = useState(false);
  const [lastCloseResult, setLastCloseResult] = useState<any | null>(null);

  /* =========================================================================
     4. UPDATE CHECKER STATE
     ========================================================================= */
  const [updateStatus, setUpdateStatus] = useState<any | null>(null);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);

  /* =========================================================================
     5. TABLES LAYOUT CUSTOMIZER STATE
     ========================================================================= */
  const [tablesList, setTablesList] = useState<Table[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [editTableNum, setEditTableNum] = useState('');
  const [editTableZona, setEditTableZona] = useState<'Interior' | 'Exterior'>('Interior');
  const [editTableX, setEditTableX] = useState(50);
  const [editTableY, setEditTableY] = useState(50);
  const [selectedEditorZona, setSelectedEditorZona] = useState<'Interior' | 'Exterior'>('Interior');
  const [isSavingTables, setIsSavingTables] = useState(false);

  // Initialize values
  useEffect(() => {
    if (config?.ticket) {
      setTicketHeader(config.ticket.header);
      setTicketDir(config.ticket.direccion);
      setTicketTel(config.ticket.telefono);
      setTicketCif(config.ticket.cif);
      setTicketPie(config.ticket.pie_pagina);
      setTicketIva(config.ticket.iva || 10);
    }
    if (config?.printer) {
      setPrinterPort(config.printer.port);
      setPrinterName(config.printer.name);
      setPrinterType(config.printer.type);
    }
    loadReports();
    loadTables();
  }, [config]);

  const loadTables = async () => {
    try {
      const data = await fetchTables();
      setTablesList(data);
    } catch (e) {
      console.error('Error fetching tables array:', e);
    }
  };

  useEffect(() => {
    const handleTablesChanged = (newTables: Table[]) => {
      setTablesList(newTables);
    };

    socket.on('tables-changed', handleTablesChanged);
    return () => {
      socket.off('tables-changed', handleTablesChanged);
    };
  }, []);

  const loadReports = async () => {
    try {
      const data = await fetchReportsList();
      setReportsList(data);
    } catch (e) {
      console.error('Error fetching tax folder list:', e);
    }
  };

  const handleSaveTablesList = async (updatedList: Table[]) => {
    setIsSavingTables(true);
    try {
      await saveTables(updatedList);
      alert('✅ Disposición y numeración de mesas guardadas de manera conforme y sincronizada.');
    } catch (e: any) {
      alert('Error guardando mesas: ' + e.message);
    } finally {
      setIsSavingTables(false);
    }
  };

  const handleAddTable = () => {
    const number = editTableNum.trim();
    if (!number) {
      alert('Especifica un identificador de mesa.');
      return;
    }
    const duplicate = tablesList.find(t => t.number.toLowerCase() === number.toLowerCase() && t.zona === selectedEditorZona);
    if (duplicate) {
      alert(`La mesa "${number}" ya existe en la zona ${selectedEditorZona}.`);
      return;
    }
    const newTable: Table = {
      id: `table-${Date.now()}`,
      number,
      zona: selectedEditorZona,
      x: 50,
      y: 50
    };
    const updated = [...tablesList, newTable];
    setTablesList(updated);
    setSelectedTableId(newTable.id);
    setEditTableNum('');
    setEditTableX(50);
    setEditTableY(50);
  };

  const handleDeleteTable = (id: string) => {
    if (!confirm('¿Eliminar esta mesa permanentemente?')) return;
    const updated = tablesList.filter(t => t.id !== id);
    setTablesList(updated);
    if (selectedTableId === id) {
      setSelectedTableId(null);
    }
  };

  const handleUpdateTableCoord = (id: string, updates: Partial<Table>) => {
    const updated = tablesList.map(t => {
      if (t.id === id) {
        return { ...t, ...updates };
      }
      return t;
    });
    setTablesList(updated);
  };

  const handleBlueprintClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!selectedTableId) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;
    const x = Math.min(Math.max(Math.round(clickX), 5), 95);
    const y = Math.min(Math.max(Math.round(clickY), 5), 95);
    setEditTableX(x);
    setEditTableY(y);
    handleUpdateTableCoord(selectedTableId, { x, y });
  };

  const handleSelectTable = (t: Table) => {
    setSelectedTableId(t.id);
    setEditTableNum(t.number);
    setEditTableZona(t.zona);
    setEditTableX(t.x);
    setEditTableY(t.y);
  };

  const handleSliderX = (val: number) => {
    setEditTableX(val);
    if (selectedTableId) {
      handleUpdateTableCoord(selectedTableId, { x: val });
    }
  };

  const handleSliderY = (val: number) => {
    setEditTableY(val);
    if (selectedTableId) {
      handleUpdateTableCoord(selectedTableId, { y: val });
    }
  };

  const handleTableZonaChange = (zona: 'Interior' | 'Exterior') => {
    setEditTableZona(zona);
    if (selectedTableId) {
      handleUpdateTableCoord(selectedTableId, { zona });
      setSelectedEditorZona(zona);
    }
  };

  const handleTableNumberChange = (num: string) => {
    setEditTableNum(num);
    if (selectedTableId) {
      handleUpdateTableCoord(selectedTableId, { number: num });
    }
  };

  const handleResetTablesDef = async () => {
    if (!confirm('⚠️ ¿Seguro que deseas restablecer la disposición por defecto (10 mesas)?')) return;
    setTablesList([
      { id: 't-int-1', number: '1', zona: 'Interior', x: 20, y: 30 },
      { id: 't-int-2', number: '2', zona: 'Interior', x: 50, y: 30 },
      { id: 't-int-3', number: '3', zona: 'Interior', x: 80, y: 30 },
      { id: 't-int-4', number: '4', zona: 'Interior', x: 20, y: 70 },
      { id: 't-int-5', number: '5', zona: 'Interior', x: 50, y: 70 },
      { id: 't-int-6', number: '6', zona: 'Interior', x: 80, y: 70 },
      { id: 't-ext-1', number: '10', zona: 'Exterior', x: 20, y: 30 },
      { id: 't-ext-2', number: '11', zona: 'Exterior', x: 50, y: 30 },
      { id: 't-ext-3', number: '12', zona: 'Exterior', x: 80, y: 30 },
      { id: 't-ext-4', number: '13', zona: 'Exterior', x: 50, y: 70 },
    ]);
    setSelectedTableId(null);
    const mockDefault: Table[] = [
      { id: 't-int-1', number: '1', zona: 'Interior', x: 20, y: 30 },
      { id: 't-int-2', number: '2', zona: 'Interior', x: 50, y: 30 },
      { id: 't-int-3', number: '3', zona: 'Interior', x: 80, y: 30 },
      { id: 't-int-4', number: '4', zona: 'Interior', x: 20, y: 70 },
      { id: 't-int-5', number: '5', zona: 'Interior', x: 50, y: 70 },
      { id: 't-int-6', number: '6', zona: 'Interior', x: 80, y: 70 },
      { id: 't-ext-1', number: '10', zona: 'Exterior', x: 20, y: 30 },
      { id: 't-ext-2', number: '11', zona: 'Exterior', x: 50, y: 30 },
      { id: 't-ext-3', number: '12', zona: 'Exterior', x: 80, y: 30 },
      { id: 't-ext-4', number: '13', zona: 'Exterior', x: 50, y: 70 },
    ];
    await handleSaveTablesList(mockDefault);
  };

  const handleSaveConfig = async () => {
    setIsSavingConfig(true);
    try {
      await saveConfig({
        ticket: {
          header: ticketHeader,
          direccion: ticketDir,
          telefono: ticketTel,
          cif: ticketCif,
          pie_pagina: ticketPie,
          iva: Number(ticketIva)
        },
        printer: {
          port: printerPort,
          name: printerName,
          type: printerType,
          status: 'Conectado'
        }
      });
      onRefreshConfig();
      alert('✅ Configuración corporativa y de periféricos guardada correctamente.');
    } catch (e) {
      alert('Error al almacenar los datos del ticket.');
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleScanPorts = async () => {
    setIsScanningPorts(true);
    try {
      const ports = await scanPorts();
      setScannedPorts(ports);
    } catch (e) {
      alert('No se pudo escanear los puertos físicos localmente.');
    } finally {
      setIsScanningPorts(false);
    }
  };

  const selectPrinterPort = (p: any) => {
    setPrinterPort(p.port);
    setPrinterName(p.name);
    setPrinterType(p.type);
    setScannedPorts([]);
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName) return;
    try {
      await saveProduct({
        nombre: newProdName,
        categoria: newProdCat,
        precio: Number(newProdPrice),
        stock: Number(newProdStock),
        imagen_url: newProdSelectedImage,
        activo: true,
        alergenos: newProdAlergenos
      });
      onRefreshProducts();
      setIsAddingProduct(false);
      // Reset
      setNewProdName('');
      setNewProdPrice(0);
      setNewProdStock(20);
      setNewProdAlergenos([]);
      setNewProdImageOptions([]);
      setNewProdSelectedImage('');
      alert('✅ Producto incorporado satisfactoriamente.');
    } catch (e) {
      alert('Error creando el artículo de inventario.');
    }
  };

  /* =========================================================================
     MÓDULO CATÁLOGO INTELIGENTE HANDLERS
     ========================================================================= */
  const handleUpdateAllImages = async () => {
    if (!confirm('¿Desea iniciar la actualización inteligente del catálogo? Esto buscará fotografías reales en Internet para todos los productos sin imagen.')) return;
    setUpdatingAllImages(true);
    try {
      const res = await fetch('/api/catalog/update-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onRefreshProducts();
        alert(`✅ Proceso finalizado. Se han actualizado ${data.updatedCount} imágenes de productos.`);
      } else {
        alert(`⚠️ No se pudo realizar la actualización automática: ${data.error || 'Error desconocido'}`);
      }
    } catch (err) {
      alert('⚠️ Error de conexión al servidor.');
    } finally {
      setUpdatingAllImages(false);
    }
  };

  const handleSearchNewProductImages = async () => {
    if (!newProdName) return;
    setSearchingNewProdImages(true);
    setNewProdImageOptions([]);
    try {
      const res = await fetch('/api/catalog/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: newProdName })
      });
      const data = await res.json();
      if (res.ok && data.success && data.images) {
        setNewProdImageOptions(data.images);
        if (data.images.length > 0) {
          setNewProdSelectedImage(data.images[0]); // default to first option
        }
      } else {
        alert('⚠️ No se encontraron imágenes sugeridas para este nombre.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSearchingNewProdImages(false);
    }
  };

  const handleAutoselectNewProductImage = () => {
    if (newProdImageOptions.length > 0) {
      setNewProdSelectedImage(newProdImageOptions[0]);
    }
  };

  const openManualImageSelector = async (prod: Product) => {
    setManualImageSelectorProduct(prod);
    setSearchingManualImages(true);
    setManualImageOptions([]);
    setSelectedManualImage('');
    try {
      const res = await fetch('/api/catalog/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: prod.nombre })
      });
      const data = await res.json();
      if (res.ok && data.success && data.images) {
        setManualImageOptions(data.images);
        if (data.images.length > 0) {
          setSelectedManualImage(data.images[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSearchingManualImages(false);
    }
  };

  const handleSaveManualImage = async () => {
    if (!manualImageSelectorProduct || !selectedManualImage) return;
    try {
      const res = await fetch('/api/catalog/download-and-process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: manualImageSelectorProduct.id,
          imageUrl: selectedManualImage
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onRefreshProducts();
        setManualImageSelectorProduct(null);
      } else {
        alert(`⚠️ Error al guardar la imagen: ${data.error || 'Error desconocido'}`);
      }
    } catch (err) {
      alert('⚠️ Error al comunicarse con el servidor.');
    }
  };

  const handleQuickStockUpdate = async (productId: string, currentStock: number, delta: number) => {
    try {
      await saveProduct({
        id: productId,
        stock: Math.max(0, currentStock + delta)
      });
      onRefreshProducts();
    } catch (e) {
      alert('Error al ajustar stock');
    }
  };

  const handleToggleProductActive = async (productId: string, currentActive: boolean) => {
    try {
      await saveProduct({
        id: productId,
        activo: !currentActive
      });
      onRefreshProducts();
    } catch (e) {
      alert('Error de modificación de estado');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('¿Seguro que desea eliminar este producto del menú permanentemente?')) return;
    try {
      await deleteProduct(id);
      onRefreshProducts();
    } catch (e) {
      alert('Error eliminando producto.');
    }
  };

  const handleToggleAllergen = (allergen: string) => {
    setNewProdAlergenos(prev => 
      prev.includes(allergen) 
        ? prev.filter(a => a !== allergen) 
        : [...prev, allergen]
    );
  };

  const handleCloseDailyCaja = async () => {
    if (!confirm('⚠️ Realizar cierre contable inmutable de hoy. Se enviará informe al repositorio de Hacienda en PDF. ¿Continuar?')) return;
    setIsPerformingClose(true);
    try {
      const result = await triggerDailyClose();
      if (result.success) {
        setLastCloseResult(result);
        loadReports();
        alert(`✅ Cierre completado. Reporte ${result.filename} escrito con éxito en ${result.folderPath}`);
      }
    } catch (e) {
      alert('Error al ejecutar el script de cierre automatizado de caja.');
    } finally {
      setIsPerformingClose(false);
    }
  };

  const handleSearchUpdate = async () => {
    setIsCheckingUpdate(true);
    try {
      const u = await checkSystemUpdate();
      setUpdateStatus(u);
    } catch (e) {
      alert('No se pudo verificar el repositorio remoto.');
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  /* Calculated indicators from global orders on frontend */
  const totalRevenues = orders.reduce((s, o) => s + o.total, 0);
  const totalCash = orders.filter(o => o.metodo_pago === 'Efectivo').reduce((s, o) => s + o.total, 0);
  const totalBizum = orders.filter(o => o.metodo_pago === 'Bizum').reduce((s, o) => s + o.total, 0);

  // Filters search parameters
  const filteredInventory = products.filter(p => {
    const matchesSearch = p.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'TODAS' || p.categoria === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="bg-[#050505] border border-[#FF00FF] p-5 shadow-[0_0_20px_rgba(255,0,255,0.05)]">
      
      {/* Top Administration Title and Navigation Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center border-b border-[#FF00FF]/40 pb-4 mb-5 gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-[#FF00FF]/10 text-[#FF00FF] border border-[#FF00FF]/40">
            <Settings className="w-5 h-5 animate-spin" />
          </div>
          <div>
            <h1 className="text-sm font-mono font-black italic uppercase tracking-widest text-[#FF00FF]">Panel Administrativo</h1>
            <p className="text-white text-base uppercase font-semibold tracking-wider">Touch-Flow Central Server</p>
          </div>
        </div>

        {/* Tab Selector buttons */}
        <div className="flex bg-[#0a0a0a] border border-[#FF00FF]/40 max-w-full overflow-x-auto scrollbar-none flex-nowrap shrink-0">
          {[
            { id: 'ticket', label: 'Ticket y Periféricos', icon: <Printer className="w-4 h-4" /> },
            { id: 'inventory', label: 'Inventario / Escandallos', icon: <Box className="w-4 h-4" /> },
            { id: 'waiters', label: 'Personal / Camareros', icon: <Users className="w-4 h-4" /> },
            { id: 'crm', label: 'Clientes CRM', icon: <Star className="w-4 h-4" /> },
            { id: 'reservations', label: 'Reservas Mesas', icon: <Calendar className="w-4 h-4" /> },
            { id: 'promos', label: 'Promociones / Packs', icon: <Percent className="w-4 h-4" /> },
            { id: 'tables', label: 'Distribución de Mesas', icon: <Grid className="w-4 h-4" /> },
            { id: 'reports', label: 'Cierres de Caja', icon: <ClipboardList className="w-4 h-4" /> },
            { id: 'audit', label: 'Registro de Auditoría', icon: <FileText className="w-4 h-4" /> },
            { id: 'backups', label: 'Copias Seguridad', icon: <Database className="w-4 h-4" /> },
            { id: 'ai', label: 'Consultor Inteligencia AI', icon: <Brain className="w-4 h-4 text-pink-400" /> },
            { id: 'system', label: 'Actualizaciones', icon: <RefreshCw className="w-4 h-4" /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-2 text-[10px] font-mono font-black uppercase tracking-tighter border-r border-[#FF00FF]/30 last:border-r-0 transition-all flex items-center space-x-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'bg-[#FF00FF] text-black italic font-black' 
                  : 'hover:bg-[#330033]/30 text-[#FF00FF]'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* TAB CONTENT: 1. TICKET AND PRINTER CONFIG */}
      {activeTab === 'ticket' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Editable forms */}
          <div className="lg:col-span-7 space-y-4">
            <h2 className="text-zinc-200 font-bold text-sm uppercase tracking-wide flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-[#FF00FF]" />
              <span>Personalización de Ticket de Venta</span>
            </h2>

            <div className="p-4 bg-black border border-zinc-900 rounded-2xl space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-500 font-mono text-[10px] uppercase block">Cabecera de Comercio</label>
                  <input
                    type="text"
                    value={ticketHeader}
                    onChange={(e) => setTicketHeader(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-855 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF00FF] mt-1 font-mono"
                  />
                </div>
                
                <div>
                  <label className="text-zinc-500 font-mono text-[10px] uppercase block">N.I.F / C.I.F Comercial</label>
                  <input
                    type="text"
                    value={ticketCif}
                    onChange={(e) => setTicketCif(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-855 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF00FF] mt-1 font-mono animate-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-500 font-mono text-[10px] uppercase block">Dirección Física</label>
                  <input
                    type="text"
                    value={ticketDir}
                    onChange={(e) => setTicketDir(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-855 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF00FF] mt-1 font-mono"
                  />
                </div>
                
                <div>
                  <label className="text-zinc-500 font-mono text-[10px] uppercase block">Teléfono de Soporte</label>
                  <input
                    type="text"
                    value={ticketTel}
                    onChange={(e) => setTicketTel(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-855 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF00FF] mt-1 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-500 font-mono text-[10px] uppercase block">Línea de Pie de Página</label>
                <textarea
                  value={ticketPie}
                  onChange={(e) => setTicketPie(e.target.value)}
                  rows={2}
                  className="w-full bg-zinc-950 border border-zinc-855 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF00FF] mt-1 font-mono"
                />
              </div>

              <div>
                <label className="text-zinc-500 font-mono text-[10px] uppercase block">Tasa de IVA Aplicable (%)</label>
                <input
                  type="number"
                  value={ticketIva}
                  onChange={(e) => setTicketIva(Number(e.target.value))}
                  className="w-24 bg-zinc-950 border border-zinc-855 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF00FF] mt-1 font-mono"
                />
              </div>
            </div>

            <h2 className="text-zinc-200 font-bold text-sm uppercase tracking-wide flex items-center space-x-2 pt-2">
              <Printer className="w-4 h-4 text-[#FF00FF]" />
              <span>Conexión de Impresora ESC/POS Térmica</span>
            </h2>

            <div className="p-4 bg-black border border-zinc-900 rounded-2xl space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-500 font-mono text-[10px] uppercase block">Puerto Local Asignado</label>
                  <input
                    type="text"
                    value={printerPort}
                    onChange={(e) => setPrinterPort(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-855 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF00FF] mt-1 font-mono"
                  />
                </div>
                
                <div>
                  <label className="text-zinc-500 font-mono text-[10px] uppercase block">Tipo de Enlace</label>
                  <select
                    value={printerType}
                    onChange={(e) => setPrinterType(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-855 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF00FF] mt-1 font-mono"
                  >
                    <option value="USB">Conexión USB Local</option>
                    <option value="Serial">Puerto Serial (RS-232)</option>
                    <option value="Network">Enlace de Red Wi-Fi/IP</option>
                    <option value="Simulado">Consola Virtual Simulada</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <button
                  onClick={handleScanPorts}
                  disabled={isScanningPorts}
                  className="px-4 py-2 bg-zinc-90 w-full md:w-auto border border-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-mono font-bold transition-all hover:bg-zinc-900 cursor-pointer flex items-center justify-center space-x-1"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isScanningPorts ? 'animate-spin text-[#FF00FF]' : ''}`} />
                  <span>{isScanningPorts ? 'Buscando Hardware...' : 'Escanear Puertos (discover)'}</span>
                </button>

                <div className="text-[10px] font-mono text-zinc-500">
                  Activa: <b className="text-zinc-300">{printerName || 'Ninguna seleccionada'}</b>
                </div>
              </div>

              {/* Scanned ports modal results */}
              {scannedPorts.length > 0 && (
                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 space-y-2 animate-fadeIn">
                  <span className="text-[9px] font-bold text-[#FF00FF] font-mono block">DIAGNÓSTICO: CONTROLADORES ENCONTRADOS</span>
                  <div className="space-y-1">
                    {scannedPorts.map((p, idx) => (
                      <button
                        key={idx}
                        onClick={() => selectPrinterPort(p)}
                        className="w-full text-left p-2 hover:bg-zinc-900 border border-zinc-900 hover:border-[#FF00FF] rounded-lg flex justify-between text-xs font-mono cursor-pointer"
                      >
                        <span className="text-zinc-300 font-bold">{p.name} ({p.type})</span>
                        <span className="text-zinc-500">{p.port} | {p.status}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleSaveConfig}
              disabled={isSavingConfig}
              className="bg-[#FF00FF] hover:bg-fuchsia-700 text-black px-6 py-3 font-bold text-xs uppercase tracking-wider font-mono rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 active:scale-95 shadow-[0_0_15px_rgba(255,0,255,0.2)]"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Parámetros Administrativos</span>
            </button>
          </div>

          {/* Right Live Preview of 80mm B/W receipt */}
          <div className="lg:col-span-5 bg-black border border-zinc-900 rounded-3xl p-4 flex flex-col items-center">
            <span className="text-xs text-[#FF00FF] font-mono uppercase tracking-widest font-semibold mb-3">Previsualización del Diseño</span>
            
            <div className="bg-white text-black p-5 max-w-[280px] w-full shadow-xl font-mono text-[10px] space-y-2 relative border border-zinc-300">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-zinc-200 border-b border-dashed border-zinc-400"></div>
              
              <div className="text-center font-extrabold text-sm uppercase mt-1">{ticketHeader || 'EL TAST'}</div>
              <div className="text-center text-[7px] border-b border-dashed border-zinc-400 pb-2">
                <div>DIR: {ticketDir || 'Carrer del TAST, S/N'}</div>
                <div>TEL: {ticketTel || '972 00 00 00'}</div>
                <div>NIF: {ticketCif || 'B-00000000'}</div>
              </div>

              <div className="py-1 text-[8px] space-y-0.5 border-b border-zinc-100">
                <div className="flex justify-between"><span>TKT ID:</span><b>PED-XXXX</b></div>
                <div className="flex justify-between"><span>FECHA:</span><span>{new Date().toLocaleDateString()}</span></div>
                <div className="flex justify-between"><span>IVA:</span><span>{ticketIva}% REGISTRADO</span></div>
              </div>

              {/* MOCK items list */}
              <table className="w-full text-[8.5px] py-1">
                <tbody>
                  <tr className="border-b border-dashed border-zinc-200"><td className="font-bold">2x</td><td>Pernil i Formatge</td><td className="text-right">7.60€</td></tr>
                  <tr className="border-b border-dashed border-zinc-200"><td className="font-bold">1x</td><td>Cafè amb Llet</td><td className="text-right">1.60€</td></tr>
                  <tr className="border-b border-dashed border-zinc-200"><td className="font-bold">1x</td><td>Croissant Sencillo</td><td className="text-right">1.50€</td></tr>
                </tbody>
              </table>

              <div className="border-t border-dashed border-zinc-400 pt-1.5 space-y-0.5">
                <div className="flex justify-between text-[8px]"><span>Impuestos Incluidos:</span><span>{(10.70 - (10.70 / (1 + (ticketIva / 100)))).toFixed(2)}€</span></div>
                <div className="flex justify-between font-extrabold text-[11px] pt-1">
                  <span>TOTAL:</span>
                  <span>10.70 €</span>
                </div>
              </div>

              <div className="text-center text-[7px] text-zinc-500 pt-3 border-t border-dashed border-zinc-400 whitespace-pre-line uppercase select-none">
                {ticketPie || 'Gràcies per la vostra visita!'}
              </div>

              <div className="absolute -bottom-1 left-0 right-0 h-3 bg-white border-t border-dashed border-zinc-300">
                <div className="flex justify-center text-zinc-300 text-[5px]">
                ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB CONTENT: 2. INVENTORY CONTROL AND CRUD */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          <div className="flex border-b border-zinc-900 pb-3 mb-2 space-x-2">
            <button
              type="button"
              onClick={() => setInventorySubMode('products')}
              className={`px-4 py-1.5 rounded-xl font-mono text-xs uppercase font-extrabold transition-all cursor-pointer ${
                inventorySubMode === 'products'
                  ? 'bg-[#FF00FF]/15 border border-[#FF00FF] text-[#FF00FF]'
                  : 'bg-[#0a0a0a] border border-zinc-800 text-zinc-500 hover:text-white'
              }`}
            >
              Catálogo de Productos / Carta
            </button>
            <button
              type="button"
              onClick={() => setInventorySubMode('raw')}
              className={`px-4 py-1.5 rounded-xl font-mono text-xs uppercase font-extrabold transition-all cursor-pointer ${
                inventorySubMode === 'raw'
                  ? 'bg-[#FF00FF]/15 border border-[#FF00FF] text-[#FF00FF]'
                  : 'bg-[#0a0a0a] border border-zinc-800 text-zinc-500 hover:text-white'
              }`}
            >
              Control de Materias Primas / Escandallos
            </button>
          </div>

          {inventorySubMode === 'raw' ? (
            <InventoryTab 
              ingredients={ingredients} 
              suppliers={suppliers} 
              batches={batches} 
              products={products} 
              onRefresh={onRefreshProducts} 
            />
          ) : (
            <>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <h2 className="text-zinc-200 font-bold text-sm uppercase tracking-wide flex items-center space-x-2">
                  <ClipboardList className="w-4 h-4 text-[#FF00FF]" />
                  <span>Gestión de Inventario de Alimentos</span>
                </h2>

            {/* Quick selectors / triggers */}
            <div className="flex space-x-2">
              <button
                onClick={() => setIsAddingProduct(!isAddingProduct)}
                className="bg-[#FF00FF] hover:bg-fuchsia-700 text-black px-4 py-2 font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center space-x-1 outline-none"
              >
                <Plus className="w-4 h-4" />
                <span>Añadir Nuevo Producto</span>
              </button>
              <button
                onClick={handleUpdateAllImages}
                disabled={updatingAllImages}
                className="bg-black hover:bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white px-4 py-2 font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 outline-none disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${updatingAllImages ? 'animate-spin text-[#FF00FF]' : ''}`} />
                <span>{updatingAllImages ? 'Actualizando...' : 'Actualizar Imágenes'}</span>
              </button>
            </div>
          </div>

          {/* Add product expandable form */}
          {isAddingProduct && (
            <form onSubmit={handleCreateProduct} className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl grid grid-cols-1 md:grid-cols-12 gap-3 text-xs animate-fadeIn">
              
              <div className="md:col-span-3">
                <label className="text-zinc-500 block font-mono">Nombre del Artículo *</label>
                <input
                  type="text"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  placeholder="Ej. Sándwich Vegetal"
                  required
                  className="w-full bg-[#000000] border border-zinc-800 rounded-lg px-2 py-1.5 text-white focus:outline-none focus:border-[#FF00FF] mt-1 font-mono"
                />
              </div>

              <div className="md:col-span-3">
                <label className="text-zinc-500 block font-mono">División / Categoría *</label>
                <select
                  value={newProdCat}
                  onChange={(e) => setNewProdCat(e.target.value as ProductCategory)}
                  className="w-full bg-[#000000] border border-zinc-800 rounded-lg px-2 py-1.5 text-white focus:outline-none focus:border-[#FF00FF] mt-1 font-mono"
                >
                  <option value="Entrepans Freds">Entrepans Freds</option>
                  <option value="Entrepans Calents">Entrepans Calents</option>
                  <option value="Torrades">Torrades</option>
                  <option value="Pastes">Pastes</option>
                  <option value="Begudes">Begudes</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="text-zinc-500 block font-mono">Precio (€) *</label>
                <input
                  type="number"
                  step="0.05"
                  value={newProdPrice}
                  onChange={(e) => setNewProdPrice(Number(e.target.value))}
                  required
                  className="w-full bg-[#000000] border border-zinc-800 rounded-lg px-2 py-1.5 text-white focus:outline-none focus:border-[#FF00FF] mt-1 font-mono"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-zinc-550 block font-mono">Stock Inicial *</label>
                <input
                  type="number"
                  value={newProdStock}
                  onChange={(e) => setNewProdStock(Number(e.target.value))}
                  required
                  className="w-full bg-[#000000] border border-zinc-800 rounded-lg px-2 py-1.5 text-white focus:outline-none focus:border-[#FF00FF] mt-1 font-mono"
                />
              </div>

              <div className="md:col-span-2 flex items-end">
                <button
                  type="submit"
                  className="w-full py-2 bg-[#FF00FF] text-black font-bold font-mono text-center uppercase rounded-lg cursor-pointer"
                >
                  Registrar
                </button>
              </div>

              {/* Allergy indicator selection box checks */}
              <div className="col-span-full border-t border-zinc-800 pt-2 mt-1">
                <span className="text-zinc-500 block font-mono text-[10px] mb-2 uppercase">Indicadores de Alérgenos (Cumplimiento Obligatorio):</span>
                <div className="flex flex-wrap gap-1.5">
                  {AVAILABLE_ALLERGENS.map((allg) => {
                    const isSelected = newProdAlergenos.includes(allg);
                    return (
                      <button
                        type="button"
                        key={allg}
                        onClick={() => handleToggleAllergen(allg)}
                        className={`px-2 py-1 rounded-full border text-[9px] font-semibold transition-all ${
                          isSelected 
                            ? 'bg-[#FF00FF]/25 border-[#FF00FF] text-[#FF00FF]' 
                            : 'bg-[#000000] border-zinc-850 text-zinc-500 hover:text-white'
                        }`}
                      >
                        {allg}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Intelligent Image Selector */}
              <div className="col-span-full border-t border-zinc-800 pt-3 mt-1 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500 block font-mono text-[10px] uppercase">Fotografía del Producto (Búsqueda IA / Manual):</span>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={handleSearchNewProductImages}
                      disabled={!newProdName || searchingNewProdImages}
                      className="bg-[#FF00FF]/15 border border-[#FF00FF]/40 text-[#FF00FF] hover:bg-[#FF00FF]/25 px-2 py-1 font-mono text-[10px] uppercase rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {searchingNewProdImages ? 'Buscando Fotos...' : '🔍 Buscar Fotos en Internet (IA)'}
                    </button>
                    {newProdImageOptions.length > 0 && (
                      <button
                        type="button"
                        onClick={handleAutoselectNewProductImage}
                        className="bg-zinc-850 border border-zinc-800 text-zinc-300 hover:text-white px-2 py-1 font-mono text-[10px] uppercase rounded-lg transition-colors cursor-pointer"
                      >
                        Auto-seleccionar mejor
                      </button>
                    )}
                  </div>
                </div>

                {searchingNewProdImages && (
                  <div className="text-[10px] text-zinc-550 font-mono animate-pulse">
                    Conectando con el Catálogo Inteligente y buscando fotografías reales...
                  </div>
                )}

                {newProdImageOptions.length > 0 && (
                  <div className="flex gap-2.5 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-zinc-800">
                    {newProdImageOptions.map((optUrl, i) => {
                      const isSelected = newProdSelectedImage === optUrl;
                      return (
                        <button
                          type="button"
                          key={i}
                          onClick={() => setNewProdSelectedImage(optUrl)}
                          className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${
                            isSelected ? 'border-[#FF00FF] scale-95 shadow-[0_0_8px_rgba(255,0,255,0.4)]' : 'border-zinc-800 hover:border-zinc-700'
                          }`}
                        >
                          <img 
                            src={optUrl} 
                            alt={`Opción ${i + 1}`} 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover" 
                          />
                          {isSelected && (
                            <div className="absolute inset-0 bg-[#FF00FF]/15 flex items-center justify-center">
                              <span className="bg-[#FF00FF] text-black font-black text-[8px] px-1 rounded">SEL</span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
                {newProdSelectedImage && (
                  <div className="text-[10px] text-[#FF00FF] font-mono flex items-center space-x-1">
                    <span>✓ Imagen seleccionada:</span>
                    <span className="truncate max-w-md text-zinc-400">{newProdSelectedImage}</span>
                  </div>
                )}
              </div>

            </form>
          )}

          {/* Filters and search filters */}
          <div className="flex flex-col md:flex-row gap-3 pt-1">
            
            <div className="relative flex-1 bg-black rounded-xl border border-zinc-900 px-3 py-1.5 flex items-center">
              <Search className="w-4 h-4 text-zinc-500 mr-2" />
              <input
                type="text"
                placeholder="Buscar artículo por nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent text-xs text-zinc-200 focus:outline-none font-mono"
              />
            </div>

            <div className="flex space-x-1.5">
              {['TODAS', 'Entrepans Freds', 'Entrepans Calents', 'Torrades', 'Pastes', 'Begudes'].map((opt) => (
                <button
                  key={opt}
                  onClick={() => setFilterCategory(opt)}
                  className={`px-3 py-1.5 border rounded-xl text-[10px] font-bold font-mono uppercase transition-all whitespace-nowrap cursor-pointer ${
                    filterCategory === opt 
                      ? 'bg-zinc-950 border-[#FF00FF] text-[#FF00FF]' 
                      : 'bg-zinc-950/20 border-zinc-900 text-zinc-500'
                  }`}
                >
                  {opt.replace('Entrepans', 'Sandwich')}
                </button>
              ))}
            </div>

          </div>

          {/* Inventory Table lists */}
          <div className="bg-black border border-zinc-900 rounded-3xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] font-mono text-left">
                <thead className="bg-[#000000] text-zinc-550 border-b border-zinc-905 uppercase text-[9px] tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4 font-bold">Artículo</th>
                    <th className="py-3.5 px-3 font-bold">División</th>
                    <th className="py-3.5 px-3 font-bold text-center">Unidad (€)</th>
                    <th className="py-3.5 px-4 font-bold text-center">Existencias</th>
                    <th className="py-3.5 px-3 font-bold">Alérgenos registrados</th>
                    <th className="py-3.5 px-3 font-bold text-center">Estado</th>
                    <th className="py-3.5 px-3 font-bold text-center">Controles</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-909">
                  {filteredInventory.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-zinc-600 font-bold italic">
                        Ningún artículo del menú coincide con la búsqueda
                      </td>
                    </tr>
                  ) : (
                    filteredInventory.map((item) => (
                      <tr key={item.id} className="hover:bg-zinc-950/40">
                        <td className="py-3 px-4 font-bold text-white text-xs">
                          <div className="flex items-center space-x-3">
                            <div className="relative group w-10 h-10 bg-zinc-950 rounded-xl overflow-hidden border border-zinc-850 flex items-center justify-center flex-shrink-0">
                              {item.imagen_url ? (
                                <img 
                                  src={item.imagen_url} 
                                  alt={item.nombre} 
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-[9px] text-zinc-650 font-bold uppercase">Sin foto</span>
                              )}
                              <button
                                type="button"
                                onClick={() => openManualImageSelector(item)}
                                className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[9px] text-[#FF00FF] font-black uppercase tracking-tighter transition-opacity cursor-pointer"
                              >
                                Cambiar
                              </button>
                            </div>
                            <span>{item.nombre}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-zinc-400 font-semibold">{item.categoria}</td>
                        <td className="py-3 px-3 text-center text-[#FF00FF] font-bold text-xs">{item.precio.toFixed(2)}€</td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            <button 
                              onClick={() => handleQuickStockUpdate(item.id, item.stock, -1)}
                              className="w-5 h-5 bg-zinc-900 border border-zinc-800 hover:border-[#FF00FF] rounded flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer active:scale-90"
                            >-</button>
                            <span className={`font-extrabold w-8 text-center text-xs ${item.stock <= 5 ? 'text-red-500 animate-pulse' : 'text-zinc-200'}`}>
                              {item.stock}
                            </span>
                            <button 
                              onClick={() => handleQuickStockUpdate(item.id, item.stock, 5)}
                              className="w-5 h-5 bg-zinc-900 border border-zinc-800 hover:border-[#FF00FF] rounded flex items-center justify-center text-zinc-400 hover:text-[#FF00FF] cursor-pointer active:scale-90"
                            >+5</button>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          {item.alergenos && item.alergenos.length > 0 ? (
                            <span className="text-[10px] text-zinc-400 font-normal truncate max-w-[150px] block" title={item.alergenos.join(', ')}>
                              ⚠️ {item.alergenos.join(', ')}
                            </span>
                          ) : (
                            <span className="text-zinc-600 italic text-[9px]">Ninguno</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => handleToggleProductActive(item.id, item.activo)}
                            className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono tracking-wide cursor-pointer flex items-center justify-center mx-auto uppercase ${
                              item.activo 
                                ? 'bg-[#FF00FF]/15 border border-[#FF00FF] text-[#FF00FF]' 
                                : 'bg-zinc-900 border border-zinc-800 text-zinc-600'
                            }`}
                          >
                            {item.activo ? 'Venta Sí' : 'Oculto'}
                          </button>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => handleDeleteProduct(item.id)}
                            className="p-1 text-zinc-600 hover:text-red-500 rounded border border-zinc-900 hover:border-red-500/50 bg-black cursor-pointer transition-colors"
                            title="Eliminar producto"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          </>
          )}
        </div>
      )}

      {/* TAB CONTENT: 3. HACIENDA CONTABILIDAD AND PDF REPORTS */}
      {activeTab === 'reports' && (
        <div className="space-y-5">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* Sales Stats Widgets */}
            <div className="bg-black border border-zinc-900 rounded-2xl p-4 flex flex-col justify-between">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold">VENTAS DE HOY</span>
              <div className="mt-2 text-2xl font-mono font-bold text-[#FF00FF]">{totalRevenues.toFixed(2)} €</div>
              <span className="text-[9px] text-zinc-400 mt-1 uppercase">Basado en sesión actual</span>
            </div>
            
            <div className="bg-black border border-zinc-900 rounded-2xl p-4 flex flex-col justify-between">
              <span className="text-[10px] font-mono text-zinc-500 uppercase block font-bold">ARQUEO EN EFECTIVO</span>
              <div className="mt-2 text-2xl font-mono font-bold text-emerald-400">{totalCash.toFixed(2)} €</div>
              <span className="text-[9px] text-zinc-400 mt-1">Caja física registradora</span>
            </div>

            <div className="bg-black border border-zinc-900 rounded-2xl p-4 flex flex-col justify-between">
              <span className="text-[10px] font-mono text-zinc-500 uppercase block font-bold">VENTAS BIZUM / TARJETA</span>
              <div className="mt-2 text-2xl font-mono font-bold text-indigo-400">{totalBizum.toFixed(2)} €</div>
              <span className="text-[9px] text-zinc-400 mt-1">Recaudación telemática</span>
            </div>

            <div className="bg-black border border-zinc-900 rounded-2xl p-4 flex flex-col justify-between">
              <span className="text-[10px] font-mono text-zinc-500 uppercase block font-bold">Base Imponible y IVA (10%)</span>
              <div className="mt-2 text-xs font-mono">
                <div className="flex justify-between"><span>Base:</span><span className="text-zinc-100">{(totalRevenues / 1.1).toFixed(2)}€</span></div>
                <div className="flex justify-between pt-1 font-bold text-[#FF00FF]"><span>Cuota IVA:</span><span>{(totalRevenues - (totalRevenues / 1.1)).toFixed(2)}€</span></div>
              </div>
              <span className="text-[9px] text-zinc-550 mt-1 uppercase">Sujeto a inspección fiscal</span>
            </div>
          </div>

          <div className="bg-zinc-900/40 border border-zinc-900 rounded-3xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
            
            <div className="space-y-1.5 max-w-xl text-left">
              <h3 className="text-white text-base font-bold flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <span>Cierre Diario Oficial e Inmutable (Hacienda España)</span>
              </h3>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Cada cierre ejecutado genera un archivo PDF físico codificado numéricamente dentro del directorio local del TPV <code className="text-zinc-200">/Reportes/YYYY/[Mes]/</code>. Estos folios registran los desgloses fiscales con cuotas de I.V.A., base imponible e ingresos conciliados por método de pago para dar estricto cumplimiento fiscal.
              </p>
            </div>

            <button
              onClick={handleCloseDailyCaja}
              disabled={isPerformingClose}
              className="px-6 py-3 bg-[#FF00FF] hover:bg-fuchsia-700 text-black font-bold font-mono text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 shadow-[0_0_20px_rgba(255,0,255,0.25)] shrink-0 disabled:opacity-40"
            >
              <FileText className="w-4 h-4" />
              <span>{isPerformingClose ? 'Emitiendo PDF...' : 'Hacer Cierre de Caja'}</span>
            </button>
          </div>

          {/* Last close out results info */}
          {lastCloseResult && (
            <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-2 text-xs font-mono animate-fadeIn">
              <span className="text-[#FF00FF] font-bold text-[10px] block uppercase">REGISTRO DE CIERRE REALIZADO DE FORMA CONFORME:</span>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-zinc-300">
                <div>🗒️ Fichero: <b className="text-white">{lastCloseResult.filename}</b></div>
                <div>💰 Base Imponible: <b className="text-white">{lastCloseResult.summary.ivaBase.toFixed(2)}€</b></div>
                <div>📌 Cupo IVA (10%): <b className="text-white">{lastCloseResult.summary.ivaCuota.toFixed(2)}€</b></div>
                <div className="text-right">
                  <a 
                    href={lastCloseResult.reportPath} 
                    download 
                    target="_blank"
                    className="p-1 px-3 bg-[#FF00FF] border border-[#FF00FF] text-black text-[9px] font-bold rounded-lg hover:bg-black hover:text-[#FF00FF] transition-all inline-block uppercase"
                  >
                    Descargar PDF
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* History of generated PDF Files */}
          <div className="space-y-3">
            <h3 className="text-zinc-300 font-bold text-xs uppercase tracking-wide flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-zinc-550" />
              <span>Historial de Informes de Contabilidad Sanitizados (Directorio PDF)</span>
            </h3>

            <div className="bg-black border border-zinc-900 rounded-3xl overflow-hidden shadow-lg">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#000000] text-zinc-500 border-b border-zinc-900 uppercase text-[9px]">
                  <tr>
                    <th className="py-3 px-4">Periodo Legal</th>
                    <th className="py-3 px-3">Fichero Documental</th>
                    <th className="py-3 px-3">Repositorio Local</th>
                    <th className="py-3 px-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {reportsList.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-zinc-650 italic">
                        No se han archivado cierres en el directorio legal /Reportes/ todavía. Haga clic en 'Hacer Cierre de Caja'.
                      </td>
                    </tr>
                  ) : (
                    reportsList.map((rep, index) => (
                      <tr key={index} className="hover:bg-zinc-950/40">
                        <td className="py-3 px-4 font-bold text-[#FF05FF]">{rep.year} - {rep.month}</td>
                        <td className="py-3 px-3 font-semibold text-zinc-200">{rep.filename}</td>
                        <td className="py-3 px-3 text-zinc-500">/Reportes/{rep.year}/{rep.month}/</td>
                        <td className="py-3 px-4 text-right">
                          <a
                            href={rep.url}
                            download
                            target="_blank"
                            className="bg-zinc-900 hover:bg-[#FF00FF] text-zinc-400 hover:text-black border border-zinc-800 hover:border-transparent px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all inline-flex items-center space-x-1 outline-none"
                          >
                            <Download className="w-3 h-3" />
                            <span>Descargar</span>
                          </a>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* TAB CONTENT: 5. TABLES DISTRIBUTION AND CUSTOMIZATION */}
      {activeTab === 'tables' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-zinc-200 font-bold text-sm uppercase tracking-wide flex items-center space-x-2">
                <Grid className="w-4 h-4 text-[#FF00FF]" />
                <span>Configuración de Zonas y Distribución de Mesas</span>
              </h2>
              <p className="text-zinc-500 text-xs font-mono mt-1">
                Personaliza la disposición interactiva de las mesas según la arquitectura del local.
              </p>
            </div>

            {/* Zone Switcher */}
            <div className="flex bg-[#0a0a0a] border border-[#FF00FF]/40 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setSelectedEditorZona('Interior')}
                className={`px-4 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                  selectedEditorZona === 'Interior'
                    ? 'bg-[#FF00FF] text-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Interior del Local
              </button>
              <button
                type="button"
                onClick={() => setSelectedEditorZona('Exterior')}
                className={`px-4 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                  selectedEditorZona === 'Exterior'
                    ? 'bg-[#FF00FF] text-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Exterior (Terraza)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Visual Floor Plan Grid (Left) */}
            <div className="lg:col-span-7 flex flex-col space-y-2">
              <span className="text-[10px] font-mono text-[#FF00FF] uppercase tracking-wider font-bold">
                Ubicación Visual de Mesas en {selectedEditorZona.toUpperCase()}
              </span>
              
              <div 
                onClick={handleBlueprintClick}
                className="relative h-[430px] bg-zinc-950 border border-[#FF00FF]/30 rounded-3xl overflow-hidden shadow-[inset_0_0_35px_rgba(0,0,0,0.9)] cursor-crosshair group select-none bg-[radial-gradient(#ffffff04_1px,transparent_1px)] [background-size:20px_20px]"
              >
                {/* Visual architectural guides */}
                <div className="absolute inset-x-0 bottom-4 flex justify-between px-6 text-[8px] font-mono text-zinc-700 pointer-events-none uppercase">
                  <span>← Callejón Exterior / Entrada principal →</span>
                  <span>Zona {selectedEditorZona}</span>
                  <span>Barra de Servicio Principal</span>
                </div>

                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5 font-mono text-[#FF00FF] text-xl font-bold uppercase tracking-widest">
                  {selectedEditorZona === 'Interior' ? 'Plano de Cafetería' : 'Plano de Terraza / Exterior'}
                </div>

                {/* Grid rendering for mesas */}
                {tablesList
                  .filter(t => t.zona === selectedEditorZona)
                  .map(t => {
                    const isSelected = selectedTableId === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent blueprint coordinate override
                          handleSelectTable(t);
                        }}
                        style={{
                          left: `${t.x}%`,
                          top: `${t.y}%`,
                          transform: 'translate(-50%, -50%)',
                        }}
                        className={`absolute w-12 h-12 rounded-full border-2 flex flex-col items-center justify-center font-mono transition-all duration-150 shadow-md ${
                          isSelected
                            ? 'bg-[#FF00FF]/25 border-[#FF00FF] text-[#FF00FF] font-black scale-110 shadow-[0_0_20px_rgba(255,0,255,0.4)] z-20'
                            : 'bg-zinc-900/90 border-zinc-700 hover:border-[#FF00FF] text-zinc-300 hover:text-white z-10'
                        }`}
                      >
                        <span className="text-[9px] uppercase font-bold text-zinc-500 leading-none">Mesa</span>
                        <span className="text-sm font-bold leading-tight">{t.number}</span>
                      </button>
                    );
                  })}

                {/* Touch placement guide banner indicator */}
                {selectedTableId && (
                  <div className="absolute top-3 left-3 bg-zinc-900/95 border border-[#FF00FF]/40 px-3 py-1.5 rounded-xl text-[9px] font-mono text-zinc-300 pointer-events-none select-none">
                    📌 Mesa <b className="text-[#FF00FF]">#{editTableNum}</b> seleccionada. <span className="text-zinc-500">Haz clic en cualquier punto del plano para reubicarla instantáneamente.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Controller Settings Drawer (Right) */}
            <div className="lg:col-span-5 space-y-4">
              
              {/* Quick Creation Form Card */}
              <div className="bg-black border border-zinc-900 rounded-3xl p-4 space-y-3">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold block">Añadir Nueva Mesa</span>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editTableNum}
                    onChange={(e) => setEditTableNum(e.target.value)}
                    placeholder="Ej. 14, B2, Barra, Terraza 5"
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF00FF] font-mono"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTable();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddTable}
                    className="bg-[#FF00FF] hover:bg-fuchsia-700 text-black px-4 py-2 font-bold font-mono text-xs uppercase rounded-xl transition-all cursor-pointer flex items-center space-x-1 outline-none"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Añadir</span>
                  </button>
                </div>
                <span className="text-[9px] text-zinc-650 block">Establece un nombre o número y haz clic sobre el plano para reposicionar si lo deseas.</span>
              </div>

              {/* Editing Controls Container Details */}
              <div className="bg-black border border-zinc-900 rounded-3xl p-4 space-y-4">
                <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold">Ajustes de Mesa Seleccionada</span>
                  {selectedTableId && (
                    <button
                      type="button"
                      onClick={() => handleDeleteTable(selectedTableId)}
                      className="text-red-500 hover:text-red-400 font-mono text-[9px] uppercase font-bold flex items-center gap-1 cursor-pointer outline-none"
                    >
                      <Trash className="w-3 h-3" />
                      <span>Eliminar Mesa</span>
                    </button>
                  )}
                </div>

                {selectedTableId ? (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-zinc-500 font-mono text-[9px] uppercase block mb-1">Identificador / Número</label>
                        <input
                          type="text"
                          value={editTableNum}
                          onChange={(e) => handleTableNumberChange(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#FF00FF] font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-zinc-500 font-mono text-[9px] uppercase block mb-1">Ubicación / Zona</label>
                        <select
                          value={editTableZona}
                          onChange={(e) => handleTableZonaChange(e.target.value as any)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#FF00FF] font-mono font-bold"
                        >
                          <option value="Interior">Interior del Local</option>
                          <option value="Exterior">Exterior (Terraza)</option>
                        </select>
                      </div>
                    </div>

                    {/* X Location */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-zinc-500">Coordenada X (Horizontal)</span>
                        <span className="text-white font-bold">{editTableX}%</span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="95"
                        value={editTableX}
                        onChange={(e) => handleSliderX(Number(e.target.value))}
                        className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-ew-resize accent-[#FF00FF]"
                      />
                    </div>

                    {/* Y Location */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-zinc-500">Coordenada Y (Vertical)</span>
                        <span className="text-white font-bold">{editTableY}%</span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="95"
                        value={editTableY}
                        onChange={(e) => handleSliderY(Number(e.target.value))}
                        className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-ns-resize accent-[#FF00FF]"
                      />
                    </div>

                    {/* Tactile Arrow helpers block */}
                    <div className="space-y-1">
                      <span className="text-[9px] font-mono text-zinc-650 block">Desplazar con Ajuste Fino:</span>
                      <div className="grid grid-cols-3 gap-1.5 max-w-[150px] mx-auto pt-1 select-none">
                        <div />
                        <button
                          type="button"
                          onClick={() => handleSliderY(Math.max(5, editTableY - 4))}
                          className="p-1 px-3 bg-zinc-900 border border-zinc-800 hover:border-[#FF00FF]/50 text-zinc-300 font-mono text-[10px] rounded-lg cursor-pointer"
                        >
                          ↑
                        </button>
                        <div />

                        <button
                          type="button"
                          onClick={() => handleSliderX(Math.max(5, editTableX - 4))}
                          className="p-1 px-3 bg-zinc-900 border border-zinc-800 hover:border-[#FF00FF]/50 text-zinc-300 font-mono text-[10px] rounded-lg cursor-pointer text-center"
                        >
                          ←
                        </button>
                        <div className="bg-zinc-950 p-1 flex items-center justify-center rounded-lg border border-zinc-900 font-mono text-[9px] text-[#FF00FF] font-bold">
                          MESA
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSliderX(Math.min(95, editTableX + 4))}
                          className="p-1 px-3 bg-zinc-900 border border-zinc-800 hover:border-[#FF00FF]/50 text-zinc-300 font-mono text-[10px] rounded-lg cursor-pointer"
                        >
                          →
                        </button>

                        <div />
                        <button
                          type="button"
                          onClick={() => handleSliderY(Math.min(95, editTableY + 4))}
                          className="p-1 px-3 bg-zinc-900 border border-zinc-800 hover:border-[#FF00FF]/50 text-zinc-300 font-mono text-[10px] rounded-lg cursor-pointer"
                        >
                          ↓
                        </button>
                        <div />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-zinc-600 italic text-[11px] leading-relaxed">
                    💡 Haz clic sobre cualquier mesa en el plano virtual de la izquierda o añade una nueva para ajustar su posición, número o zona.
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Table list table list review view */}
          <div className="bg-black border border-zinc-900 rounded-3xl overflow-hidden p-4">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold block mb-3">Mesas Registradas Actualmente ({tablesList.length})</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {tablesList.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setSelectedEditorZona(t.zona);
                    handleSelectTable(t);
                  }}
                  className={`p-2 border rounded-xl text-left select-none text-xs font-mono transition-all ${
                    selectedTableId === t.id
                      ? 'bg-[#FF00FF]/10 border-[#FF00FF] text-[#FF00FF]'
                      : 'bg-[#080808] border-zinc-900 hover:border-zinc-800 text-zinc-300'
                  }`}
                >
                  <div className="font-bold flex justify-between items-center">
                    <span>Mesa {t.number}</span>
                    <span className="text-[8px] opacity-60 px-1 rounded bg-zinc-900">{t.zona}</span>
                  </div>
                  <div className="text-[8px] text-zinc-500 mt-1">
                    Pos: X:{t.x}% Y:{t.y}%
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-zinc-900">
            <button
              type="button"
              onClick={handleResetTablesDef}
              className="px-4 py-2 border border-zinc-900 hover:border-red-500/50 text-zinc-400 hover:text-red-400 font-mono text-xs uppercase rounded-xl cursor-pointer transition-all"
            >
              Restablecer por defecto (10 mesas)
            </button>

            <button
              type="button"
              onClick={() => handleSaveTablesList(tablesList)}
              disabled={isSavingTables}
              className="bg-[#FF00FF] hover:bg-fuchsia-700 text-black px-8 py-3 font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 shadow-[0_0_20px_rgba(255,0,255,0.15)] select-none disabled:opacity-40"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingTables ? 'Guardando...' : 'Guardar Disposición de Mesas'}</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 4. SOFTWARE UPDATES AND VERSIONING */}
      {activeTab === 'system' && (
        <div className="space-y-4 max-w-2xl text-left">
          <h2 className="text-zinc-200 font-bold text-sm uppercase tracking-wide flex items-center space-x-2">
            <RefreshCw className="w-4 h-4 text-[#FF00FF]" />
            <span>Sistema Inteligente de Autores y Versiones</span>
          </h2>

          <div className="bg-black border border-zinc-900 rounded-3xl p-5 space-y-4">
            <p className="text-zinc-450 text-xs leading-relaxed">
              El TPV local está configurado para conectarse mediante pasarela cifrada HTTPS con el servidor de versiones Touch-Flow para descargar parches de seguridad, optimizaciones de drivers de impresión térmica y compatibilidades con normativas fiscales.
            </p>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 py-2 border-y border-zinc-900">
              <div className="space-y-0.5">
                <span className="text-[9px] font-mono text-zinc-600 uppercase block">Versión de Compilación Actual</span>
                <span className="text-white font-mono font-bold text-base">v1.4.2-LTS (Estable en Terminal)</span>
              </div>
              
              <button
                onClick={handleSearchUpdate}
                disabled={isCheckingUpdate}
                className="px-4 py-2.5 bg-zinc-900 hover:bg-[#FF00FF]/10 text-zinc-350 hover:text-[#FF00FF] border border-zinc-800 hover:border-[#FF00FF] rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center space-x-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
                <span>{isCheckingUpdate ? 'Conectando...' : 'Buscar Actualizaciones'}</span>
              </button>
            </div>

            {/* Updates simulation box response */}
            {updateStatus && (
              <div className="bg-[#FF00FF]/5 border border-[#FF00FF]/30 rounded-2xl p-4 space-y-3 animate-fadeIn">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="bg-[#FF00FF]/20 text-[#FF00FF] font-bold text-[9px] font-mono px-2 py-0.5 rounded-full border border-[#FF00FF]/40 uppercase tracking-wide">¡NUEVA EDICIÓN DISPONIBLE!</span>
                    <h4 className="text-white text-sm font-bold mt-1.5 font-mono">Touch-Flow Cafetería v{updateStatus.latestVersion}</h4>
                  </div>
                  <span className="text-zinc-500 font-mono text-xs">Tamaño: 14.8 MB</span>
                </div>

                <div className="bg-black/90 p-3 rounded-xl border border-zinc-900 space-y-1">
                  <span className="text-[9px] font-bold text-zinc-550 block font-mono">NOTAS DE LA ACTUALIZACIÓN:</span>
                  <p className="text-zinc-400 font-mono text-[10.5px] leading-relaxed">{updateStatus.changelog}</p>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => {
                      alert('💾 Descargando parche incremental v1.5.0, descomprimiendo ficheros recursivos de sistema y reiniciando servidor local en puerto 3000. El proceso finalizará en 5 segundos.');
                      setTimeout(() => {
                        window.location.reload();
                      }, 2000);
                    }}
                    className="px-4 py-2 bg-[#FF00FF] hover:bg-fuchsia-700 text-black font-extrabold font-mono text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-all active:scale-95"
                  >
                    Actualizar Ahora
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* NEW TPV PROFESSIONAL MODULES */}
      {activeTab === 'waiters' && (
        <WaitersTab waiters={waiters} onRefresh={onRefreshProducts} />
      )}

      {activeTab === 'crm' && (
        <CrmTab customers={customers} onRefresh={onRefreshProducts} />
      )}

      {activeTab === 'reservations' && (
        <ReservationsTab reservations={reservations} tables={tables} onRefresh={onRefreshProducts} />
      )}

      {activeTab === 'promos' && (
        <PromosTab promos={promos} products={products} onRefresh={onRefreshProducts} />
      )}

      {activeTab === 'audit' && (
        <AuditTab auditLogs={auditLogs} />
      )}

      {activeTab === 'backups' && (
        <BackupsTab />
      )}

      {activeTab === 'ai' && (
        <AiConsultingTab />
      )}

      {/* MANUAL IMAGE SELECTOR MODAL */}
      {manualImageSelectorProduct && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-[#0c0c0c] border border-zinc-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold text-[#FF00FF] font-mono uppercase tracking-widest block">CATÁLOGO INTELIGENTE (IA)</span>
                <h3 className="text-white text-base font-extrabold mt-1 font-mono">Cambiar fotografía de {manualImageSelectorProduct.nombre}</h3>
              </div>
              <button 
                onClick={() => setManualImageSelectorProduct(null)}
                className="text-zinc-550 hover:text-white font-mono text-lg cursor-pointer animate-pulse"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <span className="text-zinc-500 block font-mono text-[10px] uppercase">Fotografías sugeridas encontradas en internet:</span>

              {searchingManualImages && (
                <div className="py-8 text-center text-zinc-550 font-mono text-xs animate-pulse">
                  🔍 Conectando con los CDNs y buscando imágenes reales...
                </div>
              )}

              {!searchingManualImages && manualImageOptions.length === 0 && (
                <div className="py-8 text-center text-zinc-650 font-mono text-xs italic">
                  No se encontraron fotografías para este producto.
                </div>
              )}

              {!searchingManualImages && manualImageOptions.length > 0 && (
                <div className="grid grid-cols-3 gap-3 animate-fadeIn">
                  {manualImageOptions.map((optUrl, i) => {
                    const isSelected = selectedManualImage === optUrl;
                    return (
                      <button
                        type="button"
                        key={i}
                        onClick={() => setSelectedManualImage(optUrl)}
                        className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all ${
                          isSelected ? 'border-[#FF00FF] scale-95 shadow-[0_0_12px_rgba(255,0,255,0.5)]' : 'border-zinc-800 hover:border-zinc-750'
                        }`}
                      >
                        <img 
                          src={optUrl} 
                          alt={`Sugerencia ${i + 1}`} 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover" 
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-[#FF00FF]/15 flex items-center justify-center">
                            <span className="bg-[#FF00FF] text-black font-black text-[9px] px-1.5 py-0.5 rounded">SEL</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex space-x-2 pt-2 border-t border-zinc-900">
              <button
                type="button"
                onClick={() => setManualImageSelectorProduct(null)}
                className="flex-1 py-2 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white font-bold font-mono text-xs uppercase rounded-xl transition-all cursor-pointer text-center"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveManualImage}
                disabled={!selectedManualImage}
                className="flex-1 py-2 bg-[#FF00FF] hover:bg-fuchsia-700 text-black font-bold font-mono text-xs uppercase rounded-xl transition-all cursor-pointer text-center disabled:opacity-50"
              >
                Guardar Imagen
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
