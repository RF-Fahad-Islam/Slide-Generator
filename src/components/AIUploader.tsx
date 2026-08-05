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

  const handleRunAI = async () => {
    if (!promptText.trim() && !fileBase64) {
      setErrorMsg('Please paste text or attach a file/PDF to parse.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setParsedResult(null);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (geminiApiKey.trim()) {
        headers['x-gemini-key'] = geminiApiKey.trim();
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
        throw new Error(data.error || 'Failed to parse questions with Gemini AI.');
      }

      setParsedResult(data.items);
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred during AI parsing.');
    } finally {
      setIsLoading(false);
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
      className={`border rounded-3xl p-6 lg:p-8 shadow-2xl ${
        isAppLight
          ? 'bg-white border-slate-200 text-slate-900'
          : 'bg-slate-900 border-slate-800 text-white'
      }`}
    >
      <div className="flex items-center gap-3 pb-6 border-b border-slate-700/50 mb-6">
        <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-500 border border-amber-500/30">
          <Sparkles className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            Gemini AI Automated MCQ Ingestion
          </h2>
          <p className="text-xs text-slate-400">
            Upload question paper PDFs, DOCX, image scans, or raw text to extract structured MCQ slides
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Input Form */}
        <div className="flex flex-col gap-6">
          {/* Gemini API Key BYOK Input */}
          <div>
            <label className="block text-sm font-bold mb-2 text-slate-400 flex items-center justify-between">
              <span>Gemini API Key (BYOK - Stored locally in browser):</span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-amber-500 hover:underline"
              >
                Get Free API Key ↗
              </a>
            </label>
            <input
              type="password"
              value={geminiApiKey}
              onChange={(e) => handleApiKeyChange(e.target.value)}
              placeholder="Paste your Gemini API Key (e.g. AIzaSy...)"
              className={`w-full px-4 py-3 rounded-2xl border focus:outline-none focus:border-amber-500 text-sm ${
                isAppLight
                  ? 'bg-slate-50 border-slate-300 text-slate-900'
                  : 'bg-slate-950 border-slate-800 text-slate-100'
              }`}
            />
          </div>

          {/* Text Input */}
          <div>
            <label className="block text-sm font-bold mb-2 text-slate-400">
              Paste Raw Question Text or Unstructured Exam Content:
            </label>
            <textarea
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="Paste raw unformatted exam paper content or notes here..."
              className={`w-full h-44 p-4 rounded-2xl border focus:outline-none focus:border-amber-500 text-sm leading-relaxed resize-none ${
                isAppLight
                  ? 'bg-slate-50 border-slate-300 text-slate-900'
                  : 'bg-slate-950 border-slate-800 text-slate-100'
              }`}
            />
          </div>

          {/* File Upload Zone */}
          <div>
            <label className="block text-sm font-bold mb-2 text-slate-400">
              Or Attach Question Document (PDF, PNG, JPG):
            </label>
            <div
              className={`relative border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center gap-3 transition-colors text-center cursor-pointer ${
                isAppLight
                  ? 'bg-slate-50 border-slate-300 hover:border-amber-500'
                  : 'bg-slate-950 border-slate-800 hover:border-amber-500/50'
              }`}
            >
              <input
                type="file"
                accept=".pdf,image/*,.txt,.doc,.docx"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <Upload className="w-8 h-8 text-amber-500" />
              {file ? (
                <div>
                  <p className="text-sm font-bold text-amber-500">{file.name}</p>
                  <p className="text-xs text-slate-400 font-mono">
                    {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type || 'Document'}
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-semibold">Click to browse or drag & drop file</p>
                  <p className="text-xs text-slate-400 font-mono mt-1">
                    Supports Board exam PDFs, handwritten scan photos, & DOCX
                  </p>
                </div>
              )}
            </div>
          </div>

          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-sm flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            onClick={handleRunAI}
            disabled={isLoading}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-extrabold text-base flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 hover:brightness-110 transition-all cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Extracting & Validating MCQs with Gemini AI...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 fill-slate-950" />
                <span>Process with Gemini AI</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column: AI Extraction Results */}
        <div
          className={`p-6 rounded-2xl border flex flex-col justify-between ${
            isAppLight
              ? 'bg-slate-50 border-slate-200 text-slate-900'
              : 'bg-slate-950 border-slate-800 text-slate-100'
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
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-amber-500">
                <Loader2 className="w-10 h-10 animate-spin mb-3 text-amber-500" />
                <p className="text-sm font-bold">Analyzing document & normalizing Bangla numerals...</p>
                <p className="text-xs text-slate-400 mt-1">
                  Structuring options, roman items, and board tags...
                </p>
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
