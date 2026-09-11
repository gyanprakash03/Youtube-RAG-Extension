// const API_URL = "http://localhost:8000";
const API_URL = "https://youtube-rag-extension-wr2z.onrender.com";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  video_id: string;
  question: string;
  history?: ChatMessage[];
  k?: number;
}

export interface ChatResponse {
  answer: string;
}

export interface IngestResponse {
  message: string;
}


export async function chat(request: ChatRequest): Promise<ChatResponse> {

  const response = await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Chat request failed: ${response.status}`);
  }

  return response.json();
}


export async function ingestVideo(videoId: string,): Promise<IngestResponse> {
  
  const response = await fetch(`${API_URL}/ingest`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      video_id: videoId,
    }),
  });

  if (!response.ok) {
    let message = "Unable to prepare this video.";

    try {
      const error = await response.json();

      if (error.detail) {
        message = error.detail;
      }
    } catch {
      // Keep the fallback message.
    }

    throw new Error(message);
  }

  return response.json();
}