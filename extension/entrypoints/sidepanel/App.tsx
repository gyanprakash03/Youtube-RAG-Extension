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
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import packageJson from "~~/package.json";


type Message = {
  role: "user" | "assistant";
  content: string;
  renderedContent?: string;
};


export default function SidePanel() {
  const [videoId, setVideoId] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
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
    setMessages([]);
    setIngestionError(null);

    prepareVideo();
  }, [videoId]);


  const formatTimestamp = (seconds: number) => {
    const totalSeconds = Math.floor(seconds);

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const remainingSeconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
    }

    return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
  };


  const renderCitations = (text: string) => {
    const normalizedText = text
      .replace(/【/g, "[")
      .replace(/】/g, "]");

    return normalizedText.replace(
      /\[((?:\d+(?:\.\d+)?)(?:\s*,\s*\d+(?:\.\d+)?)+)\]|\[(\d+(?:\.\d+)?)\]/g,
      (_, groupedTimestamps, singleTimestamp) => {
        const timestamps = groupedTimestamps
          ? groupedTimestamps.split(",").map((timestamp: string) => timestamp.trim())
          : [singleTimestamp];

        return timestamps
          .map((timestamp: string) => {
            const seconds = Number(timestamp);

            if (!Number.isFinite(seconds)) {
              return `[${timestamp}]`;
            }

            const formattedTimestamp = formatTimestamp(seconds);

            return `[${formattedTimestamp}](#timestamp-${seconds})`;
          })
          .join(" ");
      },
    );
  };


  const seekTo = (seconds: number) => {
    browser.runtime.sendMessage({
      type: "SEEK_TO",
      time: seconds,
    });
  };


  const handleAsk = async () => {
    if (!question.trim() || !videoId || ingesting) {
      return;
    }

    const currentQuestion = question.trim();
    const history = messages.slice(-10);

    setLoading(true);
    setQuestion("");

    setMessages((previous) => [
      ...previous,
      {
        role: "user",
        content: currentQuestion,
      },
    ]);

    try {
      const response = await chat({
        video_id: videoId,
        question: currentQuestion,
        history,
      });

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content: response.answer,
          renderedContent: renderCitations(response.answer),
        },
      ]);
    }
    catch (error) {
      console.error(error);

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content: "Something went wrong while getting the answer.",
        },
      ]);
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

                <span className="text-[11px] text-zinc-600 italic">
                  VidMind {packageJson.version}
                </span>
              </div>
            </div>


            {/* Answer area */}
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6">
              {messages.length > 0 ? (
                <div>
                  {messages.map((message, index) => (
                    <div key={index} className="mb-6">
                      {message.role === "user" ? (
                        <>
                          <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-zinc-600">
                            You
                          </div>

                          <div className="text-sm leading-6 text-zinc-200">
                            {message.content}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="mb-2 flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-zinc-400" />
                            <h2 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                              Answer
                            </h2>
                          </div>

                          <div className="text-sm leading-6 text-zinc-200">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                a: ({ href, children }) => {
                                  if (href?.startsWith("#timestamp-")) {
                                    const seconds = Number(
                                      href.replace("#timestamp-", ""),
                                    );

                                    return (
                                      <button
                                        onClick={() => seekTo(seconds)}
                                        className="cursor-pointer mx-0.5 inline rounded bg-zinc-800 px-1.5 py-0.5 text-xs font-medium text-zinc-300 transition hover:bg-zinc-700 hover:text-zinc-100"
                                      >
                                        {children}
                                      </button>
                                    );
                                  }

                                  return (
                                    <a
                                      href={href}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="underline"
                                    >
                                      {children}
                                    </a>
                                  );
                                },

                                pre: ({ children }) => (
                                  <pre className="my-3 max-w-full overflow-x-auto rounded-lg bg-zinc-900 p-3">
                                    {children}
                                  </pre>
                                ),

                                code: ({ className, children, ...props }) => (
                                  <code
                                    className={`${className ?? ""} font-mono text-xs`}
                                    {...props}
                                  >
                                    {children}
                                  </code>
                                ),
                              }}
                            >
                              {message.renderedContent ?? message.content}
                            </ReactMarkdown>
                          </div>
                        </>
                      )}
                    </div>
                  ))}

                  {loading && (
                    <div className="mb-6">
                      <div className="mb-2 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-zinc-400" />
                        <h2 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                          Answer
                        </h2>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-zinc-500">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Thinking...</span>
                      </div>
                    </div>
                  )}
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