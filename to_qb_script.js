// ==UserScript==
// @name         M-Team to qBittorrent Web UI 下载工具
// @namespace    M-Team to qBittorrent Web UI 下载工具
// @description  在馒头详情页添加一个下载按钮，点击按钮可以选择【标题|种子名|副标题】添加种子到 qBittorrent Web UI，同时进行文件重命名。
// @version      2.0
// @updateURL    https://raw.githubusercontent.com/ShaoxiongXu/script/main/to_qb_script.js
// @downloadURL  https://raw.githubusercontent.com/ShaoxiongXu/script/main/to_qb_script.js
// @icon         https://kp.m-team.cc/favicon.ico
// @match        https://kp.m-team.cc/details.php*
// @match        https://kp.m-team.cc/*/details.php*
// @grant        GM_xmlhttpRequest
// @grant        GM_log
// @grant        GM_notification
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @grant        GM_listValues
// @grant        GM_registerMenuCommand
// @connect *
// @author       passerby
// ==/UserScript==

(function () {
    'use strict';
    let config = {
        address: GM_getValue("address"), // qBittorrent Web UI 地址 http://127.0.0.1:8080
        username: GM_getValue("username"), // qBittorrent Web UI的用户名
        password: GM_getValue("password"), // qBittorrent Web UI的密码
        savePath: GM_getValue("path"), // 下载目录 默认
        autoDownload: (GM_getValue("autoStartDownlaod") && GM_getValue("autoStartDownlaod") === "on") ? true : false, // false 添加后不自动下载，true 添加后自动下载
        paused: (GM_getValue("autoStartDownlaod") && GM_getValue("autoStartDownlaod") === "on") ? false : true, // true 暂停,false 开始
    };

    // 种子以这些文件结尾时,单文件储存,非目录
    const fileSuffix = [
        ".zip",
        ".rar",
        ".7z",
        ".tar.gz",
        ".tgz",
        ".tar.bz2",
        ".tbz2",
        ".tar",
        ".gz",
        ".bz2",
        ".xz",
        ".lzma",
        ".md",
        ".txt",
        ".mp4",
        ".avi",
        ".mkv",
        ".mov",
        ".wmv",
        ".flv",
        ".mpg",
        ".mpeg",
        ".3gp",
        ".webm",
        ".rmvb",
        ".mp3",
        ".wav",
        ".flac",
        ".aac",
        ".ogg",
        ".wma",
        ".m4a",
        ".mpc",
        ".iso"
    ]

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
                console.log(tryTimes)
                Promise.resolve(fn()).then(res => {
                    return resolve(res)
                }).catch(err => {
                    if (++tryTimes < times) {
                        setTimeout(attempt, delay)
                    } else {
                        return reject(err)
                    }
                })
            }
            attempt()
        })
    }

    /**
     *
     * @param {*} torrentName 选择的名字
     */
    let getTorrentInfo = (torrentName) => {

        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: `${config.address}/api/v2/sync/maindata`,
                onload: function (response) {

                    let data = JSON.parse(response.responseText).torrents;

                    const hashes = Object.keys(data);

                    console.log("种子列表长度:", hashes)

                    for (let hash of hashes) {

                        let info = data[hash];
                        if (info.name == torrentName) {

                            console.log('TorrentInfo:', info);

                            let oldFileName = info.content_path.replace(info.save_path, '').match(/([^\/]+)/)[0];

                            console.log(`OldFileName: ${oldFileName}`);

                            console.log(`NewFileName: ${torrentName}`);

                            return resolve({
                                "hash": hash,
                                "oldFileName": oldFileName,
                                "torrentName": torrentName,
                                "message": "获取种子信息成功."
                            })
                        }

                    }
                    console.log(data)
                    reject("获取种子信息失败,种子列表未找到种子.")
                },
                onerror: function (error) {
                    console.error('获取种子信息失败: 请求发生错误:', error);
                    reject("获取种子信息失败!")
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

        const isFolderFlag = isFolder(oldPath);
        const endpoint = isFolderFlag ? '/api/v2/torrents/renameFolder' : '/api/v2/torrents/renameFile';

        // 原来文件是单文件 当前文件名未加后缀
        if (!isFolderFlag && isFolder(newPath)) newPath += getSuffix(oldPath)

        GM_xmlhttpRequest({
            method: 'POST',
            url: `${config.address}${endpoint}`,
            data: getQueryString({
                'hash': hash,
                'oldPath': oldPath,
                'newPath': newPath
            }),
            headers: {
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
            },
            onload: function (response) {
                console.log('重命名成功.');
            },
            onerror: function (error) {
                // 请求失败
                console.error('重命名请求失败: ', error);
                alert('重命名失败!');
            }
        });
    }

    function getQueryString(params) {
        return Object.keys(params)
            .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(params[key]))
            .join('&');
    }


    let login = () => {
        return new Promise((resolve, reject) => {
            if (!config.username || !config.password) {
                return reject("请点击脚本设置 QBittorrent 下载配置！")
            }
            GM_xmlhttpRequest({
                method: 'POST',
                url: `${config.address}/api/v2/auth/login`,
                data: getQueryString({
                    'username': config.username,
                    'password': config.password
                }),
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
                },
                onload: function (response) { // 请求成功
                    console.log('Login Response:', response.responseText);
                    resolve("登录成功！")
                },
                onerror: function (error) { // 请求失败
                    console.error('请求发生错误:', error);
                    reject(resolve("登录失败！"))
                }
            });
        })
    }



    /**
     * 将种子添加到qBittorrent
     * @param {String} rename 选中种子名
     */
    function addTorrentToQBittorrent(rename) {
        return new Promise((resolve, reject) => {

            let torrentUrl = 'https://kp.m-team.cc' + document.evaluate("//a[text()='[IPv4+https]']", document).iterateNext().getAttribute("href");

            // 构建请求体数据
            let formData = new FormData();
            formData.append('urls', torrentUrl);
            formData.append('autoTMM', config.autoDownload);
            formData.append('savepath', config.savePath);
            formData.append('cookie', '');
            formData.append('rename', rename);
            formData.append('category', '');
            formData.append('paused', config.paused);
            formData.append('stopCondition', 'None');
            formData.append('contentLayout', 'Original');
            formData.append('dlLimit', 'NaN');
            formData.append('upLimit', 'NaN');

            GM_xmlhttpRequest({
                method: 'POST',
                url: `${config.address}/api/v2/torrents/add`,
                data: formData,
                onload: function (response) {
                    const responseData = response.responseText;
                    if (responseData !== "Ok.") {
                        return reject(`添加种子失败: ${responseData}`);
                    } else {
                        return resolve("添加种子成功.");
                    }
                },
                onerror: function (error) {
                    console.error('添加种子失败: 请求发生错误:', error);
                    return reject("添加种子失败: 请求发生错误...");
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



    function download(rename) {
        login().then(m => { // 添加种子
                console.log(m)
                return addTorrentToQBittorrent(rename);
            })
            .then(m => {
                return Promise.retry(() => getTorrentInfo(rename), 10, 5000);
            })
            .then((data) => { // 文件重命名
                console.log(data.message);
                return renameFileOrFolder(data.hash, data.oldFileName, data.torrentName);
            })
            .then(() => alert("下载并重命名成功!"))
            .catch((e) => {
                console.log(e);
                alert(e);
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

    /**
     * 获取种子名
     */
    let getTorrentName = function () {
        let str = document.querySelector("#outer > table:nth-child(2) > tbody > tr:nth-child(1) > td.rowfollow > a.index").innerText;
        console.log(str)
        let regex = /\.(.+)\./;
        let match = regex.exec(str);
        let dynamicPart = match[1];
        return dynamicPart;
    }

    // window.onload = function () {


    let subTitle = replaceUnsupportedCharacters(document.querySelector("#outer > table:nth-child(2) > tbody > tr:nth-child(2) > td.rowfollow").innerText.trim());
    let title = replaceUnsupportedCharacters(document.querySelector("#top").innerText).trim().replace(/\[([^\[\]]+)\]$/g, '').trim();
    let torrentName = getTorrentName();



    let popupCode = `

        <button id="qbDownload">QBitorrent下载</button>

        <div id="popup" class="popup" style="display: none;">

            <table>
                <thead style="height: 3em;">
                    <tr>
                        <th colspan="3">请选择文件名下载 </th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <th>种子名:</th>
                        <td class="t-text">
                            <input value="${torrentName}">
                            <p>${torrentName}</p>
                        </td>
                        <td class="t-download"><button class="tDownloadBtn">下载</button></td>
                    </tr>
                    <tr>
                        <th>主标题:</th>
                        <td class="t-text">
                            <input value="${title}">
                            <p>${title}</p>
                        </td>
                        <td class="t-download"><button class="tDownloadBtn">下载</button></td>
                    </tr>
                    <tr>
                        <th>副标题:</th>
                        <td class="t-text">
                            <input value="${subTitle}">
                            <p>${subTitle}</p>
                        </td>
                        <td class="t-download"><button class="tDownloadBtn">下载</button></td>
                    </tr>
                    <tr>
                        <th></th>
                        <td class="t-text"></td>
                        <td class="t-download"><button id="closePopup" style="background-color: azure;">关闭</button></td>
                    </tr>
                </tbody>
            </table>
        </div>

        `;

    GM_addStyle(`
            .popup {
                width: auto;
                min-width: 550px;
                height: auto;
                min-height: 50px;
                background-color: #7c98ae;
                border: 3px solid #587993;
                border-radius: 4px;
                padding: 10px;
                position: absolute;
                top: 50%;
                left: 50%;
                /* 在水平和垂直方向上都将元素向左和向上平移了它自身宽度和高度的一半。 */
                transform: translate(-50%, -50%);
            }

            .popup button {
                margin: 5px;
            }

            .popup input {
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

            .popup input:focus {
                /* 这条语句必须有，不然border效果不生效 */
                outline: none;
                border: 1px solid #587993;
            }

            .popup table {
                width: 100%;
            }

            .popup tbody th {
                width: 5em;
            }

            .popup .t-download {
                width: 5em;
            }

            .popup td,
            .popup th {
                vertical-align: middle;
            }

            .popup .t-text {
                position: relative;
            }

            .popup .t-text p {
                visibility: hidden;
                margin: 0.8em;
                font-size: 12px;
                line-height: 1em;
            }

        `);

    GM_addStyle(`
        #configPopup input {
            position: initial;
            transform: none;
            padding: 0;
            margin: 0;
            width: 100%;
            border: 0;
            border-radius: 0;
        }

    `)

    // 获取指定元素
    let targetElement = document.querySelector("#outer > table:nth-child(2) > tbody > tr:nth-child(5) > td.rowfollow");
    targetElement.innerHTML += popupCode;


    let closePopup = () => {
        let popup = document.getElementById("popup");
        popup.style.display = "none";
    }

    let openPopup = () => {
        let popup = document.getElementById("popup");
        popup.style.display = "block";
    }

    let closeConfigPopup = () => {
        let popup = document.getElementById("configPopup");
        popup.style.display = "none";
    }

    let openConfigPopup = () => {
        let popup = document.getElementById("configPopup");
        popup.style.display = "block";
    }

    document.getElementById("qbDownload").addEventListener('click', function (event) {
        console.log(event.currentTarget)
        openPopup();
    })

    document.getElementById("closePopup").addEventListener('click', function (event) {
        closePopup()
    })

    Array.from(document.getElementsByClassName("tDownloadBtn")).forEach((e => {
        e.addEventListener('click', function (event) {
            let inputValue = event.currentTarget.closest("tr").querySelector("input").value;
            console.log("InputValue: ", inputValue)
            closePopup()
            download(inputValue)
        })
    }))


    const menu_command_id = GM_registerMenuCommand("点击这里进行配置", function () {
        openConfigPopup();
    });


    let configPopupHtml = `



        <div id="configPopup" class="popup" style="display: none;">
            <form id="configForm">
            <table>
                <thead style="height: 3em;">
                    <tr>
                        <th colspan="3">请进行 qBittorrent 配置 </th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <th>地址:</th>
                        <td class="t-text">
                            <input name="address" placeholder="http://127.0.0.1:8080" value="${config.address}">
                        </td>
                    </tr>
                    <tr>
                        <th>用户名:</th>
                        <td class="t-text">
                            <input name="username" placeholder="qBittorrent 用户名" value="${config.username}">
                        </td>
                    </tr>
                    <tr>
                        <th>密码:</th>
                        <td class="t-text">
                            <input name="password" type="password" placeholder="qBittorrent 密码" value="${config.password}">
                        </td>
                    </tr>
                    <tr>
                        <th>下载路径:</th>
                        <td class="t-text">
                            <input name="path" value="${config.savePath}" placeholder="下载路径">
                        </td>
                    </tr>
                    <tr>
                        <th>自动开始:</th>
                        <td class="t-text">
                            <input name="autoStartDownlaod" type="checkbox" ${config.autoDownload ? "checked" : ""}>
                        </td>
                    </tr>
                    <tr>
                        <th></th>
                        <td class="t-text"><button type="button" id="configSave">保存</button><button  type="button" id="configPopupClose" style="background-color: azure;">关闭</button></td>
                    </tr>
                </tbody>
            </table>
            </form>
        </div>
    `;


    document.querySelector("#outer > table:nth-child(2) > tbody > tr:nth-child(7) > td.rowfollow").innerHTML += "<div id='configDiv'></div>"

    document.getElementById("configDiv").innerHTML = configPopupHtml;

    document.getElementById("configSave").addEventListener('click', function (event) {
        console.log(event.currentTarget)
        closeConfigPopup();

        let formData = new FormData(document.getElementById("configForm"));
        if (!formData.get("autoStartDownlaod")) GM_setValue("autoStartDownlaod", "")
        for (let entry of formData.entries()) {

            let [name, value] = entry;

            GM_setValue(name, value);

        }

        config = {
            address: GM_getValue("address"), // qBittorrent Web UI 地址 http://127.0.0.1:8080
            username: GM_getValue("username"), // qBittorrent Web UI的用户名
            password: GM_getValue("password"), // qBittorrent Web UI的密码
            savePath: GM_getValue("path"), // 下载目录 默认
            autoDownload: (GM_getValue("autoStartDownlaod") && GM_getValue("autoStartDownlaod") === "on") ? true : false, // false 添加后不自动下载，true 添加后自动下载
            paused: (GM_getValue("autoStartDownlaod") && GM_getValue("autoStartDownlaod") === "on") ? false : true, // true 暂停,false 开始
        };



    })

    document.getElementById("configPopupClose").addEventListener('click', function (event) {
        console.log(event.currentTarget)
        closeConfigPopup();
    })

    // }

})();
