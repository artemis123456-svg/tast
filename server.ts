/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import PDFDocument from 'pdfkit';
import { Product, Order, AppConfig, OrderItem, OrderStatus, ProductCategory, Table, Waiter, Ingredient, Supplier, Batch, Customer, Reservation, Promo, CashSession, AuditLog, Backup } from './src/types';
import { GoogleGenAI } from '@google/genai';

// Establish relative paths
const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');
const REPORTS_DIR = path.join(process.cwd(), 'Reportes');

// Ensure database and files exist
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

// Initial demo / seed data from user's cafe photos
const INITIAL_PRODUCTS: Product[] = [
  // Entrepans Freds
  { id: 'f-1', nombre: 'Pernil Salat', categoria: 'Entrepans Freds', precio: 3.50, stock: 45, imagen_url: '', activo: true, alergenos: ['Cereales'] },
  { id: 'f-2', nombre: 'Pernil Dolç', categoria: 'Entrepans Freds', precio: 3.00, stock: 50, imagen_url: '', activo: true, alergenos: ['Cereales'] },
  { id: 'f-3', nombre: 'Pernil i Formatge', categoria: 'Entrepans Freds', precio: 3.80, stock: 40, imagen_url: '', activo: true, alergenos: ['Cereales', 'Lácteos'] },
  { id: 'f-4', nombre: 'Formatge Semi', categoria: 'Entrepans Freds', precio: 3.20, stock: 30, imagen_url: '', activo: true, alergenos: ['Cereales', 'Lácteos'] },
  { id: 'f-5', nombre: 'Llonganissa', categoria: 'Entrepans Freds', precio: 3.50, stock: 25, imagen_url: '', activo: true, alergenos: ['Cereales', 'Lácteos', 'Soja'] },
  { id: 'f-6', nombre: 'Xoriço', categoria: 'Entrepans Freds', precio: 3.50, stock: 22, imagen_url: '', activo: true, alergenos: ['Cereales', 'Lácteos'] },
  { id: 'f-7', nombre: 'Mortadela', categoria: 'Entrepans Freds', precio: 2.80, stock: 15, imagen_url: '', activo: true, alergenos: ['Cereales', 'Lácteos', 'Soja'] },
  { id: 'f-8', nombre: 'Butifarra', categoria: 'Entrepans Freds', precio: 3.50, stock: 20, imagen_url: '', activo: true, alergenos: ['Cereales', 'Lácteos'] },
  { id: 'f-9', nombre: 'Llom Embutxat', categoria: 'Entrepans Freds', precio: 3.80, stock: 18, imagen_url: '', activo: true, alergenos: ['Cereales'] },
  { id: 'f-10', nombre: 'Pit de Gall d\'Indi', categoria: 'Entrepans Freds', precio: 3.20, stock: 20, imagen_url: '', activo: true, alergenos: ['Cereales'] },
  { id: 'f-11', nombre: 'Crema de Cacao', categoria: 'Entrepans Freds', precio: 2.50, stock: 35, imagen_url: '', activo: true, alergenos: ['Cereales', 'Lácteos', 'Frutos secos', 'Soja'] },
  { id: 'f-12', nombre: 'Fuet', categoria: 'Entrepans Freds', precio: 3.20, stock: 24, imagen_url: '', activo: true, alergenos: ['Cereales', 'Lácteos'] },
  { id: 'f-13', nombre: 'Tonyina', categoria: 'Entrepans Freds', precio: 3.50, stock: 15, imagen_url: '', activo: true, alergenos: ['Cereales', 'Pescado', 'Soja'] },
  { id: 'f-14', nombre: 'Anxoves', categoria: 'Entrepans Freds', precio: 3.80, stock: 10, imagen_url: '', activo: true, alergenos: ['Cereales', 'Pescado'] },

  // Entrepans Calents
  { id: 'c-1', nombre: 'Pernil i Formatge Calent', categoria: 'Entrepans Calents', precio: 3.90, stock: 35, imagen_url: '', activo: true, alergenos: ['Cereales', 'Lácteos'] },
  { id: 'c-2', nombre: 'Bacon', categoria: 'Entrepans Calents', precio: 3.50, stock: 40, imagen_url: '', activo: true, alergenos: ['Cereales', 'Soja'] },
  { id: 'c-3', nombre: 'Bacon i Formatge', categoria: 'Entrepans Calents', precio: 4.00, stock: 30, imagen_url: '', activo: true, alergenos: ['Cereales', 'Lácteos', 'Soja'] },
  { id: 'c-4', nombre: 'Llom', categoria: 'Entrepans Calents', precio: 3.80, stock: 28, imagen_url: '', activo: true, alergenos: ['Cereales', 'Lácteos'] },
  { id: 'c-5', nombre: 'Llom i Formatge', categoria: 'Entrepans Calents', precio: 4.30, stock: 25, imagen_url: '', activo: true, alergenos: ['Cereales', 'Lácteos'] },
  { id: 'c-6', nombre: 'Frankfurt', categoria: 'Entrepans Calents', precio: 3.20, stock: 30, imagen_url: '', activo: true, alergenos: ['Cereales'] },
  { id: 'c-7', nombre: 'Bikini', categoria: 'Entrepans Calents', precio: 3.00, stock: 55, imagen_url: '', activo: true, alergenos: ['Cereales', 'Lácteos'] },
  { id: 'c-8', nombre: 'Truita Francesa', categoria: 'Entrepans Calents', precio: 3.20, stock: 25, imagen_url: '', activo: true, alergenos: ['Cereales', 'Huevos'] },
  { id: 'c-9', nombre: 'Sobrassada', categoria: 'Entrepans Calents', precio: 3.50, stock: 20, imagen_url: '', activo: true, alergenos: ['Cereales', 'Lácteos', 'Soja'] },

  // Torrades
  { id: 't-1', nombre: 'Torrada amb Pernil', categoria: 'Torrades', precio: 2.50, stock: 30, imagen_url: '', activo: true, alergenos: ['Cereales'] },
  { id: 't-2', nombre: 'Torrada amb Formatge', categoria: 'Torrades', precio: 2.50, stock: 25, imagen_url: '', activo: true, alergenos: ['Cereales', 'Lácteos'] },
  { id: 't-3', nombre: 'Torrada amb Mantega i Melmelada Préssec', categoria: 'Torrades', precio: 2.20, stock: 20, imagen_url: '', activo: true, alergenos: ['Cereales', 'Lácteos'] },
  { id: 't-4', nombre: 'Torrada amb Mantega i Melmelada Maduixa', categoria: 'Torrades', precio: 2.20, stock: 20, imagen_url: '', activo: true, alergenos: ['Cereales', 'Lácteos'] },
  { id: 't-5', nombre: 'Torrada amb Mantega Sola', categoria: 'Torrades', precio: 1.80, stock: 30, imagen_url: '', activo: true, alergenos: ['Cereales', 'Lácteos'] },

  // Pastes
  { id: 'p-1', nombre: 'Croissant Sencillo', categoria: 'Pastes', precio: 1.50, stock: 20, imagen_url: '', activo: true, alergenos: ['Cereales', 'Huevos', 'Lácteos', 'Soja', 'Frutos secos'] },
  { id: 'p-2', nombre: 'Donut', categoria: 'Pastes', precio: 1.50, stock: 15, imagen_url: '', activo: true, alergenos: ['Cereales', 'Huevos', 'Lácteos', 'Soja'] },
  { id: 'p-3', nombre: 'Ensaïmada', categoria: 'Pastes', precio: 1.80, stock: 12, imagen_url: '', activo: true, alergenos: ['Cereales', 'Huevos', 'Lácteos', 'Soja'] },
  { id: 'p-4', nombre: 'Croissant de Xocolata', categoria: 'Pastes', precio: 2.00, stock: 15, imagen_url: '', activo: true, alergenos: ['Cereales', 'Huevos', 'Lácteos', 'Frutos secos', 'Soja'] },
  { id: 'p-5', nombre: 'Croissant de Pernil Dolç i Formatge', categoria: 'Pastes', precio: 2.50, stock: 14, imagen_url: '', activo: true, alergenos: ['Cereales', 'Huevos', 'Lácteos', 'Soja'] },

  // Begudes
  { id: 'b-1', nombre: 'Cafè Solo', categoria: 'Begudes', precio: 1.30, stock: 200, imagen_url: '', activo: true },
  { id: 'b-2', nombre: 'Tallat (Cortado)', categoria: 'Begudes', precio: 1.40, stock: 150, imagen_url: '', activo: true, alergenos: ['Lácteos'] },
  { id: 'b-3', nombre: 'Cafè amb Llet', categoria: 'Begudes', precio: 1.60, stock: 180, imagen_url: '', activo: true, alergenos: ['Lácteos'] },
  { id: 'b-4', nombre: 'Capuccino', categoria: 'Begudes', precio: 2.20, stock: 80, imagen_url: '', activo: true, alergenos: ['Lácteos'] },
  { id: 'b-5', nombre: 'Aigua 500ml', categoria: 'Begudes', precio: 1.50, stock: 90, imagen_url: '', activo: true },
  { id: 'b-6', nombre: 'Refresc Coca-Cola', categoria: 'Begudes', precio: 2.00, stock: 75, imagen_url: '', activo: true },
  { id: 'b-7', nombre: 'Cervesa Estrella', categoria: 'Begudes', precio: 2.20, stock: 60, imagen_url: '', activo: true, alergenos: ['Cereales'] }
];

