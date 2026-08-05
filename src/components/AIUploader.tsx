import React, { useState } from 'react';
import { MCQItem } from '../types';
import { Sparkles, Upload, FileText, AlertCircle, CheckCircle2, Loader2, ArrowRight, Edit3 } from 'lucide-react';

interface AIUploaderProps {
  onAddMCQs: (items: MCQItem[]) => void;
  onReviewMCQs?: (items: MCQItem[]) => void;
  appTheme?: 'dark' | 'light';
}

export const AIUploader: React.FC<AIUploaderProps> = ({
  onAddMCQs,
  onReviewMCQs,
  appTheme = 'dark',
}) => {
  const isAppLight = appTheme === 'light';
  const [geminiApiKey, setGeminiApiKey] = useState<string>(() => {
    return localStorage.getItem('mcqgen.geminiKey') || '';
  });
  const [promptText, setPromptText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [parsedResult, setParsedResult] = useState<MCQItem[] | null>(null);

  const handleApiKeyChange = (key: string) => {
    setGeminiApiKey(key);
    localStorage.setItem('mcqgen.geminiKey', key);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);

      const reader = new FileReader();
      reader.onload = (evt) => {
        const result = evt.target?.result as string;
        if (result) {
          const base64Data = result.split(',')[1];
          setFileBase64(base64Data);
        }
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const [stage1Text, setStage1Text] = useState<string | null>(null);
  const [showStage1Preview, setShowStage1Preview] = useState<boolean>(false);
  const [processingStage, setProcessingStage] = useState<'idle' | 'stage1_ocr' | 'stage2_structure'>('idle');

  const handleRunAI = async () => {
    if (!promptText.trim() && !fileBase64) {
      setErrorMsg('Please paste text or attach a file/PDF to parse.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setParsedResult(null);
    setStage1Text(null);
    setProcessingStage(fileBase64 ? 'stage1_ocr' : 'stage2_structure');

    try {
      const activeProvider = (localStorage.getItem('mcqgen.provider') as 'gemini' | 'openrouter') || 'gemini';
      const storedGeminiKey = localStorage.getItem('mcqgen.geminiKey') || geminiApiKey;
      const storedOpenrouterKey = localStorage.getItem('mcqgen.openrouterKey') || '';
      const storedOpenrouterModel = localStorage.getItem('mcqgen.openrouterModel') || 'google/gemini-2.5-flash';

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-ai-provider': activeProvider,
      };

      if (activeProvider === 'gemini') {
        if (!storedGeminiKey.trim()) {
          throw new Error('Gemini API Key is missing. Please enter your API key in Settings.');
        }
        headers['x-gemini-key'] = storedGeminiKey.trim();
      } else {
        if (!storedOpenrouterKey.trim()) {
          throw new Error('OpenRouter API Key is missing. Please enter your API key in Settings.');
        }
        headers['x-openrouter-key'] = storedOpenrouterKey.trim();
        headers['x-openrouter-model'] = storedOpenrouterModel;
      }

      const response = await fetch('/api/ai/parse-mcqs', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          promptText: promptText || undefined,
          mimeType: file?.type || undefined,
          fileBase64: fileBase64 || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to parse questions with AI.');
      }

      setParsedResult(data.items);
      if (data.stage1Text) {
        setStage1Text(data.stage1Text);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred during AI parsing.');
    } finally {
      setIsLoading(false);
      setProcessingStage('idle');
    }
  };

  const handleLoadParsedDirect = () => {
    if (parsedResult && parsedResult.length > 0) {
      onAddMCQs(parsedResult);
      setParsedResult(null);
      setPromptText('');
      setFile(null);
      setFileBase64(null);
    }
  };

  const handleSendToReview = () => {
    if (parsedResult && parsedResult.length > 0) {
      if (onReviewMCQs) {
        onReviewMCQs(parsedResult);
      } else {
        onAddMCQs(parsedResult);
      }
      setParsedResult(null);
      setPromptText('');
      setFile(null);
      setFileBase64(null);
    }
  };

  return (
    <div
      className={`p-8 lg:p-10 rounded-3xl border shadow-2xl transition-all ${
        isAppLight
          ? 'bg-white border-slate-200 text-slate-900 shadow-slate-200/50'
          : 'bg-slate-900/90 border-slate-800 text-white shadow-black/50'
      }`}
    >
      <div className={`flex items-center gap-4 pb-6 border-b mb-8 ${isAppLight ? 'border-slate-200' : 'border-slate-800/80'}`}>
        <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 font-black shadow-lg shadow-amber-500/20">
          <Sparkles className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
            AI Automated MCQ Ingestion
            <span className="text-xs px-3 py-1 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-mono font-extrabold uppercase">
              2-Stage Vision OCR
            </span>
          </h2>
          <p className={`text-sm mt-0.5 ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
            Upload SSC/HSC Board Exam PDFs, DOCX, image scans, or raw text to extract structured MCQ slides.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Left Column: Input Form */}
        <div className="flex flex-col gap-6">
          {/* Gemini API Key BYOK Input */}
          <div>
            <label className={`block text-sm font-extrabold mb-2.5 flex items-center justify-between ${isAppLight ? 'text-slate-800' : 'text-slate-300'}`}>
              <span>Gemini / OpenRouter API Key (BYOK):</span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline"
              >
                Get Free Key ↗
              </a>
            </label>
            <input
              type="password"
              value={geminiApiKey}
              onChange={(e) => handleApiKeyChange(e.target.value)}
              placeholder="Paste your API Key (e.g. AIzaSy...)"
              className={`w-full px-4 py-3.5 rounded-2xl border focus:outline-none focus:border-amber-500 font-mono text-sm font-semibold transition-all ${
                isAppLight
                  ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'
                  : 'bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-600'
              }`}
            />
          </div>

          {/* Text Input */}
          <div>
            <label className={`block text-sm font-extrabold mb-2.5 ${isAppLight ? 'text-slate-800' : 'text-slate-300'}`}>
              Paste Raw Question Text or Exam Content:
            </label>
            <textarea
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="Paste raw unformatted exam text, notes, or math formulas here..."
              className={`w-full h-48 p-4 rounded-2xl border focus:outline-none focus:border-amber-500 text-sm leading-relaxed resize-none transition-all ${
                isAppLight
                  ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'
                  : 'bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-600'
              }`}
            />
          </div>

          {/* Fatty File Upload Zone */}
          <div>
            <label className={`block text-sm font-extrabold mb-2.5 ${isAppLight ? 'text-slate-800' : 'text-slate-300'}`}>
              Or Attach Question Paper (PDF, PNG, JPG, DOCX):
            </label>
            <div
              className={`relative border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center gap-3 transition-all text-center cursor-pointer group ${
                isAppLight
                  ? 'bg-slate-50/80 border-slate-300 hover:border-amber-500 hover:bg-amber-50/60 shadow-sm'
                  : 'bg-slate-950/60 border-slate-800 hover:border-amber-500/50 hover:bg-slate-950'
              }`}
            >
              <input
                type="file"
                accept=".pdf,image/*,.txt,.doc,.docx"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <div className="p-4 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                <Upload className="w-8 h-8" />
              </div>
              {file ? (
                <div>
                  <p className="text-base font-black text-amber-600 dark:text-amber-400">{file.name}</p>
                  <p className={`text-xs font-mono mt-1 ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type || 'Document'}
                  </p>
                </div>
              ) : (
                <div>
                  <p className={`text-base font-black ${isAppLight ? 'text-slate-900' : 'text-white'}`}>Click to browse or drag & drop file</p>
                  <p className={`text-xs font-medium mt-1 ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    Supports 2-Stage Vision OCR for Board Exam PDFs & scanned photo test papers
                  </p>
                </div>
              )}
            </div>
          </div>

          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-sm font-semibold flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            onClick={handleRunAI}
            disabled={isLoading}
            className="btn-fatty-primary w-full py-4 text-base rounded-2xl"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Processing 2-Stage AI Extraction...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 fill-slate-950" />
                <span>Process Document with AI</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column: AI Extraction Results */}
        <div
          className={`p-8 rounded-3xl border flex flex-col justify-between ${
            isAppLight
              ? 'bg-slate-50/80 border-slate-200 text-slate-900'
              : 'bg-slate-950/80 border-slate-800 text-slate-100'
          }`}
        >
          <div>
            <h3 className="text-sm font-bold text-amber-500 uppercase tracking-wider mb-4 flex items-center justify-between">
              <span>Parsed Preview Output</span>
              {parsedResult && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 font-mono">
                  {parsedResult.length} MCQs Identified
                </span>
              )}
            </h3>

            {!parsedResult && !isLoading && (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <FileText className="w-12 h-12 stroke-[1.5] mb-2 text-slate-400" />
                <p className="text-sm">No items processed yet.</p>
                <p className="text-xs mt-1 text-slate-400">
                  Upload a PDF or paste text on the left to extract questions into slides.
                </p>
              </div>
            )}

            {isLoading && (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-amber-500 space-y-3">
                <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
                <div>
                  <p className="text-sm font-bold text-amber-400">
                    {processingStage === 'stage1_ocr'
                      ? 'Stage 1/2: Extracting Text & LaTeX Formulas via Vision OCR...'
                      : 'Stage 2/2: Structuring MCQs & Normalizing Bangla Numerals...'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Multi-column layout alignment & Zod schema validation...
                  </p>
                </div>
              </div>
            )}

            {stage1Text && (
              <div className="mb-4">
                <button
                  onClick={() => setShowStage1Preview(!showStage1Preview)}
                  className="text-xs text-amber-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer mb-2"
                >
                  {showStage1Preview ? 'Hide Stage 1 Vision OCR Text' : 'Inspect Stage 1 Vision OCR Text ↗'}
                </button>
                {showStage1Preview && (
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300 max-h-40 overflow-y-auto whitespace-pre-wrap">
                    {stage1Text}
                  </div>
                )}
              </div>
            )}

            {parsedResult && parsedResult.length > 0 && (
              <div className="max-h-80 overflow-y-auto space-y-3 pr-2">
                {parsedResult.map((mcq, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border text-xs ${
                      isAppLight
                        ? 'bg-white border-slate-200'
                        : 'bg-slate-900 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-amber-500 mb-1">
                      <span>
                        Q{idx + 1}: {mcq.stem.substring(0, 45)}...
                      </span>
                      {mcq.confidence === 'low' && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-500 border border-amber-500/30">
                          Review Needed
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-1 font-mono">
                      {mcq.options.map((opt, oIdx) => (
                        <div
                          key={oIdx}
                          className={opt.isCorrect ? 'text-emerald-500 font-bold' : 'text-slate-400'}
                        >
                          {opt.key}: {opt.text} {opt.isCorrect && '✓'}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {parsedResult && parsedResult.length > 0 && (
            <div className="mt-4 flex flex-col gap-2">
              <button
                onClick={handleSendToReview}
                className="w-full py-3.5 rounded-xl bg-amber-500 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg hover:brightness-110 cursor-pointer"
              >
                <Edit3 className="w-5 h-5" />
                <span>Review & Edit in Question Creator ({parsedResult.length} MCQs) →</span>
              </button>
              <button
                onClick={handleLoadParsedDirect}
                className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border cursor-pointer ${
                  isAppLight
                    ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Directly Load into Deck (Skip Review)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
