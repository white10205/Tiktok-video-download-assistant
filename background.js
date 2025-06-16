// 存储最新的视频数据
let latestVideoData = null;

// 存储视频URL的Set
let videoUrls = new Set();
// 监听来自content.js的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "newVideoData") {
    latestVideoData = request.data;
  }
});

// 监听来自popup的下载请求
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "downloadVideo" && latestVideoData) {
    const videoUrl = latestVideoData.play_addr?.url_list?.[0];
    if (videoUrl) {
      // 生成文件名
      const fileName = `${
        latestVideoData.desc || "抖音视频"
      }_${Date.now()}.mp4`;
      for (obj of videoUrls) {
        if (obj.url === videoUrl) {
          obj.isDownLoad = true;
        }
      }
      setStorage();
      // 下载视频
      chrome.downloads.download({
        url: videoUrl,
        filename: fileName,
        saveAs: true,
      });
    }
  }
});

// 监听网络请求
chrome.webRequest.onHeadersReceived.addListener(
  function (details) {
    // 检查响应头中是否包含video/mp4
    const contentType = details.responseHeaders.find(
      (header) => header.name.toLowerCase() === "content-type"
    );

    if (contentType && contentType.value.includes("video/mp4")) {
      videoUrls.add(details.url);

      setStorage();
    }
  },
  { urls: ["<all_urls>"] },
  ["responseHeaders"]
);

// 监听标签页更新事件
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (changeInfo.status === "loading") {
    console.log("background: 标签页开始加载，清空下载列表");
    videoUrls.clear();
    chrome.storage.local.set({ videoUrls: [] }, function () {
      console.log("background: 已清空storage中的视频URL");
    });
  }
});

// 监听标签页关闭事件
chrome.tabs.onRemoved.addListener(function (tabId) {
  console.log("background: 标签页已关闭，清空下载列表");
  videoUrls.clear();
  chrome.storage.local.set({ videoUrls: [] }, function () {
    console.log("background: 已清空storage中的视频URL");
  });
});

// 监听来自popup的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("background: 收到消息:", request);
  if (request.type === "GET_VIDEO_URLS") {
    // 返回所有找到的视频URL
    sendResponse({ urls: Array.from(videoUrls) });
    return true; // 保持消息通道开放
  } else if (request.type === "DOWNLOAD_VIDEO") {
    // 下载视频
    chrome.downloads.download({
      url: request.url,
      filename: "douyin_video_" + Date.now() + ".mp4",
    });
    sendResponse({ success: true });
    return true; // 保持消息通道开放
  }
});

function setStorage() {
  // 将Set转换为数组并保存到storage
  chrome.storage.local.set({ videoUrls: Array.from(videoUrls) }, function () {
    console.log("background: 视频URL已保存到storage", Array.from(videoUrls));
  });
}