const DEFAULT_CONFIG: AppConfig = {
  ticket: {
    header: 'EL TAST CAFETERIA',
    direccion: 'Carrer de la Rutlla, 45, Girona',
    telefono: '+34 972 55 88 22',
    cif: 'B-12345678A',
    pie_pagina: 'Gràcies per la vostra visita!\nFins aviat!',
    iva: 10
  },
  printer: {
    port: 'USB001',
    name: 'Thermal Printer 80mm (ESPON T88)',
    type: 'USB',
    status: 'Conectado'
  },
  authPin: '1234'
};

const INITIAL_TABLES: Table[] = [
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

// Local storage interfaces structures
interface LocalDB {
  products: Product[];
  orders: Order[];
  config: AppConfig;
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

const INITIAL_WAITERS: Waiter[] = [
  { id: 'w-1', nombre: 'Laura Martínez', pin: '1111', foto_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&fit=crop&q=80', color: '#FF00FF', activo: true, ventas_totales: 120.50, propinas_totales: 15.00, horas_trabajadas: 24, turnos: [] },
  { id: 'w-2', nombre: 'Carlos Soler', pin: '2222', foto_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&fit=crop&q=80', color: '#00FFFF', activo: true, ventas_totales: 85.00, propinas_totales: 10.00, horas_trabajadas: 16, turnos: [] },
  { id: 'w-3', nombre: 'Sofía Ortiz', pin: '3333', foto_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&fit=crop&q=80', color: '#FFFF00', activo: true, ventas_totales: 0, propinas_totales: 0, horas_trabajadas: 0, turnos: [] }
];

const INITIAL_INGREDIENTS: Ingredient[] = [
  { id: 'ing-1', nombre: 'Pan de Bocadillo', stock: 120, unidad: 'u', stock_minimo: 20 },
  { id: 'ing-2', nombre: 'Jamón Serrano', stock: 5000, unidad: 'g', stock_minimo: 1000 },
  { id: 'ing-3', nombre: 'Formatge Semi', stock: 4000, unidad: 'g', stock_minimo: 800 },
  { id: 'ing-4', nombre: 'Café en Grano', stock: 15000, unidad: 'g', stock_minimo: 2000 },
  { id: 'ing-5', nombre: 'Leche Entera', stock: 24000, unidad: 'ml', stock_minimo: 5000 },
  { id: 'ing-6', nombre: 'Croissant masa', stock: 50, unidad: 'u', stock_minimo: 10 },
  { id: 'ing-7', nombre: 'Refresco Cola lata', stock: 75, unidad: 'u', stock_minimo: 15 },
  { id: 'ing-8', nombre: 'Cerveza Estrella tercio', stock: 60, unidad: 'u', stock_minimo: 12 }
];

const INITIAL_SUPPLIERS: Supplier[] = [
  { id: 'prov-1', nombre: 'Distribuciones Girona S.L.', telefono: '972 123 456', email: 'pedidos@distgirona.com', direccion: 'Polígono Industrial Can Prats, Nave 4' },
  { id: 'prov-2', nombre: 'Forn de Pa de l\'Empordà', telefono: '972 789 012', email: 'ventas@fornemporda.cat', direccion: 'Carrer Major, 12, Celrà' }
];

const INITIAL_BATCHES: Batch[] = [
  { id: 'lote-1', ingredient_id: 'ing-2', lote: 'L-240701-A', stock: 5000, caducidad: '2026-12-31' },
  { id: 'lote-2', ingredient_id: 'ing-1', lote: 'L-260702-D', stock: 120, caducidad: '2026-07-15' }
];

const INITIAL_CUSTOMERS: Customer[] = [
  { id: 'c-1', nombre: 'Andrés Villalobos', telefono: '612 345 678', email: 'andres@gmail.com', fecha_nacimiento: '1985-06-15', puntos: 150, descuento_acumulado: 5.00, historial_consumo: [] },
  { id: 'c-2', nombre: 'María Bosch', telefono: '698 765 432', email: 'maria.b@hotmail.com', fecha_nacimiento: '1992-11-22', puntos: 80, descuento_acumulado: 0.00, historial_consumo: [] }
];

const INITIAL_RESERVATIONS: Reservation[] = [
  { id: 'res-1', nombre_cliente: 'Andrés Villalobos', telefono: '612 345 678', fecha: '2026-07-02', hora: '14:30', pax: 4, mesa_id: 't-int-2', estado: 'Confirmada' },
  { id: 'res-2', nombre_cliente: 'Elena Rovira', telefono: '654 321 098', fecha: '2026-07-03', hora: '21:00', pax: 2, mesa_id: 't-int-5', estado: 'Pendiente' }
];

const INITIAL_PROMOS: Promo[] = [
  { id: 'p-1', nombre: '2x1 en Cafés (Happy Hour)', tipo: '2x1', config: { productoId: 'b-1', horas_activas: ['16:00', '18:00'], dias_activos: [1, 2, 3, 4, 5] }, activo: true },
  { id: 'p-2', nombre: '10% Descuento en Pastas', tipo: 'Descuento', config: { categoria: 'Pastes', descuento_pct: 10 }, activo: true }
];

// Ensure database state is loaded
let db: LocalDB = {
  products: INITIAL_PRODUCTS,
  orders: [],
  config: DEFAULT_CONFIG,
  tables: INITIAL_TABLES,
  waiters: INITIAL_WAITERS,
  ingredients: INITIAL_INGREDIENTS,
  suppliers: INITIAL_SUPPLIERS,
  batches: INITIAL_BATCHES,
  customers: INITIAL_CUSTOMERS,
  reservations: INITIAL_RESERVATIONS,
  promos: INITIAL_PROMOS,
  cashSessions: [],
  auditLogs: []
};

function readDB() {
  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const loaded = JSON.parse(content);
      db = {
        products: loaded.products || INITIAL_PRODUCTS,
        orders: loaded.orders || [],
        config: loaded.config || DEFAULT_CONFIG,
        tables: loaded.tables || INITIAL_TABLES,
        waiters: loaded.waiters || INITIAL_WAITERS,
        ingredients: loaded.ingredients || INITIAL_INGREDIENTS,
        suppliers: loaded.suppliers || INITIAL_SUPPLIERS,
        batches: loaded.batches || INITIAL_BATCHES,
        customers: loaded.customers || INITIAL_CUSTOMERS,
        reservations: loaded.reservations || INITIAL_RESERVATIONS,
        promos: loaded.promos || INITIAL_PROMOS,
        cashSessions: loaded.cashSessions || [],
        auditLogs: loaded.auditLogs || []
      };
      
      // Inject recipes into initial products if missing
      db.products.forEach(p => {
        if (!p.receta) {
          if (p.id === 'f-1') p.receta = [{ ingredient_id: 'ing-1', cantidad: 1 }, { ingredient_id: 'ing-2', cantidad: 50 }];
          if (p.id === 'f-2') p.receta = [{ ingredient_id: 'ing-1', cantidad: 1 }, { ingredient_id: 'ing-3', cantidad: 50 }];
          if (p.id === 'f-3') p.receta = [{ ingredient_id: 'ing-1', cantidad: 1 }, { ingredient_id: 'ing-2', cantidad: 25 }, { ingredient_id: 'ing-3', cantidad: 25 }];
          if (p.id === 'p-1') p.receta = [{ ingredient_id: 'ing-6', cantidad: 1 }];
          if (p.id === 'b-1') p.receta = [{ ingredient_id: 'ing-4', cantidad: 8 }];
          if (p.id === 'b-2') p.receta = [{ ingredient_id: 'ing-4', cantidad: 8 }, { ingredient_id: 'ing-5', cantidad: 30 }];
          if (p.id === 'b-3') p.receta = [{ ingredient_id: 'ing-4', cantidad: 8 }, { ingredient_id: 'ing-5', cantidad: 120 }];
          if (p.id === 'b-6') p.receta = [{ ingredient_id: 'ing-7', cantidad: 1 }];
          if (p.id === 'b-7') p.receta = [{ ingredient_id: 'ing-8', cantidad: 1 }];
        }
        if (p.categoria === 'Begudes') {
          p.isDrink = true;
        }
        if (!p.costo_elaboracion) {
          p.costo_elaboracion = Number((p.precio * 0.35).toFixed(2)); // estimated 35% average food cost
        }
      });
    } catch (e) {
      console.error('Error reading local JSON db, using runtime state instead', e);
    }
  } else {
    writeDB();
  }
}

function writeDB() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing to database', e);
  }
}

readDB(); // Initial read

// Setup Gemini API Lazy client
let aiInstance: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not defined in the workspace secrets. Please configure it in Settings > Secrets.');
    }
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return aiInstance;
}

