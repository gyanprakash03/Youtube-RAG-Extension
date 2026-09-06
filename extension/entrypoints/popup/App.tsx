import { useEffect, useState } from "react";

function App() {
  const [videoId, setVideoId] = useState<string | null>(null);

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

    return () => {
      browser.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  return (
    <div>
      <h1>YouTube RAG</h1>

      {videoId ? (
        <p>Current video: {videoId}</p>
      ) : (
        <p>No YouTube video detected.</p>
      )}
    </div>
  );
}

export default App;