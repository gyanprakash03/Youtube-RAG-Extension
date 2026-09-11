let currentVideoId: string | null = null;
let currentTabId: number | null = null;

export default defineBackground(() => {

  browser.sidePanel.setPanelBehavior({
      openPanelOnActionClick: true,
  })
  .catch((error) => {
    console.error("Failed to configure side panel:", error);
  });

  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "VIDEO_CHANGED") {
      currentVideoId = message.videoId;
      currentTabId = sender.tab?.id ?? null;
    }

    if (message.type === "GET_CURRENT_VIDEO") {
      sendResponse({
        videoId: currentVideoId,
      });
    }

    if (message.type === "SEEK_TO") {
      if (currentTabId === null) {
        return;
      }

      browser.tabs.sendMessage(currentTabId, {
        type: "SEEK_TO",
        time: message.time,
      });
    }
  });
});