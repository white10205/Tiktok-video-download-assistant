document.addEventListener("DOMContentLoaded", function () {
  console.log("popup: 页面已加载");
  const videoList = document.getElementById("videoList");

  // 从storage中获取视频URL
  chrome.storage.local.get(["videoUrls"], function (result) {
    const urls = result.videoUrls || [];
    if (urls.length > 0) {
      urls.forEach((url) => {
        addVideoToList(url);
      });
    } else {
      videoList.innerHTML =
        '<p class="no-videos">暂无找到视频，请浏览抖音视频页面</p>';
    }
  });

  // 监听storage变化
  chrome.storage.onChanged.addListener(function (changes, namespace) {
    if (namespace === "local" && changes.videoUrls) {
      const objs = changes.videoUrls.newValue || [];
      videoList.innerHTML = ""; // 清空列表
      if (objs.length > 0) {
        objs.forEach((obj) => {
          addVideoToList(obj);
        });
      } else {
        videoList.innerHTML =
          '<p class="no-videos">暂无找到视频，请浏览抖音视频页面</p>';
      }
    }
  });
});

// 添加视频到列表
function addVideoToList(url) {
  const videoList = document.getElementById("videoList");
  if (!videoList) {
    console.error("popup: videoList元素不存在");
    return;
  }

  const videoItem = document.createElement("span");
  videoItem.className = "video-item";

  const videoUrl = document.createElement("p");
  videoUrl.textContent = url;
  videoUrl.className = "video-url";

  const downloadBtn = document.createElement("button");

  downloadBtn.textContent = "下载视频";
  downloadBtn.className = "download-btn";

  downloadBtn.onclick = function () {
    chrome.runtime.sendMessage({
      type: "DOWNLOAD_VIDEO",
      url: url,
    });
  };

  videoItem.appendChild(videoUrl);
  videoItem.appendChild(downloadBtn);
  videoList.appendChild(videoItem);
}
