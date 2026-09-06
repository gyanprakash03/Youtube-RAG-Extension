export default defineContentScript({
  matches: ["*://www.youtube.com/*"],

  main() {
    handleVideoChange();

    window.addEventListener("yt-navigate-finish", handleVideoChange);
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

function getVideoId(): string | null {
  const url = new URL(window.location.href);

  if (url.pathname !== "/watch") {
    return null;
  }

  return url.searchParams.get("v");
}