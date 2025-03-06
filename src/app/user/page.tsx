// apps/poc/pages/translate.tsx
'use client'

// apps/poc/pages/streaming.tsx
import React, { useState, useEffect, useRef } from 'react';
import { StreamingService } from '../../service/StreamingService';
import styles from './translate.module.css';

const StreamingPage = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [translation, setTranslation] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('ES');
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const streamingServiceRef = useRef<StreamingService>(new StreamingService());

  useEffect(() => {
    // return () => {
    //   stopStreaming();
    //   streamingServiceRef.current.cleanup();
    // };
  }, []);

  const translateText = async (text: string) => {
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, targetLang: targetLanguage }),
      });

      if (!response.ok) throw new Error('Translation failed');

      const data = await response.json();
      setTranslation(data.translation);
    } catch (error) {
      console.error('Translation error:', error);
      setError('Translation failed');
    }
  };

  const startStreaming = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 48000,
        }
      });
      
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          try {
            const buffer = await event.data.arrayBuffer();
            const base64Audio = Buffer.from(buffer).toString('base64');

            const transcription = await streamingServiceRef.current.processAudio(base64Audio);
            if (transcription) {
              setTranscript(prev => {
                const newText = prev ? `${prev} ${transcription}` : transcription;
                translateText(newText);
                return newText;
              });
            }
          } catch (error) {
            console.error('Error processing audio:', error);
            setError('Error processing audio');
          }
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(3000);
      setIsStreaming(true);
      streamingServiceRef.current.setStreaming(true);
      setError(null);

    } catch (error) {
      console.error('Error starting stream:', error);
      setError(error instanceof Error ? error.message : 'Failed to start streaming');
      stopStreaming();
    }
  };

  const stopStreaming = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    setIsStreaming(false);
    setTranslation('');
    streamingServiceRef.current.setStreaming(false);
  };

  return (
    <div className={styles.container}>
      <h1>Real-time Translation</h1>

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
          {/* Add more languages as needed */}
        </select>

        <button
          onClick={isStreaming ? stopStreaming : startStreaming}
          className={isStreaming ? styles.stopButton : styles.startButton}
        >
          {isStreaming ? 'Stop' : 'Start'} Translation
        </button>

        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}

        <div className={styles.status}>
          Status: {isStreaming ? 'Recording...' : 'Stopped'}
        </div>

        <div className={styles.transcriptBox}>
          <h3>Original Text:</h3>
          <p>{transcript}</p>
        </div>

        <div className={styles.translationBox}>
          <h3>Translation:</h3>
          <p>{translation}</p>
        </div>
      </div>
    </div>
  );
};

export default StreamingPage;