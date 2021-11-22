// ==UserScript==
// @name         Find Steam Keys
// @version      1.0
// @description  Will attempt to find potential Steam Keys anywhere
// @author       marvinscham
// @icon         https://marvinscham.de/assets/favicon-32x32.png
// @match        *://*/*
// @exclude      http://store.steampowered.com/account/registerkey*
// @namespace    https://marvinscham.de
// @grant        none
// ==/UserScript==

(function () {
    function activateProduct(productKey) {
        let activeproduct = window.open(
            "https://store.steampowered.com/account/registerkey?key=" + productKey,
            "activateproduct",
            "width=990,height=1000,resizable=0,scrollbars=0,status=0,location=0"
        );
    };
    setTimeout(function () {
        let result = document.body.innerText.match(/(?:(?:[0-9A-Z?]{5}-){2}){1,2}[0-9A-Z?]{5}/g);
        if (result.length > 0) {
            if (confirm("Potential Steam Keys found:\n\n" + result.join("\n"))) {
                activateProduct(result);
            }
        }
    }, 1000);
})();