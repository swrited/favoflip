import { CONFIG } from './config.js';

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "addToFavorites",
        title: "Add to Favorites",
        contexts: ["selection", "image", "link"]
    });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === "addToFavorites") {
        const item = {
            id: Date.now().toString(),
            type: "text",
            content: info.selectionText || info.linkUrl || info.srcUrl,
            title: tab.title,
            url: tab.url,
            date: new Date().toLocaleDateString(),
            category: "Uncategorized",
            isClassifying: true
        };

        if (info.mediaType === "image") {
            item.type = "image";
            item.content = info.srcUrl;
        } else if (info.linkUrl) {
            item.type = "link";
            item.content = info.linkUrl;
        }

        // Save initially
        saveItem(item);

        // Perform classification if it's text
        if (item.type === 'text') {
            try {
                const category = await classifyContent(item.content);
                item.category = category;
                item.isClassifying = false;
                saveItem(item); // Update with category
            } catch (error) {
                console.error("Classification failed:", error);
                item.isClassifying = false;
                saveItem(item);
            }
        } else {
            item.category = item.type === 'image' ? 'Image' : 'Link';
            item.isClassifying = false;
            saveItem(item);
        }
    }
});

function saveItem(newItem) {
    chrome.storage.local.get({ favorites: [] }, (result) => {
        let favorites = result.favorites;
        const index = favorites.findIndex(f => f.id === newItem.id);

        if (index !== -1) {
            favorites[index] = newItem;
        } else {
            favorites.push(newItem);
        }

        chrome.storage.local.set({ favorites: favorites }, () => {
            console.log("Item saved:", newItem);
        });
    });
}

async function classifyContent(text) {
    if (!CONFIG.API_KEY || CONFIG.API_KEY === "YOUR_REAL_API_KEY_HERE") {
        console.warn("API Key not set.");
        return "No API Key";
    }

    try {
        const response = await fetch(CONFIG.API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${CONFIG.API_KEY}`
            },
            body: JSON.stringify({
                model: CONFIG.MODEL,
                messages: [
                    {
                        role: "system",
                        content: "You are a helpful assistant that classifies text into one of these categories: Technology, News, Coding, Entertainment, Lifestyle, Science, or Other. Return ONLY the category name."
                    },
                    {
                        role: "user",
                        content: `Classify this text: "${text.substring(0, 500)}"`
                    }
                ],
                max_tokens: 10
            })
        });

        const data = await response.json();
        if (data.choices && data.choices.length > 0) {
            return data.choices[0].message.content.trim();
        }
        return "Unknown";
    } catch (e) {
        console.error(e);
        return "Error";
    }
}
