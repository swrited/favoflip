document.addEventListener('DOMContentLoaded', () => {
    loadFavorites();

    document.getElementById('clearAll').addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all favorites?')) {
            chrome.storage.local.set({ favorites: [] }, loadFavorites);
        }
    });
});

function loadFavorites() {
    chrome.storage.local.get({ favorites: [] }, (result) => {
        const favorites = result.favorites;
        const listElement = document.getElementById('favoritesList');
        const emptyState = document.getElementById('emptyState');

        listElement.innerHTML = '';

        if (favorites.length === 0) {
            emptyState.classList.remove('hidden');
            return;
        } else {
            emptyState.classList.add('hidden');
        }

        // Display newest first
        favorites.slice().reverse().forEach((item, index) => {
            // Calculate original index because we reversed the array
            const originalIndex = favorites.length - 1 - index;
            const li = createFavoriteElement(item, originalIndex);
            listElement.appendChild(li);
        });
    });
}

function createFavoriteElement(item, index) {
    const li = document.createElement('li');
    li.className = 'favorite-item';

    const header = document.createElement('div');
    header.className = 'item-header';

    const dateSpan = document.createElement('span');
    dateSpan.className = 'item-date';
    dateSpan.textContent = item.date;

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.innerHTML = '&times;';
    deleteBtn.title = 'Remove';
    deleteBtn.onclick = () => deleteFavorite(index);

    if (item.category) {
        const badge = document.createElement('span');
        badge.className = 'item-badge';
        badge.textContent = item.category;
        if (item.isClassifying) badge.textContent += '...';
        header.insertBefore(badge, dateSpan); // Insert before date
    }

    header.appendChild(dateSpan);
    header.appendChild(deleteBtn);
    li.appendChild(header);

    if (item.type === 'image') {
        const imgContainer = document.createElement('div');
        imgContainer.className = 'item-image';
        const img = document.createElement('img');
        img.src = item.content;
        imgContainer.appendChild(img);
        li.appendChild(imgContainer);
    } else {
        const textDiv = document.createElement('div');
        textDiv.className = 'item-content';
        textDiv.textContent = item.content;
        li.appendChild(textDiv);
    }

    if (item.url) {
        const sourceLink = document.createElement('a');
        sourceLink.className = 'item-source';
        sourceLink.href = item.url;
        sourceLink.target = '_blank';
        sourceLink.textContent = item.title || item.url;
        li.appendChild(sourceLink);
    }

    return li;
}

function deleteFavorite(index) {
    chrome.storage.local.get({ favorites: [] }, (result) => {
        const favorites = result.favorites;
        favorites.splice(index, 1);
        chrome.storage.local.set({ favorites: favorites }, loadFavorites);
    });
}
