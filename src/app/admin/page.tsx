"use client";

// apps/poc/pages/index.tsx (Admin Panel)
// apps/poc/pages/index.tsx
import React, { useState, useEffect, useRef } from "react";
import styles from "./admin.module.css";
import { debounce } from "lodash"; // Add lodash to your dependencies

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
  const [isSupported, setIsSupported] = useState(false);
  const [translation, setTranslation] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("ES");
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Debounced translation function
  const debouncedTranslate = useRef(
    debounce(async (text: string) => {
      if (!text.trim()) return;
      try {
        const response = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, targetLang: targetLanguage }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Translation failed");
        }

        const data = await response.json();
        setTranslation(data.translation);
      } catch (error) {
        console.error("Translation error:", error);
        setError(error instanceof Error ? error.message : "Translation failed");
      }
    }, 1000)
  ).current;

  useEffect(() => {
    // Check if we're in the browser
    if (typeof window === "undefined") {
      console.log("Running on server side");
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.error("Speech Recognition not supported in this browser");
      setError("Speech Recognition not supported in this browser");
      return;
    }

    try {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      console.log(recognitionRef.current, "recognitionRef.current");
      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = "";

        console.log(event, "event");
        for (let i = event.resultIndex; i < event?.results?.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + " ";
            console.log(finalTranscript, "finalTranscript");

            if (textareaRef.current) {
              const currentValue = textareaRef.current.value;
              const cursorPosition = textareaRef.current.selectionStart;
              const isAtEnd = cursorPosition === currentValue.length;

              textareaRef.current.value = currentValue + finalTranscript;

              // Maintain cursor position unless it was at the end
              if (!isAtEnd && cursorPosition !== null) {
                textareaRef.current.selectionStart = cursorPosition;
                textareaRef.current.selectionEnd = cursorPosition;
              }
              // Trigger translation for final transcripts
              debouncedTranslate(currentValue + finalTranscript || "");
            }
          }
        }
      };

      recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        setError(event.error);
      };

      recognitionRef.current.onend = () => {
        if (isListening && recognitionRef.current) {
          recognitionRef.current.start();
        }
      };
    } catch (error) {
      console.error("Error initializing Speech Recognition:", error);
      setError("Failed to initialize Speech Recognition");
      setIsSupported(false);
    }

    return () => {
      debouncedTranslate.cancel();
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isListening, debouncedTranslate]);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    debouncedTranslate(e.target.value);
  };

  const startListening = () => {
    try {
      if (!recognitionRef.current) {
        const SpeechRecognition =
          window.SpeechRecognition || window.webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
      }
      recognitionRef.current.start();
      setIsListening(true);
      setError(null);
    } catch (error) {
      console.error("Error starting recognition:", error);
      setIsListening(false);
      setError("Failed to start listening");
    }
  };

  const stopListening = () => {
    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      setIsListening(false);
    } catch (error) {
      console.error("Error stopping recognition:", error);
      setError("Failed to stop listening");
    }
  };

  const clearText = () => {
    if (textareaRef.current) {
      textareaRef.current.value = "";
      setTranslation("");
      setError(null);
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
      {error && <div className={styles.error}>{error}</div>}

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

        <div className={styles.buttonGroup}>
          <button
            onClick={isListening ? stopListening : startListening}
            className={isListening ? styles.stopButton : styles.startButton}
          >
            {isListening ? "Stop Listening" : "Start Listening"}
          </button>
          <button onClick={clearText} className={styles.clearButton}>
            Clear
          </button>
        </div>

        <div className={styles.status}>
          Status: {isListening ? "Listening..." : "Not Listening"}
        </div>

        <div className={styles.transcriptBox}>
          <h3>Real-time Transcript:</h3>
          <textarea
            ref={textareaRef}
            onChange={handleTextareaChange}
            className={styles.transcriptArea}
            placeholder="Start speaking or type here..."
            rows={5}
          />
        </div>

        <div className={styles.transcriptBox}>
          <h3>Translation:</h3>
          <p>{translation || "Translation will appear here..."}</p>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
