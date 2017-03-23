"use strict";

const toolbarHeight = 20;
let toolbar;

function createToolbar() {
    toolbar = document.createElement("div");
    toolbar.id = "topbookmarktoolbar";
    toolbar.className = "topbookmarktoolbar";
    toolbar.style.height = toolbarHeight + "px";
    toolbar.dataset.hasRoot = "false";
    toolbar.dataset.hasMenu = "false";
    toolbar.addEventListener("mouseenter", function () {
        createRootBookmarks(this);
    });
    toolbar.addEventListener("mouseleave", function () {
        clearRootBookmarks(this);
    });

    document.body.appendChild(toolbar);
}

function showToolbarWhenOnTop() {
    if (event.clientY < toolbarHeight) {
        toolbar.style.display = "block";
    }
}

function getFavIcon() {
    let favIcon = document.createElement("img");
    favIcon.style.width = "16px";
    favIcon.style.height = "16px";
    return favIcon;
}

function createRootBookmarks(toolbar) {
    if (toolbar.dataset.hasRoot === "false") {
        chrome.runtime.sendMessage({ id: "1" }, function (response) {
            let bookmarkContent = JSON.parse(response.content);
            let bookmarks = document.createDocumentFragment();

            for (let bookmark of bookmarkContent) {
                let placeHolder = document.createElement("span");
                placeHolder.style.cursor = "pointer";

                let favIcon = getFavIcon();
                let bookmarkTitle, bookmarkText;

                if (typeof bookmark.url !== "undefined") {
                    //url
                    bookmarkTitle = getHyperlink(bookmark)
                }
                else {
                    //folder
                    bookmarkTitle = getFolder(bookmark);
                    bookmarkTitle.addEventListener("click", function () {
                        event.stopPropagation();
                        toolbar.dataset.hasShowMenu = "true";
                        createMenu(1, bookmark.id);
                    });
                }

                placeHolder.appendChild(bookmarkTitle);
                bookmarks.appendChild(placeHolder);
            }

            toolbar.appendChild(bookmarks);
            toolbar.dataset.hasRoot = "true";
        });
    }
}

function clearRootBookmarks(toolbar) {
    if (toolbar.dataset.hasMenu === "false") {
        toolbar.style.display = "none";

        while (toolbar.firstChild) {
            toolbar.removeChild(toolbar.firstChild);
        }

        toolbar.dataset.hasRoot = "false";
    }
}

function createMenu(level, bookmarkId) {
    let cursorX = event.clientX;
    let cursorY = event.clientY;

    removeMenuTree(level);

    chrome.runtime.sendMessage({ id: bookmarkId }, function (response) {
        let bookmarkContent = JSON.parse(response.content);
        let bookmarks = document.createDocumentFragment();

        for (let bookmark of bookmarkContent) {
            let placeHolder = document.createElement("div");
            placeHolder.style.cursor = "pointer";

            let favIcon = getFavIcon();
            let bookmarkTitle, bookmarkText;

            if (typeof bookmark.url !== "undefined") {
                //url
                bookmarkTitle = getHyperlink(bookmark);
            }
            else {
                //folder
                bookmarkTitle = getFolder(bookmark);
                bookmarkTitle.addEventListener("click", function () {
                    event.stopPropagation();
                    createMenu(level + 1, bookmark.id);
                });
            }

            placeHolder.appendChild(bookmarkTitle);
            bookmarks.appendChild(placeHolder);
        }

        let menu = document.createElement("div");
        menu.id = "topbookmarkmenu." + level;
        menu.className = "topbookmarkmenu";
        menu.style.left = (cursorX - (toolbarHeight / 2)) + "px";
        menu.style.top = (cursorY + (toolbarHeight / 2)) + "px";

        menu.appendChild(bookmarks);
        document.body.appendChild(menu);
        toolbar.dataset.hasMenu = "true";
    });
}

function removeMenuTree(level) {
    let currentLevel = level;
    let menu = document.getElementById("topbookmarkmenu." + currentLevel);

    while (menu) {
        menu.remove();
        currentLevel++;
        menu = document.getElementById("topbookmarkmenu." + currentLevel);
    }

    toolbar.dataset.hasMenu = "false";
}

function getHyperlink(bookmark) {
    let bookmarkTitle = document.createElement("a");
    bookmarkTitle.href = bookmark.url;
    let protocal;
    let tempUrl = bookmark.url;
    protocal = tempUrl.substring(0, tempUrl.indexOf("//") + 2);
    tempUrl = tempUrl.substring(tempUrl.indexOf("//") + 2);
    tempUrl = tempUrl.substring(0, tempUrl.indexOf("/"));
    let favIcon = getFavIcon();
    favIcon.src = protocal + tempUrl + "/favicon.ico";
    favIcon.addEventListener("error", function () { this.src = chrome.extension.getURL("url.png"); })
    bookmarkTitle.appendChild(favIcon);
    let bookmarkText = document.createElement("span");
    bookmarkText.textContent = bookmark.title;
    bookmarkTitle.appendChild(bookmarkText);

    return bookmarkTitle
}

function getFolder(bookmark) {
    let bookmarkTitle = document.createElement("span");
    let favIcon = getFavIcon();
    favIcon.src = chrome.extension.getURL("folder.png");
    bookmarkTitle.appendChild(favIcon);
    let bookmarkText = document.createElement("span");
    bookmarkText.textContent = bookmark.title;
    bookmarkTitle.appendChild(bookmarkText);

    return bookmarkTitle
}

createToolbar();
document.addEventListener("mousemove", showToolbarWhenOnTop);
document.addEventListener("click", function () {
    removeMenuTree(1);
    toolbar.dataset.hasShowMenu = false;
    clearRootBookmarks(toolbar);
});