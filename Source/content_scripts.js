"use strict";

const toolbarHeight = 20;
const pauseMS = 10000;
let toolbar, rootMenu;

function createToolbar() {
    toolbar = document.createElement("div");
    toolbar.id = "topbookmarktoolbar";
    toolbar.className = "topbookmarktoolbar";
    toolbar.style.height = toolbarHeight + "px";
    toolbar.dataset.hasRoot = "false";
    toolbar.dataset.hasMenu = "false";
    toolbar.dataset.isPausing = "false";
    toolbar.addEventListener("mouseenter", function () { createRootBookmarks(toolbar); });
    toolbar.addEventListener("mouseleave", function () { removeRootBookmarks(toolbar); });

    document.body.appendChild(toolbar);
}

function showToolbarWhenOnTop() {
    if (event.clientY < toolbarHeight && toolbar.dataset.isPausing === "false") {
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
                let bookmarkTitle;

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

            //add collapse menu button
            let collapsePlaceHolder = document.createElement("span");
            collapsePlaceHolder.style.width = "16px";
            collapsePlaceHolder.style.display = "none";
            let collapseButton = document.createElement("img");
            collapseButton.src = chrome.extension.getURL("collapse.png");
            collapseButton.style.cursor = "pointer";

            collapseButton.title = chrome.i18n.getMessage("appCollapse");
            collapsePlaceHolder.appendChild(collapseButton);
            collapsePlaceHolder.addEventListener("click", function () {
                event.stopPropagation();
                toolbar.dataset.hasShowMenu = "true";
                showRootMenu();
            });

            toolbar.appendChild(collapsePlaceHolder);
            toolbar.appendChild(bookmarks);
            toolbar.dataset.hasRoot = "true";

            //recalculate root bookmarks total width
            let windowWidth = window.innerWidth;
            let bookmarksWidth = 0;
            let bookmarkOverWideIndex;
            for (let currentChildNodeIndex = 0, toolbarChildNodeCount = toolbar.childNodes.length; currentChildNodeIndex < toolbarChildNodeCount; currentChildNodeIndex++) {
                let childNode = toolbar.childNodes[currentChildNodeIndex];
                bookmarksWidth += childNode.offsetWidth;
                if (bookmarksWidth >= windowWidth) {
                    bookmarkOverWideIndex = currentChildNodeIndex;
                    collapsePlaceHolder.style.display = "inline";
                    break;
                };
            }

            //add root menu to contain root bookmarks
            rootMenu = document.createElement("div");
            rootMenu.id = "topbookmarkmenu.0";
            rootMenu.className = "topbookmarkmenu";
            rootMenu.style.left = "0px";
            rootMenu.style.top = "21px";
            rootMenu.style.display = "none";

            let overWideBookmarks = document.createDocumentFragment();

            for (let currentChildNodeIndex = toolbar.childNodes.length - 1; currentChildNodeIndex >= bookmarkOverWideIndex; currentChildNodeIndex--) {
                let childNode = toolbar.childNodes[currentChildNodeIndex];
                childNode.style.display = "block";
                overWideBookmarks.insertBefore(childNode, overWideBookmarks.childNodes[0]);
            }

            rootMenu.appendChild(overWideBookmarks);
            document.body.appendChild(rootMenu);
        });
    }
}

function removeRootBookmarks(toolbar) {
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
    rootMenu.style.display = event.currentTarget.offsetParent === rootMenu ? "block" : "none";

    chrome.runtime.sendMessage({ id: bookmarkId }, function (response) {
        let bookmarkContent = JSON.parse(response.content);
        let bookmarks = document.createDocumentFragment();

        for (let bookmark of bookmarkContent) {
            let placeHolder = document.createElement("div");
            placeHolder.style.cursor = "pointer";

            let favIcon = getFavIcon();
            let bookmarkTitle;

            if (typeof bookmark.url !== "undefined") {
                //url
                bookmarkTitle = getHyperlink(bookmark);
            }
            else {
                //folder
                bookmarkTitle = getFolder(bookmark);
                bookmarkTitle.addEventListener("click", function () {
                    event.stopPropagation();
                    createMenu(level + 1, bookmark.id, false);
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
        let windowHeight = window.innerHeight;
        let menuHeight = menu.offsetHeight;
        if (menuHeight > windowHeight) {
            menu.style.height = windowHeight * 0.85 + "px";
        }
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

function pauseShowToolbar() {
    hideToolbar();
    toolbar.dataset.isPausing = "true";
    setTimeout(function () { toolbar.dataset.isPausing = "false"; }, pauseMS);
}

function hideToolbar() {
    rootMenu.style.display = "none";
    removeMenuTree(1);
    toolbar.dataset.hasShowMenu = "false";
    removeRootBookmarks(toolbar);
}

function showRootMenu() {
    removeMenuTree(1);
    rootMenu.style.display = "block";
    toolbar.dataset.hasMenu = "true";
    let windowHeight = window.innerHeight;
    let rootMenuHeight = rootMenu.offsetHeight;
    if (rootMenuHeight > windowHeight) {
        rootMenu.style.height = windowHeight * 0.85 + "px";
    }
}

//=====start running=====
createToolbar();
document.addEventListener("mousemove", function () { showToolbarWhenOnTop(); });
document.addEventListener("click", function () { hideToolbar(); });