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

- 目前仅测试北洋园、M-Team(馒头)、ptlsp 站点

- qBittorrent 版本要求 ≥ v4.1

- Transmission 版本要求 ≥ 3.0

- 更多站点我也没号,**有 HDChina 或其他PT站 邀可以拉小弟一把**.本人TG:[@zhendi6](https://t.me/zhendi6)
  
- 贡献者 [@fqdeng](https://t.me/fqdeng) 也欢迎大佬 给邀

## 使用教程 

### 安装

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


## 新站点支持

欢迎提交 PR

新增站点需: 
1. 在 `siteStrategies` 对象中新增一个策略，实现以下方法
    ```javascript
    label: {
        getTorrentUrl() // 获取种子地址，能复制到 qb 下载的 必须
        getTorrentHash() // 获取种子 Hash 必须
        getTorrentTitle() // 获取标题 必须
        getTorrentName() // 获取种子文件名 必须
        getTorrentSubTitle() // 获取副标题 可选
    }
    ```
2. 在 `sites` 对象中增加映射网站关系, 例子
    ```
    // 网站路径包含  host : label  要增加网站改这里
    let sites = {
        "m-team": "mteam",
        "ptlsp": "ptlsp",
        "www.tjupt.org": "tjupt",
        "www.label.com": "label" // 示例
    }
    ```
