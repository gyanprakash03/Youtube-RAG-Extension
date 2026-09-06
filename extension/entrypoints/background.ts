let currentVideoId: string | null = null;

export default defineBackground(() => {

  browser.sidePanel.setPanelBehavior({
      openPanelOnActionClick: true,
  })
  .catch((error) => {
    console.error("Failed to configure side panel:", error);
  });

  browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === "VIDEO_CHANGED") {
      currentVideoId = message.videoId;
    }

    if (message.type === "GET_CURRENT_VIDEO") {
      sendResponse({
        videoId: currentVideoId,
      });
    }
  });
});