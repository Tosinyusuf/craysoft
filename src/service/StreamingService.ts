// apps/poc/services/StreamingService.ts

export class StreamingService {
  private isStreaming: boolean = false;

  async processAudio(audioData: string): Promise<string> {
    try {
      const response = await fetch("/api/speech", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ audio: audioData }),
      });

      if (!response.ok) {
        throw new Error("Failed to process audio");
      }

      const data = await response.json();
      return data.transcription || "";
    } catch (error) {
      console.error("Error processing audio:", error);
      throw error;
    }
  }

  setStreaming(status: boolean) {
    this.isStreaming = status;
  }

  getStreamingStatus() {
    return this.isStreaming;
  }
}
