// ==UserScript==
// @name         LinkAce Launcher
// @namespace    https://marvinscham.de
// @version      0.2
// @description  Creates a keyboard shortcut to add links to my instance of LinkAce
// @author       marvinscham
// @match        *://*/*
// @exclude      https://bookmarks.xn--schmkerei-37a.de/*
// @icon         https://bookmarks.xn--schmkerei-37a.de/favicon-32x32.png
// @grant        none
// ==/UserScript==

let keysPressed = {};

document.addEventListener('keydown', (event) => {
    keysPressed[event.key] = true;
});

document.addEventListener('keyup', (event) => {
    delete this.keysPressed[event.key];
});

window.addEventListener("load", function () {
    window.addEventListener('keydown', function () {
        if (keysPressed["Control"] && keysPressed[">"]) {
            var url = location.href;
            var description = document.getSelection() || '';
            var title = document.title || url;
            window.open('https://bookmarks.xn--schmkerei-37a.de/bookmarklet/add?u=' + encodeURIComponent(url) + '&t=' + encodeURIComponent(title) + '&d=' + encodeURIComponent(description), '_blank', 'menubar=no,height=720,width=600,toolbar=no,scrollbars=yes,status=no,dialog=1');
        }
    });
})();
