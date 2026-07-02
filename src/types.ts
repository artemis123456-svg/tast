/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ProductCategory = 
  | 'Entrepans Freds' 
  | 'Entrepans Calents' 
  | 'Torrades' 
  | 'Pastes' 
  | 'Begudes';

export interface Product {
  id: string;
  nombre: string;
  categoria: ProductCategory;
  precio: number;
  stock: number;
  imagen_url: string;
  activo: boolean;
  alergenos?: string[];
}

export interface OrderItem {
  id: string;     // Unique identifier for the item in the cart or order
  productId: string;
  nombre: string;
  precio: number;
  quantity: number;
  options?: string;
}

export type OrderStatus = 'Pendiente' | 'Preparado' | 'Pagado';

export interface Order {
  id: string;
  camarero_id: string;
  items: OrderItem[];
  total: number;
  metodo_pago: 'Efectivo' | 'Bizum';
  estado: OrderStatus;
  timestamp: number; // ms since epoch
}

export interface TicketConfig {
  header: string;
  direccion: string;
  telefono: string;
  cif: string;
  pie_pagina: string;
  iva: number; // Percent, e.g. 10 for 10%
}

export interface PrinterConfig {
  port: string;
  name: string;
  type: 'USB' | 'Serial' | 'Network' | 'Simulado';
  status: 'Conectado' | 'No detectado';
}

export interface AppConfig {
  ticket: TicketConfig;
  printer: PrinterConfig;
  authPin: string; // 4-digit PIN, default '1234'
}

export interface DashboardStats {
  totalVentas: number;
  ventasEfectivo: number;
  ventasBizum: number;
  totalTickets: number;
  ventasPorCategoria: Record<string, number>;
  productosMasVendidos: Array<{ nombre: string; cantidad: number; total: number }>;
}

export interface Table {
  id: string;
  number: string;
  zona: 'Interior' | 'Exterior';
  x: number; // percentage relative 0 to 100
  y: number; // percentage relative 0 to 100
  status?: 'free' | 'busy' | 'reserved';
  mergedWith?: string; // id of another table it is merged with
  capacity?: number;
  shape?: 'circle' | 'square';
}

export interface Waiter {
  id: string;
  nombre: string;
  pin: string;
  foto_url: string;
  color: string;
  activo: boolean;
  ventas_totales: number;
  propinas_totales: number;
  horas_trabajadas: number;
  turnos: Array<{
    id: string;
    inicio: number;
    fin?: number;
    ventas: number;
    propinas: number;
    activo: boolean;
  }>;
}

export interface Ingredient {
  id: string;
  nombre: string;
  stock: number;
  unidad: 'g' | 'ml' | 'u' | 'kg' | 'l';
  stock_minimo: number;
  proveedor_id?: string;
}

export interface Supplier {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
  direccion: string;
}

export interface Batch {
  id: string;
  ingredient_id: string;
  lote: string;
  stock: number;
  caducidad: string; // YYYY-MM-DD
}

export interface RecipeItem {
  ingredient_id: string;
  cantidad: number; // amount in units (g, ml, u)
}

// Expand Product to support Recipe and promotions
export interface Product {
  id: string;
  nombre: string;
  categoria: ProductCategory;
  precio: number;
  stock: number;
  imagen_url: string;
  activo: boolean;
  alergenos?: string[];
  receta?: RecipeItem[]; // ingredients recipe
  isDrink?: boolean; // helper to filter bar screen
  costo_elaboracion?: number; // calculated for estimated profit
}

export interface Customer {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
  fecha_nacimiento?: string; // YYYY-MM-DD
  puntos: number;
  descuento_acumulado: number;
  historial_consumo: Array<{
    orderId: string;
    total: number;
    timestamp: number;
  }>;
}

export interface Reservation {
  id: string;
  nombre_cliente: string;
  telefono: string;
  fecha: string; // YYYY-MM-DD
  hora: string; // HH:MM
  pax: number;
  mesa_id?: string;
  estado: 'Pendiente' | 'Confirmada' | 'Cancelada' | 'Sentado';
}

export interface Promo {
  id: string;
  nombre: string;
  tipo: '2x1' | 'HappyHour' | 'Descuento' | 'Menu';
  config: {
    categoria?: ProductCategory;
    productoId?: string;
    descuento_pct?: number;
    horas_activas?: string[]; // ['16:00', '18:00']
    dias_activos?: number[]; // [1, 2, 3, 4, 5] (Mon-Fri)
    precio_menu?: number;
  };
  activo: boolean;
}

export interface CashSession {
  id: string;
  abierta_por: string; // waiter name or manager
  cerrada_por?: string;
  timestamp_apertura: number;
  timestamp_cierre?: number;
  caja_inicial: number;
  caja_esperada: number;
  caja_real?: number;
  diferencia?: number;
  estado: 'Abierta' | 'Cerrada';
  firma_digital?: string;
  movimientos: Array<{
    id: string;
    tipo: 'entrada' | 'salida' | 'venta';
    cantidad: number;
    motivo: string;
    timestamp: number;
    camarero: string;
  }>;
}

export interface AuditLog {
  id: string;
  usuario: string;
  accion: string;
  descripcion: string;
  timestamp: number;
}

export interface Backup {
  id: string;
  nombre: string;
  timestamp: number;
  tamano: string;
}

