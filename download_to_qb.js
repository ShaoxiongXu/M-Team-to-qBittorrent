// ==UserScript==
// @name         种子下载工具
// @namespace    https://github.com/ShaoxiongXu/M-Team-to-qBittorrent
// @description  在【馒头】或【NexusPHP 架构】PT站种子详情页添加下载按钮，点击后可以选择【标题|种子名|副标题】并将种子添加到 qBittorrent|Transmission，支持文件重命名并指定下载位置。
// @version      5.4
// @icon         https://www.qbittorrent.org/favicon.svg
// @require      https://cdn.jsdelivr.net/npm/vue@2.7.14/dist/vue.js
// @require      https://cdn.jsdelivr.net/gh/ShaoxiongXu/M-Team-to-qBittorrent@304e1e487cc415fa57aef27e6a1d3f74308a98e2/coco-message.js
// @match        https://*/details.php*
// @match        https://*/*/details.php*
// @match        https://test2.m-team.cc/detail/*
// @match        https://*.m-team.cc/detail/*
// @match        https://*.m-team.io/detail/*
// @match        https://totheglory.im/t/*
// @grant        GM_xmlhttpRequest
// @connect      *
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

    let torrentInfo = {}

    /**
     * 在这里面的网站走策略特殊处理 {域名标识: 标签(对应siteStrategies对象中key)}
     * sites 中没配置的走 NexusPHP 默认逻辑, NexusPHP 站点一般不用配置, 理论上 NexusPHP 站点都支持.
     *
     */
    let sites = {
        // "m-team.cc": "new_mteam",
        "m-team": "new_mteam",
        // "m-team": "mteam",
        "www.ptlsp.com": "ptlsp",
        "www.tjupt.org": "tjupt",
        "springsunday": "springsunday",
        "hhanclub": "hhanclub",
        "hdsky": "hdsky",
        "hdhome.org": "hdhome",
        "audiences.me": "audiences",
        "keepfrds.com": "keepfrds",
        "zmpt.cc": "zmpt",
        "hdarea.club": "hdarea",
        "totheglory": "totheglory",
        "hddolby.com": "hddolby"
    }

    // 异步加载种子信息的网站, 如新版馒头
    const asyncArr = ["new_mteam"]

    let host = window.location.host;

    function getSite() {
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
            getTorrentUrl: () => torrentInfo.url,
            getTorrentHash: () => "",
            getTorrentTitle: () => torrentInfo.name,
            getTorrentName: () => torrentInfo.originFileName,
            getTorrentSubTitle: () => torrentInfo.smallDescr,
            getDownloadButtonMountPoint: () => document.querySelector('button.ant-btn.ant-btn-link.ant-btn-sm.ant-dropdown-trigger')?.closest("td")
        },
        mteam: {
            getTorrentUrl: () => {
                return document.evaluate("//a[text()='[IPv4+https]']", document).iterateNext().href;
            }
        },
        ptlsp: {
            getTorrentUrl: () => document.querySelector(`#download_pkey`).getAttribute(`href`)
        },
        tjupt: {
            getTorrentUrl: () => document.querySelector(`#direct_link`).getAttribute(`href`)
        },
        springsunday: {
            getTorrentTitle: () => document.querySelector(`#torrent-name`).innerText,
            getDownloadButtonMountPoint: () => document.querySelector('a[title="下载种子"]').closest('td')
        },
        hhanclub: {
            getTorrentTitle: () => {
                return document.evaluate("//div[text()='标题']", document).iterateNext()?.nextElementSibling.innerText.trim()
            },
            getTorrentName: () => {
                let str = document.querySelector("a.index").innerText;
                console.log("原始种子名:", str);
                return /\.(.+)\./.exec(str)[1];
            },
            getTorrentSubTitle: () => document.evaluate("//div[text()='副标题']", document).iterateNext()?.nextElementSibling.innerText,
            getDownloadButtonMountPoint: () => document.querySelector(".flex.gap-x-5")
        },
        hdsky: {
            getTorrentName: () => {
                let str = document.evaluate("//td[text()='下载']", document).iterateNext()?.nextElementSibling.querySelector("input").value
                console.log("原始种子名:", str);
                return /\.(.+)\./.exec(str)[1];
            },
            getDownloadButtonMountPoint: () => document.querySelector("#outer .dt_download")?.closest("td")
        },
        hdhome: {
            getTorrentUrl: () => {
                const linkElement = document.querySelector('td.rowfollow a[href*="/download.php?id="]');
                return linkElement ? linkElement.getAttribute("href") : null;
            }
        },
        audiences: {
            getTorrentUrl: () => {
                const linkElement = document.getElementById('torrent_dl_url').querySelector('a');
                return linkElement ? linkElement.getAttribute('href') : null;
            }
        },
        zmpt: {
            getTorrentUrl: () => document.getElementById('content').textContent.trim()
        },
        keepfrds: {
            getTorrentUrl: () => document.getElementById('download_link').value
        },
        hdarea: {
            getTorrentTitle: () => {
                const titleElement = document.querySelector("h1#top");
                let titleText = titleElement.textContent.trim(); // 获取标题文本并去除首尾空白
                titleText = titleText.replace(/(<.*?>|\[.*?\])/g, ''); // 使用正则表达式替换 HTML 标签和括号内容
                return titleText ? titleText : null;
            },
            getTorrentUrl: () => {
                const regex = /https?:\/\/\S+download\.php\?id=\d+&passkey=\w+/;
                const match = document.body.textContent.match(regex);
                return match ? match[0] : null;
            }
        },
        totheglory: {
            getTorrentName: () => document.querySelector("td.rowhead").nextElementSibling.querySelector("a").textContent.replace("[TTG]", ""),
            getTorrentTitle: () => document.querySelector("h1").textContent,
            getTorrentSubTitle: () => "",
            getTorrentUrl: () => document.querySelector("td[valign='top'] a").getAttribute("href"),
            getDownloadButtonMountPoint: () => document.querySelector('a[href^="https://totheglory.im/dl/"]').closest('td')

        },
        hddolby: {
            getTorrentUrl: () => {
                const currentDomain = window.location.origin;
                const relativeUrl = [...document.querySelectorAll('a.faqlink')].find(element => element.textContent.includes('右键复制种子链接')).getAttribute('href');
                return currentDomain + '/' + relativeUrl;
            }
        },
        // 默认策略
        defaultStrategy: {
            getTorrentUrl: () => {
                let allLinks = document.querySelectorAll('body a');
                // 查找第一个下载链接 link.href 会自动将相对路径转换为绝对路径，提供完整的 URL。
                let firstMatchingLink = Array.from(allLinks).find(function (link) {
                    return /download.php\?id=[0-9]+&passkey=.+$/.test(link.href)
                        || /download.php\?downhash=[0-9]+\|.+$/.test(link.href);
                });
                return firstMatchingLink ? firstMatchingLink.href : "";
            },
            getTorrentHash: () => {
                let text = document.querySelector("body").innerText;
                // let match = text.match(/hash.?:\s([a-fA-F0-9]{40})/i);
                let match = text.match(/([a-fA-F0-9]{40})/);
                return match ? match[1] : "";
            },
            getTorrentTitle: () => {
                return document.querySelector("#top").firstChild.nodeValue;
            },
            getTorrentName: () => {
                let str = document.querySelector("#outer td.rowfollow > a.index").innerText.trim()
                console.log("原始种子名:", str);
                return /\.(.+)\./.exec(str)[1];
            },
            getTorrentSubTitle: () => {
                let subTitleTd = document.evaluate("//td[text()='副標題']", document).iterateNext()
                    || document.evaluate("//td[text()='副标题']", document).iterateNext()
                    || document.evaluate("//td[text()='Small Description']", document).iterateNext()
                return subTitleTd.nextElementSibling.innerText;
            },
            getDownloadButtonMountPoint: () => document.querySelector("#outer img.dt_download")?.closest("td")
        }
    };

    function execMethodName(methodName) {
        try {
            let strategy = getSite() && siteStrategies[getSite()] || siteStrategies.defaultStrategy;
            let execMethodName = strategy[methodName] || siteStrategies.defaultStrategy[methodName];
            let flag = getSite() && siteStrategies[getSite()] && siteStrategies[getSite()][methodName] ? getSite() : "defaultStrategy"
            console.log(`执行: ${flag}.${methodName}(${execMethodName})`)
            return execMethodName() ?? "";
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
            if (v.endsWith(".torrent")) {
                v = v.replace(".torrent", "");
            }
            console.log("种子名: ", v);
            return v;
        },
        getTorrentSubTitle: () => {
            let v = replaceUnsupportedCharacters(execMethodName("getTorrentSubTitle")).trim();
            console.log("副标题: ", v);
            return v;
        },
        getDownloadButtonMountPoint: () => {
            return execMethodName("getDownloadButtonMountPoint")
        }
    }

    // 封装 GM_xmlhttpRequest 为 Promise
    function GM_fetch(options) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                ...options,
                onload: (response) => resolve(response),
                onerror: (error) => reject(error),
            });
        });
    }


    let qbittorrent = (function () {
        let login = () => {
            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'POST',
                    url: `${config.address}/api/v2/auth/login`,
                    data: getQueryString({
                        'username': config.username, 'password': config.password
                    }),
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
                    },
                    onload: function (response) { // 请求成功
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
                    },
                    onerror: function (error) { // 请求失败
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
        let getTorrentInfo = (hash, newTorrentName) => {
            return new Promise((resolve, reject) => {
                if (hash) {
                    GM_xmlhttpRequest({
                        method: 'GET',
                        url: `${config.address}/api/v2/torrents/info?hashes=${hash}`,
                        onload: function (response) {

                            let data = JSON.parse(response.responseText);
                            console.log("查询到种子数:", data.length)

                            if (data && data.length === 1) {

                                let info = data[0];
                                console.log("种子信息:", info)
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
                } else {
                    GM_xmlhttpRequest({
                        method: 'GET',
                        url: `${config.address}/api/v2/torrents/info?${getQueryString({"limit": 5, "sort": "added_on", "reverse": "true"})}`,
                        onload: function (response) {

                            let dataArr = JSON.parse(response.responseText);

                            if (!dataArr) {
                                reject("获取种子信息失败,种子列表未找到种子.");
                                return;
                            }

                            dataArr.forEach((info) => {
                                if (info.name === newTorrentName) {

                                    console.log('TorrentInfo:', info);

                                    // content_path 这个路径不同版本不固定,有时候是相对路径,有时候是绝对路径
                                    // let oldFileName = info.content_path.replace(info.save_path, '').match(/([^\/]+)/)[0];
                                    // content_path: "D:\\Adobe\\Richard Walters - Murmurate (2023) [24B-48kHz]"
                                    // save_pat: "D:\Adobe"

                                    // 下载目录下面第一级
                                    let oldFilePath = info.content_path.replace(info.save_path, '');

                                    if (!oldFilePath.startsWith(config.separator)) oldFilePath = config.separator + oldFilePath;

                                    // 原文件名 -- 根据原文件名重命名 "Richard Walters - Murmurate (2023) [24B-48kHz]"
                                    let oldFileName = oldFilePath.split(config.separator)[1];

                                    console.log(`原文件名: ${oldFileName}`);

                                    console.log(`新文件名: ${newTorrentName}`);

                                    return resolve({
                                        "hash": info.hash,
                                        "oldFileName": oldFileName,
                                        "torrentName": newTorrentName,
                                        "message": "获取种子信息成功."
                                    })
                                }
                            })
                            console.log(dataArr)
                            reject("获取种子信息失败,种子列表未找到种子.")
                        },
                        onerror: function (error) {
                            console.error('获取种子信息失败: 请求发生错误:', error);
                            reject("获取种子信息失败!")
                        }
                    })
                }
            })

        }

        /**
         * 判断种子是否存在了
         * @returns
         * @param hash
         */
        let checkExist = (hash) => {
            return new Promise((resolve, reject) => {
                if (hash) {
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
                } else {
                    resolve("没有 Hash 值不判断是否存在...")
                }
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
                    method: 'POST',
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
                    },
                    url: `${config.address}${endpoint}`,
                    data: getQueryString({
                        'hash': hash, 'oldPath': oldPath, 'newPath': newPath
                    }),
                    onload: function (response) {
                        console.log('重命名成功.');
                        resolve("重命名成功.")
                    },
                    onerror: function (error) {
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
            return new Promise((resolve, reject) => {
                let downloadMsg = cocoMessage.loading("下载中！", 10000, true);
                GM_fetch({ // 下载种子文件
                    method: "GET",
                    url: torrentUrl,
                    responseType: "arraybuffer",
                }).then((response) => {
                    if (response.status !== 200) {
                        console.log("下载种子失败",response);
                        throw new Error(`下载种子失败，状态码：${response.status}`);
                    }
                    return response.response; // arraybuffer
                }).then(binaryData => {

                    let formData = new FormData();
                    // 设置mime
                    let bl = new Blob([binaryData], {type: "application/x-bittorrent"})
                    // 将下载的种子文件内容添加到表单
                    formData.append('torrents', bl);

                    // 设置其他参数
                    formData.append('savepath', savePath); // 下载文件夹 不传就保存到默认文件夹
                    formData.append('rename', rename); // 重命名种子
                    formData.append('sequentialDownload', config.sequentialDownload); // 启用顺序下载。可能的值为true, false（默认）
                    formData.append('firstLastPiecePrio', config.firstLastPiecePrio); // 优先下载最后一块。可能的值为true, false（默认）
                    formData.append('autoTMM', config.autoTMM); // 优先下载最后一块。可能的值为true, false（默认）

                    // 通过 savePath 获得 category
                    let saveLocations = GM_getValue("saveLocations", [{label: "默认", value: ""}]);
                    const item = saveLocations.find(item => item.value === savePath);
                    if (item) formData.append('category', item.label); // 分类

                    formData.append('paused', !config.autoStartDownload); // 暂停? 默认 false

                    // let downloadMsg = cocoMessage.loading("下载中！", 10000, true);

                    GM_xmlhttpRequest({
                        method: 'POST',
                        url: `${config.address}/api/v2/torrents/add`,
                        data: formData,
                        onload: function (response) {
                            const responseData = response.responseText;
                            if (responseData !== "Ok.") {
                                downloadMsg();
                                reject(`添加种子失败: ${responseData}`);
                            } else {
                                sleep(1000);
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
                }).catch(error => {
                    console.error(error);
                    reject(`下载种子时出错：${error.message}`);
                });
            })
        }

        return { // qBittorrent
            download: (rename, savePath, hash, torrentUrl, autoCloseWindow) => {
                let readyRenameMsg = null;
                login().then(m => { // 检查是否添加过了
                    console.log(m)
                    return checkExist(hash);
                }).then(m => { // 添加种子
                    if (m) console.log(m)
                    return addTorrent(rename, savePath, torrentUrl);
                }).then(m => {
                    // 添加种子之后不是第一时间就在 qBittorrent 中能查询到，所以得循环等待，查询到后才能重命名。
                    readyRenameMsg = cocoMessage.loading("重命名中...", true);
                    return Promise.retry(() => getTorrentInfo(hash, rename), 60, 1500);
                }).then((data) => { // 文件重命名
                    console.log(data.message);
                    if (data.oldFileName === rename) {
                        console.log("文件名相同无需修改");
                        return;
                    }
                    if (!hash && data.hash) hash = data.hash
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

        function arrayBufferToBase64(buffer) {
            return new Promise((resolve, reject) => {
                const blob = new Blob([buffer], { type: "application/x-bittorrent" });
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result.split(',')[1]);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        }

        function addTorrent(rename, savePath, torrentUrl) {
            return new Promise((resolve, reject) => {
                GM_fetch({ // 下载种子文件
                    method: "GET",
                    url: torrentUrl,
                    responseType: "arraybuffer",
                }).then((response) => {
                    if (response.status !== 200) {
                        console.log("下载种子失败",response);
                        throw new Error(`下载种子失败，状态码：${response.status}`);
                    }
                    return response.response; // arraybuffer
                }).then(binaryData => {
                    return arrayBufferToBase64(binaryData);
                }).then(base64Torrent => {
                    request({
                        "arguments": {
                            "download-dir": savePath,
                            // "filename": torrentUrl,
                            "metainfo": base64Torrent, // base64 编码的 .torrent 内容
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
                }).catch(error => {
                    console.error(error);
                    reject(`下载种子时出错：${error.message}`);
                });
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
        return new URLSearchParams(params).toString();
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
        let unsupportedCharsRegex = /[\/\\:*?"<>|]/g;

        // 将不支持的字符替换为空格
        filename = filename.replace(unsupportedCharsRegex, ' ');
        // 替换连续多个空格为一个空格 (空格,制表符,换行,回车等)
        return filename.replace(/\s+/g, ' ');
    }

    function init() {
        let torrentName = PT.getTorrentName();
        let app = new Vue({
            el: '#plugin-download-div',
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
                    client: GM_getValue("client", "qbittorrent"),
                    sequentialDownload: GM_getValue("sequentialDownload", false), // 启用顺序下载。可能的值为true, false（默认）
                    firstLastPiecePrio: GM_getValue("firstLastPiecePrio", false), // 优先下载最后一块。可能的值为true, false（默认）
                    autoTMM: GM_getValue("autoTMM", false), // 是否应使用自动种子管理
                    pinButton: GM_getValue("pinButton", false) // 下载按钮固定到右侧
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
                download(inputValue) {

                    console.log("InputValue: ", inputValue)

                    this.togglePopup();

                    const isFolderFlag = isFolder(torrentName);

                    // 原来文件是单文件 当前文件名未加后缀
                    if (!isFolderFlag && isFolder(inputValue)) inputValue += getSuffix(torrentName);

                    console.log("InputValue 增加后缀: ", inputValue)

                    if (!this.config.username || !this.config.password || !this.config.address) {
                        cocoMessage.error("请点击脚本图标进行下载配置", 10000, true);
                        return;
                    }

                    let hash = PT.getTorrentHash();
                    // 馒头新架构获取不到 hash
                    // if (!hash) {
                    //     cocoMessage.error("未在页面找到 Hash 值！", 10000, true);
                    //     return;
                    // }

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
                    Client[config.client].download(inputValue, savePath, hash, torrentUrl, this.config.autoCloseWindow);
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
            #plugin-download-div * {
                box-sizing: border-box;
                font-size: 14px;
                margin: 0;
                padding: 0;
                box-sizing: border-box;
                color: revert;
                font-weight: revert;
            }
            #plugin-download-div table {
                table-layout: auto;
            }
            #plugin-download-div button{
                padding-block: 1px;
                padding-inline: 6px;
                background: revert;
                border: revert;
                line-height: 1.3em;
                margin: 2px 0;
                border-radius: revert;
                color: revert;
            }
            #plugin-download-div table td,
             #plugin-download-div table th{
                background: initial;
            }
            #plugin-download-div button:hover {
                background: revert;
            }
            #plugin-download-div {
                display: inline-block;
                font-size: 14px;
            }
            #plugin-download-div .download-html {
                position: absolute;
            }
            #plugin-download-div .download-html table {
                border-right: medium none;
                border-top: medium none;
                border-left: medium none;
                border-bottom: medium none;
                border-collapse: collapse;
                background-color: #bccad6;
            }
            #plugin-download-div .download-html input[type="checkbox" i] {
                    margin: 2px 0;
                    height: 1.5em;
                    width: 1.5em;
                    margin-left: 50%;
                    transform: translateX(-50%);
            }
            #plugin-download-div .download-html .exclusive-label {
                    display: inline-block;
                    width: 100%;
            }
            #plugin-download-div #download-title {
                text-align: center;
            }
            #plugin-download-div .download-html td{
                border-right: #000000 1px solid;
                border-top: #000000 1px solid;
                border-left: #000000 1px solid;
                border-bottom: #000000 1px solid;
            }
            #plugin-download-div .download-html .popup {
                min-width: 550px;
                height: auto;
                min-height: 50px;
                background-color: #7c98ae;
                border: 3px solid #587993;
                border-radius: 4px;
                padding: 10px;
                position: fixed;
                top: 50%;
                left: 50%;
                /* 在水平和垂直方向上都将元素向左和向上平移了它自身宽度和高度的一半。 */
                transform: translate(-50%, -50%);
                max-height: calc(100% - 20px);
                overflow-x: auto;
            }

            #plugin-download-div .download-html input[type="text"],
             #plugin-download-div .download-html input[type="password"] {
                background-color: #e4e4e4;
                border: 1px solid #587993;
                font-size: 14px;
                height: 20px;
            }

            #plugin-download-div .download-html .torrent-text > .textinput {
                background-color: #e4e4e4;
                border-radius: 4px;
                position: absolute;
                top: 50%;
                left: 0;
                transform: translate(0, -50%);
                font-size: 12px;
                margin: 0 3px 0 3px;
                width: calc(100% - 6px);
                padding: 1em 2px;
            }

            #plugin-download-div .download-html .popup input:focus {
                /* 这条语句必须有，不然border效果不生效 */
                outline: none;
                border: 1px solid #587993;
            }

            #plugin-download-div .download-html .popup table {
                width: 100%;
            }

            #plugin-download-div .download-html .popup tbody th {
                min-width: 5em;
                width: 5em;
                text-align: right;
                padding: 0 0.5em 0 0;
            }

            #plugin-download-div .download-html .t-download-last-td {
                min-width: 5em;
                width: 5em;
                text-align: center;
            }

            #plugin-download-div .download-html .popup td,
            #plugin-download-div .download-html .popup th {
                vertical-align: middle;
            }

            #plugin-download-div .download-html .popup .t-text {
                position: relative;
            }

            #plugin-download-div .download-html .popup .torrent-text p {
                visibility: hidden;
                margin: 12px 6px;
                font-size: 12px;
                /* line-height: 1.6em; */
                max-width: 600px;
                white-space: nowrap;
                overflow: hidden;
            }
            #plugin-download-div .download-html th {
                text-align: center;
            }

            #plugin-download-div .download-html .draggable {
                // position: absolute;
                // cursor: grab;
            }
            #plugin-download-div #configPopup input[type=text],
             #plugin-download-div #configPopup input[type=password] {
                position: initial;
                transform: none;
                padding: 12px 2px;
                margin: 0;
                width: 100%;
                border: 0;
                border-radius: 0;
            }

            #plugin-download-div .save-location-table td:last-child {
                width: 5em;
                text-align: center;
            }
            #plugin-download-div .save-location-table td:first-child {
                width: 6em;
            }
            
        `)
    }

    function setHtml() {

        let html = `<div id="plugin-download-div" class="plugin-download-div">
            &nbsp;<button @click="togglePopup()">{{config.client}} 下载</button>
            <div id='download-html' class='download-html'>
                <div id="configPopup"  class="popup config-popup" style="z-index: 2;" v-show="isVisible">
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
                                            <input style="vertical-align: middle;margin: 2px;" type="radio" v-model="config.client" value="qbittorrent">qBittorrent
                                        </label>
                                        <label style="vertical-align: middle;white-space: nowrap;display: inline-flex;padding: 3px;">
                                            <input style="vertical-align: middle;margin: 2px;" type="radio" v-model="config.client" value="transmission">Transmission
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
                                    <table class="save-location-table">
                                        <tbody>
                                            <tr v-for="(item, index) in config.saveLocations" :key="index">
                                                <td style="background: #e4e4e4;"><input type="text" class="textinput" v-model="item.label" placeholder="标签"></td>
                                                <td style="background: #e4e4e4;">
                                                    <input type="text" class="textinput" v-model="item.value" placeholder="下载路径">
                                                </td>
                                                <td ><button class="location-btn" type="button" @click="delLine(index)">删除</button></td>
                                            </tr>
                                            <tr>
                                                <td colspan="2">&nbsp;</td>
                                                <td><button class="location-btn" type="button" @click="addLine()">添加</button></td>
                                                <!-- <button type="button" @click="saveLine($event)">保存</button> -->
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                            <tr>
                                <th>自动开始:</th>
                                <td class="t-text">
                                    <label class="exclusive-label"><input class="textinput" type="checkbox" :checked="config.autoStartDownload" v-model="config.autoStartDownload"></label>
                                </td>
                            </tr>
                            <tr v-if="config.client === 'qbittorrent'">
                                <th title="按顺序下载 torrent 片段">顺序下载:</th>
                                <td class="t-text">
                                    <label class="exclusive-label"><input class="textinput" type="checkbox" :checked="config.sequentialDownload" v-model="config.sequentialDownload"></label>
                                </td>
                            </tr>
                            <tr v-if="config.client === 'qbittorrent'">
                                <th title="默认禁用优先下载文件的首尾区块，优先下载首尾区块用于在文件未下载完成前可以预览，若启用本功能，将至少优先下载首区块和尾区块各1MB">首尾下载:</th>
                                <td class="t-text">
                                    <label class="exclusive-label"><input class="textinput" type="checkbox" :checked="config.firstLastPiecePrio" v-model="config.firstLastPiecePrio"></label>
                                </td>
                            </tr>
                            <tr v-if="config.client === 'qbittorrent'">
                                <th title="自动 Torrent 管理">自动管理:</th>
                                <td class="t-text">
                                    <label class="exclusive-label"><input class="textinput" type="checkbox" :checked="config.autoTMM" v-model="config.autoTMM"></label>
                                </td>
                            </tr>
                            <tr v-if="config.client === 'qbittorrent'">
                                <th title="下载按钮浮动在页面右上角">右浮按钮:</th>
                                <td class="t-text">
                                    <label class="exclusive-label"><input class="textinput" type="checkbox" :checked="config.pinButton" v-model="config.pinButton"></label>
                                </td>
                            </tr>
                            <tr>
                                <th title="打开状态时，如果新的窗口只有这一个页面，则在下载并重命名成功后会自动关闭该窗口。">智能关窗:</th>
                                <td class="t-text">
                                    <label class="exclusive-label"><input class="textinput" type="checkbox" :checked="config.autoCloseWindow" v-model="config.autoCloseWindow"></label>
                                </td>
                            </tr>
                            
                            <tr>
                                <th></th>
                                <td class="t-text"><div style="display: flex;flex-direction: row;justify-content: flex-end;padding-right: 6px;"><button type="button" id="configSave" @click="configSave($event)">保存</button><button style="margin-left: 6px" type="button" @click="toggleConfigPopup()">关闭</button></div></td>
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
                                <td class="t-text" colspan="2" style="padding: 8px 4px;">
                                    <div style="flex-wrap: wrap;">
                                        <label :title="item.value" style="vertical-align: middle;white-space: nowrap;display: inline-flex;padding: 3px;" v-for="(item, index) in config.saveLocations" :key="index">
                                            <input style="vertical-align: middle;margin: 2px;" type="radio" v-model="selectedLabel" :value="index">
                                            {{ item.label }}
                                        </label>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <th>种子名:</th>
                                <td class="t-text torrent-text">
                                    <input type="text" :title="torrentName" class="textinput" v-model="torrentName">
                                    <p>{{torrentName}}</p>
                                </td>
                                <td class="t-download-last-td"><button @click="download(torrentName)">下载</button></td>
                            </tr>
                            <tr>
                                <th>主标题:</th>
                                <td class="t-text torrent-text">
                                    <input type="text" :title="title" class="textinput" v-model="title">
                                    <p>{{title}}</p>
                                </td>
                                <td class="t-download-last-td"><button @click="download(title)">下载</button></td>
                            </tr>
                            <tr>
                                <th>副标题:</th>
                                <td class="t-text torrent-text">
                                    <input type="text" :title="subTitle" class="textinput" v-model="subTitle">
                                    <p>{{subTitle}}</p>
                                </td>
                                <td class="t-download-last-td"><button @click="download(subTitle)">下载</button></td>
                            </tr>
                            <tr v-if="config.client === 'qbittorrent'">
                                <th title="按顺序下载 torrent 片段">顺序下载:</th>
                                <td class="t-text">
                                    <label class="exclusive-label"><input class="textinput checkbox" type="checkbox" :checked="config.sequentialDownload" v-model="config.sequentialDownload"></label>
                                </td>
                                <td rowspan="2"></td>
                            </tr>
                            <tr v-if="config.client === 'qbittorrent'">
                                <th title="默认禁用优先下载文件的首尾区块，优先下载首尾区块用于在文件未下载完成前可以预览，若启用本功能，将至少优先下载首区块和尾区块各1MB">首尾下载:</th>
                                <td class="t-text">
                                    <label class="exclusive-label"><input class="textinput checkbox" type="checkbox" :checked="config.firstLastPiecePrio" v-model="config.firstLastPiecePrio"></label>
                                </td>
                            </tr>
                            <tr>
                                <th>自动开始:</th>
                                <td class="t-text"><label class="exclusive-label"><input class="textinput checkbox" type="checkbox" :checked="config.autoStartDownload" v-model="config.autoStartDownload"></label></td>
                                <td class="t-download-last-td"><button @click="togglePopup()">关闭</button></td>
                            </tr>
                            
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        `;


        let downloadButtonMountPoint = PT.getDownloadButtonMountPoint();
        if (GM_getValue("pinButton", false) === false && downloadButtonMountPoint) {
            let el = document.createElement('div');
            el.innerHTML = html;
            el.style.display = "inline"
            downloadButtonMountPoint.append(el);
        } else {
            GM_addStyle(`.plugin-download-div {
                position: fixed;
                top: 20%;
                right: 0;
            }`)
            let el = document.createElement('div')
            el.innerHTML = html;
            document.body.append(el)
        }
    }

    // let matchRegex = /^https:\/\/.+\/details.php\?id=[0-9]+&hit=1$/
    // matchRegex.test(window.location.href)

    function isNexusPHP() {
        let meta = document.querySelector('meta[name="generator"]')
        return meta && meta.getAttribute("content") === "NexusPHP";
    }

    async function main() {
        try {
            if (getSite() || isNexusPHP()) {
                setStyle();
                setHtml();
                init();
            } else {
                console.log("非 NexusPHP 站点，或未经过特殊配置站点，暂不支持！")
            }
        } catch (e) {
            console.error("脚本初始化失败...", e)
        }
    }

    function result() {
        return new Promise((resolve, reject) => {
            fetch(`${localStorage.getItem("apiHost")}/torrent/genDlToken`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                    "TS": Math.floor(Date.now() / 1000),
                    "Authorization": localStorage.getItem("auth") || ""
                },
                body: getQueryString({
                    id: torrentInfo.id
                })
            }).then(response => {
                if (!response.ok) {
                    console.error(`获取种子下载地址失败: ${data.message}`);
                    return reject(`获取种子下载地址失败: ${data.message}`);
                }
                return response.json();
            }).then(data => {
                if (data.code !== "0") {
                    console.error(`获取种子下载地址失败: ${data.message}`);
                    return reject(`获取种子下载地址失败: ${data.message}`);
                }
                resolve(data.data);
            }).catch(error => {
                console.error('获取种子下载地址失败:', error);
                reject("获取种子下载地址失败: 请求发生错误...");
            });
        });
    }

    async function mteamMain() { //  馒头网站现在有 bug 重复请求等.
        await result().then(d => {
            torrentInfo.url = d;
        }).catch(() => {
            cocoMessage.error("获取种子下载地址失败，请刷新重试！", 10000, true);
        })
        main();
    }

    let executed = false;
    if (asyncArr.includes(getSite())) {
        const originOpen = XMLHttpRequest.prototype.open;
        // TODO 暂时馒头新架构实现, 待封装
        XMLHttpRequest.prototype.open = function (_, url) {
            if (url.includes("/api/torrent/detail")) {
                this.addEventListener("readystatechange", function () {
                    if (this.readyState === 4 && this.status === 200) {
                        const res = JSON.parse(this.responseText);
                        if (res.message === "SUCCESS" && !executed) {
                            executed = true;
                            torrentInfo.id = res.data.id
                            torrentInfo.name = res.data.name
                            torrentInfo.originFileName = res.data.originFileName
                            torrentInfo.smallDescr = res.data.smallDescr
                            console.log("ID: ", res.data.id)
                            console.log("标题: ", res.data.name)
                            console.log("种子名: ", res.data.originFileName)
                            console.log("副标题: ", res.data.smallDescr)
                            mteamMain()
                        }
                    }
                });
            }
            originOpen.apply(this, arguments);
        }
    } else { // 同步加载网页
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
    }

})();

