import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  RotateCcw,
  Send,
  Sparkles,
} from "lucide-react";
import { chat, ingestVideo } from "./api";


export default function SidePanel() {
  const [videoId, setVideoId] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [ingesting, setIngesting] = useState(false);
  const [ingestionError, setIngestionError] = useState<string | null>(null);


  useEffect(() => {
    const handleMessage = (message: {
      type?: string;
      videoId?: string | null;
    }) => {
      if (message.type === "VIDEO_CHANGED") {
        setVideoId(message.videoId ?? null);
      }
    };

    browser.runtime.onMessage.addListener(handleMessage);

    browser.runtime.sendMessage({
      type: "GET_CURRENT_VIDEO",
    }).then((response) => {
      setVideoId(response?.videoId ?? null);
    });

    return () => {
      browser.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);


  const prepareVideo = async () => {
    if (!videoId) {
      return;
    }

    setIngesting(true);
    setIngestionError(null);

    try {
      await ingestVideo(videoId);
    }
    catch (error) {
      console.error("Video ingestion failed:", error);

      setIngestionError(
        "This video isn't available for chat right now.",
      );
    }
    finally {
      setIngesting(false);
    }
  };


  useEffect(() => {
    if (!videoId) {
      return;
    }

    setQuestion("");
    setAnswer("");
    setIngestionError(null);

    prepareVideo();
  }, [videoId]);


  const handleAsk = async () => {
    if (!question.trim() || !videoId || ingesting) {
      return;
    }

    setLoading(true);
    setAnswer("");

    try {
      const response = await chat({
        video_id: videoId,
        question: question.trim(),
      });

      setAnswer(response.answer);
    }
    catch (error) {
      console.error(error);
      setAnswer("Something went wrong while getting the answer.");
    }
    finally {
      setLoading(false);
    }
  };


  return (
    <div className="flex h-screen flex-col bg-zinc-950 text-zinc-100">

      {/* Main content */}
      <main className="flex min-h-0 flex-1 flex-col">

        {ingesting ? (
          /* Preparing */
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-800">
              <Loader2 className="h-5 w-5 animate-spin text-zinc-300" />
            </div>

            <h1 className="text-base font-medium">
              Preparing this video
            </h1>

            <p className="mt-2 max-w-65 text-sm leading-5 text-zinc-500">
              Processing the transcript so you can ask questions about it.
            </p>
          </div>

        ) : ingestionError ? (
          /* Error */
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <button
              onClick={prepareVideo}
              disabled={ingesting}
              aria-label="Retry preparing video"
              className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 text-zinc-400 transition hover:border-zinc-700 hover:bg-zinc-800 hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RotateCcw className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-zinc-500" />

              <h1 className="text-sm font-medium">
                This video isn't available for chat right now.
              </h1>
            </div>

            <p className="mt-2 max-w-67.5 text-xs leading-5 text-zinc-500">
              Something went wrong while preparing the transcript.
              Try again.
            </p>
          </div>

        ) : videoId ? (
          /* Ready */
          <>
            {/* Video status */}
            <div className="px-4 pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />

                  <span className="text-xs font-medium text-zinc-300">
                    Video ready
                  </span>
                </div>

                <span className="text-[11px] text-zinc-600">
                  YouTube RAG
                </span>
              </div>
            </div>


            {/* Answer area */}
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6">
              {loading ? (
                <div className="flex h-full items-center justify-center">
                  <div className="flex flex-col items-center">
                    <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />

                    <p className="mt-3 text-xs text-zinc-500">
                      Thinking...
                    </p>
                  </div>
                </div>

              ) : answer ? (
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-zinc-400" />

                    <h2 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                      Answer
                    </h2>
                  </div>

                  <p className="whitespace-pre-wrap text-sm leading-6 text-zinc-200">
                    {answer}
                  </p>
                </div>

              ) : (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-900">
                    <Sparkles className="h-5 w-5 text-zinc-400" />
                  </div>

                  <h2 className="text-sm font-medium text-zinc-200">
                    Ask about this video
                  </h2>

                  <p className="mt-2 max-w-62.5 text-xs leading-5 text-zinc-500">
                    Ask a question and I'll find the relevant parts
                    of the transcript.
                  </p>
                </div>
              )}
            </div>


            {/* Composer */}
            <div className="border-t border-zinc-800/80 bg-zinc-950 p-3">
              <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-1.5 transition focus-within:border-zinc-700">
                <input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAsk();
                    }
                  }}
                  placeholder="Ask about this video..."
                  disabled={loading}
                  className="min-w-0 flex-1 bg-transparent py-2 text-sm text-zinc-200 outline-none placeholder:text-zinc-600 disabled:cursor-not-allowed"
                />

                <button
                  onClick={handleAsk}
                  disabled={
                    loading ||
                    !videoId ||
                    ingesting ||
                    !question.trim()
                  }
                  aria-label="Ask question"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-30"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </div>

              <p className="mt-2 text-center text-[10px] text-zinc-600">
                Press Enter to ask
              </p>
            </div>
          </>

        ) : (
          /* No video */
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900">
              <Sparkles className="h-5 w-5 text-zinc-500" />
            </div>

            <h1 className="text-sm font-medium text-zinc-200">
              No YouTube video detected
            </h1>

            <p className="mt-2 max-w-65 text-xs leading-5 text-zinc-500">
              Open a YouTube video to start asking questions about its
              content.
            </p>
          </div>
        )}

      </main>
    </div>
  );
}