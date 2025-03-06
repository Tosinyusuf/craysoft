"use client";

// apps/poc/pages/index.tsx (Admin Panel)
// apps/poc/pages/index.tsx
import React, { useState, useEffect, useRef } from "react";
import styles from "./admin.module.css";

// Properly typed interface for SpeechRecognition
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: {
    length: number;
    [key: number]: {
      isFinal: boolean;
      [key: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
}

// Update Window interface
interface Window {
  SpeechRecognition: {
    new (): SpeechRecognition;
  };
  webkitSpeechRecognition: {
    new (): SpeechRecognition;
  };
}

declare let window: Window;

const AdminPanel = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(false);
  const [translation, setTranslation] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("ES");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    // Check if Speech Recognition is supported
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = async (
        event: SpeechRecognitionEvent
      ) => {
        let finalTranscript = "";
        // let interimTranscript = "";

        for (let i = event.resultIndex; i < event?.results?.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + " ";
          } else {
            // interimTranscript += transcript;
          }
        }

        // Update transcript with both final and interim
        setTranscript((prev) => {
          const newText = prev + finalTranscript;
          // Only translate when we have final text
          if (finalTranscript.trim()) {
            translateText(finalTranscript.trim());
          }
          return newText;
        });
      };

      recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        // Auto restart if we're still supposed to be listening
        if (isListening && recognitionRef.current) {
          recognitionRef.current.start();
        }
      };
    } else {
      console.error("Speech Recognition not supported");
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isListening]);

  const translateText = async (text: string) => {
    try {
      if (!text.trim()) return;
      
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text, targetLang: targetLanguage }),
      });

      if (!response.ok) throw new Error("Translation failed");

      const data = await response.json();
      setTranslation((prev) => {
        return prev ? `${prev} ${data.translation}` : data.translation;
      });
    } catch (error) {
      console.error("Translation error:", error);
      setError("Translation failed");
    }
  };

  const startListening = () => {
    try {
      if (!recognitionRef.current) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
      }
      recognitionRef.current.start();
      setIsListening(true);
    } catch (error) {
      console.error("Error starting recognition:", error);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null; // Clear the reference
        
        // Reinitialize recognition for next use
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
      }
      setIsListening(false);
    } catch (error) {
      console.error("Error stopping recognition:", error);
    }
  };


  if (!isSupported) {
    return (
      <div className={styles.container}>
        <h1>Speech to Text POC</h1>
        <div className={styles.error}>
          <p>Speech Recognition is not supported in your browser.</p>
          <p>Please use Chrome, Edge, or another supported browser.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1>Speech to Text POC</h1>
      <h1>{error}</h1>

      <div className={styles.controls}>
        <select
          value={targetLanguage}
          onChange={(e) => setTargetLanguage(e.target.value)}
          className={styles.languageSelect}
        >
          <option value="ES">Spanish</option>
          <option value="FR">French</option>
          <option value="DE">German</option>
          <option value="IT">Italian</option>
          <option value="JA">Japanese</option>
        </select>
        <button
          onClick={isListening ? stopListening : startListening}
          className={isListening ? styles.stopButton : styles.startButton}
        >
          {isListening ? "Stop Listening" : "Start Listening"}
        </button>

        <div className={styles.status}>
          <p>Status: {isListening ? "Listening..." : "Not Listening"}</p>
        </div>

        <div className={styles.transcriptBox}>
          <h3>Real-time Transcript:</h3>
          <p>{transcript || "Start speaking..."}</p>
        </div>
        <div className={styles.transcriptBox}>
          <h3>Translation:</h3>
          <p>{translation}</p>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
