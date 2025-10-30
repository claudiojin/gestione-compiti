'use client';

import type { ChangeEvent } from "react";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";

const hasMediaRecorder = typeof window !== "undefined" && "MediaRecorder" in window;

export type VoiceSuggestion = {
  title: string;
  description: string;
  transcript: string;
};

type VoiceTaskInputProps = {
  onSuggestion: (suggestion: VoiceSuggestion) => void;
};

export function VoiceTaskInput({ onSuggestion }: VoiceTaskInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isUploading, startTransition] = useTransition();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    return () => {
      mediaRecorderRef.current?.stream.getTracks().forEach((track) => track.stop());
      mediaRecorderRef.current = null;
    };
  }, []);

  const supportLabel = useMemo(() => {
    if (!hasMediaRecorder) {
      return "Il tuo browser non supporta la registrazione diretta. Carica un file audio.";
    }
    return "Premi registra e detta il compito da aggiungere.";
  }, []);

  const handleRecordingAvailable = (event: BlobEvent) => {
    if (event.data && event.data.size > 0) {
      chunksRef.current.push(event.data);
    }
  };

  const handleStop = () => {
    const blob = new Blob(chunksRef.current, { type: "audio/webm" });
    chunksRef.current = [];
    uploadBlob(blob, "registrazione.webm");
  };

  const startRecording = async () => {
    try {
      setError(null);
      setStatus("Registrazione in corso...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      recorder.addEventListener("dataavailable", handleRecordingAvailable);
      recorder.addEventListener("stop", handleStop, { once: true });
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Unable to start recording", err);
      setError("Non è possibile accedere al microfono. Controlla i permessi.");
      setStatus(null);
    }
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    setStatus("Elaborazione audio...");
    recorder.stop();
    recorder.stream.getTracks().forEach((track) => track.stop());
    setIsRecording(false);
  };

  const uploadBlob = (blob: Blob, filename: string) => {
    if (!blob || blob.size === 0) {
      setError("Registrazione vuota, riprova.");
      setStatus(null);
      return;
    }

    const formData = new FormData();
    formData.append("audio", blob, filename);

    startTransition(async () => {
      setError(null);
      setStatus("Trascrizione in corso...");
      try {
        const response = await fetch("/api/tasks/voice", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          const message =
            (payload && (payload.error as string)) || "Trascrizione non disponibile.";
          setError(message);
          setStatus(null);
          return;
        }

        const payload = (await response.json()) as {
          transcript: string;
          suggestion: { title: string; description: string };
        };

        onSuggestion({
          title: payload.suggestion.title,
          description: payload.suggestion.description,
          transcript: payload.transcript,
        });
        setStatus("Trascrizione completata ✔");
      } catch (err) {
        console.error("Voice upload failed", err);
        setError("Errore di rete durante l'invio dell'audio.");
        setStatus(null);
      }
    });
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);
    uploadBlob(file, file.name);
    event.target.value = "";
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Inserisci via voce
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">{supportLabel}</p>
        </div>
        {hasMediaRecorder ? (
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold shadow transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 ${isRecording ? "bg-rose-500 text-white hover:bg-rose-600" : "bg-emerald-500 text-white hover:bg-emerald-600"}`}
          >
            {isRecording ? "Ferma" : "Registra"}
          </button>
        ) : null}
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600">
          Carica audio
          <input
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={handleFileChange}
            disabled={isUploading}
          />
        </label>
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
