declare module '@google-cloud/speech' {
  import { protos } from '@google-cloud/speech';
  
  export class SpeechClient {
    recognize(request: {
      config: protos.google.cloud.speech.v1.IRecognitionConfig;
      audio: { content: string };
    }): Promise<[protos.google.cloud.speech.v1.IRecognizeResponse]>;
  }
  
  export { protos };
} 