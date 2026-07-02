import React, { useState } from 'react';
import { Brain, Send, RefreshCw, MessageSquare, Sparkles, TrendingUp, AlertTriangle } from 'lucide-react';
import Markdown from 'react-markdown';

export default function AiConsultingTab() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string>('');

  const quickPrompts = [
    { label: '📊 Resumen Ejecutivo', query: 'Haz un resumen ejecutivo de las ventas de hoy y dime qué productos destacan' },
    { label: '🚨 Alerta de Inventario', query: '¿Qué ingredientes del stock están en nivel de alerta crítico y qué proveedor debo contactar?' },
    { label: '👥 Rendimiento Personal', query: '¿Quién es el camarero estrella de hoy en ventas y propinas, y cómo van las horas?' },
    { label: '💡 Consejo de Optimización', query: 'Dame consejos prácticos para reducir mermas y optimizar los escandallos de costes de El Tast' }
  ];

  const handleAskAI = async (queryToSend: string) => {
    if (!queryToSend.trim() || loading) return;
    setLoading(true);
    setAnswer('');
    try {
      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: queryToSend })
      });
      if (res.ok) {
        const data = await res.json();
        setAnswer(data.answer);
      } else {
        setAnswer('⚠️ No se ha podido contactar con el consultor de IA. Compruebe la clave GEMINI_API_KEY.');
      }
    } catch (e) {
      setAnswer('⚠️ Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-zinc-200 font-bold text-sm uppercase tracking-wide flex items-center space-x-2">
            <Brain className="w-4 h-4 text-[#FF00FF] animate-pulse" />
            <span>Consultor Ejecutivo IA (El Tast Business Intelligence)</span>
          </h2>
          <p className="text-zinc-500 text-xs mt-0.5">Asistente de inteligencia comercial y análisis de inventario en tiempo real con Gemini</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Input and Quick templates */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-2xl space-y-3">
            <span className="text-[10px] font-mono text-zinc-500 uppercase block font-bold">Plantillas de Consulta Rápida</span>
            <div className="flex flex-col gap-2">
              {quickPrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setPrompt(p.query);
                    handleAskAI(p.query);
                  }}
                  disabled={loading}
                  className="p-2.5 bg-black border border-zinc-900 rounded-xl text-left hover:border-[#FF00FF]/50 hover:bg-[#FF00FF]/5 text-zinc-300 font-mono text-xs transition-all flex justify-between items-center cursor-pointer disabled:opacity-40"
                >
                  <span className="font-bold">{p.label}</span>
                  <Sparkles className="w-3.5 h-3.5 text-[#FF00FF]" />
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-2xl space-y-3">
            <span className="text-[10px] font-mono text-zinc-500 uppercase block font-bold">Pregunta Directa al Consultor</span>
            <div className="relative">
              <textarea
                rows={3}
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="Escribe tu consulta sobre ventas, stock, mermas..."
                className="w-full bg-black border border-zinc-800 rounded-xl p-3 pr-10 text-xs text-zinc-200 focus:outline-none focus:border-[#FF00FF] font-mono resize-none leading-relaxed"
              />
              <button
                onClick={() => handleAskAI(prompt)}
                disabled={loading || !prompt.trim()}
                className="absolute bottom-3 right-3 p-1.5 bg-[#FF00FF] hover:bg-[#FF00FF]/90 disabled:opacity-30 text-black rounded-lg transition-colors cursor-pointer"
              >
                {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Answers with Markdown and Styling */}
        <div className="lg:col-span-7 p-5 bg-zinc-950 border border-zinc-900 rounded-2xl flex flex-col min-h-[320px] justify-between">
          <div className="space-y-4 flex-1">
            <span className="text-[10px] font-mono text-zinc-550 uppercase block font-bold tracking-widest border-b border-zinc-900 pb-2">
              Respuesta del Consultor Comercial
            </span>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-3">
                <div className="w-8 h-8 border-4 border-t-[#FF00FF] border-r-transparent border-dashed border-[#FF00FF]/20 rounded-full animate-spin" />
                <p className="font-mono text-zinc-500 text-xs animate-pulse">Procesando métricas y stock con Gemini...</p>
              </div>
            ) : answer ? (
              <div className="markdown-body text-xs font-mono text-zinc-300 leading-relaxed whitespace-pre-wrap max-h-[400px] overflow-y-auto pr-2">
                <Markdown>{answer}</Markdown>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-2 text-zinc-650 font-mono text-xs">
                <MessageSquare className="w-8 h-8 text-zinc-800" />
                <p>Formula una pregunta de análisis o selecciona una plantilla rápida para comenzar la auditoría inteligente de El Tast.</p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-900 flex justify-between items-center text-[10px] font-mono text-zinc-600">
            <span>Servicio: Gemini 3.5 Flash (TPV Realtime)</span>
            <span>Seguro y Conforme</span>
          </div>
        </div>

      </div>
    </div>
  );
}
