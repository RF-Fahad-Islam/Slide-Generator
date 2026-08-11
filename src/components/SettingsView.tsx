import React, { useState } from 'react';
import { Settings, Key, Cpu, CheckCircle2, AlertCircle, Loader2, Sparkles, ExternalLink, ShieldCheck, ScanText, MonitorSmartphone } from 'lucide-react';

interface SettingsViewProps {
  appTheme?: 'dark' | 'light';
}

export type AIProvider = 'gemini' | 'openrouter';
export type OcrMethod = 'model' | 'browser';

export const OPENROUTER_MODELS = [
  { id: 'google/gemini-2.5-flash', name: 'Google Gemini 2.5 Flash (Fast & Precise)' },
  { id: 'google/gemini-1.5-pro', name: 'Google Gemini 1.5 Pro (Deep Reasoning)' },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Anthropic Claude 3.5 Sonnet (Elite Text Parsing)' },
  { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Meta Llama 3.3 70B (Open Source Master)' },
  { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1 (Advanced Math Reasoning)' },
];

// OCR needs a model that accepts image input. Text-only models (Llama 3.3
// 70B, DeepSeek R1) are excluded here even though they're valid choices for
// the structuring stage — picking one for OCR would fail on image input.
export const OPENROUTER_VISION_MODELS = [
  { id: 'google/gemini-2.5-flash', name: 'Google Gemini 2.5 Flash (Fast & Precise)' },
  { id: 'google/gemini-1.5-pro', name: 'Google Gemini 1.5 Pro (Deep Reasoning)' },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Anthropic Claude 3.5 Sonnet (Elite Vision OCR)' },
  { id: 'meta-llama/llama-3.2-90b-vision-instruct', name: 'Meta Llama 3.2 90B Vision (Open Source)' },
];

export const SettingsView: React.FC<SettingsViewProps> = ({ appTheme = 'dark' }) => {
  const isAppLight = appTheme === 'light';

  const [provider, setProvider] = useState<AIProvider>(() => {
    return (localStorage.getItem('mcqgen.provider') as AIProvider) || 'gemini';
  });

  const [geminiApiKey, setGeminiApiKey] = useState<string>(() => {
    return localStorage.getItem('mcqgen.geminiKey') || '';
  });

  const [openrouterApiKey, setOpenrouterApiKey] = useState<string>(() => {
    return localStorage.getItem('mcqgen.openrouterKey') || '';
  });

  const [openrouterModel, setOpenrouterModel] = useState<string>(() => {
    return localStorage.getItem('mcqgen.openrouterModel') || 'google/gemini-2.5-flash';
  });

  const [testStatus, setTestStatus] = useState<{
    loading: boolean;
    success?: boolean;
    msg?: string;
  }>({ loading: false });

  const saveProvider = (newProvider: AIProvider) => {
    setProvider(newProvider);
    localStorage.setItem('mcqgen.provider', newProvider);
  };

  const saveGeminiKey = (key: string) => {
    setGeminiApiKey(key);
    localStorage.setItem('mcqgen.geminiKey', key);
  };

  const saveOpenrouterKey = (key: string) => {
    setOpenrouterApiKey(key);
    localStorage.setItem('mcqgen.openrouterKey', key);
  };

  const saveOpenrouterModel = (model: string) => {
    setOpenrouterModel(model);
    localStorage.setItem('mcqgen.openrouterModel', model);
  };

  const handleTestConnection = async () => {
    setTestStatus({ loading: true });
    try {
      const activeKey = provider === 'gemini' ? geminiApiKey : openrouterApiKey;

      if (!activeKey.trim()) {
        throw new Error(`Please enter your ${provider === 'gemini' ? 'Gemini' : 'OpenRouter'} API Key first.`);
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-ai-provider': provider,
      };

      if (provider === 'gemini') {
        headers['x-gemini-key'] = geminiApiKey.trim();
      } else {
        headers['x-openrouter-key'] = openrouterApiKey.trim();
        headers['x-openrouter-model'] = openrouterModel;
      }

      const res = await fetch('/api/ai/test-connection', {
        method: 'POST',
        headers,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to connect to API provider.');
      }

      setTestStatus({
        loading: false,
        success: true,
        msg: `Successfully connected to ${data.providerName || provider}! Model latency: ${data.latencyMs}ms.`,
      });
    } catch (err: any) {
      setTestStatus({
        loading: false,
        success: false,
        msg: err.message || 'Connection test failed.',
      });
    }
  };

  // --- OCR engine settings (independent from the structuring key above) ---
  // Kept as separate localStorage keys and separate state so the vision-OCR
  // call and the MCQ-structuring call never share one API key/quota.
  const [ocrMethod, setOcrMethod] = useState<OcrMethod>(() => {
    return (localStorage.getItem('mcqgen.ocrMethod') as OcrMethod) || 'model';
  });

  const [ocrProvider, setOcrProvider] = useState<AIProvider>(() => {
    return (localStorage.getItem('mcqgen.ocrProvider') as AIProvider) || 'gemini';
  });

  const [ocrGeminiApiKey, setOcrGeminiApiKey] = useState<string>(() => {
    return localStorage.getItem('mcqgen.ocrGeminiKey') || '';
  });

  const [ocrOpenrouterApiKey, setOcrOpenrouterApiKey] = useState<string>(() => {
    return localStorage.getItem('mcqgen.ocrOpenrouterKey') || '';
  });

  const [ocrOpenrouterModel, setOcrOpenrouterModel] = useState<string>(() => {
    return localStorage.getItem('mcqgen.ocrOpenrouterModel') || 'google/gemini-2.5-flash';
  });

  const [ocrTestStatus, setOcrTestStatus] = useState<{
    loading: boolean;
    success?: boolean;
    msg?: string;
  }>({ loading: false });

  const saveOcrMethod = (method: OcrMethod) => {
    setOcrMethod(method);
    localStorage.setItem('mcqgen.ocrMethod', method);
  };

  const saveOcrProvider = (newProvider: AIProvider) => {
    setOcrProvider(newProvider);
    localStorage.setItem('mcqgen.ocrProvider', newProvider);
  };

  const saveOcrGeminiKey = (key: string) => {
    setOcrGeminiApiKey(key);
    localStorage.setItem('mcqgen.ocrGeminiKey', key);
  };

  const saveOcrOpenrouterKey = (key: string) => {
    setOcrOpenrouterApiKey(key);
    localStorage.setItem('mcqgen.ocrOpenrouterKey', key);
  };

  const saveOcrOpenrouterModel = (model: string) => {
    setOcrOpenrouterModel(model);
    localStorage.setItem('mcqgen.ocrOpenrouterModel', model);
  };

  const handleTestOcrConnection = async () => {
    setOcrTestStatus({ loading: true });
    try {
      const activeKey = ocrProvider === 'gemini' ? ocrGeminiApiKey : ocrOpenrouterApiKey;

      if (!activeKey.trim()) {
        throw new Error(`Please enter your OCR ${ocrProvider === 'gemini' ? 'Gemini' : 'OpenRouter'} API Key first.`);
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-ai-provider': ocrProvider,
      };

      if (ocrProvider === 'gemini') {
        headers['x-gemini-key'] = ocrGeminiApiKey.trim();
      } else {
        headers['x-openrouter-key'] = ocrOpenrouterApiKey.trim();
        headers['x-openrouter-model'] = ocrOpenrouterModel;
      }

      const res = await fetch('/api/ai/test-connection', {
        method: 'POST',
        headers,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to connect to API provider.');
      }

      setOcrTestStatus({
        loading: false,
        success: true,
        msg: `Successfully connected to ${data.providerName || ocrProvider}! Model latency: ${data.latencyMs}ms.`,
      });
    } catch (err: any) {
      setOcrTestStatus({
        loading: false,
        success: false,
        msg: err.message || 'Connection test failed.',
      });
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Main Settings Card */}
      <div
        className={`p-8 lg:p-10 rounded-3xl border-2 shadow-2xl ${
          isAppLight
            ? 'glass-card-fatty-light border-slate-200'
            : 'glass-card-fatty border-slate-800'
        }`}
      >
        {/* Header */}
        <div className={`flex items-center gap-5 pb-8 border-b ${isAppLight ? 'border-slate-200' : 'border-slate-800/80'}`}>
          <div className="p-4 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 font-black shadow-lg shadow-amber-500/25">
            <Settings className="w-8 h-8 stroke-[2.5]" />
          </div>
          <div>
            <h2 className={`text-2xl lg:text-3xl font-black tracking-tight ${isAppLight ? 'text-slate-900' : 'text-white'}`}>
              Structuring Engine — API Key
            </h2>
            <p className={`text-sm mt-1.5 ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Bring Your Own Key (BYOK) for Google Gemini or OpenRouter. Used to parse extracted text into structured MCQ JSON. Keys are saved locally, never on our servers.
            </p>
          </div>
        </div>

        {/* Security Banner */}
        <div className={`mt-8 p-5 rounded-2xl border text-base font-semibold flex items-center gap-4 ${
          isAppLight
            ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
        }`}>
          <ShieldCheck className="w-7 h-7 shrink-0 text-emerald-400" />
          <span>
            <strong>Local Privacy Guarantee:</strong> API keys are never saved on any cloud server. They are sent directly from your browser to AI provider endpoints.
          </span>
        </div>

        {/* Provider Selector */}
        <div className="mt-8 space-y-5">
          <label className={`block text-sm font-black uppercase tracking-widest ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
            Select Active AI Provider Engine:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Gemini Option */}
            <div
              onClick={() => saveProvider('gemini')}
              className={`p-6 rounded-3xl border cursor-pointer transition-all flex items-start gap-4 ${
                provider === 'gemini'
                  ? isAppLight
                    ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/40 shadow-lg'
                    : 'bg-amber-500/15 border-amber-500 ring-2 ring-amber-500/50 shadow-lg shadow-amber-500/10'
                  : isAppLight
                  ? 'bg-white border-slate-200 hover:border-slate-400 shadow-sm'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className={`p-3.5 rounded-2xl shrink-0 ${
                provider === 'gemini'
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25'
                  : isAppLight
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-amber-500/20 text-amber-500'
              }`}>
                <Sparkles className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <h3 className={`font-black text-lg ${isAppLight ? 'text-slate-900' : 'text-white'}`}>
                  Google Gemini API
                </h3>
                <p className={`text-sm mt-1.5 leading-relaxed ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Direct connection to Google AI Studio. Native 2-stage vision support for PDFs & photos.
                </p>
              </div>
            </div>

            {/* OpenRouter Option */}
            <div
              onClick={() => saveProvider('openrouter')}
              className={`p-6 rounded-3xl border cursor-pointer transition-all flex items-start gap-4 ${
                provider === 'openrouter'
                  ? isAppLight
                    ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-400/40 shadow-lg'
                    : 'bg-blue-500/15 border-blue-500 ring-2 ring-blue-500/50 shadow-lg shadow-blue-500/10'
                  : isAppLight
                  ? 'bg-white border-slate-200 hover:border-slate-400 shadow-sm'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className={`p-3.5 rounded-2xl shrink-0 ${
                provider === 'openrouter'
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                  : isAppLight
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-blue-500/20 text-blue-500'
              }`}>
                <Cpu className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <h3 className={`font-black text-lg ${isAppLight ? 'text-slate-900' : 'text-white'}`}>
                  OpenRouter API
                </h3>
                <p className={`text-sm mt-1.5 leading-relaxed ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Access Gemini, Claude 3.5, Llama 3.3, & DeepSeek R1 via OpenRouter proxying.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Provider Details Form */}
        <div className="mt-8">
          {provider === 'gemini' ? (
            <div className={`p-6 rounded-3xl border space-y-5 ${
              isAppLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
            }`}>
              <div className="flex items-center justify-between">
                <label className={`text-sm font-extrabold flex items-center gap-2 ${isAppLight ? 'text-amber-600' : 'text-amber-400'}`}>
                  <Key className="w-4 h-4" />
                  Google Gemini API Key:
                </label>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-amber-500 hover:text-amber-400 font-bold flex items-center gap-1 transition-colors"
                >
                  Get Free Gemini Key <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <input
                type="password"
                value={geminiApiKey}
                onChange={(e) => saveGeminiKey(e.target.value)}
                placeholder="Paste your Gemini API Key (e.g. AIzaSy...)"
                className={`w-full px-4 py-4 rounded-xl border focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 font-mono text-sm transition-all ${
                  isAppLight
                    ? 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
                    : 'bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-600'
                }`}
              />
              <p className={`text-sm ${isAppLight ? 'text-slate-500' : 'text-slate-500'}`}>
                Recommended default model: <code className={`px-1.5 py-0.5 rounded font-mono ${isAppLight ? 'bg-amber-100 text-amber-700' : 'bg-amber-500/10 text-amber-400'}`}>gemini-2.5-flash</code> (Fast multimodal vision & Bengali LaTeX text extraction).
              </p>
            </div>
          ) : (
            <div className={`p-6 rounded-3xl border space-y-6 ${
              isAppLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
            }`}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-extrabold text-blue-500 flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    OpenRouter API Key:
                  </label>
                  <a
                    href="https://openrouter.ai/keys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-blue-500 hover:text-blue-400 font-bold flex items-center gap-1 transition-colors"
                  >
                    Get OpenRouter Key <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <input
                  type="password"
                  value={openrouterApiKey}
                  onChange={(e) => saveOpenrouterKey(e.target.value)}
                  placeholder="Paste your OpenRouter Key (e.g. sk-or-v1-...)"
                  className={`w-full px-4 py-4 rounded-xl border focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 font-mono text-sm transition-all ${
                    isAppLight
                      ? 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
                      : 'bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-600'
                  }`}
                />
              </div>

              {/* OpenRouter Model Selection */}
              <div className="space-y-3">
                <label className={`block text-sm font-extrabold ${isAppLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Select OpenRouter Model:
                </label>
                <select
                  value={openrouterModel}
                  onChange={(e) => saveOpenrouterModel(e.target.value)}
                  className={`w-full px-4 py-4 rounded-xl border focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm font-semibold transition-all cursor-pointer ${
                    isAppLight
                      ? 'bg-white border-slate-300 text-slate-900'
                      : 'bg-slate-900 border-slate-800 text-slate-100'
                  }`}
                >
                  {OPENROUTER_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Connection Test Action */}
        <div className={`mt-8 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4 ${
          isAppLight ? 'border-slate-200' : 'border-slate-800/80'
        }`}>
          <button
            onClick={handleTestConnection}
            disabled={testStatus.loading}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-amber-500/25 hover:brightness-110 cursor-pointer disabled:opacity-50 transition-all"
          >
            {testStatus.loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Verifying Connection...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                <span>Test API Connection</span>
              </>
            )}
          </button>

          {testStatus.msg && (
            <div
              className={`p-4 rounded-xl text-sm font-semibold flex items-center gap-2.5 border w-full sm:w-auto ${
                testStatus.success
                  ? isAppLight
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : isAppLight
                  ? 'bg-rose-50 border-rose-300 text-rose-800'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              }`}
            >
              {testStatus.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{testStatus.msg}</span>
            </div>
          )}
        </div>
      </div>

      {/* OCR Engine Card — deliberately separate key/provider from Structuring above */}
      <div
        className={`p-8 lg:p-10 rounded-3xl border-2 shadow-2xl ${
          isAppLight
            ? 'glass-card-fatty-light border-slate-200'
            : 'glass-card-fatty border-slate-800'
        }`}
      >
        <div className={`flex items-center gap-5 pb-8 border-b ${isAppLight ? 'border-slate-200' : 'border-slate-800/80'}`}>
          <div className="p-4 rounded-2xl bg-gradient-to-tr from-blue-500 to-cyan-300 text-slate-950 font-black shadow-lg shadow-blue-500/25">
            <ScanText className="w-8 h-8 stroke-[2.5]" />
          </div>
          <div>
            <h2 className={`text-2xl lg:text-3xl font-black tracking-tight ${isAppLight ? 'text-slate-900' : 'text-white'}`}>
              OCR Engine — Document → Text
            </h2>
            <p className={`text-sm mt-1.5 ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Only used for scanned or legacy-encoded documents that need vision OCR. Deliberately a separate key from the Structuring engine above, so one call never eats the other's quota.
            </p>
          </div>
        </div>

        {/* OCR Method Selector */}
        <div className="mt-8 space-y-5">
          <label className={`block text-sm font-black uppercase tracking-widest ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
            Select OCR Method:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div
              onClick={() => saveOcrMethod('model')}
              className={`p-6 rounded-3xl border cursor-pointer transition-all flex items-start gap-4 ${
                ocrMethod === 'model'
                  ? isAppLight
                    ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-400/40 shadow-lg'
                    : 'bg-blue-500/15 border-blue-500 ring-2 ring-blue-500/50 shadow-lg shadow-blue-500/10'
                  : isAppLight
                  ? 'bg-white border-slate-200 hover:border-slate-400 shadow-sm'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className={`p-3.5 rounded-2xl shrink-0 ${
                ocrMethod === 'model'
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                  : isAppLight
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-blue-500/20 text-blue-500'
              }`}>
                <Sparkles className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <h3 className={`font-black text-lg ${isAppLight ? 'text-slate-900' : 'text-white'}`}>
                  AI Vision Model
                </h3>
                <p className={`text-sm mt-1.5 leading-relaxed ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Highest accuracy for scanned & legacy-encoded Bangla (conjunct-aware). Needs its own API key.
                </p>
              </div>
            </div>

            <div
              onClick={() => saveOcrMethod('browser')}
              className={`p-6 rounded-3xl border cursor-pointer transition-all flex items-start gap-4 ${
                ocrMethod === 'browser'
                  ? isAppLight
                    ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-400/40 shadow-lg'
                    : 'bg-emerald-500/15 border-emerald-500 ring-2 ring-emerald-500/50 shadow-lg shadow-emerald-500/10'
                  : isAppLight
                  ? 'bg-white border-slate-200 hover:border-slate-400 shadow-sm'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className={`p-3.5 rounded-2xl shrink-0 ${
                ocrMethod === 'browser'
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25'
                  : isAppLight
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-emerald-500/20 text-emerald-500'
              }`}>
                <MonitorSmartphone className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <h3 className={`font-black text-lg ${isAppLight ? 'text-slate-900' : 'text-white'}`}>
                  Browser OCR (Free)
                </h3>
                <p className={`text-sm mt-1.5 leading-relaxed ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Runs locally via Tesseract.js — no API key, unlimited use. Lower accuracy on Bangla conjuncts, slower on long scans.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* OCR Provider Details */}
        <div className="mt-8">
          {ocrMethod === 'model' ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <button
                  type="button"
                  onClick={() => saveOcrProvider('gemini')}
                  className={`px-5 py-3.5 rounded-xl border font-bold text-sm transition-all cursor-pointer ${
                    ocrProvider === 'gemini'
                      ? isAppLight
                        ? 'bg-amber-50 border-amber-400 text-amber-700'
                        : 'bg-amber-500/15 border-amber-500 text-amber-400'
                      : isAppLight
                      ? 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  Google Gemini (OCR)
                </button>
                <button
                  type="button"
                  onClick={() => saveOcrProvider('openrouter')}
                  className={`px-5 py-3.5 rounded-xl border font-bold text-sm transition-all cursor-pointer ${
                    ocrProvider === 'openrouter'
                      ? isAppLight
                        ? 'bg-blue-50 border-blue-400 text-blue-700'
                        : 'bg-blue-500/15 border-blue-500 text-blue-400'
                      : isAppLight
                      ? 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  OpenRouter (OCR)
                </button>
              </div>

              {ocrProvider === 'gemini' ? (
                <div className={`p-6 rounded-3xl border space-y-5 ${
                  isAppLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                }`}>
                  <div className="flex items-center justify-between">
                    <label className={`text-sm font-extrabold flex items-center gap-2 ${isAppLight ? 'text-amber-600' : 'text-amber-400'}`}>
                      <Key className="w-4 h-4" />
                      Google Gemini API Key (OCR):
                    </label>
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-amber-500 hover:text-amber-400 font-bold flex items-center gap-1 transition-colors"
                    >
                      Get Free Gemini Key <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <input
                    type="password"
                    value={ocrGeminiApiKey}
                    onChange={(e) => saveOcrGeminiKey(e.target.value)}
                    placeholder="Paste a Gemini API Key for OCR (can be a different key/project than Structuring)"
                    className={`w-full px-4 py-4 rounded-xl border focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 font-mono text-sm transition-all ${
                      isAppLight
                        ? 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
                        : 'bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-600'
                    }`}
                  />
                </div>
              ) : (
                <div className={`p-6 rounded-3xl border space-y-6 ${
                  isAppLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                }`}>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-extrabold text-blue-500 flex items-center gap-2">
                        <Key className="w-4 h-4" />
                        OpenRouter API Key (OCR):
                      </label>
                      <a
                        href="https://openrouter.ai/keys"
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-blue-500 hover:text-blue-400 font-bold flex items-center gap-1 transition-colors"
                      >
                        Get OpenRouter Key <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <input
                      type="password"
                      value={ocrOpenrouterApiKey}
                      onChange={(e) => saveOcrOpenrouterKey(e.target.value)}
                      placeholder="Paste an OpenRouter Key for OCR (can differ from Structuring)"
                      className={`w-full px-4 py-4 rounded-xl border focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 font-mono text-sm transition-all ${
                        isAppLight
                          ? 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
                          : 'bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-600'
                      }`}
                    />
                  </div>

                  <div className="space-y-3">
                    <label className={`block text-sm font-extrabold ${isAppLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      Select OpenRouter Vision Model:
                    </label>
                    <select
                      value={ocrOpenrouterModel}
                      onChange={(e) => saveOcrOpenrouterModel(e.target.value)}
                      className={`w-full px-4 py-4 rounded-xl border focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm font-semibold transition-all cursor-pointer ${
                        isAppLight
                          ? 'bg-white border-slate-300 text-slate-900'
                          : 'bg-slate-900 border-slate-800 text-slate-100'
                      }`}
                    >
                      {OPENROUTER_VISION_MODELS.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                    <p className={`text-xs ${isAppLight ? 'text-slate-500' : 'text-slate-500'}`}>
                      Only vision-capable models are listed — OCR needs a model that accepts image input.
                    </p>
                  </div>
                </div>
              )}

              <div className={`mt-8 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4 ${
                isAppLight ? 'border-slate-200' : 'border-slate-800/80'
              }`}>
                <button
                  onClick={handleTestOcrConnection}
                  disabled={ocrTestStatus.loading}
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-blue-500/25 hover:brightness-110 cursor-pointer disabled:opacity-50 transition-all"
                >
                  {ocrTestStatus.loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Verifying OCR Connection...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                      <span>Test OCR Connection</span>
                    </>
                  )}
                </button>

                {ocrTestStatus.msg && (
                  <div
                    className={`p-4 rounded-xl text-sm font-semibold flex items-center gap-2.5 border w-full sm:w-auto ${
                      ocrTestStatus.success
                        ? isAppLight
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                          : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : isAppLight
                        ? 'bg-rose-50 border-rose-300 text-rose-800'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                    }`}
                  >
                    {ocrTestStatus.success ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0" />
                    )}
                    <span>{ocrTestStatus.msg}</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className={`p-6 rounded-3xl border flex items-start gap-4 ${
              isAppLight
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            }`}>
              <MonitorSmartphone className="w-6 h-6 shrink-0 mt-0.5" />
              <div className="text-sm font-semibold leading-relaxed">
                Browser OCR runs entirely on this device using Tesseract.js — no API key needed, no rate limit.
                Bengali + English trained data (~a few MB) downloads once on first use and is cached for later runs.
                Expect noticeably lower accuracy than AI Vision on scanned or legacy-encoded (Bijoy) Bangla,
                especially for complex conjuncts (যুক্তাক্ষর) — best used as a fallback, not for high-stakes documents.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
