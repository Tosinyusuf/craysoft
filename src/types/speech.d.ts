declare module '@google-cloud/speech' {
  import { protos } from '@google-cloud/speech';
  
  interface ClientConfig {
    credentials: {
      client_email: string;
      private_key: string;
      project_id?: string;
    };
  }

  export class SpeechClient {
    constructor(config?: ClientConfig);
    recognize(request: {
      config: protos.google.cloud.speech.v1.IRecognitionConfig;
      audio: { content: string };
    }): Promise<[protos.google.cloud.speech.v1.IRecognizeResponse]>;
  }
  
  export { protos };
} 