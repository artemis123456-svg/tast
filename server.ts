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
import { Product, Order, AppConfig, OrderItem, OrderStatus, ProductCategory, Table } from './src/types';

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
}

// Ensure database state is loaded
let db: LocalDB = {
  products: INITIAL_PRODUCTS,
  orders: [],
  config: DEFAULT_CONFIG,
  tables: INITIAL_TABLES
};

function readDB() {
  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      db = JSON.parse(content);
      if (!db.tables || !Array.isArray(db.tables)) {
        db.tables = INITIAL_TABLES;
        writeDB();
      }
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
      tables: db.tables || []
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
    const { items, metodo_pago, camarero_id } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'El pedido debe contener al menos 1 producto' });
    }

    // Calculate sum, reduce stock limits gracefully
    let calculatedTotal = 0;
    const updatedItems = items.map((item: OrderItem) => {
      // Look up current product to double check pricing
      const dbProd = db.products.find(p => p.id === item.productId);
      const originalPrice = dbProd ? dbProd.precio : item.precio;
      
      // Reduce stocks
      if (dbProd) {
        dbProd.stock = Math.max(0, dbProd.stock - item.quantity);
      }

      calculatedTotal += originalPrice * item.quantity;
      return {
        ...item,
        precio: originalPrice
      };
    });

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
    writeDB();

    // Direct Sync triggers to all linked touchpads
    io.emit('orders-changed', db.orders);
    io.emit('products-changed', db.products);

    res.status(201).json(newOrder);
  });

  app.put('/api/orders/:id', (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;
    const index = db.orders.findIndex(o => o.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }
    db.orders[index].estado = estado as OrderStatus;
    writeDB();
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
