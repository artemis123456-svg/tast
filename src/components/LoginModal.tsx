/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { KeyRound, Fingerprint, Lock, ShieldAlert, Wifi, Terminal } from 'lucide-react';
import { verifyPin } from '../lib/api';

interface LoginModalProps {
  onSuccess: (token: string) => void;
  title?: string;
  subtitle?: string;
}

export default function LoginModal({ onSuccess, title = "Acceso Autenticado", subtitle = "Se requiere identificación para abrir el terminal" }: LoginModalProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [attemptsLeft, setAttemptsLeft] = useState(4);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(0);
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Check if WebAuthn or similar is mockable / biometrics available (generally we can simulate mobile sensor)
  useEffect(() => {
    // Check if it's touch device / simulated mobile
    if (window.navigator && ('maxTouchPoints' in window.navigator && window.navigator.maxTouchPoints > 0)) {
      setBiometricsAvailable(true);
    } else {
      // Allow simulation for testing purposes
      setBiometricsAvailable(true);
    }
  }, []);

  useEffect(() => {
    let timer: any;
    if (lockoutTime > 0) {
      timer = setInterval(() => {
        setLockoutTime((prev) => {
          if (prev <= 1) {
            setIsLocked(false);
            setError('');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [lockoutTime]);

  const handleKeyPress = (num: string) => {
    if (isProcessing || isLocked) return;
    setError('');
    
    if (num === 'C') {
      setPin('');
    } else if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
      
      // Auto submit on 4 digits
      if (nextPin.length === 4) {
        handleSubmit(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    if (isProcessing || isLocked) return;
    setPin(prev => prev.slice(0, -1));
  };

  const handleSubmit = async (pinValue: string) => {
    setIsProcessing(true);
    setError('');
    try {
      const result = await verifyPin(pinValue);
      if (result.success && result.token) {
        onSuccess(result.token);
      } else {
        setError(result.message || 'PIN incorrecto');
        setPin('');
        
        // Handle server lockout checks
        if (result.message?.includes('bloqueado') || result.message?.includes('Bloqueado')) {
          setIsLocked(true);
          setLockoutTime(30);
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Error de red de seguridad local.');
      setPin('');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSimulateBiometrics = () => {
    if (isLocked) return;
    setIsProcessing(true);
    // Simulate FaceID/TouchID scanning animation
    setTimeout(async () => {
      // Correct credentials login
      try {
        const result = await verifyPin('1234');
        if (result.success && result.token) {
          onSuccess(result.token);
        } else {
          setError('Sensor biométrico no registrado o error de lectura');
        }
      } catch (e) {
        setError('Acceso biométrico local fallido');
      } finally {
        setIsProcessing(false);
      }
    }, 1200);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4 py-8">
      <div className="w-full max-w-md bg-black border-4 border-[#FF00FF] shadow-[0_0_30px_rgba(255,0,255,0.25)] overflow-hidden transition-all duration-300">
        
        {/* Top Header Design Banner */}
        <div className="bg-[#111] px-6 py-6 border-b border-[#FF00FF] text-center relative">
          <div className="absolute top-4 right-4 flex items-center space-x-1.5 text-xs text-[#FF00FF]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF00FF] animate-ping" />
            <Wifi className="w-3.5 h-3.5" />
            <span className="font-mono text-[9px] tracking-wider uppercase text-zinc-500">Wi-Fi TPV LOCAL</span>
          </div>

          <div className="mx-auto w-12 h-12 bg-black border-2 border-[#FF00FF] flex items-center justify-center text-[#FF00FF] shadow-[0_0_12px_rgba(255,0,255,0.3)] mb-3">
            <Lock className="w-5 h-5" />
          </div>
          
          <h2 className="text-[#FF00FF] text-xl font-black tracking-tighter uppercase italic">
            {title}
          </h2>
          <p className="text-zinc-400 text-xs mt-1 uppercase tracking-wider">
            {subtitle}
          </p>
        </div>

        {/* Content Box */}
        <div className="px-6 py-6 flex flex-col items-center">
          
          {/* Display Indicator */}
          <div className="w-full mb-6 text-center">
            <div className="inline-flex space-x-4 bg-black px-6 py-4 border border-[#FF00FF]/40">
              {[0, 1, 2, 3].map((index) => (
                <div 
                  key={index} 
                  className={`w-4 h-4 transition-all duration-150 ${
                    pin.length > index 
                      ? 'bg-[#FF00FF] border-[#FF00FF] scale-110 shadow-[0_0_8px_rgba(255,0,255,0.6)]' 
                      : 'bg-[#111] border-zinc-700'
                  }`}
                />
              ))}
            </div>
            {isProcessing && (
              <p className="text-[#FF00FF] font-mono text-[10px] uppercase tracking-widest mt-2 animate-pulse">
                Procesando firma criptográfica...
              </p>
            )}
          </div>

          {/* Security alerts / locks */}
          {error && (
            <div className="w-full bg-[#330033]/40 border border-red-500/50 px-4 py-3 text-red-400 text-xs flex items-start space-x-2.5 mb-5 font-mono uppercase">
              <ShieldAlert className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {isLocked && (
            <div className="w-full bg-[#111] border border-amber-500/50 px-4 py-3 text-amber-550 text-xs text-center mb-5 font-mono">
              <p className="font-bold uppercase tracking-wider">🔐 BLOQUEO DE SEGURIDAD EXCESIVO</p>
              <p className="mt-1">Espere {lockoutTime} segundos para reintentar.</p>
            </div>
          )}

          {/* Keypad Layout */}
          <div className="grid grid-cols-3 gap-2 w-full max-w-xs mb-6">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                onClick={() => handleKeyPress(num)}
                disabled={isLocked || isProcessing}
                className="h-14 border border-[#FF00FF]/40 bg-black text-white font-black text-lg hover:border-[#FF00FF] hover:bg-[#330033]/25 transition-all active:scale-95 flex items-center justify-center disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              >
                {num}
              </button>
            ))}
            
            {/* Action C */}
            <button
              onClick={() => handleKeyPress('C')}
              disabled={isLocked || isProcessing}
              className="h-14 border border-zinc-900 bg-[#111] text-zinc-500 font-bold text-base hover:border-red-500 hover:text-red-500 hover:bg-red-950/20 transition-all active:scale-95 flex items-center justify-center disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              C
            </button>

            {/* Zero Key */}
            <button
              onClick={() => handleKeyPress('0')}
              disabled={isLocked || isProcessing}
              className="h-14 border border-[#FF00FF]/40 bg-black text-white font-black text-lg hover:border-[#FF00FF] hover:bg-[#330033]/25 transition-all active:scale-95 flex items-center justify-center disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              0
            </button>

            {/* Backspace Key */}
            <button
              onClick={handleBackspace}
              disabled={isLocked || isProcessing}
              className="h-14 border border-[#FF00FF]/40 bg-black text-zinc-400 font-bold text-base hover:border-[#FF00FF] hover:bg-[#330033]/25 transition-all active:scale-95 flex items-center justify-center disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              ⌫
            </button>
          </div>

          {/* Biometrics Integration Option */}
          {biometricsAvailable && (
            <button
              onClick={handleSimulateBiometrics}
              disabled={isLocked || isProcessing}
              className="w-full max-w-xs py-3 border-2 border-dashed border-[#FF00FF]/45 hover:border-[#FF00FF] text-[#FF00FF] hover:bg-[#330033]/10 flex items-center justify-center space-x-2 text-xs font-mono transition-all uppercase tracking-widest cursor-pointer"
            >
              <Fingerprint className="w-4 h-4 animate-pulse text-[#FF00FF]" />
              <span>Acceso Rápido Biométrico</span>
            </button>
          )}

          {/* Footer Warning */}
          <div className="mt-6 flex items-center space-x-1.5 text-[9px] font-mono text-zinc-650">
            <Terminal className="w-3 h-3" />
            <span>ROOT_SESSION_LOCK_ENABLED // PIN PILOTO: 1234</span>
          </div>
        </div>

      </div>
    </div>
  );
}
