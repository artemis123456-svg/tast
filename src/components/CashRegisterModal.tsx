/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Check, Coins, ArrowRight, Printer, RotateCcw } from 'lucide-react';

interface CashRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  onConfirm: (amountPaid: number, change: number, method: 'Efectivo' | 'Bizum') => Promise<void>;
  orderId?: string;
}

export function getChangeBreakdown(change: number) {
  const denominations = [
    { value: 100, label: 'Billete de 100€', isNote: true, color: '#059669' },
    { value: 50, label: 'Billete de 50€', isNote: true, color: '#F97316' },
    { value: 20, label: 'Billete de 20€', isNote: true, color: '#2563EB' },
    { value: 10, label: 'Billete de 10€', isNote: true, color: '#DC2626' },
    { value: 5, label: 'Billete de 5€', isNote: true, color: '#4B5563' },
    { value: 2, label: 'Moneda de 2€', isNote: false },
    { value: 1, label: 'Moneda de 1€', isNote: false },
    { value: 0.50, label: 'Moneda de 0.50€', isNote: false },
    { value: 0.20, label: 'Moneda de 0.20€', isNote: false },
    { value: 0.10, label: 'Moneda de 0.10€', isNote: false },
    { value: 0.05, label: 'Moneda de 0.05€', isNote: false },
  ];

  let remaining = Math.round(change * 100) / 100;
  const breakdown: Array<{ label: string; count: number; value: number; isNote: boolean }> = [];

  for (const denom of denominations) {
    if (remaining >= denom.value) {
      const count = Math.floor(remaining / denom.value);
      breakdown.push({ label: denom.label, count, value: denom.value, isNote: denom.isNote });
      remaining = Math.round((remaining - count * denom.value) * 100) / 100;
    }
  }

  return breakdown;
}

