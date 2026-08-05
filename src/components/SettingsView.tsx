import React, { useState } from 'react';
import { Settings, Key, Cpu, CheckCircle2, AlertCircle, Loader2, Sparkles, ExternalLink, ShieldCheck } from 'lucide-react';

interface SettingsViewProps {
  appTheme?: 'dark' | 'light';
}

export type AIProvider = 'gemini' | 'openrouter';

export const OPENROUTER_MODELS = [
  { id: 'google/gemini-2.5-flash', name: 'Google Gemini 2.5 Flash (Fast & Precise)' },
  { id: 'google/gemini-1.5-pro', name: 'Google Gemini 1.5 Pro (Deep Reasoning)' },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Anthropic Claude 3.5 Sonnet (Elite Text Parsing)' },
  { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Meta Llama 3.3 70B (Open Source Master)' },
  { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1 (Advanced Math Reasoning)' },
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

  return (
    <div
      className={`border rounded-3xl p-6 lg:p-8 shadow-2xl space-y-8 max-w-4xl mx-auto ${
        isAppLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-4 pb-6 border-b border-slate-700/50">
        <div className="p-3.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
          <Settings className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-2xl font-black flex items-center gap-2">
            AI Provider & API Key Settings
          </h2>
          <p className="text-xs text-slate-400">
            Bring Your Own Key (BYOK) for Google Gemini or OpenRouter. Keys are stored locally in your browser.
          </p>
        </div>
      </div>

      {/* Security Banner */}
      <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-3">
        <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-400" />
        <span>
          <strong>Local Privacy Guarantee:</strong> API keys are never stored on any server or logged. They are sent directly from your browser to AI provider endpoints.
        </span>
      </div>

      {/* Provider Selector */}
      <div className="space-y-4">
        <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider">
          Choose Active AI Provider:
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Gemini Option */}
          <div
            onClick={() => saveProvider('gemini')}
            className={`p-5 rounded-2xl border cursor-pointer transition-all flex items-start gap-4 ${
              provider === 'gemini'
                ? 'bg-amber-500/10 border-amber-500 text-white ring-2 ring-amber-500/50'
                : isAppLight
                ? 'bg-slate-50 border-slate-200 hover:border-slate-400'
                : 'bg-slate-950 border-slate-800 hover:border-slate-700'
            }`}
          >
            <Sparkles className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                Google Gemini API
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Direct connection to Google AI Studio. Native support for multimodal vision & PDFs.
              </p>
            </div>
          </div>

          {/* OpenRouter Option */}
          <div
            onClick={() => saveProvider('openrouter')}
            className={`p-5 rounded-2xl border cursor-pointer transition-all flex items-start gap-4 ${
              provider === 'openrouter'
                ? 'bg-blue-500/10 border-blue-500 text-white ring-2 ring-blue-500/50'
                : isAppLight
                ? 'bg-slate-50 border-slate-200 hover:border-slate-400'
                : 'bg-slate-950 border-slate-800 hover:border-slate-700'
            }`}
          >
            <Cpu className="w-6 h-6 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                OpenRouter API
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Unified API gateway supporting Claude 3.5, Gemini 2.5, Llama 3.3, and DeepSeek R1.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Provider Details Form */}
      {provider === 'gemini' ? (
        <div className="space-y-4 p-6 rounded-2xl bg-slate-950 border border-slate-800">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-amber-400 flex items-center gap-2">
              <Key className="w-4 h-4" />
              Google Gemini API Key:
            </label>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-amber-400 hover:underline flex items-center gap-1"
            >
              Get Free Gemini Key <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <input
            type="password"
            value={geminiApiKey}
            onChange={(e) => saveGeminiKey(e.target.value)}
            placeholder="Paste your Gemini API Key (e.g. AIzaSy...)"
            className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:border-amber-500 font-mono text-sm ${
              isAppLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-slate-100'
            }`}
          />
          <p className="text-xs text-slate-500">
            Recommended default model: <code className="text-amber-400 font-mono">gemini-2.5-flash</code> (Fast multimodal vision & Bengali LaTeX text extraction).
          </p>
        </div>
      ) : (
        <div className="space-y-6 p-6 rounded-2xl bg-slate-950 border border-slate-800">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-blue-400 flex items-center gap-2">
                <Key className="w-4 h-4" />
                OpenRouter API Key:
              </label>
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-400 hover:underline flex items-center gap-1"
              >
                Get OpenRouter Key <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <input
              type="password"
              value={openrouterApiKey}
              onChange={(e) => saveOpenrouterKey(e.target.value)}
              placeholder="Paste your OpenRouter Key (e.g. sk-or-v1-...)"
              className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:border-blue-500 font-mono text-sm ${
                isAppLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-slate-100'
              }`}
            />
          </div>

          {/* OpenRouter Model Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-400">
              Select OpenRouter Model:
            </label>
            <select
              value={openrouterModel}
              onChange={(e) => saveOpenrouterModel(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:border-blue-500 text-sm font-semibold ${
                isAppLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-slate-100'
              }`}
            >
              {OPENROUTER_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.id})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Connection Test Action */}
      <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <button
          onClick={handleTestConnection}
          disabled={testStatus.loading}
          className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 hover:brightness-110 cursor-pointer disabled:opacity-50 transition-all"
        >
          {testStatus.loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Verifying Connection...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Test API Connection</span>
            </>
          )}
        </button>

        {testStatus.msg && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 border w-full sm:w-auto ${
              testStatus.success
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}
          >
            {testStatus.success ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            )}
            <span>{testStatus.msg}</span>
          </div>
        )}
      </div>
    </div>
  );
};
