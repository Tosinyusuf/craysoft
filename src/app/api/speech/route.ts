import { NextResponse } from 'next/server';
import { SpeechClient, protos } from '@google-cloud/speech';

const speechClient = new SpeechClient({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    project_id: process.env.NEXT_PUBLIC_GOOGLE_CLOUD_PROJECT,
  },
});

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { audio } = data;

    if (!audio) {
      return NextResponse.json(
        { error: 'No audio data provided' },
        { status: 400 }
      );
    }

    const config: protos.google.cloud.speech.v1.IRecognitionConfig = {
      encoding: protos.google.cloud.speech.v1.RecognitionConfig.AudioEncoding.WEBM_OPUS,
      sampleRateHertz: 48000, // Standard rate for WebM
      languageCode: 'en-US',
      enableAutomaticPunctuation: true,
    };

    const [response] = await speechClient.recognize({
      config,
      audio: { content: audio },
    }).catch(e => {
      throw e;
    });

    if (!response.results || response.results.length === 0) {
      return NextResponse.json({ transcription: '' });
    }

    const transcription = response.results
      ?.map(result => result.alternatives?.[0]?.transcript || '')
      .join(' ');

    return NextResponse.json({ transcription });
  } catch (error) {
    console.error('Speech API Error:', error);
    return NextResponse.json(
      { error: 'Failed to process audio' },
      { status: 500 }
    );
  }
} 