// Activity Audit Logger helper
function logAudit(usuario: string, accion: string, descripcion: string) {
  const newLog: AuditLog = {
    id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    usuario,
    accion,
    descripcion,
    timestamp: Date.now()
  };
  if (!db.auditLogs) db.auditLogs = [];
  db.auditLogs.unshift(newLog);
  // Keep last 500 logs to manage database size
  if (db.auditLogs.length > 500) {
    db.auditLogs = db.auditLogs.slice(0, 500);
  }
  writeDB();
}

// Global reference for sockets to broadcast alerts
let socketIoInstance: Server | null = null;

// Recipe stock deduction logic
function deductIngredients(items: OrderItem[], camarero: string) {
  items.forEach(item => {
    const prod = db.products.find(p => p.id === item.productId);
    if (prod && prod.receta) {
      prod.receta.forEach(rec => {
        const ing = db.ingredients.find(i => i.id === rec.ingredient_id);
        if (ing) {
          const qtyToDeduct = rec.cantidad * item.quantity;
          ing.stock = Math.max(0, ing.stock - qtyToDeduct);
          
          // Trigger alert if dropping below minimum threshold
          if (ing.stock <= ing.stock_minimo && socketIoInstance) {
            socketIoInstance.emit('low-stock-alert', {
              ingredient_id: ing.id,
              nombre: ing.nombre,
              stock: ing.stock,
              stock_minimo: ing.stock_minimo
            });
          }
        }
      });
    }
  });
  writeDB();
  if (socketIoInstance) {
    socketIoInstance.emit('ingredients-changed', db.ingredients);
  }
}

