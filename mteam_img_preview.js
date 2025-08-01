// ==UserScript==
// @name         馒头种子列表页图片预览
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  鼠标悬停到图片上时自动放大，预览！
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


    function addEven(thumbnail) {
        let parent = thumbnail.parentElement
        let removeIcon = parent.querySelector("div")
        if (removeIcon) parent.removeChild(removeIcon)
        let imgPreview = document.querySelector("#img-preview")
        parent.addEventListener('mouseover', function (e) {
            let flagElement = this; // 新版
            if (this.parentElement.tagName === "TD") flagElement = this.parentElement; // 老版
            let img = this.querySelector("img");
            let src = img.src
            if (src) {
                imgPreview.src = src;
                // 视窗
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;

                // 略缩图片相对于视窗的位置
                const imgPosition = flagElement.getBoundingClientRect();
                const imgLeft = imgPosition.x;
                // const imgTop = imgPosition.y;
                const imgWidth = imgPosition.width;
                // const imgHeight = imgPosition.height;

                // 图片的真实宽度 (自由放大的宽度)
                let imgNaturalWidth = img.naturalWidth
                let imgNaturalHeight = img.naturalHeight

                // 宽高比
                let ratio = imgNaturalWidth / imgNaturalHeight;

                // 计算出可以显示图片的最大区域, 视口宽 - (imgLeft + imgWidth + 10) * 2 ,去掉两边只剩中间区域
                let maxImgWidth = viewportWidth - (imgLeft + imgWidth + 10) * 2
                imgPreview.style.maxWidth = `${maxImgWidth}px`;

                // 判断高度是否够 目前设定最大高度为视窗 80%
                let maxImgHeight = viewportHeight * 0.8;

                // 在高度不限制下的图片宽度,如果高度不够宽度会压缩
                let previewImgWidth = imgNaturalWidth > maxImgWidth ? maxImgWidth : imgNaturalWidth;
                console.log("预览图宽度:", previewImgWidth)


                // 计算显示高度,如果宽度压缩了高度也会压缩
                let previewImgHeight = previewImgWidth / ratio;


                if (previewImgHeight > maxImgHeight) {
                    previewImgHeight = previewImgHeight > maxImgHeight ? maxImgHeight : previewImgHeight
                    // 压缩比率 * 图片实际宽度
                    previewImgWidth = (imgNaturalWidth / imgNaturalHeight) * previewImgHeight
                }

                console.log("预览图宽度:", previewImgWidth)

                // 还有空间,尝试放大图片 最大放大2倍
                let enlargementFactor = Math.min(maxImgWidth / previewImgWidth, maxImgHeight / previewImgHeight)
                if (enlargementFactor > 2) enlargementFactor = 2;

                console.log("放大倍数:", enlargementFactor)

                imgPreview.style.width = `${previewImgWidth * enlargementFactor}px`;

                imgPreview.style.left = `calc(50% - ${previewImgWidth * enlargementFactor / 2}px)`;

                // 显示预览
                imgPreview.style.display = 'block';

            }
        });
        parent.addEventListener('mouseout', function (e) {
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
                max-height: 80%;
                top: 50%;
                transform: translateY(-50%);
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




