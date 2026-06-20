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
}

