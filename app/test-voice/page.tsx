'use client';

import { BrowserVoiceInput, VoiceSuggestion } from "../../components/browser-voice-input";

export default function TestVoicePage() {
  const handleSuggestion = (suggestion: VoiceSuggestion) => {
    console.log('Voice suggestion received:', suggestion);
    alert(`Titolo: ${suggestion.title}\nDescrizione: ${suggestion.description}\nTrascrizione: ${suggestion.transcript}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Test Riconoscimento Vocale</h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Informazioni sul Browser</h2>
          <div className="space-y-2 text-sm">
            <p><strong>User Agent:</strong> {typeof window !== 'undefined' ? navigator.userAgent : 'N/A'}</p>
            <p><strong>Supporto Speech Recognition:</strong> {typeof window !== 'undefined' && (('SpeechRecognition' in window) || ('webkitSpeechRecognition' in window)) ? '✅ Sì' : '❌ No'}</p>
            <p><strong>Linguaggio Browser:</strong> {typeof window !== 'undefined' ? navigator.language : 'N/A'}</p>
            <p><strong>HTTPS:</strong> {typeof window !== 'undefined' && window.location.protocol === 'https:' ? '✅ Sì' : '❌ No (necessario per il microfono)'}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Test Input Vocale</h2>
          <BrowserVoiceInput onSuggestion={handleSuggestion} />
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Istruzioni:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
            <li>Assicurati di usare Chrome, Edge o un browser che supporta Web Speech API</li>
            <li>Consenti l'accesso al microfono quando richiesto</li>
            <li>Parla chiaramente in italiano</li>
            <li>Controlla la console per eventuali errori</li>
          </ol>
        </div>
      </div>
    </div>
  );
}