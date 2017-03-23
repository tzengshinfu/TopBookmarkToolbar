chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        chrome.bookmarks.getChildren(request.id, function (results) {
            sendResponse({ content: JSON.stringify(results) });
        })

        return true;
    });