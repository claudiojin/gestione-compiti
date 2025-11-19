'use client';

import { useEffect, useMemo, useRef, useState } from "react";

// 检查浏览器是否支持语音识别
const hasSpeechRecognition =
  typeof window !== "undefined" &&
  ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

export type VoiceSuggestion = {
  title: string;
  description: string;
  transcript: string;
};

type BrowserVoiceInputProps = {
  onSuggestion: (suggestion: VoiceSuggestion) => void;
};

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export function BrowserVoiceInput({ onSuggestion }: BrowserVoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>("");
  const transcriptRef = useRef<string>("");
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // 清理函数
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, []);

  const supportLabel = useMemo(() => {
    if (!hasSpeechRecognition) {
      return "Il tuo browser non supporta il riconoscimento vocale. Usa Chrome o Edge.";
    }
    return "Premi registra o usa la tastiera per dettare il compito. Assicurati di consentire l'accesso al microfono.";
  }, []);

  const generateTaskSuggestion = async (text: string) => {
    setStatus("Elaborazione suggerimento...");

    try {
      // 调用现有的AI建议API（使用NVIDIA API）
      const response = await fetch("/api/tasks/suggest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ transcript: text }),
      });

      if (!response.ok) {
        throw new Error("Errore nella generazione del suggerimento");
      }

      const suggestion = await response.json();

      onSuggestion({
        title: suggestion.title || text.split(/[.!?\n]/)[0]?.trim() || "Nuova attività",
        description: suggestion.description || text.trim() || "Note importate dalla dettatura.",
        transcript: text,
      });

      setStatus("Trascrizione completata ✔");
    } catch (err) {
      console.error("Failed to generate suggestion", err);
      // 使用简单的fallback
      const fallbackTitle = text.split(/[.!?\n]/)[0]?.trim() || "Nuova attività";
      onSuggestion({
        title: fallbackTitle.slice(0, 80),
        description: text.trim().slice(0, 400) || "Note importate dalla dettatura.",
        transcript: text,
      });
      setStatus("Trascrizione completata ✔");
    }
  };

  const startRecording = () => {
    if (!hasSpeechRecognition) {
      setError("Il browser non supporta il riconoscimento vocale");
      return;
    }

    try {
      setError(null);
      setStatus("Ascolto...");
      transcriptRef.current = "";
      setTranscript("");

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setError("Il browser non supporta il riconoscimento vocale. Usa Chrome o Edge.");
        return;
      }

      const recognition = new SpeechRecognition();

      // 配置语音识别
      recognition.continuous = false; // 改为false，避免持续录音
      recognition.interimResults = true;
      recognition.lang = 'it-IT';
      recognition.maxAlternatives = 1;

      console.log('Starting speech recognition with config:', {
        continuous: recognition.continuous,
        interimResults: recognition.interimResults,
        lang: recognition.lang
      });

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        console.log('Speech recognition result:', event);

        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;

          if (result.isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        if (interimTranscript) {
          setStatus(`Ascoltando: ${interimTranscript}`);
        }

        if (finalTranscript) {
          setTranscript((prev) => {
            const updated = `${prev}${finalTranscript}`.trim();
            transcriptRef.current = updated;
            console.log('Final transcript:', updated);
            return updated;
          });
          setStatus(`Trascrizione: ${finalTranscript}`);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error, event.message);
        let errorMessage = "Errore nel riconoscimento vocale";

        switch(event.error) {
          case 'no-speech':
            errorMessage = "Nessun parlato rilevato. Riprova.";
            break;
          case 'audio-capture':
            errorMessage = "Microfono non disponibile. Controlla i permessi.";
            break;
          case 'not-allowed':
            errorMessage = "Permesso microfono negato. Consenti l'accesso al microfono.";
            break;
          case 'network':
            errorMessage = "Errore di rete. Controlla la connessione.";
            break;
          case 'service-not-allowed':
            errorMessage = "Servizio di riconoscimento vocale non disponibile. Usa Chrome o Edge.";
            break;
          case 'aborted':
            errorMessage = "Registrazione interrotta.";
            break;
          default:
            errorMessage = `Errore: ${event.error || 'sconosciuto'}`;
        }

        setError(errorMessage);
        setIsRecording(false);
        setStatus(null);
      };

      recognition.onend = () => {
        console.log('Speech recognition ended');
        setIsRecording(false);

        // 延迟检查，确保所有结果都已处理
        setTimeout(() => {
          const finalTranscript = transcriptRef.current.trim();
          if (finalTranscript) {
            console.log('Processing transcript for suggestion:', finalTranscript);
            generateTaskSuggestion(finalTranscript);
          } else {
            setStatus("Nessuna trascrizione rilevata. Riprova.");
            setTimeout(() => setStatus(null), 2000);
          }
        }, 100);
      };

      recognitionRef.current = recognition;
      recognition.start();

    } catch (err) {
      console.error("Unable to start speech recognition", err);
      setError("Non è possibile avviare il riconoscimento vocale. Controlla i permessi del microfono.");
      setStatus(null);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setStatus("Elaborazione audio...");
      setIsRecording(false);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Inserisci via voce
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">{supportLabel}</p>
          {hasSpeechRecognition && (
            <p className="text-xs text-slate-400 dark:text-slate-500">💡 Premi Spazio o Ctrl+Spazio per avviare</p>
          )}
        </div>

        {hasSpeechRecognition ? (
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            onKeyDown={(e) => {
              // 支持空格键触发语音识别
              if (e.key === ' ' && !isRecording) {
                e.preventDefault();
                startRecording();
              }
            }}
            className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold shadow transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 ${
              isRecording
                ? "bg-rose-500 text-white hover:bg-rose-600 animate-pulse"
                : "bg-emerald-500 text-white hover:bg-emerald-600"
            }`}
            title={isRecording ? "Ferma registrazione (Spazio)" : "Avvia registrazione (Spazio)"}
          >
            {isRecording ? "Ferma" : "Registra 🎤"}
          </button>
        ) : (
          <div className="text-xs text-amber-600 dark:text-amber-400">
            Browser non supportato - usa Chrome o Edge
          </div>
        )}

        {transcript && (
          <div className="mt-2 p-2 bg-slate-100 dark:bg-slate-800 rounded text-xs text-slate-600 dark:text-slate-300">
            <strong>Trascrizione:</strong> {transcript}
          </div>
        )}
      </div>

      {status ? (
        <p className="mt-2 text-xs font-medium text-emerald-600 dark:text-emerald-300">
          {status}
        </p>
      ) : null}

      {error ? (
        <p className="mt-2 text-xs font-medium text-rose-600 dark:text-rose-300">{error}</p>
      ) : null}
    </section>
  );
}
