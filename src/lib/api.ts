/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { io, Socket } from 'socket.io-client';
import { Product, Order, AppConfig, TicketConfig, PrinterConfig, Table } from '../types';

// Connect to the backend server socket (with robust transport fallbacks)
export const socket: Socket = io({
  transports: ['polling', 'websocket'],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
});

export async function fetchProducts(): Promise<Product[]> {
  const res = await fetch('/api/products');
  if (!res.ok) throw new Error('Error al obtener productos');
  return res.json();
}

export async function saveProduct(product: Partial<Product> & { id?: string }): Promise<Product> {
  const url = product.id ? `/api/products/${product.id}` : '/api/products';
  const method = product.id ? 'PUT' : 'POST';
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product)
  });
  if (!res.ok) throw new Error('Error al guardar el producto');
  return res.json();
}

export async function deleteProduct(id: string): Promise<boolean> {
  const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Error al eliminar el producto');
  return true;
}

export async function fetchOrders(): Promise<Order[]> {
  const res = await fetch('/api/orders');
  if (!res.ok) throw new Error('Error al obtener pedidos');
  return res.json();
}

export async function createOrder(order: { 
  items: Array<{ productId: string; nombre: string; precio: number; quantity: number; options?: string }>;
  metodo_pago: 'Efectivo' | 'Bizum';
  camarero_id: string;
}): Promise<Order> {
  const res = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order)
  });
  if (!res.ok) {
    const errData = await res.json();
    throw new Error(errData.error || 'Error al crear el pedido');
  }
  return res.json();
}

export async function updateOrderStatus(orderId: string, estado: 'Pendiente' | 'Preparado' | 'Pagado'): Promise<Order> {
  const res = await fetch(`/api/orders/${orderId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ estado })
  });
  if (!res.ok) throw new Error('Error al actualizar el estado del pedido');
  return res.json();
}

export async function fetchConfig(): Promise<{ ticket: TicketConfig; printer: PrinterConfig }> {
  const res = await fetch('/api/config');
  if (!res.ok) throw new Error('Error al cargar la configuración');
  return res.json();
}

export async function saveConfig(updates: { ticket?: Partial<TicketConfig>; printer?: Partial<PrinterConfig>; authPin?: string }): Promise<boolean> {
  const res = await fetch('/api/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  if (!res.ok) throw new Error('Error al guardar la configuración');
  return true;
}

export async function verifyPin(pin: string): Promise<{ success: boolean; token?: string; message?: string }> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin })
  });
  
  if (res.status === 401 || res.status === 429) {
    const errorData = await res.json();
    return { success: false, message: errorData.message };
  }
  if (!res.ok) throw new Error('Error del servidor de seguridad');
  return res.json();
}

export async function scanPorts(): Promise<any[]> {
  const res = await fetch('/api/printer/discover', { method: 'POST' });
  if (!res.ok) throw new Error('Error al escanear los puertos');
  return res.json();
}

export async function checkSystemUpdate(): Promise<any> {
  const res = await fetch('/api/update-system', { method: 'POST' });
  if (!res.ok) throw new Error('Error consultando el servidor de actualizaciones');
  return res.json();
}

export async function triggerDailyClose(): Promise<{
  success: boolean;
  summary: any;
  reportPath: string;
  filename: string;
  folderPath: string;
}> {
  const res = await fetch('/api/reports/close-daily', { method: 'POST' });
  if (!res.ok) throw new Error('Error al realizar el cierre de caja diario');
  return res.json();
}

export async function fetchReportsList(): Promise<Array<{
  year: string;
  month: string;
  filename: string;
  url: string;
  stat: any;
}>> {
  const res = await fetch('/api/reports/list');
  if (!res.ok) throw new Error('Error al obtener la lista de reportes contables');
  return res.json();
}

export async function fetchTables(): Promise<Table[]> {
  const res = await fetch('/api/tables');
  if (!res.ok) throw new Error('Error al obtener la disposición de las mesas');
  return res.json();
}

export async function saveTables(tables: Table[]): Promise<boolean> {
  const res = await fetch('/api/tables', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tables })
  });
  if (!res.ok) throw new Error('Error al guardar la disposición de las mesas');
  return true;
}
