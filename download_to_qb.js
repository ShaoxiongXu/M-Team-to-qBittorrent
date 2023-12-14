// ==UserScript==
// @name         种子下载工具
// @namespace    https://github.com/ShaoxiongXu/M-Team-to-qBittorrent
// @description  在种子详情页添加下载按钮，点击后可以选择【标题|种子名|副标题】并将种子添加到 qBittorrent|Transmission，支持文件重命名并指定下载位置，兼容 NexusPHP 站点。
// @version      4.1
// @icon         https://www.qbittorrent.org/favicon.svg
// @require      https://cdn.jsdelivr.net/npm/vue@2.7.14/dist/vue.js
// @require      https://cdn.jsdelivr.net/gh/ShaoxiongXu/M-Team-to-qBittorrent@304e1e487cc415fa57aef27e6a1d3f74308a98e2/coco-message.js
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
                let match = text.match(/hash.?:\s([a-fA-F0-9]{40})/i);
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

    const PT = {
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

    let qbittorrent = (function () {
        let login = () => {
            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'POST', url: `${config.address}/api/v2/auth/login`, data: getQueryString({
                        'username': config.username, 'password': config.password
                    }), headers: {
                        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
                    }, onload: function (response) { // 请求成功
                        if (response.status === 404) {
                            reject("请检查 qBittorrent 访问地址是否正确");
                            return;
                        }
                        if (response.responseText !== "Ok.") {
                            reject("请检查 qBittorrent 配置是否正确！");
                            return;
                        }

                        console.log('Login Response:', response.responseText);
                        resolve("请求成功！")
                    }, onerror: function (error) { // 请求失败
                        console.error('请求发生错误:', error);
                        reject("qBittorrent 无响应！");
                    }
                });
            })
        }
        /**
         * 获取种子信息
         * @param {String} hash 种子hash
         */
        let getTorrentInfo = (hash) => {
            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: `${config.address}/api/v2/torrents/info?hashes=${hash}`,
                    onload: function (response) {

                        let data = JSON.parse(response.responseText);
                        console.log("查询到种子数:", data.length)

                        if (data && data.length === 1) {

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
                    },
                    onerror: function (error) {
                        console.error('获取种子信息失败: 请求发生错误:', error);
                        reject("获取种子信息失败！")
                    }
                });
            })

        }

        /**
         * 判断种子是否存在了
         * @returns
         * @param hash
         */
        let checkExist = (hash) => {
            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: `${config.address}/api/v2/torrents/info?hashes=${hash}`,
                    onload: function (response) {
                        let data = JSON.parse(response.responseText);
                        if (data && data.length === 1) {
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

        /**
         * 将种子添加到qBittorrent
         * @param {String} rename 选中种子名
         * @param {String} savePath
         * @param {String} torrentUrl
         * @returns
         */
        function addTorrent(rename, savePath, torrentUrl) {
            return new Promise(function (resolve, reject) {

                let formData = new FormData();
                formData.append('urls', torrentUrl);
                formData.append('savepath', savePath); // 下载文件夹 不传就保存到默认文件夹
                formData.append('rename', rename); // 重命名种子
                formData.append('paused', !config.autoStartDownload); // 暂停? 默认 false

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

        return {
            download: (rename, savePath, hash, torrentUrl, autoCloseWindow) => {
                let readyRenameMsg = null;
                login().then(m => { // 检查是否添加过了
                    console.log(m)
                    return checkExist(hash);
                }).then(m => { // 添加种子
                    if (m) console.log(m)
                    return addTorrent(rename, savePath, torrentUrl);
                }).then(m => {
                    readyRenameMsg = cocoMessage.loading("重命名中...", true);
                    return Promise.retry(() => getTorrentInfo(hash), 60, 1500);
                }).then((data) => { // 文件重命名
                    console.log(data.message);
                    if (data.oldFileName === rename) {
                        console.log("文件名相同无需修改");
                        return;
                    }
                    return renameFileOrFolder(hash, data.oldFileName, rename);
                }).then(() => {
                    readyRenameMsg()
                    downloadSucceed(autoCloseWindow);
                }).catch((e) => {
                    if (readyRenameMsg) readyRenameMsg();
                    console.log(e);
                    cocoMessage.error(e, 0);
                })
            },
            setFileSystemSeparatorAndDefaultSavePath: () => {
                // 设置文件分隔符和默认目录  打开设置时触发
                return new Promise((resolve, reject) => {
                    login().then(m => {
                        return new Promise((resolve, reject) => {
                            GM_xmlhttpRequest({
                                method: 'GET',
                                url: `${config.address}/api/v2/app/defaultSavePath`, onload: function (response) {

                                    if (response.status !== 200) {
                                        resolve("获取默认保存路径失败！");
                                        return;
                                    }

                                    let save_path = response.responseText;

                                    console.log("默认保存路径:", save_path)

                                    setConfig(save_path, resolve);
                                }, onerror: function (error) {
                                    console.error('获取系统信息失败！', error);
                                    reject("获取系统信息失败！")
                                }
                            });
                        })
                    }).then(m => {
                        resolve(m)
                    }).catch((e) => {
                        console.log(e);
                        // alert(e);
                        reject(e)
                    })
                })
            }
        }
    })();

    let transmission = (function () {

        let sessionId = GM_getValue("sessionId", "");

        function request(data, onload, onerror) {
            GM_xmlhttpRequest({
                method: 'POST',
                url: `${config.address}/transmission/rpc`,
                data: JSON.stringify(data),
                headers: {
                    'Content-Type': 'application/json',
                    'X-Transmission-Session-Id': sessionId,
                },
                user: config.username,
                password: config.password,
                onload,
                onerror
            });
        }

        function getBasicInfo() {
            return new Promise(async (resolve, reject) => {
                request({"method": "session-get"}, async function (response) { // 请求成功
                    console.log('Login Response:', response.responseText);
                    if (response.status === 404) {
                        reject("请检查 Transmission 访问地址是否正确");
                        return;
                    }
                    if (response.status === 409) { // X-Transmission-Session-Id 失效
                        sessionId = response.responseHeaders.match(/X-Transmission-Session-Id:\s*(\S+)/i)[1];
                        GM_setValue("sessionId", sessionId);
                        // 加 await 更直观
                        await getBasicInfo(true).then(resolve).catch(reject);
                        return;
                    }
                    if (response.status !== 200) {
                        reject("请检查 Transmission 配置是否正确！");
                        return;
                    }

                    let data = JSON.parse(response.responseText);
                    console.log("session-get: ", data)
                    if (data.result !== "success") {
                        reject(`请求失败：${data.result}`);
                        return;
                    }

                    resolve({
                        message: "登录成功！",
                        savePath: data.arguments["download-dir"]
                    })
                }, function (error) { // 请求失败
                    console.error('请求发生错误:', error);
                    reject("Transmission 无响应！");
                });
            })
        }

        function addTorrent(rename, savePath, torrentUrl) {
            return new Promise((resolve, reject) => {
                request({
                    "arguments": {
                        "download-dir": savePath,
                        "filename": torrentUrl,
                        "paused": !config.autoStartDownload
                    },
                    "method": "torrent-add"
                }, function (response) {
                    const responseData = response.responseText;
                    if (response.status !== 200) {
                        return reject(`添加种子失败: ${responseData}`);
                    }

                    let data = JSON.parse(response.responseText);
                    console.log("torrent-add: ", data)
                    if (data.result !== "success") {
                        return reject(`添加种子失败：${data.result}`);
                    }
                    let duplicate = data.arguments["torrent-duplicate"];
                    let torrent = duplicate ? data.arguments["torrent-duplicate"] : data.arguments["torrent-added"];
                    resolve({
                        message: "添加种子成功.",
                        id: torrent.id,
                        hash: torrent.hashString,
                        name: torrent.name,
                        duplicate: duplicate
                    });
                })
            })
        }

        function renameFile(id, oldPath, newPath) {
            return new Promise((resolve, reject) => {
                request({
                    "arguments": {
                        "ids": [id],
                        "name": newPath,
                        "path": oldPath
                    },
                    "method": "torrent-rename-path"
                }, function (response) {
                    const responseData = response.responseText;
                    if (response.status !== 200) {
                        return reject(`添加种子失败: ${responseData}`);
                    }
                    let data = JSON.parse(response.responseText);
                    console.log("torrent-rename-path: ", data)
                    if (data.result !== "success") {
                        reject(`重命名文件失败: ${data.result}`);
                    }
                    resolve({
                        message: "添加种子成功.",
                        id: data.arguments.id,
                        hash: data.arguments.hashString,
                        name: data.arguments.name,
                    });
                })
            })
        }

        return {
            download: (rename, savePath, hash, torrentUrl, autoCloseWindow) => {
                let readyRenameMsg = cocoMessage.loading("下载中...", true);
                let duplicate = false;
                getBasicInfo().then((data) => {
                    console.log(data.message)
                    return addTorrent(rename, savePath, torrentUrl);
                }).then((data) => {
                    console.log(data.message)
                    duplicate = data.duplicate;
                    if (data.name === rename) {
                        console.log("文件名相同无需修改");
                        return;
                    }
                    return renameFile(data.id, data.name, rename);
                }).then(() => {
                    readyRenameMsg()
                    downloadSucceed(autoCloseWindow, duplicate);
                }).catch((e) => {
                    readyRenameMsg();
                    console.log(e);
                    cocoMessage.error(e, 0);
                });
            },
            setFileSystemSeparatorAndDefaultSavePath: () => { // 设置文件分隔符和默认目录  打开设置时触发
                return new Promise((resolve, reject) => {
                    getBasicInfo().then(data => {
                        let save_path = data.savePath;
                        console.log("默认保存路径:", save_path)
                        setConfig(save_path, resolve);
                    }).catch((e) => {
                        console.log(e);
                        // alert(e);
                        reject(e)
                    })
                })
            }
        }
    })();

    /**
     * 这里定义不同的客户端
     * @type {{transmission: {download: transmission.download, setFileSystemSeparatorAndDefaultSavePath: (function(): Promise<unknown>)}, qbittorrent: {download: qbittorrent.download, setFileSystemSeparatorAndDefaultSavePath: (function(): Promise<unknown>)}}}
     */
    const Client = {
        qbittorrent: qbittorrent,
        transmission: transmission
    }

    function downloadSucceed(autoCloseWindow, duplicate = false) {
        console.log("下载并重命名成功！")
        let message = duplicate ? "种子已存在，重命名成功！" : "下载并重命名成功！";
        if (autoCloseWindow && !(window.history && window.history.length > 1)) {
            cocoMessage.success(`${message} 窗口 3 秒后关闭！`, 0);
            setTimeout(function () {
                window.close();
            }, 3000);
        } else {
            cocoMessage.success(message, 0);
        }
    }

    function setConfig(save_path, resolve) {
        // 设置 Linux or Windows 文件分隔符
        let separator = save_path[1] === ":" ? "\\" : "/"
        GM_setValue("separator", separator)

        console.log("设置 Linux or Windows 文件分隔符为 ", separator)

        // 设置默认文件夹
        let saveLocations = GM_getValue("saveLocations");
        if (!saveLocations || saveLocations.length === 0 || (saveLocations.length === 1 && saveLocations[0].label === "默认" && !saveLocations[0].value)) {
            GM_setValue("saveLocations", [{label: "默认", value: save_path}])
            console.log("设置默认保存位置为 ", save_path)
            resolve("保存配置成功，并设置了默认下载位置！");
            return;
        }
        resolve("保存配置成功！");
    }

    let sleep = (time) => {
        return new Promise((resolve) => {
            setTimeout(function () {
                console.log(`经过 ${time} 毫秒`);
                resolve()
            }, time);
        })
    }

    function getQueryString(params) {
        return Object.keys(params)
            .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(params[key]))
            .join('&');
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
     * @description: 加入失败后使用失败重试功能，如果 n 次中有任意一次成功了，就停止尝试并返回
     * @param fn
     * @param times
     * @param delay
     * @returns {Promise<unknown>}
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
     * 取代 Linux 和 Windows 非法字符为空格
     *
     * @param {*} filename
     */
    function replaceUnsupportedCharacters(filename) {
        // 使用正则表达式匹配Linux和Windows不支持的字符
        let unsupportedCharsRegex = /[\/:*?"<>|]/g;

        // 将不支持的字符替换为空格
        return filename.replace(unsupportedCharsRegex, ' ');
    }

    function init() {
        let torrentName = PT.getTorrentName();
        let app = new Vue({
            el: '#script-div',
            data: {
                isVisible: false, //
                isPopupVisible: false,
                selectedLabel: GM_getValue("selectedLabel", 0), // 默认下载位置索引
                config: {
                    address: GM_getValue("address", ""), //  Web UI 地址 http://127.0.0.1:8080
                    username: GM_getValue("username", ""), //  Web UI的用户名
                    password: GM_getValue("password", ""), //  Web UI的密码
                    saveLocations: GM_getValue("saveLocations", [{label: "默认", value: ""}]), // 下载目录 默认 savePath 兼容老版本
                    separator: GM_getValue("separator", null), // 文件分隔符 兼容 Linux Windows
                    autoStartDownload: GM_getValue("autoStartDownload", true),
                    autoCloseWindow: GM_getValue("autoCloseWindow", false), // 自动关闭窗口，只在窗口只有这个页面时生效
                    client: GM_getValue("client", "qbittorrent")
                },
                torrentName: torrentName,
                title: PT.getTorrentTitle(),
                subTitle: PT.getTorrentSubTitle(),
                // 拖动div
                isDragging: false,
                initialX: 0,
                initialY: 0,
                position: {x: 0, y: 0},
            },
            methods: {
                toggleConfigPopup() {
                    this.isVisible = !this.isVisible;
                },
                togglePopup() {
                    // 切换元素的显示与隐藏
                    if (!this.isPopupVisible) {
                        cocoMessage.destroyAll();
                    }
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
                    Client[config.client].setFileSystemSeparatorAndDefaultSavePath().then((m) => {
                        this.config.saveLocations = GM_getValue("saveLocations", []);
                        this.config.separator = GM_getValue("separator", null);
                        console.log("refresh vue data.")
                        config = this.config;
                        cocoMessage.success(m, 3000);
                    }).catch((e) => {
                        cocoMessage.error(e, 10000, true);
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

                    if (!this.config.username || !this.config.password || !this.config.address) {
                        cocoMessage.error("请点击脚本图标进行下载配置", 10000, true);
                        return
                    }

                    if (!this.config.username || !this.config.password || !this.config.address) {
                        cocoMessage.error("请点击脚本图标进行下载配置", 10000, true);
                        return
                    }

                    let byteCount = new TextEncoder().encode(inputValue).length;
                    if (byteCount > 255) {
                        console.log(`字节数超过255，有 ${byteCount} 个字节。`);
                        cocoMessage.error(`字节数超过255，一个中文占用3字节，当前字节数：${byteCount}`, 10000, true);
                        return;
                    }

                    config = this.config;


                    if (this.config.saveLocations.length === 0 || this.selectedLabel >= this.config.saveLocations.length) {
                        cocoMessage.error("必须选择下载位置，如果没有下载位置请点击脚本图标进行配置", 10000, true);
                        return;
                    }

                    let savePath = this.config.saveLocations[this.selectedLabel].value;
                    if (!savePath) {
                        cocoMessage.error("下载路径为空！如果没有下载位置请点击脚本图标进行配置", 10000, true);
                        return;
                    }

                    let torrentUrl = PT.getTorrentUrl();
                    if (!torrentUrl) {
                        cocoMessage.error("获取下载地址为空！", 10000, true);
                        return;
                    }

                    console.log("下载路径:", savePath)

                    // 记住上次下载位置
                    GM_setValue("selectedLabel", this.selectedLabel);
                    Client[config.client].download(inputValue, savePath, PT.getTorrentHash(), torrentUrl, this.config.autoCloseWindow);
                },
                addLine() {
                    this.config.saveLocations.push({label: "", value: ""})
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
            },
            computed: {
                calculateStyles() {
                    return {
                        transform: `translate(${this.position.x}px, ${this.position.y}px)`,
                        visibility: this.isPopupVisible ? 'visible' : 'hidden'
                    };
                },
            },
            mounted() {
                // 设置下载框默认位置
                let element = this.$el.querySelector('#popup')
                const translateX = -50 * element.offsetWidth / 100;
                const translateY = -50 * element.offsetHeight / 100;
                console.log("translateX", translateX)
                console.log("translateY", translateY)
                this.position.x = translateX;
                this.position.y = translateY;
                element.style.position = `translate(${this.position.x}px, ${this.position.y}px)`;
            },
        })

        GM_registerMenuCommand("点击这里进行配置", function () {
            app.isVisible = true;
            cocoMessage.destroyAll();
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

        let box = isNexusPHP() ? document.querySelector("#outer img.dt_download").closest("td") : document.querySelector("body");

        box.innerHTML += `
            &nbsp;<div id="script-div" class="script-div">
            <button @click="togglePopup()">{{config.client}} 下载</button>
            <div id='download-html' class='download-html'>
                <div id="configPopup"  class="popup" style="z-index: 2;" v-show="isVisible">
                    <table>
                        <thead style="height: 3em;">
                            <tr>
                                <th colspan="3" style="text-align: center;">请进行下载配置 </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <th>客户端:</th>
                                <td class="t-text">
                                    <div style="flex-wrap: wrap;">
                                        <label style="vertical-align: middle;white-space: nowrap;display: inline-flex;padding: 3px;">
                                            <input style="vertical-align: middle;margin: 0px 2px 0px 2px;" type="radio" v-model="config.client" value="qbittorrent">
                                            qBittorrent
                                        </label>
                                        <label style="vertical-align: middle;white-space: nowrap;display: inline-flex;padding: 3px;">
                                            <input style="vertical-align: middle;margin: 0px 2px 0px 2px;" type="radio" v-model="config.client" value="transmission">
                                            Transmission
                                        </label>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <th>地址:</th>
                                <td class="t-text">
                                    <input class="textinput" autocomplete="off" type="text" placeholder="http://127.0.0.1:8080" v-model="config.address">
                                </td>
                            </tr>
                            <tr>
                                <th>用户名:</th>
                                <td class="t-text">
                                    <input class="textinput" autocomplete="off" type="text" placeholder="Web UI 登录用户名" v-model="config.username">
                                </td>
                            </tr>
                            <tr>
                                <th>密码:</th>
                                <td class="t-text">
                                    <input class="textinput" autocomplete="off" type="password" placeholder="Web UI 登录密码" v-model="config.password">
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
    
                <div id="popup" class="popup draggable"  @mousedown="startDragging" style="z-index: 1;" :style="calculateStyles">
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
            </div>
        </div>
        `;
    }

    // let matchRegex = /^https:\/\/.+\/details.php\?id=[0-9]+&hit=1$/
    // matchRegex.test(window.location.href)

    function isNexusPHP() {
        let meta = document.querySelector('meta[name="generator"]')
        return meta && meta.getAttribute("content") === "NexusPHP";
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
