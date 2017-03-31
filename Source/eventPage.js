chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        chrome.bookmarks.getChildren(request.id, function (results) {
            sendResponse({ content: JSON.stringify(results) });
        })

        return true;
    });

chrome.contextMenus.create({ id: "TopBookmarkToolbar", title: chrome.i18n.getMessage("appPause"), contexts: ["all"] });
chrome.contextMenus.onClicked.addListener(function (info, tab) {
    chrome.tabs.executeScript({
        code: "pauseShowToolbar();"
    });
});