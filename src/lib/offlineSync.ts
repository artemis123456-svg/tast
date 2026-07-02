/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Order, OrderItem } from '../types';
import { createOrder, socket } from './api';

const OFFLINE_ORDERS_KEY = 'tpv_offline_orders_queue';

export interface OfflineOrder {
  id: string; // Temporary local offline ID
  items: Array<{ productId: string; nombre: string; precio: number; quantity: number; options?: string }>;
  metodo_pago: 'Efectivo' | 'Bizum';
  camarero_id: string;
  mesa_id?: string;
  cliente_id?: string;
  timestamp: number;
  syncAttempts: number;
}

// Get all orders pending synchronization from local storage
export function getOfflineOrders(): OfflineOrder[] {
  try {
    const data = localStorage.getItem(OFFLINE_ORDERS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Error al parsear pedidos offline:', e);
    return [];
  }
}

// Save the offline queue back to local storage
function saveOfflineOrders(orders: OfflineOrder[]) {
  try {
    localStorage.setItem(OFFLINE_ORDERS_KEY, JSON.stringify(orders));
  } catch (e) {
    console.error('Error al guardar cola offline:', e);
  }
}

// Queue an order when network is unreachable
export function queueOfflineOrder(order: {
  items: Array<{ productId: string; nombre: string; precio: number; quantity: number; options?: string }>;
  metodo_pago: 'Efectivo' | 'Bizum';
  camarero_id: string;
  mesa_id?: string;
  cliente_id?: string;
}): OfflineOrder {
  const offlineOrders = getOfflineOrders();
  
  const newOfflineOrder: OfflineOrder = {
    ...order,
    id: `OFFLINE-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: Date.now(),
    syncAttempts: 0
  };

  offlineOrders.push(newOfflineOrder);
  saveOfflineOrders(offlineOrders);
  
  // Dispatch custom event to notify React UI of offline queue change
  window.dispatchEvent(new CustomEvent('offline-queue-changed', { detail: offlineOrders }));
  
  return newOfflineOrder;
}

// Try to synchronize pending offline orders to the server
export async function syncOfflineOrders(): Promise<{ synchronized: number; failed: number }> {
  const queue = getOfflineOrders();
  if (queue.length === 0) return { synchronized: 0, failed: 0 };

  console.log(`[OfflineSync] Iniciando sincronización de ${queue.length} pedidos...`);
  
  const remaining: OfflineOrder[] = [];
  let synchronized = 0;
  let failed = 0;

  for (const offlineOrder of queue) {
    try {
      // Attempt creation on the central backend
      await createOrder({
        items: offlineOrder.items,
        metodo_pago: offlineOrder.metodo_pago,
        camarero_id: offlineOrder.camarero_id
        // Keep additional fields if server accepts them (they are parsed in the body)
      } as any);
      
      synchronized++;
      console.log(`[OfflineSync] Pedido offline ${offlineOrder.id} sincronizado con éxito.`);
    } catch (err) {
      failed++;
      offlineOrder.syncAttempts++;
      // If we failed but it's not due to a network error (e.g. invalid product, negative validation), 
      // we don't block the queue forever, but retry a maximum of 5 times.
      if (offlineOrder.syncAttempts < 5) {
        remaining.push(offlineOrder);
      } else {
        console.warn(`[OfflineSync] Descartando pedido offline ${offlineOrder.id} tras 5 intentos fallidos:`, err);
      }
    }
  }

  saveOfflineOrders(remaining);
  window.dispatchEvent(new CustomEvent('offline-queue-changed', { detail: remaining }));

  return { synchronized, failed };
}

// Set up automatic listeners and triggers
if (typeof window !== 'undefined') {
  // Listen for online status change
  window.addEventListener('online', () => {
    console.log('[OfflineSync] Red restaurada. Lanzando sincronización automática...');
    setTimeout(syncOfflineOrders, 1000);
  });

  // Listen for WebSocket connection restoral as additional trigger
  socket.on('connect', () => {
    console.log('[OfflineSync] Enlace websocket reconectado. Sincronizando comandos locales...');
    setTimeout(syncOfflineOrders, 1500);
  });

  // Periodic fallback check every 15 seconds
  setInterval(() => {
    if (navigator.onLine && socket.connected) {
      syncOfflineOrders();
    }
  }, 15000);
}
