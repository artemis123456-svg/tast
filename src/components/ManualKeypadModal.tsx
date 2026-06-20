/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Coins, CreditCard, ShoppingBag, Delete } from 'lucide-react';

interface ManualKeypadModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeStaffId: string;
  onAddCustomItemToCart?: (nombre: string, precio: number) => void;
  onDirectCheckout?: (amount: number, paymentMethod: 'Efectivo' | 'Bizum', concept: string) => Promise<void>;
}

export default function ManualKeypadModal({
  isOpen,
  onClose,
  activeStaffId,
  onAddCustomItemToCart,
  onDirectCheckout,
}: ManualKeypadModalProps) {
  const [amount, setAmount] = useState('0');
  const [concept, setConcept] = useState('Consumició Ràpida');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleNumPress = (val: string) => {
    setErrorMsg('');
    setAmount((prev) => {
      if (prev === '0' && val !== '.') {
        return val;
      }
      // Max length check to prevent layout issues
      if (prev.replace('.', '').length >= 6) {
        return prev;
      }
      // Prevent multiple dots
      if (val === '.' && prev.includes('.')) {
        return prev;
      }
      return prev + val;
    });
  };

  const handleBackspace = () => {
    setAmount((prev) => {
      if (prev.length <= 1) return '0';
      return prev.slice(0, -1);
    });
  };

  const handleClear = () => {
    setAmount('0');
  };

  const parsedAmount = parseFloat(amount) || 0;

  const handleDirectCharge = async (method: 'Efectivo' | 'Bizum') => {
    if (parsedAmount <= 0) {
      setErrorMsg('⚠️ Introduzca un importe superior a 0,00€');
      return;
    }
    if (!onDirectCheckout) return;

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await onDirectCheckout(parsedAmount, method, concept || 'Venda Manual');
      setAmount('0');
      onClose();
    } catch (e: any) {
      setErrorMsg(`Error: ${e?.message || 'Error al procesar cobro'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddToCart = () => {
    if (parsedAmount <= 0) {
      setErrorMsg('⚠️ Introduzca un importe superior a 0,00€');
      return;
    }
    if (onAddCustomItemToCart) {
      onAddCustomItemToCart(concept || 'Consumició Ràpida', parsedAmount);
      setAmount('0');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-black border-4 border-[#FF00FF] shadow-[0_0_35px_rgba(255,0,255,0.3)] text-white overflow-hidden flex flex-col">
        
        {/* Header Bar */}
        <div className="bg-[#111] px-4 py-3 border-b border-[#FF00FF] flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 bg-[#FF00FF] animate-pulse rounded-full shrink-0" />
            <h3 className="font-mono font-black uppercase text-xs tracking-wider text-[#FF00FF]">⌨️ Teclado Cobro Manual</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 border border-zinc-800 bg-black text-[#FF00FF] hover:bg-[#FF00FF] hover:text-black cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-4 flex-1">
          
          {/* Neon Screen Display */}
          <div className="relative">
            <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest absolute top-1 left-2.5">
              Importe Total €
            </div>
            <div className="bg-black border border-[#FF00FF]/40 py-5 px-3.5 text-right font-mono text-3xl font-black text-[#FF00FF] tracking-widest shadow-[0_0_12px_rgba(255,0,255,0.15)] select-none">
              {parsedAmount.toFixed(2)} €
            </div>
          </div>

          {/* Description Concept Input */}
          <div>
            <label className="text-[9px] font-mono font-bold text-[#FF00FF] block uppercase tracking-wider mb-1">
              Concepto / Notas Comanda
            </label>
            <input
              type="text"
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder="Consumició Ràpida / Venda Manual"
              className="w-full bg-[#0a0a0a] border border-zinc-800 px-3 py-1.5 text-xs text-white uppercase font-bold focus:outline-none focus:border-[#FF00FF] font-mono"
            />
          </div>

          {errorMsg && (
            <div className="bg-red-950/40 border border-red-500/50 text-red-500 text-[10px] font-mono uppercase p-2 text-center animate-pulse">
              {errorMsg}
            </div>
          )}

          {/* Keypad Layout */}
          <div className="grid grid-cols-3 gap-1.5 max-w-[280px] mx-auto">
            {['7', '8', '9', '4', '5', '6', '1', '2', '3'].map((num) => (
              <button
                key={num}
                onClick={() => handleNumPress(num)}
                className="h-11 bg-black border border-[#FF00FF]/30 text-white font-black font-mono text-sm hover:bg-[#330033]/25 hover:border-[#FF00FF] active:scale-95 transition-all cursor-pointer"
              >
                {num}
              </button>
            ))}
            
            <button
              onClick={handleClear}
              className="h-11 bg-[#111] border border-zinc-900 text-zinc-500 font-bold font-mono text-xs hover:border-red-500 hover:text-red-500 active:scale-95 transition-all cursor-pointer"
            >
              CLEAR
            </button>
            <button
              onClick={() => handleNumPress('0')}
              className="h-11 bg-black border border-[#FF00FF]/30 text-white font-black font-mono text-sm hover:bg-[#330033]/25 hover:border-[#FF00FF] active:scale-95 transition-all cursor-pointer"
            >
              0
            </button>
            <button
              onClick={() => handleNumPress('.')}
              className="h-11 bg-black border border-[#FF00FF]/30 text-white font-black font-mono text-sm hover:bg-[#330033]/25 hover:border-[#FF00FF] active:scale-95 transition-all cursor-pointer"
            >
              .
            </button>
          </div>

          <button
            onClick={handleBackspace}
            className="w-full h-8 bg-zinc-950 border border-zinc-900 text-zinc-400 font-bold font-mono text-[10px] flex items-center justify-center gap-1 hover:text-white cursor-pointer active:scale-95 transition-transform"
          >
            <span>CORREGIR</span>
            <span className="text-[12px]">⌫</span>
          </button>

          {/* Action Trigger Options */}
          <div className="border-t border-[#FF00FF]/30 pt-3 space-y-1.5">
            {onAddCustomItemToCart && (
              <button
                onClick={handleAddToCart}
                className="w-full bg-black hover:bg-[#330033]/15 text-[#FF00FF] border-2 border-[#FF00FF] py-2 text-[10px] font-black font-mono uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Añadir a Comanda Activa</span>
              </button>
            )}

            {onDirectCheckout && (
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => handleDirectCharge('Efectivo')}
                  disabled={isSubmitting}
                  className="bg-[#FF00FF] hover:bg-white text-black py-2.5 text-[10px] font-black font-mono uppercase tracking-tighter transition-all disabled:opacity-40 cursor-pointer flex items-center justify-center space-x-1"
                >
                  <Coins className="w-3.5 h-3.5" />
                  <span>Cobrar Efectivo</span>
                </button>
                <button
                  onClick={() => handleDirectCharge('Bizum')}
                  disabled={isSubmitting}
                  className="bg-black text-[#FF00FF] border border-[#FF00FF] hover:bg-[#FF00FF] hover:text-black py-2.5 text-[10px] font-black font-mono uppercase tracking-tighter transition-all disabled:opacity-40 cursor-pointer flex items-center justify-center space-x-1"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Cobrar Bizum</span>
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Footer info lock indicator */}
        <div className="bg-[#111] px-4 py-1.5 border-t border-zinc-900 text-center text-[8px] font-mono text-zinc-600">
          OPERARIO AUTORIZADO // {activeStaffId || 'TERMINAL LOCAL'}
        </div>

      </div>
    </div>
  );
}
