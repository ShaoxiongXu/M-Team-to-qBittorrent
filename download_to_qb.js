// ==UserScript==
// @name         种子下载工具
// @namespace    种子下载工具
// @description  在种子详情页添加下载按钮，点击后可以选择​【标题|种子名|副标题】​并将种子添加到 qBittorrent，支持文件重命名并指定下载位置，兼容 NexusPHP 站点。
// @version      3.7
// @icon         https://www.qbittorrent.org/favicon.svg
// @require      https://cdn.jsdelivr.net/npm/vue@2.7.14/dist/vue.js
// @match        https://*/details.php*
// @match        https://*/*/details.php*
// @match        https://test2.m-team.cc/detail/*
// @grant        GM_xmlhttpRequest
// @grant        GM_log
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @grant        GM_listValues
// @grant        GM_registerMenuCommand
// @grant        unsafeWindow
// @grant        window.close
// @grant        window.focus
// @grant        window.onurlchange
// @run-at       document-start
// @connect      *
// @license      GPL-2.0
// @author       ShaoxiongXu
// ==/UserScript==

(function () {
    'use strict';

    // 消息提示 JS @require https://cdn.jsdelivr.net/gh/ShaoxiongXu/M-Team-to-qBittorrent@3.6/coco-message.js
    function _typeof(o) { return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o }, _typeof(o) } !function (o, e) { "object" === ("undefined" == typeof exports ? "undefined" : _typeof(exports)) && "undefined" != typeof module ? module.exports = e() : "function" == typeof define && define.amd ? define(e) : (o = o || self, o.cocoMessage = e()) }(void 0, function () { "use strict"; function o(o, e) { var t = document.createElement("div"); for (var s in o) { var a = o[s]; "className" == s ? (s = "class", t.setAttribute(s, a)) : "_" == s[0] && t.addEventListener(s.slice(1), a) } if ("string" == typeof e) t.innerHTML = e; else if ("object" == _typeof(e) && e.tagName) t.appendChild(e); else if (e) for (var r = 0; r < e.length; r++) { var c = e[r]; t.appendChild(c) } return t } function e(o, e) { ["a", "webkitA"].forEach(function (t) { var s = t + "nimationEnd"; o.addEventListener(s, function () { e() }) }) } function t(o, e) { for (var t in e) o.style[t] = e[t]; "" === o.getAttribute("style") && o.removeAttribute("style") } function s(o, e) { var t = o.className || ""; if (!a(t, e)) { var s = t.split(/\s+/); s.push(e), o.className = s.join(" ") } } function a(o, e) { return o.indexOf(e) > -1 } function r(o, e) { var t = o.className || ""; if (a(t, e)) { var s = t.split(/\s+/), r = s.indexOf(e); s.splice(r, 1), o.className = s.join(" ") } "" === o.className && o.removeAttribute("class") } function c(o, e) { var t = {}; for (var s in h) t[s] = h[s]; for (var a = 0; a < o.length; a++) { var r = o[a]; void 0 !== r && ("string" == typeof r || "object" == _typeof(r) ? t.msg = r : "boolean" == typeof r ? t.showClose = r : "function" == typeof r ? t.onClose = r : "number" == typeof r && (t.duration = r)) } return t.type = e, n(t) } function n(s) { var a = s.type, c = s.duration, n = s.msg, d = s.showClose, g = s.onClose, m = 0 === c, h = l(); "loading" == a && (n = "" === n ? "正在加载，请稍后" : n, m = d, c = 0); var u = o({ className: "coco-msg-wrapper" }, [o({ className: "coco-msg coco-msg-fade-in " + a }, [o({ className: "coco-msg-icon" }, h[a]), o({ className: "coco-msg-content" }, n), o({ className: "coco-msg-wait " + (m ? "coco-msg-pointer" : ""), _click: function () { m && f(u, g) } }, i(m))])]), b = u.querySelector(".coco-msg__circle"); if (b && (t(b, { animation: "coco-msg_" + a + " " + c + "ms linear" }), "onanimationend" in window ? e(b, function () { f(u, g) }) : setTimeout(function () { f(u, g) }, c)), "loading" == a && 0 !== c && setTimeout(function () { f(u, g) }, c), p.children.length || document.body.appendChild(p), p.appendChild(u), t(u, { height: u.offsetHeight + "px" }), setTimeout(function () { r(u.children[0], "coco-msg-fade-in") }, 300), "loading" == a) return function () { f(u, g) } } function i(o) { return o ? '\n    <svg class="coco-msg-close" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="5514"><path d="M810 274l-238 238 238 238-60 60-238-238-238 238-60-60 238-238-238-238 60-60 238 238 238-238z" p-id="5515"></path></svg>\n    ' : '<svg class="coco-msg-progress" viewBox="0 0 33.83098862 33.83098862" xmlns="http://www.w3.org/2000/svg">\n    <circle class="coco-msg__background" cx="16.9" cy="16.9" r="15.9"></circle>\n    <circle class="coco-msg__circle" stroke-dasharray="100,100" cx="16.9" cy="16.9" r="15.9"></circle>\n    </svg>\n    ' } function f(o, e) { o && (t(o, { padding: 0, height: 0 }), s(o.children[0], "coco-msg-fade-out"), e && e(), setTimeout(function () { if (o) { for (var e = !1, t = 0; t < p.children.length; t++)p.children[t] === o && (e = !0); e && d(o), o = null, p.children.length || e && d(p) } }, 300)) } function l() { return { info: '\n    <svg t="1609810636603" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3250"><path d="M469.333333 341.333333h85.333334v469.333334H469.333333z" fill="#ffffff" p-id="3251"></path><path d="M469.333333 213.333333h85.333334v85.333334H469.333333z" fill="#ffffff" p-id="3252"></path><path d="M384 341.333333h170.666667v85.333334H384z" fill="#ffffff" p-id="3253"></path><path d="M384 725.333333h256v85.333334H384z" fill="#ffffff" p-id="3254"></path></svg>\n    ', success: '\n    <svg t="1609781242911" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1807"><path d="M455.42 731.04c-8.85 0-17.75-3.05-24.99-9.27L235.14 553.91c-16.06-13.81-17.89-38.03-4.09-54.09 13.81-16.06 38.03-17.89 54.09-4.09l195.29 167.86c16.06 13.81 17.89 38.03 4.09 54.09-7.58 8.83-18.31 13.36-29.1 13.36z" p-id="1808" fill="#ffffff"></path><path d="M469.89 731.04c-8.51 0-17.07-2.82-24.18-8.6-16.43-13.37-18.92-37.53-5.55-53.96L734.1 307.11c13.37-16.44 37.53-18.92 53.96-5.55 16.43 13.37 18.92 37.53 5.55 53.96L499.67 716.89c-7.58 9.31-18.64 14.15-29.78 14.15z" p-id="1809" fill="#ffffff"></path></svg>\n    ', warning: '\n    <svg t="1609776406944" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="18912"><path d="M468.114286 621.714286c7.314286 21.942857 21.942857 36.571429 43.885714 36.571428s36.571429-14.628571 43.885714-36.571428L585.142857 219.428571c0-43.885714-36.571429-73.142857-73.142857-73.142857-43.885714 0-73.142857 36.571429-73.142857 80.457143l29.257143 394.971429zM512 731.428571c-43.885714 0-73.142857 29.257143-73.142857 73.142858s29.257143 73.142857 73.142857 73.142857 73.142857-29.257143 73.142857-73.142857-29.257143-73.142857-73.142857-73.142858z" p-id="18913" fill="#ffffff"></path></svg>\n    ', error: '\n    <svg t="1609810716933" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="5514"><path d="M810 274l-238 238 238 238-60 60-238-238-238 238-60-60 238-238-238-238 60-60 238 238 238-238z" p-id="5515" fill="#ffffff"></path></svg>\n    ', loading: '\n    <div class="coco-msg_loading">\n    <svg class="coco-msg-circular" viewBox="25 25 50 50">\n      <circle class="coco-msg-path" cx="50" cy="50" r="20" fill="none" stroke-width="4" stroke-miterlimit="10"/>\n    </svg>\n    </div>\n    ' } } function d(o) { o && o.parentNode.removeChild(o) } function g() { for (var o = 0; o < p.children.length; o++) { var e = p.children[o]; f(e) } } function m() { var o = document; if (o && o.head) { var e = o.head, t = o.createElement("style"), s = "\n\n[class|=coco],[class|=coco]::after,[class|=coco]::before{box-sizing:border-box;outline:0}.coco-msg-progress{width:13px;height:13px}.coco-msg__circle{stroke-width:2;stroke-linecap:square;fill:none;transform:rotate(-90deg);transform-origin:center}.coco-msg-stage:hover .coco-msg__circle{-webkit-animation-play-state:paused!important;animation-play-state:paused!important}.coco-msg__background{stroke-width:2;fill:none}.coco-msg-stage{position:fixed;top:20px;left:50%;width:auto;transform:translate(-50%,0);z-index:3000}.coco-msg-wrapper{position:relative;left:50%;transform:translate(-50%,0);transform:translate3d(-50%,0,0);transition:height .3s ease,padding .3s ease;padding:6px 0;will-change:transform,opacity}.coco-msg{padding:15px 21px;border-radius:3px;position:relative;left:50%;transform:translate(-50%,0);transform:translate3d(-50%,0,0);display:flex;align-items:center}.coco-msg-content,.coco-msg-icon,.coco-msg-wait{display:inline-block}.coco-msg-icon{position:relative;width:13px;height:13px;border-radius:100%;display:flex;justify-content:center;align-items:center}.coco-msg-icon svg{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:11px;height:11px}.coco-msg-wait{width:20px;height:20px;position:relative;fill:#4eb127}.coco-msg-wait svg{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)}.coco-msg-close{width:14px;height:14px}.coco-msg-content{margin:0 10px;min-width:240px;text-align:left;font-size:14px;font-weight:500;font-family:-apple-system,Microsoft Yahei,sans-serif;text-shadow:0 0 1px rgba(0,0,0,.01)}.coco-msg.info{color:#0fafad;background-color:#e7fdfc;box-shadow:0 0 2px 0 rgba(0,1,1,.01),0 0 0 1px #c0faf9}.coco-msg.info .coco-msg-icon{background-color:#0fafad}.coco-msg.success{color:#4ebb23;background-color:#f3ffe8;box-shadow:0 0 2px 0 rgba(0,1,0,.01),0 0 0 1px #d9f8bb}.coco-msg.success .coco-msg-icon{background-color:#4ebb23}.coco-msg.warning{color:#f1b306;background-color:#fff9eb;box-shadow:0 0 2px 0 rgba(1,1,0,.01),0 0 0 1px #fcf2cd}.coco-msg.warning .coco-msg-icon{background-color:#f1b306}.coco-msg.error{color:#f34b51;background-color:#fff7f7;box-shadow:0 0 2px 0 rgba(1,0,0,.01),0 0 0 1px #ffe3e3}.coco-msg.error .coco-msg-icon{background-color:#f34b51}.coco-msg.loading{color:#0fafad;background-color:#e7fdfc;box-shadow:0 0 2px 0 rgba(0,1,1,.01),0 0 0 1px #c2faf9}.coco-msg_loading{flex-shrink:0;width:20px;height:20px;position:relative}.coco-msg-circular{-webkit-animation:coco-msg-rotate 2s linear infinite both;animation:coco-msg-rotate 2s linear infinite both;transform-origin:center center;height:18px!important;width:18px!important}.coco-msg-path{stroke-dasharray:1,200;stroke-dashoffset:0;stroke:#0fafad;-webkit-animation:coco-msg-dash 1.5s ease-in-out infinite;animation:coco-msg-dash 1.5s ease-in-out infinite;stroke-linecap:round}@-webkit-keyframes coco-msg-rotate{100%{transform:translate(-50%,-50%) rotate(360deg)}}@keyframes coco-msg-rotate{100%{transform:translate(-50%,-50%) rotate(360deg)}}@-webkit-keyframes coco-msg-dash{0%{stroke-dasharray:1,200;stroke-dashoffset:0}50%{stroke-dasharray:89,200;stroke-dashoffset:-35px}100%{stroke-dasharray:89,200;stroke-dashoffset:-124px}}@keyframes coco-msg-dash{0%{stroke-dasharray:1,200;stroke-dashoffset:0}50%{stroke-dasharray:89,200;stroke-dashoffset:-35px}100%{stroke-dasharray:89,200;stroke-dashoffset:-124px}}.coco-msg.info .coco-msg-wait{fill:#0fafad}.coco-msg.success .coco-msg-wait{fill:#4ebb23}.coco-msg.warning .coco-msg-wait{fill:#f1b306}.coco-msg.error .coco-msg-wait{fill:#f34b51}.coco-msg.loading .coco-msg-wait{fill:#0fafad}.coco-msg-pointer{cursor:pointer}@-webkit-keyframes coco-msg_info{0%{stroke:#0fafad}to{stroke:#0fafad;stroke-dasharray:0 100}}@keyframes coco-msg_info{0%{stroke:#0fafad}to{stroke:#0fafad;stroke-dasharray:0 100}}@-webkit-keyframes coco-msg_success{0%{stroke:#4eb127}to{stroke:#4eb127;stroke-dasharray:0 100}}@keyframes coco-msg_success{0%{stroke:#4eb127}to{stroke:#4eb127;stroke-dasharray:0 100}}@-webkit-keyframes coco-msg_warning{0%{stroke:#fcbc0b}to{stroke:#fcbc0b;stroke-dasharray:0 100}}@keyframes coco-msg_warning{0%{stroke:#fcbc0b}to{stroke:#fcbc0b;stroke-dasharray:0 100}}@-webkit-keyframes coco-msg_error{0%{stroke:#eb262d}to{stroke:#eb262d;stroke-dasharray:0 100}}@keyframes coco-msg_error{0%{stroke:#eb262d}to{stroke:#eb262d;stroke-dasharray:0 100}}.coco-msg-fade-in{-webkit-animation:coco-msg-fade .2s ease-out both;animation:coco-msg-fade .2s ease-out both}.coco-msg-fade-out{animation:coco-msg-fade .3s linear reverse both}@-webkit-keyframes coco-msg-fade{0%{opacity:0;transform:translate(-50%,0);transform:translate3d(-50%,-80%,0)}to{opacity:1;transform:translate(-50%,0);transform:translate3d(-50%,0,0)}}@keyframes coco-msg-fade{0%{opacity:0;transform:translate(-50%,0);transform:translate3d(-50%,-80%,0)}to{opacity:1;transform:translate(-50%,0);transform:translate3d(-50%,0,0)}}\n        "; t.innerHTML = s, e.children.length ? e.insertBefore(t, e.children[0]) : e.appendChild(t) } } var p = o({ className: "coco-msg-stage" }), h = { msg: "", duration: 2e3, showClose: !1 }, u = { info: function () { c(arguments, "info") }, success: function () { c(arguments, "success") }, warning: function () { c(arguments, "warning") }, error: function () { c(arguments, "error") }, loading: function () { return c(arguments, "loading") }, destroyAll: function () { g() }, config: function (o) { for (var e in o) Object.hasOwnProperty.call(o, e) && void 0 !== o[e] && (h[e] = o[e]) } }; return "loading" === document.readyState ? window.addEventListener("DOMContentLoaded", function () { m() }) : m(), u });

    let config = {}

    /**
     * 在这里面的网站走策略特殊处理 {域名标识: 标签(对应siteStrategies对象中key)}
     * sites 中没配置的走 NexusPHP 默认逻辑, NexusPHP 站点一般不用配置, 理论上 NexusPHP 站点都支持.
     * 
     */
    let sites = {
        "test2.m-team.cc": "new_mteam",
        "m-team": "mteam",
        "www.ptlsp.com": "ptlsp",
        "www.tjupt.org": "tjupt"
    }

    /**
     * 不同站点的策略对象
     * 没有配置的站点走默认逻辑：defaultStrategy.xxx()
     */
    const siteStrategies = {
        new_mteam: { // TODO 待实现
            getTorrentUrl: () => "",
            getTorrentHash: () => "",
            getTorrentTitle: () => "",
            getTorrentName: () => "",
            getTorrentSubTitle: () => ""
        },
        mteam: {
            getTorrentUrl: () => {
                return window.location.protocol + "//" + window.location.hostname + document.evaluate("//a[text()='[IPv4+https]']", document).iterateNext().getAttribute("href");
            }
        },
        ptlsp: {
            getTorrentUrl: () => document.querySelector(`#download_pkey`).getAttribute(`href`)
        },
        tjupt: {
            getTorrentUrl: () => document.querySelector(`#direct_link`).getAttribute(`href`)
        }, // 默认策略
        defaultStrategy: {
            getTorrentUrl: () => {
                let allLinks = document.querySelectorAll('#outer a');
                // 使用 Array.prototype.find 查找第一个包含模糊文本的链接
                let firstMatchingLink = Array.from(allLinks).find(function (link) {
                    return /download.php\?id=[0-9]+&passkey=.+$/.test(link.href)
                        || /download.php\?downhash=[0-9]+\|.+$/.test(link.href);
                });

                if (firstMatchingLink) {
                    let href = firstMatchingLink.getAttribute("href");
                    if (href.startsWith("http")) {
                        return href;
                    }
                    if (href.startsWith("/")) {
                        return window.location.protocol + "//" + window.location.hostname + href;
                    }
                    return window.location.protocol + "//" + "/" + window.location.hostname + href;
                } else {
                    cocoMessage.error("未在页面找到下载链接！", 10000, true);
                    return "";
                }
            },
            getTorrentHash: () => {
                let text = document.getElementById("outer").innerText;
                let match = text.match(/hash.?: ([a-fA-F0-9]{40})/i);
                if (!match) {
                    cocoMessage.error("未在页面找到 Hash 值！", 10000, true);
                    return;
                }
                // 输出匹配到的hash值
                return match[1];
            },
            getTorrentTitle: () => {
                return document.querySelector("#top").firstChild.nodeValue;
            },
            getTorrentName: () => {
                let str = document.querySelector("#outer td.rowfollow > a.index").innerText.trim()
                console.log("原始种子名:", str);
                let regex = /\.(.+)\./;
                return regex.exec(str)[1];
            },
            getTorrentSubTitle: () => {
                let subTitleTd = document.evaluate("//td[text()='副標題']", document).iterateNext()
                    || document.evaluate("//td[text()='副标题']", document).iterateNext()
                    || document.evaluate("//td[text()='Small Description']", document).iterateNext()
                return subTitleTd.nextElementSibling.innerText;
            }
        }
    };

    function getSite() {
        let host = window.location.host;
        const entries = Object.entries(sites);
        for (const [key, value] of entries) {
            if (host.includes(key)) {
                return value
            }
        }
        return null;
    }

    function execMethodName(methodName) {
        try {
            let strategy = getSite() && siteStrategies[getSite()] || siteStrategies.defaultStrategy;
            let execMethodName = strategy[methodName] || siteStrategies.defaultStrategy[methodName];
            let flag = getSite() && siteStrategies[getSite()] && siteStrategies[getSite()][methodName] ? getSite() : "defaultStrategy"
            console.log(`"执行: ${flag}.${methodName}(${execMethodName})"`)
            return execMethodName();
        } catch (e) {
            console.error(`执行 ${methodName}() 失败！`, e)
        }
        return ""
    }

    const pt = {
        getTorrentUrl: () => {
            let v = execMethodName("getTorrentUrl");
            console.log("种子地址: ", v);
            return v;
        },
        getTorrentHash: () => {
            let v = execMethodName("getTorrentHash").trim();
            console.log("Hash值: ", v);
            return v;
        },
        getTorrentTitle: () => {
            let v = replaceUnsupportedCharacters(execMethodName("getTorrentTitle")).trim();
            if (v.endsWith(".torrent")) {
                v = v.replace(".torrent", "");
            }
            console.log("标题: ", v);
            return v;
        },
        getTorrentName: () => {
            let v = replaceUnsupportedCharacters(execMethodName("getTorrentName")).trim();
            console.log("种子名: ", v);
            return v;
        },
        getTorrentSubTitle: () => {
            let v = replaceUnsupportedCharacters(execMethodName("getTorrentSubTitle")).trim();
            console.log("副标题: ", v);
            return v;
        }
    }


    // 种子以这些文件结尾时,单文件储存,非目录
    const fileSuffix = [".zip", ".rar", ".7z", ".tar.gz", ".tgz", ".tar.bz2", ".tbz2", ".tar", ".gz", ".bz2", ".xz", ".lzma", ".md", ".txt", ".pdf", ".epub", ".mp4", ".avi", ".mkv", ".mov", ".wmv", ".flv", ".mpg", ".mpeg", ".3gp", ".webm", ".rmvb", ".mp3", ".wav", ".flac", ".aac", ".ogg", ".wma", ".m4a", ".mpc", ".iso"]

    /**
     * 判断 torrentName 是否是以数组fileSuffix中的字符串结尾的,是的话返回false
     *
     * @param {String} torrentName
     *
     * @returns {Boolean}
     */
    function isFolder(torrentName) {
        for (const suffix of fileSuffix) {
            if (torrentName.endsWith(suffix)) {
                return false;
            }
        }
        return true;
    }

    function getSuffix(torrentName) {
        for (const suffix of fileSuffix) {
            if (torrentName.endsWith(suffix)) {
                return suffix;
            }
        }
        return "";
    }

    /**
     * @description: 加入失败后使用失败重试功能，如果5次中有任意一次成功了，就停止尝试并返回
     * @param  {*}
     * @return {*}
     * @param {*} fn 绑定函数
     * @param {*} times 请求次数
     * @param {*} delay 延迟时间
     */
    Promise.retry = function (fn, times, delay) {
        let tryTimes = 0
        return new Promise((resolve, reject) => {
            function attempt() {
                console.log(`重试第 ${tryTimes} 次`)
                Promise.resolve(fn()).then(res => {
                    resolve(res)
                }).catch(err => {
                    if (++tryTimes < times) {
                        setTimeout(attempt, delay)
                    } else {
                        reject(err)
                    }
                })
            }

            attempt()
        })
    }

    /**
     *
     * @param {String} hash 种子hash
     */
    let getTorrentInfo = (hash) => {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET', url: `${config.address}/api/v2/torrents/info?hashes=${hash}`, onload: function (response) {

                    let data = JSON.parse(response.responseText);
                    console.log("查询到种子数:", data.length)

                    if (data && data.length == 1) {

                        let info = data[0];
                        console.log("种子信息:", info)

                        // content_path 这个路径不同版本不固定,有时候是相对路径,有时候是绝对路径
                        // content_path 种子内容的绝对路径（多文件种子的根路径，单文件种子的绝对文件路径）

                        // let oldFileName = info.content_path.replace(info.save_path, '').match(/([^\/]+)/)[0];

                        // content_path: "D:\\Adobe\\Richard Walters - Murmurate (2023) [24B-48kHz]"
                        // save_pat: "D:\Adobe"

                        // 下载目录下面第一级
                        let oldFilePath = info.content_path.replace(info.save_path, '');

                        if (!oldFilePath.startsWith(config.separator)) oldFilePath = config.separator + oldFilePath;

                        // 原文件名 -- 根据原文件名重命名 "Richard Walters - Murmurate (2023) [24B-48kHz]"
                        let oldFileName = oldFilePath.split(config.separator)[1];

                        resolve({
                            "oldFileName": oldFileName, "message": "获取种子信息成功."
                        })
                        return;
                    }
                    reject("获取种子信息失败,种子列表未找到种子.")
                }, onerror: function (error) {
                    console.error('获取种子信息失败: 请求发生错误:', error);
                    reject("获取种子信息失败！")
                }
            });
        })

    }

    /**
     *
     * @param {String} 种子hash
     * @returns
     */
    let chcekExist = (hash) => {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: `${config.address}/api/v2/torrents/info?hashes=${hash}`,
                onload: function (response) {
                    let data = JSON.parse(response.responseText);
                    if (data && data.length == 1) {
                        reject("种子已经存在啦！")
                        return;
                    }
                    resolve()
                },
                onerror: function (error) {
                    console.error('获取种子信息失败: 请求发生错误:', error);
                    reject("获取种子信息失败！")
                }
            });
        })
    }

    /**
     * 重命名
     *
     * hash: hash
     * oldPath: 111
     * newPath: 222
     *
     * @param {*} hash
     * @param {*} oldPath
     * @param {*} newPath
     */
    function renameFileOrFolder(hash, oldPath, newPath) {
        return new Promise((resolve, reject) => {

            console.log(`原文件名: ${oldPath}`);
            console.log(`新文件名: ${newPath}`);

            const endpoint = isFolder(oldPath) ? '/api/v2/torrents/renameFolder' : '/api/v2/torrents/renameFile';

            GM_xmlhttpRequest({
                method: 'POST', url: `${config.address}${endpoint}`, data: getQueryString({
                    'hash': hash, 'oldPath': oldPath, 'newPath': newPath
                }), headers: {
                    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
                }, onload: function (response) {
                    console.log('重命名成功.');
                    resolve("重命名成功.")
                }, onerror: function (error) {
                    // 请求失败
                    console.error('重命名请求失败: ', error);
                    reject('重命名失败！');
                }
            });
        })
    }

    function getQueryString(params) {
        return Object.keys(params)
            .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(params[key]))
            .join('&');
    }


    let login = () => {
        return new Promise((resolve, reject) => {
            if (!config.username || !config.password || !config.address) {
                reject("请点击脚本设置 QBittorrent 下载配置！")
                return
            }
            GM_xmlhttpRequest({
                method: 'POST', url: `${config.address}/api/v2/auth/login`, data: getQueryString({
                    'username': config.username, 'password': config.password
                }), headers: {
                    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
                }, onload: function (response) { // 请求成功
                    if (response.status == "404") {
                        reject("请检查配置【qBittorrent Web UI】访问地址是否正确");
                        return;
                    }
                    if (response.responseText == "Fails.") {
                        reject("登录失败！ 请检查用户名和密码是否配置正确！");
                        return;
                    }
                    console.log('Login Response:', response.responseText);
                    resolve("登录成功！")
                }, onerror: function (error) { // 请求失败
                    console.error('请求发生错误:', error);
                    reject("登录失败！");
                }
            });
        })
    }


    /**
     * 将种子添加到qBittorrent
     * @param {String} rename 选中种子名
     * @param {String} savePath 
     * @param {String} torrentUrl 
     * @returns 
     */
    function addTorrentToQBittorrent(rename, savePath, torrentUrl) {
        return new Promise(function (resolve, reject) {

            if (!torrentUrl) {
                cocoMessage.error("获取下载地址为空！", 10000, true);
                return;
            }

            // 构建请求体数据
            let formData = new FormData();
            formData.append('urls', torrentUrl);
            // formData.append('autoTMM', false); // 是否应使用自动种子管理
            formData.append('savepath', savePath); // 下载文件夹 不传就保存到默认文件夹
            // formData.append('cookie', '');
            formData.append('rename', rename); // 重命名种子
            // formData.append('category', '');
            formData.append('paused', !config.autoStartDownload); // 暂停? 默认 false
            // formData.append('stopCondition', 'None');
            // formData.append('contentLayout', 'Original');
            // formData.append('dlLimit', 'NaN'); // 设置种子下载速度限制。单位为字节/秒
            // formData.append('upLimit', 'NaN'); // 设置种子上传速度限制。单位为字节/秒

            let downloadMsg = cocoMessage.loading("下载中！", 10000, true);

            GM_xmlhttpRequest({
                method: 'POST',
                url: `${config.address}/api/v2/torrents/add`,
                data: formData,
                onload: async function (response) {
                    const responseData = response.responseText;
                    if (responseData !== "Ok.") {
                        downloadMsg();
                        reject(`添加种子失败: ${responseData}`);
                    } else {
                        await sleep(1000)
                        downloadMsg();
                        resolve("添加种子成功.");
                    }
                },
                onerror: function (error) {
                    downloadMsg();
                    console.error('添加种子失败: 请求发生错误:', error);
                    reject("添加种子失败: 请求发生错误...");
                }
            });

        })
    }

    let sleep = (time) => {
        return new Promise((resolve) => {
            setTimeout(function () {
                console.log(`经过 ${time} 毫秒`);
                resolve()
            }, time);
        })
    }

    /**
     * 设置文件分隔符和默认目录  打开设置时触发
     */
    function setFileSystemSeparatorAndDefaultSavePath() {
        return new Promise((resolve, reject) => {
            login().then(m => {
                return new Promise((resolve, reject) => {
                    GM_xmlhttpRequest({
                        method: 'GET', // url: `${config.address}/api/v2/app/preferences`,
                        url: `${config.address}/api/v2/app/defaultSavePath`, onload: function (response) {

                            if (response.status != "200") {
                                resolve("获取默认保存路径失败！");
                                return;
                            }

                            let save_path = response.responseText;

                            console.log("默认保存路径:", save_path)

                            // 设置 Linux or Windows 文件分隔符
                            let separator = save_path[1] == ":" ? "\\" : "/"
                            GM_setValue("separator", separator)

                            console.log("设置 Linux or Windows 文件分隔符为 ", separator)

                            // 设置默认文件夹
                            let saveLocations = GM_getValue("saveLocations");
                            if (!saveLocations || saveLocations.length == 0 || (saveLocations.length == 1 && saveLocations[0].label == "默认" && !saveLocations[0].value)) {
                                GM_setValue("saveLocations", [{ label: "默认", value: save_path }])
                                console.log("设置默认保存位置为 ", save_path)
                            }
                            resolve();
                        }, onerror: function (error) {
                            console.error('获取系统信息失败！', error);
                            reject("获取系统信息失败！")
                        }
                    });
                })
            }).then(m => {
                resolve()
            }).catch((e) => {
                console.log(e);
                // alert(e);
                reject(e)
            })
        })
    };

    function download(rename, savePath, hash, torrentUrl, autoCloseWindow) {
        let readyRenameMsg = null;
        login().then(m => { // 检查是否添加过了
            console.log(m)
            return chcekExist(hash);
        }).then(m => { // 添加种子
            if (m) console.log(m)
            return addTorrentToQBittorrent(rename, savePath, torrentUrl);
        }).then(m => {
            readyRenameMsg = cocoMessage.loading("重命名中...", true);
            return Promise.retry(() => getTorrentInfo(hash), 60, 1500);
        }).then((data) => { // 文件重命名
            console.log(data.message);
            return renameFileOrFolder(hash, data.oldFileName, rename);
        }).then(() => {
            readyRenameMsg()
            console.log("下载并重命名成功！")
            if (autoCloseWindow && !(window.history && window.history.length > 1)) {
                cocoMessage.success("下重命名成功！ 窗口 3 秒后关闭！", 0);
                setTimeout(function () {
                    window.close();
                }, 3000);
            } else {
                cocoMessage.success("下载并重命名成功！", 0);
            }
        }).catch((e) => {
            if (readyRenameMsg) readyRenameMsg();
            console.log(e);
            cocoMessage.error(e, 0);
        })
    };


    /**
     *
     * 取代 Linux 和 Windows 非法字符为空格
     *
     * @param {*} filename
     */
    function replaceUnsupportedCharacters(filename) {
        // 使用正则表达式匹配Linux和Windows不支持的字符
        let unsupportedCharsRegex = /[\/:*?"<>|]/g;

        // 将不支持的字符替换为空格
        let replacedFilename = filename.replace(unsupportedCharsRegex, ' ');

        return replacedFilename;
    }


    function init() {
        let torrentName = pt.getTorrentName();
        let app = new Vue({
            el: '#download-html', data: {
                isVisible: false, //
                isPopupVisible: false,
                selectedLabel: GM_getValue("selectedLabel", 0), // 默认下载位置索引
                config: {
                    address: GM_getValue("address", ""), // qBittorrent Web UI 地址 http://127.0.0.1:8080
                    username: GM_getValue("username", ""), // qBittorrent Web UI的用户名
                    password: GM_getValue("password", ""), // qBittorrent Web UI的密码
                    saveLocations: GM_getValue("saveLocations", [{ label: "默认", value: "" }]), // 下载目录 默认 savePath 兼容老版本
                    separator: GM_getValue("separator", null), // 文件分隔符 兼容 Linux Windows
                    autoStartDownload: GM_getValue("autoStartDownload", true),
                    autoCloseWindow: GM_getValue("autoCloseWindow", false) // 自动关闭窗口，只在窗口只有这个页面时生效
                },
                torrentName: torrentName,
                title: pt.getTorrentTitle(),
                subTitle: pt.getTorrentSubTitle(),
                // 拖动div
                isDragging: false,
                initialX: 0,
                initialY: 0,
                position: { x: 0, y: 0 },
            },
            methods: {
                toggleConfigPopup() {
                    // 切换元素的显示与隐藏
                    this.isVisible = !this.isVisible;
                },
                togglePopup() {
                    // 切换元素的显示与隐藏
                    this.isPopupVisible = !this.isPopupVisible;
                },
                configSave() {

                    this.toggleConfigPopup();

                    if (this.config.address && this.config.address.endsWith("/")) {
                        this.config.address = this.config.address.slice(0, -1);
                    }

                    Object.entries(this.config).forEach(([key, value]) => {
                        console.log(`Key: ${key}, Value: `, value);
                        GM_setValue(key, value);
                    });

                    config = this.config;
                    setFileSystemSeparatorAndDefaultSavePath().then(() => {
                        this.config.saveLocations = GM_getValue("saveLocations", []);
                        this.config.separator = GM_getValue("separator", null);
                        console.log("refresh vue data.")
                        config = this.config;
                    }).catch((e) => {
                        cocoMessage.error(e, 3000, true);
                    })

                },
                autoStartDownloadCheckboxChange() {
                    console.log('Checkbox state changed. New state:', this.config.autoStartDownload);
                    GM_setValue("autoStartDownload", this.config.autoStartDownload);
                },
                autoCloseWindowCheckboxChange() {
                    console.log('Checkbox state changed. New state:', this.config.autoCloseWindow);
                    GM_setValue("autoCloseWindow", this.config.autoCloseWindow);
                },
                download(inputValue) {

                    console.log("InputValue: ", inputValue)

                    this.togglePopup();

                    const isFolderFlag = isFolder(torrentName);

                    // 原来文件是单文件 当前文件名未加后缀
                    if (!isFolderFlag && isFolder(inputValue)) inputValue += getSuffix(torrentName);

                    console.log("InputValue 增加后缀: ", inputValue)

                    let byteCount = new TextEncoder().encode(inputValue).length;
                    if (byteCount > 255) {
                        console.log(`字节数超过255，有 ${byteCount} 个字节。`);
                        cocoMessage.error(`字节数超过255，一个中文占用3字节，当前字节数：${byteCount}`, 10000, true);
                        return;
                    }

                    config = this.config;

                    if (this.config.saveLocations.length == 0 || this.selectedLabel >= this.config.saveLocations.length) {
                        cocoMessage.error("必须选择下载位置，如果没有下载位置请点击脚本图标进行配置。", 10000, true);
                        return;
                    }

                    let savePath = this.config.saveLocations[this.selectedLabel].value;
                    if (!savePath) {
                        cocoMessage.error("下载路径为空！", 10000, true);
                        return;
                    }
                    console.log("下载路径:", savePath)

                    // 记住上次下载位置
                    GM_setValue("selectedLabel", this.selectedLabel);

                    download(inputValue, savePath, pt.getTorrentHash(), pt.getTorrentUrl(), this.config.autoCloseWindow);
                },
                addLine() {
                    this.config.saveLocations.push({ label: "", value: "" })
                },
                saveLine() {
                    GM_setValue("saveLocations", this.config.saveLocations)
                },
                delLine(index) {
                    console.log("删除元素:", this.config.saveLocations[index])
                    this.config.saveLocations.splice(index, 1)
                    if (this.selectedLabel >= this.config.saveLocations.length) {
                        this.selectedLabel = 0;
                        GM_setValue("selectedLabel", 0)
                    }
                }, // 拖动 div
                startDragging(e) {

                    // console.log("拖动", e.target)
                    if (e.target === this.$el.querySelector('#popup') || e.target === this.$el.querySelector('#download-title')) {  // 只有在鼠标在popup上时才允许拖动,外圈
                        this.isDragging = true;
                        this.initialX = e.clientX - this.position.x;
                        this.initialY = e.clientY - this.position.y;
                        // 鼠标样式设置为 grabbing 拖动
                        // this.$el.querySelector('#popup').style.cursor = 'grabbing';

                        window.addEventListener('mousemove', this.drag);
                        window.addEventListener('mouseup', this.stopDragging);
                    }
                },
                drag(e) {
                    if (!this.isDragging) return;
                    this.position.x = e.clientX - this.initialX;
                    this.position.y = e.clientY - this.initialY;
                },
                stopDragging() {
                    this.isDragging = false;
                    // 抓住鼠标样式
                    // this.$el.querySelector('#popup').style.cursor = 'grab';

                    window.removeEventListener('mousemove', this.drag);
                    window.removeEventListener('mouseup', this.stopDragging);
                },
            }, computed: {
                calculateStyles() {
                    if (this.position.x == 0 && this.position.y == 0) {
                        const parentWidth = this.$el.querySelector('#popup').offsetWidth;
                        const parentHeight = this.$el.querySelector('#popup').offsetHeight;

                        const translateX = -50 * parentWidth / 100;
                        const translateY = -50 * parentHeight / 100;
                        // console.log("translateX", translateX)
                        // console.log("translateY", translateY)
                        this.position.x = translateX;
                        this.position.y = translateY;
                    }
                    return {
                        transform: `translate(${this.position.x}px, ${this.position.y}px)`,
                    };
                },
            },
        })

        document.getElementById("downloadButton").addEventListener('click', function () {
            app.isPopupVisible = true
        })

        GM_registerMenuCommand("点击这里进行配置", function () {
            app.isVisible = true
        });
    }


    function setStyle() {
        GM_addStyle(`
            .download-html {
                position: absolute;
            }
            .download-html table {
                border-right: medium none;
                border-top: medium none;
                border-left: medium none;
                border-bottom: medium none;
                border-collapse: collapse;
                background-color: #bccad6;
            }
            #download-title {
            text-align: center;
            }
            .download-html td{
                border-right: #000000 1px solid;
                border-top: #000000 1px solid;
                border-left: #000000 1px solid;
                border-bottom: #000000 1px solid;
            }
            .download-html .popup {
                width: auto;
                min-width: 550px;
                height: auto;
                min-height: 50px;
                background-color: #7c98ae;
                border: 3px solid #587993;
                border-radius: 4px;
                padding: 10px;
                position: fixed;
                top: 40vh;
                left: 50%;
                /* 在水平和垂直方向上都将元素向左和向上平移了它自身宽度和高度的一半。 */
                transform: translate(-50%, -50%);
            }

            .download-html .popup button {
                margin: 5px;
            }

            .download-html .textinput {
                width: 400px;
                background-color: #e4e4e4;
                border: 1px solid #587993;
                border-radius: 4px;
                height: 1.5em;
                display: inline-block;
                position: absolute;
                top: 50%;
                left: 0;
                transform: translate(0, -50%);
                width: 100%;
                font-size: 12px;
                line-height: 12px;
                margin: 0 8px 0 8px;
                width: calc(100% - 20px);
            }

            .download-html .popup input:focus {
                /* 这条语句必须有，不然border效果不生效 */
                outline: none;
                border: 1px solid #587993;
            }

            .download-html .popup table {
                width: 100%;
            }

            .download-html .popup tbody th {
                width: 5em;
            }

            .download-html .popup .t-download {
                width: 5em;
            }

            .download-html .popup td,
            .download-html .popup th {
                vertical-align: middle;
            }

            .download-html .popup .t-text {
                position: relative;
            }

            .download-html .popup .t-text p {
                visibility: hidden;
                margin: 0.8em;
                font-size: 12px;
                line-height: 1em;
            }
            .download-html th {
                text-align: center;
            }
            .download-html button {
                padding-block: 1px;
                padding-inline: 6px;
                background: revert;
                border:revert;
            }
            .download-html button:hover {
                background: revert;
            }
            .download-html .location-btn {
                height: 18px;
                font-size: 12px;
                line-height: 12px;
                margin: 0 !important;
            }

            .download-html .draggable {
                // position: absolute;
                // cursor: grab;
            }
            #configPopup input {
                position: initial;
                transform: none;
                padding: 0;
                margin: 0;
                width: 100%;
                border: 0;
                border-radius: 0;
            }
            .script-div {
                display: inline-block;
            }
        `)

        if (!isNexusPHP()) {
            GM_addStyle(`.script-div {
                position: fixed;
                top: 50%;
                right: 0;
            }`)
        }
    }


    function setHtml() {

        // 设置下载按钮
        let downloadButton = ` <div class="script-div"><button id="downloadButton">QBitorrent下载</button><div id='download-html' class='download-html'></div></div>`;
        if (isNexusPHP()) {
            document.querySelector("#outer img.dt_download").closest("td").innerHTML += downloadButton;
        } else {
            document.querySelector("body").innerHTML += downloadButton;
        }


        let downloadHtml = `
            <div id="configPopup"  class="popup" style="z-index: 2;" v-show="isVisible">
                <table>
                    <thead style="height: 3em;">
                        <tr>
                            <th colspan="3" style="text-align: center;">请进行 qBittorrent 配置 </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <th>地址:</th>
                            <td class="t-text">
                                <input class="textinput" autocomplete="off" type="text" placeholder="http://127.0.0.1:8080" v-model="config.address">
                            </td>
                        </tr>
                        <tr>
                            <th>用户名:</th>
                            <td class="t-text">
                                <input class="textinput" autocomplete="off" type="text" placeholder="qBittorrent 用户名" v-model="config.username">
                            </td>
                        </tr>
                        <tr>
                            <th>密码:</th>
                            <td class="t-text">
                                <input class="textinput" autocomplete="off" type="password" placeholder="qBittorrent 密码" v-model="config.password">
                            </td>
                        </tr>
                        <tr>
                            <th>下载位置:</th>
                            <td class="t-text">
                                <table>
                                    <tbody>
                                        <tr v-for="(item, index) in config.saveLocations" :key="index">
                                            <td><input class="textinput" v-model="item.label" placeholder="标签"></td>
                                            <td>
                                                <input class="textinput" v-model="item.value" placeholder="下载路径">
                                            </td>
                                            <td ><button class="location-btn" type="button" @click="delLine(index)">删除</button></td>
                                        </tr>
                                        <tr>
                                            <th></th>
                                            <td style="border: 0;"></td>
                                            <td style="border: 0;"><button class="location-btn" type="button" @click="addLine()">添加</button></td>
                                            <!-- <button type="button" @click="saveLine($event)">保存</button> -->
                                        </tr>
                                    </tbody>
                                </table>
                            </td>
                        </tr>
                        <tr>
                            <th>自动开始:</th>
                            <td class="t-text">
                                <input class="textinput" type="checkbox" :checked="config.autoStartDownload" v-model="config.autoStartDownload" @change="autoStartDownloadCheckboxChange">
                            </td>
                        </tr>
                        <tr>
                            <th title="打开状态时，如果新的窗口只有这一个页面，则在下载并重命名成功后会自动关闭该窗口。">智能关窗:</th>
                            <td class="t-text">
                                <input class="textinput" type="checkbox" :checked="config.autoCloseWindow" v-model="config.autoCloseWindow" @change="autoCloseWindowCheckboxChange">
                            </td>
                        </tr>
                        <tr>
                            <th></th>
                            <td class="t-text"><button type="button" id="configSave" @click="configSave($event)">保存</button><button  type="button" @click="toggleConfigPopup()">关闭</button></td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div id="popup" class="popup draggable"  @mousedown="startDragging" v-show="isPopupVisible" style="z-index: 1;" :style="calculateStyles">
                <table>
                    <thead style="height: 3em;">
                        <tr>
                            <th id="download-title" colspan="3">请选择文件名下载 </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <th>下载位置:</th>
                            <td class="t-text" colspan="2" style="padding: 6px 6px 6px 6px;">
                                <div style="flex-wrap: wrap;">
                                    <label :title="item.value" style="vertical-align: middle;white-space: nowrap;display: inline-flex;padding: 3px;" v-for="(item, index) in config.saveLocations" :key="index">
                                        <input style="vertical-align: middle;margin: 0px 2px 0px 2px;" type="radio" v-model="selectedLabel" :value="index">
                                        {{ item.label }}
                                    </label>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <th>种子名:</th>
                            <td class="t-text">
                                <input :title="torrentName" class="textinput" v-model="torrentName">
                                <p>{{torrentName}}</p>
                            </td>
                            <td class="t-download"><button @click="download(torrentName)">下载</button></td>
                        </tr>
                        <tr>
                            <th>主标题:</th>
                            <td class="t-text">
                                <input :title="title" class="textinput" v-model="title">
                                <p>{{title}}</p>
                            </td>
                            <td class="t-download"><button @click="download(title)">下载</button></td>
                        </tr>
                        <tr>
                            <th>副标题:</th>
                            <td class="t-text">
                                <input :title="subTitle" class="textinput" v-model="subTitle">
                                <p>{{subTitle}}</p>
                            </td>
                            <td class="t-download"><button @click="download(subTitle)">下载</button></td>
                        </tr>
                        <tr>
                            <th>自动开始:</th>
                            <td class="t-text"><input class="textinput" type="checkbox" :checked="config.autoStartDownload" v-model="config.autoStartDownload"></td>
                            <td class="t-download"><button @click="togglePopup()">关闭</button></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;

        document.getElementById("download-html").innerHTML = downloadHtml;
    }

    // let matchRegex = /^https:\/\/.+\/details.php\?id=[0-9]+&hit=1$/
    // matchRegex.test(window.location.href)

    function isNexusPHP() {
        let meta = document.querySelector('meta[name="generator"]')
        return meta && meta.getAttribute("content") == "NexusPHP";
    }


    // const requestDataMap = new Map();

    // // 拦截所有请求
    // const originFetch = fetch;
    // console.log(originFetch)
    // window.unsafeWindow.fetch = (url, options) => {
    //     console.log(url)
    //     return originFetch(url, options).then((response) => {
    //         console.log(url)
    //         requestDataMap.set(url, response)
    //         return response;
    //     });
    // };

    // const originOpen = XMLHttpRequest.prototype.open;
    // XMLHttpRequest.prototype.open = function (_, url) {
    //     const xhr = this;
    //     const getter = Object.getOwnPropertyDescriptor(
    //         XMLHttpRequest.prototype,
    //         "response"
    //     ).get;
    //     Object.defineProperty(xhr, "responseText", {
    //         get: () => {
    //             let result = getter.call(xhr);
    //             debugger;
    //             requestDataMap.set(url, result)
    //             return result;
    //         },
    //     });
    //     originOpen.apply(this, arguments);
    // };



    function main() {
        if (getSite() || isNexusPHP()) {
            setStyle();
            setHtml();
            init();
        } else {
            console.log("非 NexusPHP 站点，或未经过特殊配置站点，暂不支持！")
        }
    }

    // console.log(requestDataMap)
    if (document.readyState === "loading") {
        // 在DOM加载完成后执行的代码，页面资源加载可能仍在进行中，但DOM已准备就绪
        document.addEventListener('DOMContentLoaded', function () {
            // 单独配置了的站点或者 NexusPHP 站点
            console.log("在DOM加载完成后执行...")
            main();
        });
    } else {
        // `DOMContentLoaded` 已经被触发 极低概率触发。。。
        console.log("DOMContentLoaded 已经被触发")
        main();
    }

})();