export default function CashRegisterModal({
  isOpen,
  onClose,
  totalAmount,
  onConfirm,
  orderId
}: CashRegisterModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'Efectivo' | 'Bizum'>('Efectivo');
  const [deliveredValue, setDeliveredValue] = useState<number>(0);
  const [customInput, setCustomInput] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Update default states when total changes
  useEffect(() => {
    setDeliveredValue(0);
    setCustomInput('');
    setErrorMsg('');
  }, [totalAmount, isOpen]);

  if (!isOpen) return null;

  const handleNoteCoinClick = (val: number) => {
    setDeliveredValue((prev) => parseFloat((prev + val).toFixed(2)));
  };

  const handleDirectValue = (val: number) => {
    setDeliveredValue(val);
  };

  // Quick helper to round up to typical next notes (5, 10, 20, 50, 100)
  const getRoundingOptions = () => {
    const defaultNotes = [5, 10, 20, 50, 100];
    const options: number[] = [];
    
    // Nearest exact note
    for (const note of defaultNotes) {
      if (note >= totalAmount && options.length < 3) {
        options.push(note);
      }
    }
    
    // Add multiple of 10 if not present
    const tensRound = Math.ceil(totalAmount / 10) * 10;
    if (tensRound > totalAmount && !options.includes(tensRound) && options.length < 3) {
      options.push(tensRound);
    }
    
    // Add next 5 increment
    const fivesRound = Math.ceil(totalAmount / 5) * 5;
    if (fivesRound > totalAmount && !options.includes(fivesRound) && options.length < 3) {
      options.push(fivesRound);
    }

    return Array.from(new Set(options)).sort((a, b) => a - b);
  };

  const changeToReturn = Math.max(0, parseFloat((deliveredValue - totalAmount).toFixed(2)));
  const pendingAmount = Math.max(0, parseFloat((totalAmount - deliveredValue).toFixed(2)));
  const changeDistribution = changeToReturn > 0 ? getChangeBreakdown(changeToReturn) : [];

  const handleManualInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(customInput);
    if (!isNaN(val) && val >= 0) {
      setDeliveredValue(val);
      setCustomInput('');
    }
  };

  const processFinishPayment = async () => {
    if (paymentMethod === 'Efectivo' && deliveredValue < totalAmount) {
      setErrorMsg('⚠️ El importe entregado no es suficiente para cubrir el total.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const finalPaid = paymentMethod === 'Efectivo' ? deliveredValue : totalAmount;
      const finalChange = paymentMethod === 'Efectivo' ? changeToReturn : 0;
      await onConfirm(finalPaid, finalChange, paymentMethod);
      onClose();
    } catch (err: any) {
      setErrorMsg(`Error: ${err?.message || 'Error al procesar el pago'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const roundedNotes = getRoundingOptions();

  const euroNotesList = [
    { 
      val: 5, 
      label: '5', 
      bg: 'from-[#5C6E7C] via-[#708494] to-[#4F5D6B]', 
      textColor: 'text-slate-100',
      watermarkColor: 'border-slate-300/30 bg-slate-300/10',
      gate: '🏛️', 
      era: 'Clásica', 
      sign: 'M. Draghi', 
      stripeClass: 'from-amber-200/40 via-purple-300/40 to-[#708494]/50'
    },
    { 
      val: 10, 
      label: '10', 
      bg: 'from-[#C14450] via-[#D25460] to-[#99333E]', 
      textColor: 'text-rose-50',
      watermarkColor: 'border-rose-400/30 bg-rose-400/10',
      gate: '⛪', 
      era: 'Románica', 
      sign: 'Ch. Lagarde', 
      stripeClass: 'from-blue-200/40 via-[#D25460]/40 to-yellow-250/50'
    },
    { 
      val: 20, 
      label: '20', 
      bg: 'from-[#3A6B9B] via-[#487FAF] to-[#2B5480]', 
      textColor: 'text-sky-50',
      watermarkColor: 'border-sky-300/30 bg-sky-300/10',
      gate: '🥀', 
      era: 'Gótica', 
      sign: 'M. Draghi', 
      stripeClass: 'from-pink-300/40 via-indigo-200/40 to-[#2B5480]/50'
    },
    { 
      val: 50, 
      label: '50', 
      bg: 'from-[#D26E17] via-[#E4822B] to-[#9B4D0D]', 
      textColor: 'text-amber-50',
      watermarkColor: 'border-amber-300/30 bg-amber-300/10',
      gate: '🌉', 
      era: 'Renacentista', 
      sign: 'Ch. Lagarde', 
      stripeClass: 'from-teal-200/40 via-[#E4822B]/40 to-indigo-300/50'
    },
    { 
      val: 100, 
      label: '100', 
      bg: 'from-[#3C7B53] via-[#4A9264] to-[#2B593C]', 
      textColor: 'text-emerald-50',
      watermarkColor: 'border-emerald-300/30 bg-emerald-300/10',
      gate: '🏰', 
      era: 'Barroca', 
      sign: 'M. Draghi', 
      stripeClass: 'from-yellow-300/40 via-sky-200/40 to-[#2B593C]/50'
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
      <div className="w-full max-w-4xl bg-black border-4 border-[#FF00FF] shadow-[0_0_40px_rgba(255,0,255,0.25)] text-white overflow-hidden flex flex-col rounded-3xl animate-fadeIn">
        
        {/* Header bar */}
        <div className="bg-[#111] px-6 py-4 border-b border-[#FF00FF]/50 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Coins className="w-6 h-6 text-[#FF00FF] animate-pulse" />
            <div>
              <h3 className="font-mono font-black uppercase text-sm tracking-widest text-[#FF00FF]">REGISTRO DE COBRO / CAMBIO</h3>
              <p className="text-[10px] text-zinc-450 font-mono">Calcule el efectivo del cliente y emita el ticket fiscal</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1 border border-zinc-800 bg-black text-[#FF00FF] hover:bg-[#FF00FF] hover:text-black cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body layout */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-y-auto max-h-[80vh]">
          
          {/* LEFT SIDE: Payment detail & coins generator */}
          <div className="lg:col-span-7 space-y-5">
            
            {/* Payment Method Picker */}
            <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-900 flex space-x-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('Efectivo')}
                className={`flex-1 py-3 px-4 font-mono font-black uppercase text-xs rounded-xl border text-center transition-all cursor-pointer ${
                  paymentMethod === 'Efectivo'
                    ? 'bg-[#FF00FF] text-black border-[#FF00FF] shadow-[0_0_15px_rgba(255,0,255,0.25)]'
                    : 'bg-black text-zinc-400 border-zinc-800 hover:text-white'
                }`}
              >
                💶 Efectivo / Metálico
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('Bizum')}
                className={`flex-1 py-3 px-4 font-mono font-black uppercase text-xs rounded-xl border text-center transition-all cursor-pointer ${
                  paymentMethod === 'Bizum'
                    ? 'bg-[#FF00FF] text-black border-[#FF00FF] shadow-[0_0_15px_rgba(255,0,255,0.25)]'
                    : 'bg-black text-zinc-400 border-zinc-800 hover:text-white'
                }`}
              >
                📱 Pago Bizum / Tarjeta
              </button>
            </div>

            {paymentMethod === 'Efectivo' ? (
              <div className="space-y-5">
                
                {/* EURO NOTES CONTAINER (Billetes) */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono text-[#FF00FF] uppercase tracking-wider block font-bold">Billetes de Euro (€)</span>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    {euroNotesList.map((n) => (
                      <button
                        key={n.val}
                        type="button"
                        onClick={() => handleNoteCoinClick(n.val)}
                        className={`w-full aspect-[1.8/1] bg-gradient-to-br ${n.bg} rounded-xl relative overflow-hidden transition-all active:scale-[0.96] hover:brightness-110 shadow-lg border border-white/20 select-none cursor-pointer flex flex-col justify-between p-2`}
                      >
                        {/* BCE Stamp */}
                        <div className="absolute top-1 left-2 text-[5px] opacity-40 font-mono tracking-tighter leading-none scale-90 origin-left">
                          BCE ECB ЕЦБ 25
                        </div>
                        
                        {/* President Signature */}
                        <div className="absolute top-3.5 left-2 text-[4px] opacity-35 italic font-serif leading-none scale-75 origin-left">
                          {n.sign}
                        </div>

                        {/* EU Blue Flag of Stars */}
                        <div className="absolute top-1 right-[30%] w-3.5 h-2.5 bg-blue-700/80 rounded-sm flex flex-wrap items-center justify-center p-0.5 pointer-events-none">
                          <div className="grid grid-cols-3 gap-0.5 leading-none h-full w-full justify-items-center items-center">
                            <span className="text-[3px] text-yellow-300 scale-75">★</span>
                            <span className="text-[3px] text-yellow-300 scale-75">★</span>
                            <span className="text-[3px] text-yellow-300 scale-75">★</span>
                          </div>
                        </div>

                        {/* Central architectural gate vignette backdrop */}
                        <div className="absolute inset-x-0 top-3 bottom-2 flex items-center justify-center pointer-events-none opacity-[0.14] select-none text-[28px] leading-none">
                          {n.gate}
                        </div>

                        {/* Foil Security Hologram column */}
                        <div className={`absolute right-1 top-0 bottom-0 w-3 md:w-4 bg-gradient-to-b ${n.stripeClass} opacity-85 border-l border-r border-white/5 flex flex-col justify-around items-center py-1`}>
                          <span className="text-[5px] font-mono font-black text-black/40 scale-75">{n.label}</span>
                          <span className="text-[4px] text-black/50 scale-75">★</span>
                        </div>

                        {/* Left watermark circle */}
                        <div className={`absolute left-2.5 bottom-1.5 w-6 h-6 rounded-full border ${n.watermarkColor} backdrop-blur-[0.5px] group-hover:scale-95 transition-transform flex items-center justify-center`}>
                          <span className="text-[8px] font-sans font-black text-white/5 opacity-40">{n.label}</span>
                        </div>

                        {/* Main Numeric print label bottom right */}
                        <div className="absolute right-4.5 bottom-1 text-[10px] font-bold opacity-30 leading-none">
                          EURO
                        </div>

                        {/* Value prints */}
                        <div className="flex justify-between items-start w-full relative z-10 pt-1 pointer-events-none">
                          <span className={`text-[17px] font-black italic tracking-tighter leading-none ${n.textColor}`}>{n.label}</span>
                        </div>
                        
                        <div className="flex justify-between items-end w-full relative z-10 pointer-events-none">
                          <span className="text-[6px] font-bold opacity-30 uppercase tracking-widest">{n.era}</span>
                          <span className={`text-[16px] font-sans font-extrabold italic leading-none mr-3 ${n.textColor}`}>{n.label}€</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* EURO COINS CONTAINER (Monedas) */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono text-[#FF00FF] uppercase tracking-wider block font-bold font-mono">Monedas de Euro (€)</span>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { val: 2.00, label: '2 €', color: 'bg-zinc-800 border-yellow-500 text-yellow-300 shadow-[0_0_8px_rgba(234,179,8,0.15)] shadow-md w-12 h-12 text-sm' },
                      { val: 1.00, label: '1 €', color: 'bg-yellow-600 border-zinc-400 text-zinc-100 shadow-md w-11 h-11 text-xs' },
                      { val: 0.50, label: '50c', color: 'bg-amber-600 border-amber-800 text-amber-100 shadow-sm w-10 h-10 text-[11px]' },
                      { val: 0.20, label: '20c', color: 'bg-amber-600 border-amber-800 text-amber-100/90 shadow-sm w-9.5 h-9.5 text-[10px]' },
                      { val: 0.10, label: '10c', color: 'bg-amber-600 border-amber-800 text-amber-200/90 shadow-sm w-9 h-9 text-[9px]' },
                      { val: 0.05, label: '5c', color: 'bg-amber-800 border-amber-950 text-amber-300/80 shadow-xs w-8.5 h-8.5 text-[8.5px]' },
                    ].map((c) => (
                      <button
                        key={c.val}
                        type="button"
                        onClick={() => handleNoteCoinClick(c.val)}
                        className={`rounded-full border-2 flex items-center justify-center font-mono font-black active:scale-90 transition-all cursor-pointer select-none hover:brightness-115 hover:border-white/50 ${c.color}`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* QUICK ASSISTANCE CONTROLS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  
                  {/* Shortcut value list */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono text-zinc-550 uppercase block font-bold">Importe Exacto / Importes Rápidos</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleDirectValue(totalAmount)}
                        className="flex-1 py-2 bg-zinc-900 hover:bg-[#330033]/20 border border-zinc-800 hover:border-[#FF00FF]/50 rounded-xl font-mono text-[11px] font-black uppercase text-zinc-300 transition-all cursor-pointer"
                      >
                        Exacto ({totalAmount.toFixed(2)}€)
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeliveredValue(0)}
                        className="p-2 bg-zinc-950 border border-zinc-900 rounded-xl text-zinc-550 hover:text-red-500 transition-colors cursor-pointer"
                        title="Reiniciar a 0€"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Nearest matching notes list */}
                    {roundedNotes.length > 0 && (
                      <div className="flex gap-1.5 mt-1">
                        {roundedNotes.map((note) => (
                          <button
                            key={note}
                            type="button"
                            onClick={() => handleDirectValue(note)}
                            className="flex-1 py-1.5 bg-black border border-zinc-850 hover:border-zinc-700 text-xs font-mono font-bold hover:text-white rounded-lg transition-all"
                          >
                            Paga con {note}€
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Manual input form */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono text-zinc-550 uppercase block font-bold font-mono">Escribir importe manual (€)</span>
                    <form onSubmit={handleManualInputSubmit} className="flex space-x-2">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Ej. 65.50"
                        value={customInput}
                        onChange={(e) => setCustomInput(e.target.value)}
                        className="flex-1 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#FF00FF] font-mono text-right font-black"
                      />
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-[#FF00FF]/15 border border-[#FF00FF]/55 hover:bg-[#FF00FF] hover:text-black text-[#FF00FF] font-mono text-xs font-black uppercase rounded-xl transition-all"
                      >
                        Establecer
                      </button>
                    </form>
                  </div>

                </div>

              </div>
            ) : (
              <div className="bg-[#050505] border border-zinc-900 p-8 rounded-3xl text-center space-y-4">
                <div className="text-[#FF00FF] text-4xl">📱</div>
                <h4 className="font-mono font-bold text-zinc-250 uppercase text-xs tracking-wider">PAGO DIRECTO ELECTRÓNICO</h4>
                <p className="text-zinc-500 text-xs font-mono max-w-sm mx-auto leading-relaxed">
                  Para pagos con Bizum o Tarjeta, no hay gestión de cambio en metálico. El sistema registrará el neto exacto de la cuenta automáticamente.
                </p>
                <div className="text-xl font-mono font-black text-white bg-zinc-900 border border-zinc-800/80 inline-block px-5 py-2.5 rounded-2xl">
                  {totalAmount.toFixed(2)} €
                </div>
              </div>
            )}

          </div>

          {/* RIGHT SIDE: Breakdown screen display totals */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4 bg-[#0a0a0a] border border-zinc-900 rounded-3xl p-5 relative">
            
            <div className="space-y-4">
              
              {/* LED Neon Receipt Header Summary */}
              <div className="space-y-3.5">
                <div>
                  <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest block font-bold">TOTAL DE LA CUENTA</span>
                  <div className="text-2xl font-mono font-black tracking-widest text-zinc-100">{totalAmount.toFixed(2)} €</div>
                </div>

                {paymentMethod === 'Efectivo' && (
                  <>
                    <div className="border-t border-dashed border-zinc-900 pt-3">
                      <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest block font-bold">EFECTIVO ENTREGADO</span>
                      <div className="text-3xl font-mono font-black tracking-widest text-[#FF00FF]">{deliveredValue.toFixed(2)} €</div>
                    </div>

                    <div className="border-t border-zinc-900 pt-3 flex justify-between items-baseline">
                      <div>
                        <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest block font-bold">CAMBIO A DEVOLVER</span>
                        <div className={`text-3xl font-mono font-black tracking-wider ${changeToReturn > 0 ? 'text-amber-400 font-black' : 'text-zinc-650'}`}>
                          {changeToReturn.toFixed(2)} €
                        </div>
                      </div>
                      
                      {pendingAmount > 0 && (
                        <span className="text-[9px] font-mono font-bold bg-yellow-950/20 text-yellow-500 px-2 py-1 rounded border border-yellow-500/30 animate-pulse">
                          Faltan: {pendingAmount.toFixed(2)}€
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* COIN RETURN SYSTEM PATH FINDER (Breakdown of which bills/coins to return) */}
              {paymentMethod === 'Efectivo' && changeToReturn > 0 && (
                <div className="bg-black border border-zinc-900 rounded-2xl p-3.5 space-y-2 flex-1">
                  <span className="text-[9px] font-mono text-zinc-550 uppercase tracking-wider block font-black border-b border-zinc-900 pb-1 flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5 text-amber-500" />
                    MESILLA DE CAMBIO RECOMENDADA
                  </span>

                  <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                    {changeDistribution.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-[10px] font-mono p-1 rounded hover:bg-zinc-950">
                        <span className="text-zinc-300 font-medium">{item.label}</span>
                        <span className="font-extrabold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 border border-amber-500/20 rounded">
                          x {item.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {errorMsg && (
                <div className="bg-red-950/40 border border-red-500/40 text-red-500 text-[10px] font-mono uppercase p-3 rounded-xl text-center animate-pulse">
                  {errorMsg}
                </div>
              )}

            </div>

            {/* ACTION BOTTOM ROW */}
            <div className="pt-4 border-t border-zinc-900 space-y-2">
              <button
                type="button"
                onClick={processFinishPayment}
                disabled={isSubmitting || (paymentMethod === 'Efectivo' && deliveredValue < totalAmount)}
                className="w-full py-3.5 bg-[#FF00FF] hover:bg-white disabled:bg-zinc-900 disabled:text-zinc-650 disabled:border-zinc-800 text-black font-mono font-black text-xs uppercase tracking-widest rounded-2xl transition-all cursor-pointer flex items-center justify-center space-x-2 border-2 border-[#FF00FF]"
              >
                <Printer className="w-4 h-4" />
                <span>CONFIRMAR Y AUTO-IMPRIMIR TICKET</span>
              </button>
              
              <div className="text-[8px] font-mono text-zinc-600 text-center uppercase tracking-wide">
                * El ticket se enviará e imprimirá por la cola fiscal inmediatamente
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
