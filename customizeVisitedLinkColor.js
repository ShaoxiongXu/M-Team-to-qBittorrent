// ==UserScript==
// @name         PT 站自定义已访问链接颜色
// @namespace    https://github.com/ShaoxiongXu/M-Team-to-qBittorrent
// @version      0.1
// @description  PT 站：自定义种子列表已访问链接颜色，兼容 NexusPHP 站点。
// @author       ShaoxiongXu
// @match        *://*/*/torrents.php*
// @match        *://*/torrents.php*
// @match        *://*/*/movie.php*
// @match        *://*/movie.php*
// @match        *://*/*/music.php*
// @match        *://*/music.php*
// @match        *://*/*/offers.php*
// @match        *://*/offers.php*
// @match        *://*/*/seek.php*
// @match        *://*/seek.php*
// @match        *://*/*/adult.php*
// @match        *://*/adult.php*
// @grant        GM_addStyle
// @grant        unsafeWindow
// @run-at       document-start
// @license      GPL-2.0
// ==/UserScript==
(function () {
    'use strict';

    function setStyle() {
        GM_addStyle(`
            .torrents a:visited {
                /* 你想要的已访问链接颜色，可以是颜色名称、十六进制颜色码等，替换 #70ada7 比如 red */
                color: #70ada7 !important;
            }
        `)
    }

    if (document.readyState === "loading") {
        document.addEventListener('DOMContentLoaded', function () {
            setStyle()
        });
    } else {
        setStyle()
    }

})();
