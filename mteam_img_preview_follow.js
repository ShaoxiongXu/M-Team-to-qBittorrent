// ==UserScript==
// @name         馒头种子列表页图片预览(跟随鼠标)
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  鼠标悬停到图片上时自动放大，预览！(跟随鼠标)
// @author       ShaoxiongXu
// @match        https://*.m-team.cc/*
// @match        https://*.m-team.io/*
// @match        https://test2.m-team.cc/*
// @grant        GM_addStyle
// @grant        unsafeWindow
// @run-at       document-start
// @license      GPL-2.0


// ==/UserScript==
(function () {
    'use strict';

    let i = 0;

    // MutationObserver 实例
    let observer = undefined;

    function setStyle(link) {
        link.addEventListener("click", function () {
            this.querySelector("strong").style.color = '#70ada7'
        })
    }

    function getPosition(e, position) {
        return {
            left: e.pageX + position.offsetX,
            top: e.pageY + position.offsetY,
            width: position.imgNaturalWidth,
            height: position.imgNaturalHeight
        }
    }


    function getImgPosition(e, img) {
        // console.log(e, img)
        let imgNaturalWidth = img.naturalWidth
        let imgNaturalHeight = img.naturalHeight
        let ratio = imgNaturalWidth / imgNaturalHeight;
        let offsetX = 10;
        let offsetY = 10;
        let width = window.innerWidth - e.clientX;
        let height = window.innerHeight - e.clientY;
        let changeOffsetY = 0;
        let changeOffsetX = false;
        if (e.clientX > window.innerWidth / 2 && e.clientX + imgNaturalWidth > window.innerWidth) {
            changeOffsetX = true
            width = e.clientX
        }
        if (e.clientY > window.innerHeight / 2) {
            if (e.clientY + imgNaturalHeight / 2 > window.innerHeight) {
                changeOffsetY = 1
                height = e.clientY
            } else if (e.clientY + imgNaturalHeight > window.innerHeight) {
                changeOffsetY = 2
                height = e.clientY
            }
        }
        let log = `innerWidth: ${window.innerWidth}, innerHeight: ${window.innerHeight}, pageX: ${e.pageX}, pageY: ${e.pageY}, imgNaturalWidth: ${imgNaturalWidth}, imgNaturalHeight: ${imgNaturalHeight}, width: ${width}, height: ${height}, offsetX: ${offsetX}, offsetY: ${offsetY}, changeOffsetX: ${changeOffsetX}, changeOffsetY: ${changeOffsetY}`
        console.log(log)
        if (imgNaturalWidth > width) {
            imgNaturalWidth = width;
            imgNaturalHeight = imgNaturalWidth / ratio;
        }
        if (imgNaturalHeight > height) {
            imgNaturalHeight = height;
            imgNaturalWidth = imgNaturalHeight * ratio;
        }
        if (changeOffsetX) {
            offsetX = -(e.clientX - width + 10)
        }
        if (changeOffsetY == 1) {
            offsetY = - (imgNaturalHeight - (window.innerHeight - e.clientY))
        } else if (changeOffsetY == 2) {
            offsetY = - imgNaturalHeight / 2
        }
        return { imgNaturalWidth, imgNaturalHeight, offsetX, offsetY }
    }
    var imgPosition;
    function addEven(thumbnail) {
        let parent = thumbnail.parentElement
        let removeIcon = parent.querySelector("div")
        if (removeIcon) parent.removeChild(removeIcon)
        let imgPreview = document.querySelector("#img-preview")
        thumbnail.addEventListener('mouseover', function (e) {
            imgPosition = getImgPosition(e, thumbnail)
            let src = this.src
            if (src) {
                imgPreview.src = src;
                let position = getPosition(e, imgPosition)
                imgPreview.style.left = `${position.left}px`;
                imgPreview.style.top = `${position.top}px`;
                imgPreview.style.width = `${position.width}px`;
                imgPreview.style.height = `${position.height}px`;
                imgPreview.style.display = 'block';

            }
        });

        thumbnail.addEventListener('mousemove', function (e) {
            let position = getPosition(e, imgPosition)
            imgPreview.style.left = `${position.left}px`;
            imgPreview.style.top = `${position.top}px`;
            imgPreview.style.width = `${position.width}px`;
            imgPreview.style.height = `${position.height}px`;
            imgPreview.style.display = 'block';
        });

        thumbnail.addEventListener('mouseout', function (e) {
            console.log("鼠标移开图片时触发")
            // 隐藏预览
            imgPreview.style.display = 'none';
        });
    }

    function exec(arr) {

        if (!observer) {
            observer = new MutationObserver(function (mutationsList, observer) {
                // 遍历每一个发生变化的 mutation
                mutationsList.forEach(function (mutation) {
                    // 检查每一个新添加的节点
                    mutation.addedNodes.forEach(function (node) {
                        if (node instanceof HTMLElement) {
                            node.querySelectorAll('a[href^="/detail"]').forEach(function (link) {
                                // console.log("新增的a标签：", link)
                                console.log("新增的a标签计数：", i++)
                                setStyle(link);
                            });

                            node.querySelectorAll(".torrent-list__thumbnail").forEach((thumbnail) => {
                                addEven(thumbnail);
                            })
                        }
                    });
                });
            });

            // 配置 MutationObserver 监听目标以及要观察的子节点
            observer.observe(document.querySelector("#root"), {childList: true, subtree: true});
        }

    }

    function init() {
        console.log("init...")
        const originOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function (_, url) {
            if (url.includes("/api/torrent/search")) {
                this.addEventListener("readystatechange", function () {
                    if (this.readyState === 4 && this.status === 200) {
                        const res = JSON.parse(this.responseText);
                        if (res.message === "SUCCESS") {
                            exec(res.data.data);
                        }
                    }
                });
            }
            originOpen.apply(this, arguments);
        }

        GM_addStyle(`
            #img-preview {
                position: fixed;
                display: none;
                z-index: 999;
            }
      `);
    }

    function appendImgElement() {
        let img = document.createElement('img')
        img.setAttribute('id', 'img-preview');
        document.body.append(img)
    }

    let isLoad = false;
    if (window.location.pathname.startsWith("/browse")) {
        console.log("加载列表页油猴脚本...")
        isLoad = true;
        init();

        if (document.readyState === "loading") {
            // 在DOM加载完成后执行的代码，页面资源加载可能仍在进行中，但DOM已准备就绪
            document.addEventListener('DOMContentLoaded', function () {
                // 单独配置了的站点或者 NexusPHP 站点
                console.log("img preview 在DOM加载完成后执行...")
                appendImgElement();
            }, {once: true});
        } else {
            // `DOMContentLoaded` 已经被触发 极低概率触发。。。
            console.log("img preview DOMContentLoaded 已经被触发")
            appendImgElement();
        }

    }

    let originPush = history.pushState;
    history.pushState = function (...arg) {
        if (!isLoad && arg[arg.length - 1].startsWith("/browse")) {
            isLoad = true;
            console.log("路由变化, 加载列表页油猴脚本...");
            init();
            appendImgElement();
        }
        return originPush.call(this, ...arg);
    };


})();




