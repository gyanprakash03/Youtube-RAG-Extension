export default defineContentScript({
  matches: ["*://www.youtube.com/*"],

  main() {
    handleVideoChange();

    window.addEventListener("yt-navigate-finish", handleVideoChange);

    browser.runtime.onMessage.addListener((message) => {
      if (message.type === "SEEK_TO") {
        seekTo(message.time);
      }
    });
  },
});

function handleVideoChange() {
  const videoId = getVideoId();

  console.log("Current YouTube video ID:", videoId);

  browser.runtime.sendMessage({
    type: "VIDEO_CHANGED",
    videoId,
  });
}

function seekTo(time: number) {
  const video = document.querySelector("video");

  if (!video) {
    return;
  }

  video.currentTime = time;
  video.play().catch(() => {});
}

function getVideoId(): string | null {
  const url = new URL(window.location.href);

  if (url.pathname !== "/watch") {
    return null;
  }

  return url.searchParams.get("v");
}