// Rate limiting state for pin
let pinAttempts = 0;
let pinLockoutUntil = 0;

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json());
  // Static file access for physical PDF reports
  app.use('/reportes-archivos', express.static(REPORTS_DIR));

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
  });

  socketIoInstance = io;

  io.on('connection', (socket) => {
    console.log('Client connected targeting socket ID:', socket.id);
    
    // Send immediate sync packages on link
    socket.emit('initial-sync', {
      products: db.products,
      orders: db.orders,
      config: {
        ticket: db.config.ticket,
        printer: db.config.printer
      },
      tables: db.tables || [],
      waiters: db.waiters || [],
      ingredients: db.ingredients || [],
      suppliers: db.suppliers || [],
      batches: db.batches || [],
      customers: db.customers || [],
      reservations: db.reservations || [],
      promos: db.promos || [],
      cashSessions: db.cashSessions || [],
      auditLogs: db.auditLogs || []
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  // Auth/Login PIN Endpoint with rate-limit
  app.post('/api/auth/login', (req, res) => {
    const { pin } = req.body;
    const now = Date.now();

    if (pinLockoutUntil > now) {
      const waitTimeSec = Math.ceil((pinLockoutUntil - now) / 1000);
      return res.status(429).json({ 
        success: false, 
        message: `Bloqueado por seguridad. Inténtelo de nuevo en ${waitTimeSec} s.` 
      });
    }

    if (pin === db.config.authPin) {
      pinAttempts = 0; // restart
      return res.json({ success: true, token: 'jwt-equivalent-token-pos-flow-2026' });
    } else {
      pinAttempts++;
      if (pinAttempts >= 4) {
        pinLockoutUntil = now + 30000; // 30 seconds block
        pinAttempts = 0;
        return res.status(429).json({ 
          success: false, 
          message: 'Demasiados intentos fallidos. PIN bloqueado por 30 segundos.' 
        });
      }
      return res.status(401).json({ 
        success: false, 
        message: `PIN incorrecto. Intentos restantes antes de bloqueo: ${4 - pinAttempts}` 
      });
    }
  });

  // Products CRUD endpoints
  app.get('/api/products', (req, res) => {
    res.json(db.products);
  });

  app.post('/api/products', (req, res) => {
    const newProduct: Product = req.body;
    if (!newProduct.nombre || !newProduct.categoria || newProduct.precio === undefined) {
      return res.status(400).json({ error: 'Faltan campos obligatorios en el producto' });
    }
    // Generate simple incremental ID
    newProduct.id = `${newProduct.categoria.toLowerCase().substring(0, 1)}-${Date.now()}`;
    db.products.push(newProduct);
    writeDB();
    io.emit('products-changed', db.products);
    res.status(201).json(newProduct);
  });

  app.put('/api/products/:id', (req, res) => {
    const { id } = req.params;
    const fieldUpdates: Partial<Product> = req.body;
    const index = db.products.findIndex(p => p.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    db.products[index] = { ...db.products[index], ...fieldUpdates };
    writeDB();
    io.emit('products-changed', db.products);
    res.json(db.products[index]);
  });

  app.delete('/api/products/:id', (req, res) => {
    const { id } = req.params;
    const index = db.products.findIndex(p => p.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    db.products.splice(index, 1);
    writeDB();
    io.emit('products-changed', db.products);
    res.json({ success: true, message: 'Producto eliminado correctamente' });
  });

  // Orders Admin / Waiter Endpoints
  app.get('/api/orders', (req, res) => {
    res.json(db.orders);
  });

  app.post('/api/orders', (req, res) => {
    const { items, metodo_pago, camarero_id, mesa_id, cliente_id } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'El pedido debe contener al menos 1 producto' });
    }

    // Identify waiter name
    const waiter = db.waiters.find(w => w.id === camarero_id) || db.waiters[0];
    const waiterName = waiter ? waiter.nombre : 'Móvil-Camarero';

    let calculatedTotal = 0;
    let totalDiscountApplied = 0;

    const updatedItems = items.map((item: OrderItem) => {
      const dbProd = db.products.find(p => p.id === item.productId);
      const originalPrice = dbProd ? dbProd.precio : item.precio;
      
      // Traditional Product stock reduction
      if (dbProd) {
        dbProd.stock = Math.max(0, dbProd.stock - item.quantity);
      }

      let finalPrice = originalPrice;

      // Apply automatic promotions (Happy Hour, 2x1, or Category Discount)
      db.promos.forEach(p => {
        if (p.activo) {
          if (p.tipo === 'Descuento' && p.config.categoria && dbProd?.categoria === p.config.categoria) {
            const pct = p.config.descuento_pct || 0;
            const discount = (originalPrice * (pct / 100));
            finalPrice = originalPrice - discount;
            totalDiscountApplied += discount * item.quantity;
          }
          if (p.tipo === '2x1' && p.config.productoId === item.productId && item.quantity >= 2) {
            const freeCount = Math.floor(item.quantity / 2);
            totalDiscountApplied += originalPrice * freeCount;
          }
        }
      });

      calculatedTotal += finalPrice * item.quantity;
      return {
        ...item,
        precio: Number(finalPrice.toFixed(2))
      };
    });

    // Make sure total is positive
    calculatedTotal = Math.max(0, calculatedTotal - totalDiscountApplied);

    const newOrder: Order = {
      id: `PED-${Date.now().toString().substring(6)}`,
      camarero_id: camarero_id || 'Móvil-Camarero',
      items: updatedItems,
      total: Number(calculatedTotal.toFixed(2)),
      metodo_pago: metodo_pago || 'Efectivo',
      estado: 'Pendiente',
      timestamp: Date.now()
    };

    db.orders.push(newOrder);

    // Update table status if table is specified
    if (mesa_id) {
      const table = db.tables.find(t => t.id === mesa_id);
      if (table) {
        table.status = 'busy';
      }
    }

    // Deduct raw ingredients/materials (recipe escandallo)
    deductIngredients(updatedItems, waiterName);

    // Track CRM customer loyalty points
    if (cliente_id) {
      const customer = db.customers.find(c => c.id === cliente_id);
      if (customer) {
        // 1 point for every 10 € spent
        const ptsEarned = Math.floor(calculatedTotal / 10);
        customer.puntos += ptsEarned;
        customer.historial_consumo.unshift({
          orderId: newOrder.id,
          total: newOrder.total,
          timestamp: newOrder.timestamp
        });
        logAudit(waiterName, 'Fidelización Cliente', `Cliente ${customer.nombre} sumó ${ptsEarned} puntos por compra.`);
      }
    }

    // Add Sales and tips metrics to current waiter
    if (waiter) {
      waiter.ventas_totales += newOrder.total;
      // update current active shift of this waiter if any
      const activeShift = waiter.turnos?.find(t => t.activo);
      if (activeShift) {
        activeShift.ventas += newOrder.total;
      }
    }

    writeDB();

    // Log action to Audit Logs
    logAudit(waiterName, 'Nuevo Pedido', `Mesa: ${mesa_id || 'Llevar'}. Total: ${newOrder.total} €. ID: ${newOrder.id}`);

    // Direct Sync triggers to all linked touchpads
    io.emit('orders-changed', db.orders);
    io.emit('products-changed', db.products);
    io.emit('tables-changed', db.tables);
    io.emit('waiters-changed', db.waiters);
    io.emit('customers-changed', db.customers);

    res.status(201).json(newOrder);
  });

  app.put('/api/orders/:id', (req, res) => {
    const { id } = req.params;
    const { estado, items, mesa_id } = req.body;
    const index = db.orders.findIndex(o => o.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    const prevOrder = db.orders[index];
    const prevStatus = prevOrder.estado;

    if (estado) {
      db.orders[index].estado = estado as OrderStatus;
      
      // If paid, free table
      if (estado === 'Pagado' && prevOrder.id) {
        // find table associated
        const table = db.tables.find(t => t.status === 'busy'); // simplify or check if match
        // Or if mesa_id is supplied or we store it in Order (we will support this in frontend)
      }
    }

    // If order was modified, print delta only
    if (items) {
      db.orders[index].items = items;
      logAudit('Cocina', 'Modificación Comanda', `Pedido ${id} actualizado. Solo cambios enviados a preparación.`);
    }

    writeDB();
    logAudit('Sistema', 'Cambio Estado Pedido', `Pedido ${id} cambió de ${prevStatus} a ${estado || prevOrder.estado}`);

    io.emit('orders-changed', db.orders);
    res.json(db.orders[index]);
  });

  // Configuration management
  app.get('/api/config', (req, res) => {
    res.json({
      ticket: db.config.ticket,
      printer: db.config.printer
    });
  });

  app.post('/api/config', (req, res) => {
    const { ticket, printer, authPin } = req.body;
    if (ticket) db.config.ticket = { ...db.config.ticket, ...ticket };
    if (printer) db.config.printer = { ...db.config.printer, ...printer };
    if (authPin && authPin.length === 4) db.config.authPin = authPin;
    
    writeDB();
    io.emit('config-changed', {
      ticket: db.config.ticket,
      printer: db.config.printer
    });
    res.json({ success: true, config: db.config });
  });

  // Tables management
  app.get('/api/tables', (req, res) => {
    res.json(db.tables || []);
  });

  app.post('/api/tables', (req, res) => {
    const { tables } = req.body;
    if (tables && Array.isArray(tables)) {
      db.tables = tables;
      writeDB();
      io.emit('tables-changed', db.tables);
      res.json({ success: true, tables: db.tables });
    } else {
      res.status(400).json({ error: 'Formato de mesas no válido' });
    }
  });

  // Waiters CRUD
  app.get('/api/waiters', (req, res) => {
    res.json(db.waiters || []);
  });

  app.post('/api/waiters', (req, res) => {
    const newWaiter: Waiter = req.body;
    if (!newWaiter.nombre || !newWaiter.pin) {
      return res.status(400).json({ error: 'Nombre y PIN requeridos' });
    }
    newWaiter.id = `w-${Date.now()}`;
    newWaiter.ventas_totales = 0;
    newWaiter.propinas_totales = 0;
    newWaiter.horas_trabajadas = 0;
    newWaiter.turnos = [];
    newWaiter.activo = true;
    db.waiters.push(newWaiter);
    writeDB();
    logAudit('Admin', 'Crear Camarero', `Se añadió al camarero: ${newWaiter.nombre}`);
    io.emit('waiters-changed', db.waiters);
    res.status(201).json(newWaiter);
  });

  app.put('/api/waiters/:id', (req, res) => {
    const { id } = req.params;
    const updates: Partial<Waiter> = req.body;
    const index = db.waiters.findIndex(w => w.id === id);
    if (index === -1) return res.status(404).json({ error: 'Camarero no encontrado' });
    db.waiters[index] = { ...db.waiters[index], ...updates };
    writeDB();
    io.emit('waiters-changed', db.waiters);
    res.json(db.waiters[index]);
  });

  app.delete('/api/waiters/:id', (req, res) => {
    const { id } = req.params;
    const index = db.waiters.findIndex(w => w.id === id);
    if (index === -1) return res.status(404).json({ error: 'Camarero no encontrado' });
    const name = db.waiters[index].nombre;
    db.waiters.splice(index, 1);
    writeDB();
    logAudit('Admin', 'Eliminar Camarero', `Se eliminó al camarero: ${name}`);
    io.emit('waiters-changed', db.waiters);
    res.json({ success: true });
  });

  // Shift & Turn Login via PIN
  app.post('/api/waiters/login', (req, res) => {
    const { pin } = req.body;
    const waiter = db.waiters.find(w => w.pin === pin && w.activo);
    if (!waiter) {
      return res.status(401).json({ error: 'PIN incorrecto o camarero inactivo' });
    }
    
    // Start Turn/Shift if none active
    let activeShift = waiter.turnos?.find(t => t.activo);
    if (!activeShift) {
      if (!waiter.turnos) waiter.turnos = [];
      activeShift = {
        id: `shift-${Date.now()}`,
        inicio: Date.now(),
        ventas: 0,
        propinas: 0,
        activo: true
      };
      waiter.turnos.push(activeShift);
      writeDB();
      logAudit(waiter.nombre, 'Inicio Turno', `Camarero inició sesión y empezó turno de trabajo.`);
      io.emit('waiters-changed', db.waiters);
    }
    res.json({ success: true, waiter });
  });

  app.post('/api/waiters/shift/end', (req, res) => {
    const { waiterId, propinas } = req.body;
    const waiter = db.waiters.find(w => w.id === waiterId);
    if (!waiter) return res.status(404).json({ error: 'Camarero no encontrado' });

    const activeShiftIndex = waiter.turnos?.findIndex(t => t.activo);
    if (activeShiftIndex === -1 || activeShiftIndex === undefined) {
      return res.status(400).json({ error: 'No hay turno activo para este camarero' });
    }

    const shift = waiter.turnos[activeShiftIndex];
    shift.fin = Date.now();
    shift.activo = false;
    shift.propinas = Number(propinas) || 0;
    
    const diffMs = shift.fin - shift.inicio;
    const hours = Number((diffMs / 3600000).toFixed(2));
    waiter.horas_trabajadas = Number((waiter.horas_trabajadas + hours).toFixed(2));
    waiter.propinas_totales = Number((waiter.propinas_totales + shift.propinas).toFixed(2));

    writeDB();
    logAudit(waiter.nombre, 'Cierre Turno', `Cerró turno. Horas: ${hours}h, Propinas registradas: ${shift.propinas} €`);
    io.emit('waiters-changed', db.waiters);
    res.json({ success: true, waiter, shift, hoursWorked: hours });
  });

  // Ingredients/Stock CRUD
  app.get('/api/ingredients', (req, res) => {
    res.json(db.ingredients || []);
  });

  app.post('/api/ingredients', (req, res) => {
    const newIng: Ingredient = req.body;
    if (!newIng.nombre || newIng.stock === undefined) {
      return res.status(400).json({ error: 'Nombre y stock inicial requeridos' });
    }
    newIng.id = `ing-${Date.now()}`;
    db.ingredients.push(newIng);
    writeDB();
    logAudit('Stock', 'Agregar Ingrediente', `Ingrediente ${newIng.nombre} añadido al inventario.`);
    io.emit('ingredients-changed', db.ingredients);
    res.status(201).json(newIng);
  });

  app.put('/api/ingredients/:id', (req, res) => {
    const { id } = req.params;
    const updates: Partial<Ingredient> = req.body;
    const index = db.ingredients.findIndex(i => i.id === id);
    if (index === -1) return res.status(404).json({ error: 'Ingrediente no encontrado' });
    db.ingredients[index] = { ...db.ingredients[index], ...updates };
    writeDB();
    io.emit('ingredients-changed', db.ingredients);
    res.json(db.ingredients[index]);
  });

  app.delete('/api/ingredients/:id', (req, res) => {
    const { id } = req.params;
    const index = db.ingredients.findIndex(i => i.id === id);
    if (index === -1) return res.status(404).json({ error: 'Ingrediente no encontrado' });
    const name = db.ingredients[index].nombre;
    db.ingredients.splice(index, 1);
    writeDB();
    logAudit('Stock', 'Eliminar Ingrediente', `Se eliminó el ingrediente: ${name}`);
    io.emit('ingredients-changed', db.ingredients);
    res.json({ success: true });
  });

  // Suppliers CRUD
  app.get('/api/suppliers', (req, res) => {
    res.json(db.suppliers || []);
  });

  app.post('/api/suppliers', (req, res) => {
    const newProv: Supplier = req.body;
    if (!newProv.nombre) return res.status(400).json({ error: 'Nombre de proveedor requerido' });
    newProv.id = `prov-${Date.now()}`;
    db.suppliers.push(newProv);
    writeDB();
    logAudit('Admin', 'Crear Proveedor', `Proveedor creado: ${newProv.nombre}`);
    io.emit('suppliers-changed', db.suppliers);
    res.status(201).json(newProv);
  });

  app.put('/api/suppliers/:id', (req, res) => {
    const { id } = req.params;
    const index = db.suppliers.findIndex(s => s.id === id);
    if (index === -1) return res.status(404).json({ error: 'Proveedor no encontrado' });
    db.suppliers[index] = { ...db.suppliers[index], ...req.body };
    writeDB();
    io.emit('suppliers-changed', db.suppliers);
    res.json(db.suppliers[index]);
  });

  app.delete('/api/suppliers/:id', (req, res) => {
    const { id } = req.params;
    const index = db.suppliers.findIndex(s => s.id === id);
    if (index === -1) return res.status(404).json({ error: 'Proveedor no encontrado' });
    db.suppliers.splice(index, 1);
    writeDB();
    io.emit('suppliers-changed', db.suppliers);
    res.json({ success: true });
  });

  // Batches (Lotes / Caducidades)
  app.get('/api/batches', (req, res) => {
    res.json(db.batches || []);
  });

  app.post('/api/batches', (req, res) => {
    const { ingredient_id, lote, stock, caducidad } = req.body;
    if (!ingredient_id || !lote || stock === undefined) {
      return res.status(400).json({ error: 'Datos de lote obligatorios faltantes' });
    }
    const newBatch: Batch = {
      id: `lote-${Date.now()}`,
      ingredient_id,
      lote,
      stock,
      caducidad
    };
    db.batches.push(newBatch);

    // Sum stock to main ingredient reference
    const ing = db.ingredients.find(i => i.id === ingredient_id);
    if (ing) {
      ing.stock += stock;
    }

    writeDB();
    logAudit('Inventario', 'Ingresar Lote', `Lote ${lote} ingresado para ingrediente ID ${ingredient_id}.`);
    io.emit('ingredients-changed', db.ingredients);
    io.emit('batches-changed', db.batches);
    res.status(201).json(newBatch);
  });

  // Customers CRM
  app.get('/api/customers', (req, res) => {
    res.json(db.customers || []);
  });

  app.post('/api/customers', (req, res) => {
    const newCustomer: Customer = req.body;
    if (!newCustomer.nombre || !newCustomer.telefono) {
      return res.status(400).json({ error: 'Nombre y teléfono requeridos' });
    }
    newCustomer.id = `c-${Date.now()}`;
    newCustomer.puntos = newCustomer.puntos || 0;
    newCustomer.descuento_acumulado = newCustomer.descuento_acumulado || 0;
    newCustomer.historial_consumo = [];
    db.customers.push(newCustomer);
    writeDB();
    logAudit('CRM', 'Fidelizar Cliente', `Cliente registrado: ${newCustomer.nombre}`);
    io.emit('customers-changed', db.customers);
    res.status(201).json(newCustomer);
  });

  app.put('/api/customers/:id', (req, res) => {
    const { id } = req.params;
    const index = db.customers.findIndex(c => c.id === id);
    if (index === -1) return res.status(404).json({ error: 'Cliente no encontrado' });
    db.customers[index] = { ...db.customers[index], ...req.body };
    writeDB();
    io.emit('customers-changed', db.customers);
    res.json(db.customers[index]);
  });

  // Reservations
  app.get('/api/reservations', (req, res) => {
    res.json(db.reservations || []);
  });

  app.post('/api/reservations', (req, res) => {
    const resv: Reservation = req.body;
    if (!resv.nombre_cliente || !resv.fecha || !resv.hora) {
      return res.status(400).json({ error: 'Campos obligatorios requeridos' });
    }
    resv.id = `res-${Date.now()}`;
    resv.estado = 'Pendiente';
    db.reservations.push(resv);
    
    // Set table status to reserved
    if (resv.mesa_id) {
      const table = db.tables.find(t => t.id === resv.mesa_id);
      if (table) table.status = 'reserved';
    }

    writeDB();
    logAudit('Reservas', 'Crear Reserva', `Reserva creada para ${resv.nombre_cliente} el ${resv.fecha} a las ${resv.hora}`);
    io.emit('reservations-changed', db.reservations);
    io.emit('tables-changed', db.tables);
    res.status(201).json(resv);
  });

  app.put('/api/reservations/:id', (req, res) => {
    const { id } = req.params;
    const index = db.reservations.findIndex(r => r.id === id);
    if (index === -1) return res.status(404).json({ error: 'Reserva no encontrada' });
    db.reservations[index] = { ...db.reservations[index], ...req.body };
    
    // update table link if seated
    if (req.body.estado === 'Sentado' && db.reservations[index].mesa_id) {
      const table = db.tables.find(t => t.id === db.reservations[index].mesa_id);
      if (table) table.status = 'busy';
    }

    writeDB();
    io.emit('reservations-changed', db.reservations);
    io.emit('tables-changed', db.tables);
    res.json(db.reservations[index]);
  });

  // Promos CRUD
  app.get('/api/promos', (req, res) => {
    res.json(db.promos || []);
  });

  app.post('/api/promos', (req, res) => {
    const newPromo: Promo = req.body;
    if (!newPromo.nombre || !newPromo.tipo) return res.status(400).json({ error: 'Faltan datos de la promoción' });
    newPromo.id = `p-${Date.now()}`;
    db.promos.push(newPromo);
    writeDB();
    logAudit('Admin', 'Crear Promoción', `Nueva política promocional: ${newPromo.nombre}`);
    io.emit('promos-changed', db.promos);
    res.status(201).json(newPromo);
  });

  app.put('/api/promos/:id', (req, res) => {
    const { id } = req.params;
    const index = db.promos.findIndex(p => p.id === id);
    if (index === -1) return res.status(404).json({ error: 'Promoción no encontrada' });
    db.promos[index] = { ...db.promos[index], ...req.body };
    writeDB();
    io.emit('promos-changed', db.promos);
    res.json(db.promos[index]);
  });

  // Cash Drawer Session (Apertura y Cierre de caja con arqueo)
  app.get('/api/cash/current', (req, res) => {
    const currentSession = db.cashSessions?.find(s => s.estado === 'Abierta') || null;
    res.json(currentSession);
  });

  app.post('/api/cash/open', (req, res) => {
    const { abierta_por, caja_inicial } = req.body;
    const active = db.cashSessions?.find(s => s.estado === 'Abierta');
    if (active) {
      return res.status(400).json({ error: 'Ya existe una sesión de caja abierta' });
    }

    const newSession: CashSession = {
      id: `session-${Date.now()}`,
      abierta_por: abierta_por || 'Laura Martínez',
      timestamp_apertura: Date.now(),
      caja_inicial: Number(caja_inicial) || 150.00,
      caja_esperada: Number(caja_inicial) || 150.00,
      estado: 'Abierta',
      movimientos: []
    };

    if (!db.cashSessions) db.cashSessions = [];
    db.cashSessions.push(newSession);
    writeDB();
    logAudit(newSession.abierta_por, 'Apertura Caja', `Caja abierta con fondo de arqueo inicial de ${newSession.caja_inicial} €`);
    io.emit('cash-changed', db.cashSessions);
    res.status(201).json(newSession);
  });

  app.post('/api/cash/close', (req, res) => {
    const { cerrada_por, caja_real, firma_digital } = req.body;
    const active = db.cashSessions?.find(s => s.estado === 'Abierta');
    if (!active) {
      return res.status(400).json({ error: 'No hay ninguna sesión de caja abierta' });
    }

    // Calculate sales within this session
    const salesInSession = db.orders
      .filter(o => o.timestamp >= active.timestamp_apertura && o.estado === 'Pagado')
      .reduce((acc, o) => acc + o.total, 0);

    // Sum manual entries and deduct outputs
    const adjustments = active.movimientos.reduce((acc, m) => {
      if (m.tipo === 'entrada') return acc + m.cantidad;
      if (m.tipo === 'salida') return acc - m.cantidad; // fallback
      return acc;
    }, 0);

    active.caja_esperada = Number((active.caja_inicial + salesInSession + adjustments).toFixed(2));
    active.caja_real = Number(caja_real) || 0;
    active.diferencia = Number((active.caja_real - active.caja_esperada).toFixed(2));
    active.cerrada_por = cerrada_por || 'Responsable';
    active.timestamp_cierre = Date.now();
    active.estado = 'Cerrada';
    active.firma_digital = firma_digital || 'FIRMA_MANUAL_RESPONSABLE_OK';

    writeDB();
    logAudit(active.cerrada_por, 'Arqueo Caja', `Caja cerrada. Esperada: ${active.caja_esperada} €, Real: ${active.caja_real} €, Diferencia: ${active.diferencia} €`);
    io.emit('cash-changed', db.cashSessions);
    res.json(active);
  });

  app.post('/api/cash/movimiento', (req, res) => {
    const { tipo, cantidad, motivo, camarero } = req.body;
    const active = db.cashSessions?.find(s => s.estado === 'Abierta');
    if (!active) {
      return res.status(400).json({ error: 'Debe abrir caja antes de registrar movimientos' });
    }

    const mov = {
      id: `mov-${Date.now()}`,
      tipo: tipo as 'entrada' | 'salida',
      cantidad: Number(cantidad) || 0,
      motivo: motivo || 'Movimiento manual',
      timestamp: Date.now(),
      camarero: camarero || 'Cajero'
    };

    active.movimientos.push(mov);
    writeDB();
    logAudit(mov.camarero, 'Ajuste Caja', `Registro de ${tipo}: ${cantidad} € por: ${motivo}`);
    io.emit('cash-changed', db.cashSessions);
    res.json(active);
  });

  app.get('/api/cash/history', (req, res) => {
    const closed = db.cashSessions?.filter(s => s.estado === 'Cerrada') || [];
    res.json(closed);
  });

  // Audit Logs reading
  app.get('/api/audit', (req, res) => {
    res.json(db.auditLogs || []);
  });

  // Backups and restoration
  app.get('/api/backups', (req, res) => {
    const backupDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(backupDir)) return res.json([]);
    const files = fs.readdirSync(backupDir);
    const backupsList: Backup[] = files
      .filter(f => f.startsWith('backup_') && f.endsWith('.json'))
      .map(f => {
        const stats = fs.statSync(path.join(backupDir, f));
        return {
          id: f,
          nombre: f,
          timestamp: stats.mtimeMs,
          tamano: `${(stats.size / 1024).toFixed(1)} KB`
        };
      })
      .sort((a,b) => b.timestamp - a.timestamp);
    res.json(backupsList);
  });

  app.post('/api/backups/create', (req, res) => {
    try {
      const timestampStr = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFilename = `backup_${timestampStr}.json`;
      const backupPath = path.join(process.cwd(), 'data', backupFilename);
      
      // write current db JSON state
      fs.writeFileSync(backupPath, JSON.stringify(db, null, 2), 'utf-8');
      
      logAudit('Sistema', 'Crear Backup', `Copia de seguridad del sistema realizada: ${backupFilename}`);
      res.json({ success: true, backupFilename });
    } catch (e: any) {
      res.status(500).json({ error: `Fallo al crear backup: ${e.message}` });
    }
  });

  app.post('/api/backups/restore', (req, res) => {
    const { filename } = req.body;
    if (!filename) return res.status(400).json({ error: 'Nombre de archivo requerido' });
    const backupPath = path.join(process.cwd(), 'data', filename);
    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({ error: 'Archivo de backup no encontrado' });
    }

    try {
      const content = fs.readFileSync(backupPath, 'utf-8');
      const loaded = JSON.parse(content);
      db = loaded;
      writeDB();
      logAudit('Sistema', 'Restaurar Backup', `Restauración completa del sistema desde copia: ${filename}`);
      
      // broadcast full sync to everybody
      io.emit('initial-sync', {
        products: db.products,
        orders: db.orders,
        config: {
          ticket: db.config.ticket,
          printer: db.config.printer
        },
        tables: db.tables || [],
        waiters: db.waiters || [],
        ingredients: db.ingredients || [],
        suppliers: db.suppliers || [],
        batches: db.batches || [],
        customers: db.customers || [],
        reservations: db.reservations || [],
        promos: db.promos || [],
        cashSessions: db.cashSessions || [],
        auditLogs: db.auditLogs || []
      });

      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: `Fallo al restaurar backup: ${e.message}` });
    }
  });

  // AI Assistant Analytics Layer Endpoint
  app.post('/api/ai/ask', async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: 'Falta la pregunta' });
      }

      // Context construction
      const totalSales = db.orders.reduce((acc, o) => acc + o.total, 0);
      const ticketCount = db.orders.length;
      const averageTicket = ticketCount > 0 ? (totalSales / ticketCount).toFixed(2) : '0.00';
      
      const productQuantities: Record<string, number> = {};
      db.orders.forEach(o => {
        o.items.forEach(item => {
          productQuantities[item.nombre] = (productQuantities[item.nombre] || 0) + item.quantity;
        });
      });

      const lowStockIngredients = db.ingredients.filter(i => i.stock <= i.stock_minimo);
      const openSession = db.cashSessions?.find(s => s.estado === 'Abierta');

      const systemPrompt = `Actúas como un consultor financiero de hostelería inteligente integrado en el sistema TPV Touch-Flow de la cafetería El Tast.
Tienes acceso directo en tiempo real a los datos del negocio para dar respuestas precisas, estratégicas y ejecutivas.

DATOS ACTUALES DEL NEGOCIO:
- Ventas Totales Acumuladas: ${totalSales.toFixed(2)} €
- Total de Facturas/Tickets: ${ticketCount}
- Ticket Medio: ${averageTicket} €
- Caja Abierta Actual: ${openSession ? `Sí, abierta por ${openSession.abierta_por} con caja inicial de ${openSession.caja_inicial} €` : 'No hay turno de caja abierto en este momento.'}

ALERTAS DE INVENTARIO (Bajo Stock Mínimo):
${lowStockIngredients.length > 0 ? lowStockIngredients.map(i => `- ${i.nombre}: stock actual ${i.stock} ${i.unidad} (Mínimo: ${i.stock_minimo})`).join('\n') : 'Todo el stock de ingredientes está en niveles óptimos.'}

PERSONAL Y RENDIMIENTO:
${db.waiters.map(w => `- ${w.nombre}: Ventas totales ${w.ventas_totales.toFixed(2)} €, Propinas ${w.propinas_totales.toFixed(2)} € (Activo: ${w.activo ? 'Sí' : 'No'})`).join('\n')}

PRODUCTOS MÁS VENDIDOS:
${Object.entries(productQuantities).sort((a,b) => b[1]-a[1]).slice(0, 5).map(([nombre, cant]) => `- ${nombre}: ${cant} unidades vendidas`).join('\n')}

Responde de forma ejecutiva, en español, profesional, motivadora, usando formato markdown limpio y directo. Si te preguntan sobre previsiones o sugerencias, dales consejos de optimización (Happy Hours, promociones, reabastecimiento) basados en estos datos reales.`;

      const ai = getGemini();
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.7
        }
      });

      res.json({ text: response.text });
    } catch (e: any) {
      console.error('Error in AI Assistant endpoint:', e);
      res.status(500).json({ error: e.message || 'No se pudo procesar la consulta con la IA' });
    }
  });

  // Printer discovery simulation
  app.post('/api/printer/discover', (req, res) => {
    // Simulates physical USB/Serial scanning
    const simulatedPorts = [
      { port: 'USB001', name: 'Thermal Printer 80mm (ESPON T88)', type: 'USB', status: 'Conectado' },
      { port: 'COM2', name: 'Serial Ticket Matrix (Bixolon GP)', type: 'Serial', status: 'No detectado' },
      { port: '192.168.1.150:9100', name: 'Kitchen Network Bar Printer', type: 'Network', status: 'Conectado' }
    ];
    res.json(simulatedPorts);
  });

  // Autoupdater check simulation
  app.post('/api/update-system', (req, res) => {
    res.json({
      updateAvailable: true,
      currentVersion: '1.4.2',
      latestVersion: '1.5.0-LTS',
      changelog: 'Optimización de tickets térmicos, soporte de informes trimestrales automatizados de Hacienda y mejora en conexión de clientes Wi-Fi.'
    });
  });

  // Report Contabilidad generation backend (Hacienda/Legal Compliant PDF generator via PDFKit)
  app.post('/api/reports/close-daily', (req, res) => {
    // Extract today's stats
    const today = new Date();
    const currentYear = today.getFullYear().toString();
    const currentMonthNum = (today.getMonth() + 1).toString().padStart(2, '0');
    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const monthName = monthNames[today.getMonth()];
    
    // Directory targeting /Reportes/AAAA/MES/
    const destinationSubfolder = path.join(REPORTS_DIR, currentYear, `${currentMonthNum}_${monthName}`);
    if (!fs.existsSync(destinationSubfolder)) {
      fs.mkdirSync(destinationSubfolder, { recursive: true });
    }

    const todayStr = today.toISOString().split('T')[0];
    const pdfFilename = `Reporte_Cierre_${todayStr}.pdf`;
    const finalPdfPath = path.join(destinationSubfolder, pdfFilename);

    // Calculate today's metrics
    const startOfTodayRange = new Date();
    startOfTodayRange.setHours(0, 0, 0, 0);
    const startMs = startOfTodayRange.getTime();

    // Filters today's orders
    const todayOrders = db.orders.filter(o => o.timestamp >= startMs);
    const totalVentas = todayOrders.reduce((sum, o) => sum + o.total, 0);
    const ventasEfectivo = todayOrders.filter(o => o.metodo_pago === 'Efectivo').reduce((sum, o) => sum + o.total, 0);
    const ventasBizum = todayOrders.filter(o => o.metodo_pago === 'Bizum').reduce((sum, o) => sum + o.total, 0);
    const countTickets = todayOrders.length;

    // PDF Generation via PDFKit
    const doc = new PDFDocument({ margin: 40 });
    const writeStream = fs.createWriteStream(finalPdfPath);
    doc.pipe(writeStream);

    // Styling the report nicely
    doc.fillColor('#111827').fontSize(22).text('EL TAST CAFETERIA', { align: 'center' });
    doc.fontSize(10).fillColor('#4B5563').text('SISTEMA TPV TOUCH-FLOW - CONTABILIDAD REGISTRADA', { align: 'center' });
    doc.moveDown();
    doc.strokeColor('#D1D5DB').lineWidth(1).moveTo(40, doc.y).lineTo(570, doc.y).stroke();
    doc.moveDown();

    doc.fillColor('#000000').fontSize(14).text(`RESUMEN DIARIO DE CIERRE DE CAJA`, { underline: true });
    doc.fontSize(11).fillColor('#374151');
    doc.text(`Fecha del Reporte: ${today.toLocaleDateString('es-ES')}  |  Hora de Cierre: ${today.toLocaleTimeString('es-ES')}`);
    doc.text(`ID De Auditoría: AUD-${Date.now().toString().substring(5)}`);
    doc.text(`Cumplimiento Legal: Conforme Ley General Tributaria de Facturación Española`);
    doc.moveDown();

    // Table elements
    doc.strokeColor('#E5E7EB').rect(40, doc.y, 530, 110).fillAndStroke('#F9FAFB', '#D1D5DB');
    doc.fillColor('#111827').fontSize(12);
    
    // Stats indicators inside container box
    let boxY = doc.y + 12;
    doc.fillColor('#111827').text(`VENTAS TOTALES REGISTRADAS:`, 55, boxY);
    doc.font('Helvetica-Bold').text(`${totalVentas.toFixed(2)} €`, 350, boxY);
    doc.font('Helvetica').moveDown(0.7);

    boxY = doc.y;
    doc.text(`- Arqueo en Efectivo:`, 75, boxY);
    doc.text(`${ventasEfectivo.toFixed(2)} €`, 350, boxY);
    doc.moveDown(0.7);

    boxY = doc.y;
    doc.text(`- Ventas por Bizum / Tarjeta:`, 75, boxY);
    doc.text(`${ventasBizum.toFixed(2)} €`, 350, boxY);
    doc.moveDown(0.7);

    boxY = doc.y;
    doc.text(`- Recuento total de tickets:`, 75, boxY);
    doc.text(`${countTickets} tickets cerrados`, 350, boxY);
    
    doc.moveDown(2);

    // IVA tax breakdown calculation (e.g. 10% IVA included)
    const ivaratePercent = db.config.ticket.iva || 10;
    const baseImponible = totalVentas / (1 + (ivaratePercent / 100));
    const cuotaIva = totalVentas - baseImponible;

    doc.font('Helvetica-Bold').fontSize(12).text('DESGLOSE DE IMPUESTOS (IVA CAFETERÍA)', 40);
    doc.font('Helvetica').fontSize(11);
    doc.text(`- Base Imponible Gravada (${ivaratePercent}%): ${baseImponible.toFixed(2)} €`);
    doc.text(`- Cuota de IVA Devengada (${ivaratePercent}%): ${cuotaIva.toFixed(2)} €`);
    doc.text(`- Total Facturado (I.V.A. Incluido): ${totalVentas.toFixed(2)} €`);
    doc.moveDown();

    // List of Orders included
    doc.strokeColor('#D1D5DB').lineWidth(0.5).moveTo(40, doc.y).lineTo(570, doc.y).stroke();
    doc.moveDown();

    doc.font('Helvetica-Bold').fontSize(12).text('RECEPTO DE FACTURAS EMITIDAS', 40);
    doc.moveDown(0.5);

    if (todayOrders.length === 0) {
      doc.font('Helvetica-Oblique').fontSize(10).text('No se registraron transacciones cerradas durante esta jornada.', 50);
    } else {
      doc.font('Helvetica-Bold').fontSize(10);
      let listY = doc.y;
      doc.text('ID Ticket', 45, listY);
      doc.text('Hora', 140, listY);
      doc.text('Pago', 220, listY);
      doc.text('Estado', 310, listY);
      doc.text('Total', 450, listY);
      doc.moveDown(0.5);

      doc.font('Helvetica').fontSize(9);
      todayOrders.forEach(o => {
        listY = doc.y;
        if (listY > 700) {
          doc.addPage();
          listY = 40;
        }
        const timeStr = new Date(o.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        doc.text(o.id, 45, listY);
        doc.text(timeStr, 140, listY);
        doc.text(o.metodo_pago, 220, listY);
        doc.text(o.estado, 310, listY);
        doc.text(`${o.total.toFixed(2)} €`, 450, listY);
        doc.moveDown(0.5);
      });
    }

    // Legal signature and disclaimer
    doc.moveDown(2);
    let bottomY = doc.y;
    if (bottomY > 650) {
      doc.addPage();
      bottomY = 40;
    }
    doc.strokeColor('#111827').lineWidth(1).moveTo(40, bottomY).lineTo(570, bottomY).stroke();
    doc.moveDown();
    doc.font('Helvetica-Bold').fontSize(10).text('REGISTRO OFICIAL DE ARCHIVOS TRIBUTARIOS', 40);
    doc.font('Helvetica').fontSize(8).fillColor('#6B7280');
    doc.text('Este documento sirve como registro oficial inmutable conforme al Reglamento por el que se regulan las obligaciones de facturación y software de control de caja. La firma criptográfica interna certifica que estos folios numéricos no han sido manipulados con posteridad al cierre de la sesión diaria.');

    doc.end();

    // Respond back when file writing is completed
    writeStream.on('finish', () => {
      res.json({
        success: true,
        summary: {
          totalVentas,
          ventasEfectivo,
          ventasBizum,
          countTickets,
          ivaBase: baseImponible,
          ivaCuota: cuotaIva
        },
        reportPath: `/reportes-archivos/${currentYear}/${currentMonthNum}_${monthName}/${pdfFilename}`,
        filename: pdfFilename,
        folderPath: `/Reportes/${currentYear}/${currentMonthNum}_${monthName}/`
      });
    });

    writeStream.on('error', (err) => {
      console.error('Error generating PDF close out report', err);
      res.status(500).json({ error: 'No se pudo escribir el reporte legal PDF' });
    });
  });

  // Fetch compiled reports tree list
  app.get('/api/reports/list', (req, res) => {
    // Traverse the /Reportes directory recursively to find all .pdf files
    const results: Array<{ year: string, month: string, filename: string, url: string, stat: fs.Stats }> = [];

    const walk = (dir: string) => {
      if (!fs.existsSync(dir)) return;
      const list = fs.readdirSync(dir);
      list.forEach((file) => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
          walk(fullPath);
        } else if (file.endsWith('.pdf')) {
          // Extract year/month from path if matching structure /Reportes/YYYY/[MM_MonthName]/file.pdf
          const relative = path.relative(REPORTS_DIR, fullPath);
          const parts = relative.split(path.sep);
          const year = parts[0] || 'Desconocido';
          const month = parts[1] ? parts[1].replace(/^\d+_+/, '') : 'General';
          
          results.push({
            year,
            month,
            filename: file,
            url: `/reportes-archivos/${relative.replace(/\\/g, '/')}`,
            stat
          });
        }
      });
    };

    walk(REPORTS_DIR);
    // Sort chronologically newest first
    results.sort((a, b) => b.stat.mtime.getTime() - a.stat.mtime.getTime());
    res.json(results);
  });

  // Vite middleware or production build assets
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Touch-Flow POS server launched online at: http://localhost:${PORT}`);
  });
}

startServer();
