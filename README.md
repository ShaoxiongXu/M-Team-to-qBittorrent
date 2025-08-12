# 【油猴脚本】PT to qBittorrent|Transmission 下载工具 【一键下载、重命名、指定下载位置】

GitHub项目地址: [https://github.com/ShaoxiongXu/M-Team-to-qBittorrent](https://github.com/ShaoxiongXu/M-Team-to-qBittorrent)

【PT助手|PT下载|team|mteam|馒头|NexusPHP】在种子详情页添加下载按钮，点击后可以选择【标题|种子名|副标题】并将种子添加到 qBittorrent 或 Transmission，支持文件重命名并指定下载位置，兼容 NexusPHP 站点。

![image](https://github.com/ShaoxiongXu/M-Team-to-qBittorrent/assets/127823819/ee602b67-1939-45fc-8a74-b4ab31f12083)

- 支持下载到 qBittorrent 和 Transmission

- 支持选择命名 （选择时也可以在输入框手动修改）
  
- 种子名和磁盘文件名同步修改 (不影响上传)
  
- 支持选择下载位置

- 支持下载完后智能关闭下载页面 (可设置)
  
- 自动取代 Windows/Linux 不支持字符为空格

- 文件名长度检测

- 顺序下载：按顺序下载 torrent 片段

- 首尾下载：默认禁用优先下载文件的首尾区块，优先下载首尾区块用于在文件未下载完成前可以预览，若启用本功能，将至少优先下载首区块和尾区块各1MB

- 理论支持所有 NexusPHP 架构站点

- 目前仅测试北洋园、M-Team(馒头)、ptlsp、HDTime 站点

- qBittorrent 版本要求 ≥ v4.1

- Transmission 版本要求 ≥ 3.0

- IOS Safari 浏览器使用 Stay 安装插件时, 需要在**设置** => **Safari浏览器** => **取消勾选防止跨站跟踪**, 并在 Web UI **取消启用跨站请求伪造 (CSRF) 保护**

- 如有问题可联系TG:[@zhendi6](https://t.me/zhendi6)

## 使用教程 

### 安装

**由于最新 Chrome 浏览器禁止 Manifest V2 扩展规范，使用脚本需要在浏览器扩展页面打开开发者模式！**

脚本安装:[https://greasyfork.org/zh-CN/scripts/470727](https://greasyfork.org/zh-CN/scripts/470727-%E7%A7%8D%E5%AD%90%E4%B8%8B%E8%BD%BD%E5%B7%A5%E5%85%B7)


### Windows 客户端需要打开 WebUI

![20220714130923](https://github.com/ShaoxiongXu/M-Team-to-qBittorrent/assets/127823819/4d8cf059-84b1-4ac7-82a6-9da27880ffc8)


### 脚本配置

<img src="https://github.com/ShaoxiongXu/M-Team-to-qBittorrent/assets/127823819/f92f2356-402a-41a4-a8b0-d6a163e5bac0" alt="image" style="zoom: 50%;" />

**Linux NAS 示例**
![image](https://github.com/ShaoxiongXu/M-Team-to-qBittorrent/assets/127823819/4cb66f1f-1063-495e-a267-9613a037b7b8)


**Windows 示例**

![image](https://github.com/ShaoxiongXu/M-Team-to-qBittorrent/assets/127823819/ddee873d-2f3c-414d-9dc0-52b64e50e415)


### 种子详情页点击下载

![image](https://github.com/ShaoxiongXu/script/assets/127823819/bc33dc63-6c9c-4086-8c53-3cdfb722c74b)

![image](https://github.com/ShaoxiongXu/M-Team-to-qBittorrent/assets/127823819/ee602b67-1939-45fc-8a74-b4ab31f12083)

![image](https://github.com/ShaoxiongXu/M-Team-to-qBittorrent/assets/127823819/e675eb78-d244-4d3a-b135-f0c9cc47290d)


## 新增站点支持 - 完整示例

想让脚本支持更多站点？只需要改两个地方。

假设我们要给网站 `www.newpt.com` 加支持，站点代号取名 `newpt`。

### **1. 在 `siteStrategies` 里加策略**

```javascript
let siteStrategies = {
    // 已有的策略...
    
    newpt: { // 这是站点代号，和后面映射的要一致
        getTorrentUrl() {
            // 找到种子下载按钮的链接
            // 这里的选择器和属性值要根据站点实际 HTML 调整
            return document.querySelector('.download-link').href;
        },
        getTorrentTitle() {
            // 获取种子标题
            return document.querySelector('h1.torrent-title').innerText.trim();
        },
        getTorrentName() {
            // 获取种子文件名
            return document.querySelector('.filename').innerText.trim();
        },
        getTorrentSubTitle() {
            // （可选）获取副标题，没有可以 return 空
            let el = document.querySelector('.subtitle');
            return el ? el.innerText.trim() : '';
        }
    }
};
```

------

### **2. 在 `sites` 里加映射关系**

```javascript
let sites = {
    "m-team": "mteam",
    "ptlsp": "ptlsp",
    "www.tjupt.org": "tjupt",
    "www.newpt.com": "newpt" // 新加的站点映射
};
```

------

### **3. 提交 PR 前自测**

1. 打开 `www.newpt.com` 的种子详情页

2. 在浏览器控制台手动调用：

   ```javascript
   siteStrategies.newpt.getTorrentUrl()
   siteStrategies.newpt.getTorrentTitle()
   siteStrategies.newpt.getTorrentName()
   siteStrategies.newpt.getTorrentSubTitle()
   ```

   确认能返回正确的值

3. 确保 `newpt` 这个代号在两处都一致

4. 代码缩进和现有项目保持统一

## 贡献者

<!-- readme: contributors -start -->
<table>
<tr>
    <td align="center">
        <a href="https://github.com/ShaoxiongXu">
            <img src="https://avatars.githubusercontent.com/u/127823819?v=4" width="100;" alt="ShaoxiongXu"/>
            <br />
            <sub><b>ShaoxiongXu</b></sub>
        </a>
    </td>
    <td align="center">
        <a href="https://github.com/dadinet">
            <img src="https://avatars.githubusercontent.com/u/131777059?v=4" width="100;" alt="dadinet"/>
            <br />
            <sub><b>dadinet</b></sub>
        </a>
    </td>
    <td align="center">
        <a href="https://github.com/ywwzwb">
            <img src="https://avatars.githubusercontent.com/u/13915067?v=4" width="100;" alt="ywwzwb"/>
            <br />
            <sub><b>ywwzwb</b></sub>
        </a>
    </td></tr>
</table>
<!-- readme: contributors -end -->
