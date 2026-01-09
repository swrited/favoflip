chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "addToFavorites",
    title: "Add to Favorites",
    contexts: ["selection", "image", "link"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "addToFavorites") {
    const item = {
      id: Date.now().toString(),
      type: "text",
      content: info.selectionText || info.linkUrl || info.srcUrl,
      title: tab.title,
      url: tab.url,
      date: new Date().toLocaleDateString()
    };

    if (info.mediaType === "image") {
      item.type = "image";
      item.content = info.srcUrl;
    } else if (info.linkUrl) {
      item.type = "link";
      item.content = info.linkUrl;
    }

    chrome.storage.local.get({ favorites: [] }, (result) => {
      const favorites = result.favorites;
      favorites.push(item);
      chrome.storage.local.set({ favorites: favorites }, () => {
        console.log("Item added to favorites:", item);
      });
    });
  }
});
