---
outline: [1, 2, 3, 4]
title: afanime - 部署流程
---

# Telegram初始化（必须）

> [!IMPORTANT]
> RealSearch的public api目前仍在内测，token暂未公开。你或许可以通过联系[作者本人](mailto:quick.joy8246@fastmail.com)索取一个。

## 1. 认领Telegram Bot

你需要首先关注这个官方的[Bot Father账号](https://t.me/BotFather)，用来帮助管理已有的机器人）。点击菜单或者输入`/newbot`并回车

![image.png](/img/deployment/image.png)

按照提示输入昵称和username(会作为telegram访问链接的一部分），最后会得到一个 **HTTP API Token**例如`123456:Ahz2141dadaw` 这个很重要需要找个地方存放，当然忘了也没关系，可以随时找Bot Father取回。这就是我后面提到的**bot token**。

![image.png](/img/deployment/image%201.png)

## 2. 创建一个自己的Telegram群组

以PC端（Windows）的Telegram为例，点击左上角的图标展开更多，选择【new group】。记得勾选打开【Topics】话题功能。

![image.png](/img/deployment/image%202.png)

![image.png](/img/deployment/image%203.png)

输入你喜欢的群组名称然后回车。

这里会提示你邀请成员，<del>如果你没有朋友在Telegram</del>也可以先把刚刚创建好的bot添加进来（按昵称搜索）。

![image.png](/img/deployment/image%204.png)

确认后你会得到一个空的群组

![image.png](/img/deployment/image%205.png)

点击右上角的三个点然后选择“Manage Group” 这里把里面的Topics打开，我们后面会用到他管理不同的番剧。

![image.png](/img/deployment/image%206.png)

另外还有一步很重要，需要去刚刚“Manage Group” 的”Members”里找到你刚刚邀请的bot, 赋予它管理员权限。（不然bot无法发消息）

> 没有管理员权限的bot无法在群组发送消息 也就无法推送了XD

![image.png](/img/deployment/image%207.png)

# 创建实例

## Nodejs（最快）

首先要确保你的系统上已经安装了[Git环境](https://git-scm.com/)和[Nodejs环境(推荐至少node18及以上)](https://nodejs.org/en/download)，在bash或者powershell里输入`git -v`查看。

> 同时也需要安装npm或pnpm等包管理工具。

在目标目录下输入这个命令拷贝到本地：
```bash
git clone https://github.com/flynncao/afanime.git
```
然后使用 `cd afanime`定位到afanime根目录

把`.env.example`改名为`.env`，各项环境变量的功能如下：

```dotenv
BOT_TOKEN="1234455:abcdABCD" #bot token，上一步获取到的
BOT_NAME="Tony" # bot名称
GROUP_CHAT_ID="-1233333" # 用于bot推送的channel id
MONGO_DB_URL="mongodb://root:12345@mongodb:27017/afanime?authSource=admin" # 本地mongodb连接串
TRANSLATOR_BLACK_LIST="Up to 21°C" # 字幕组黑名单
ADMIN_CHAT_IDS="5166880313" # 管理user id，多个用逗号隔开，可用于执行各种管理员命令
REAL_SEARCH_URI="https://open-search.acgn.es" # RealSearch的公开api endpoint
REAL_SEARCH_TOKEN="abc:zrKMfVYiwgxNawdawaadawdawdaad" # RealSearch给开发者的个人token
PROXY_ADDRESS="socks://127.0.0.1:7897" # 如果你的开发/部署环境在中国大陆且代理支持socks，可以通过这里来建立bot实例
```

然后使用 `pnpm i`安装完依赖之后使用`pnpm run start`启动即可。

如果你需要更持久的应用程序，可以尝试使用`pm2`等node程序管理工具。

## Docker（推荐）
### 安装Docker Desktop， 配置docker compose

这里先以Windows下为例，如果有云服务器也可以参考这个方法部署上去。

去Docker Desktop官网直接下载程序安装，对家用PC和笔记本来说选择  Download for Windows - AMD64 版本就行了。

https://www.docker.com/products/docker-desktop/

你不需要进行任何预先配置，安装完成后Win+S输入`Terminal`在打开的命令行界面（标题一般是Powershell)，分别输入 `docker --version` 和 `docker compose version` 并回车，确认两个命令都有结果就说明安装成功了~

![image.png](/img/deployment/image%208.png)

在你喜欢的目录，例如 `D:\DockerPrograms\afanime` 下创建一个名为 `docker-compose.yaml` 的文件，注意后缀。然后拷贝以下内容进去：

 [https://gist.github.com/flynncao/b0ca9036106d46b03524d7b77d94a79f](https://gist.github.com/flynncao/b0ca9036106d46b03524d7b77d94a79f)

- 可选（远程访问），如果你只是在本机使用且没有公网ip什么的，可以把 `services->mongodb->ports` 端口暴露字段注释掉

```yaml
services:
  mongodb:
    image: mongo
    restart: always
    volumes:
      - ./data/db:/data/db
    networks:
      - node-network
    # ports:
    # - "27017:27017"
```

- afanime的字段配置

```yaml
environment:
  BOT_TOKEN: '1234455:abcdABCD'
  BOT_NAME: Tony
  GROUP_CHAT_ID: '-1233333'
  MONGO_DB_URL: 'mongodb://root:12345@mongodb:27017/afanime?authSource=admin'
  ADMIN_CHAT_IDS: '5166880313'
  REAL_SEARCH_URI: 'https://open-search.acgn.es'
  REAL_SEARCH_TOKEN: 'abc:zrKMfVYiwgxNawdawaadawdawdaad'
  TRANSLATOR_BLACK_LIST: Up to 21°C
  PROXY_ADDRESS: ''
```

- 关于你或者其他管理员的chat id 如何取得的问题，有很多方法。最简单的方法：关注这个机器人https://t.me/getmyid_bot 然后输入 `/start` 命令回车就可以看到自己的**chatid**了

![image.png](/img/deployment/image%209.png)

###  拉取Docker镜像

回到刚刚存放 `docker-compose.yaml` 的目录下，右键启动terminal或者powershell

运行命令 `docker compose up -d`  等待它拉取完成并自动启动🚀就好了！

![image.png](/img/deployment/image%2010.png)

🚨 注：如果出现这样的提示，请检查是不是你的docker引擎没启动（可以在docker desktop左下角检查健康度或者安装失败等问题）

![image.png](/img/deployment/image%2011.png)

🚨 注：如果docker镜像拉取失败，可以使用`docker login --username 你的用户名`登录（需要注册Docker Hub账号）后再重试

![](https://cfr2-img.flynncao.uk/202504210010312.png)

#  bot初配置

这时候回到刚刚我们创建的telegram bot里：（可以在telegram直接查找它的名字或者用户名）

手动输入命令 `/start` 并回车或者点击左下角的 `menu` 选择是最常见的使用telegram命令的方式：

![image.png](/img/deployment/image%2012.png)

🚨 如果你和bot聊天的时候被拒绝了！ 说明你在之前给afanime配置环境变量时没有把自己的`chatid`加入到`ADMIN_CHAT_IDS`中

![image.png](/img/deployment/image%2013.png)

## 创建番剧 /create

本次的例子：https://bgm.tv/subject/457326

首先你需要给这个番剧在你的telegram群组中开一个单独的话题(topic)：

![image.png](/img/deployment/image%2014.png)

![image.png](/img/deployment/image%2015.png)

在刚刚创建的话题里直接输入 `/getid` 并回车，可以得到bot发给你的 `themeid` ，等下要用，这里是 2347

![image.png](/img/deployment/image%2016.png)

然后你需要到Bangumi的任一镜像网站例如 [bangumi.tv](http://bangumi.tv) [bgm.tv](http://bgm.tv) 搜寻你想创建的番剧例如[**BLEACH 千年血戦篇-相剋譚](https://bgm.tv/subject/457326) ，**在地址栏复制最后的一串数字，这里为 `457326` （暂记录为 `animeid`）

完成这些后就可以回到机器人的聊天框（🚨 推荐番剧管理操作都通过私聊进行！），输入或者选择 `/create` 命令，然后根据提示把上文的 `animeid` 和 `themeid` 填入，在“查询串”的问题上直接填入 1 使用中文名称即可，后面的 “匹配串”才是重头戏。

## 模糊查询

> 为了提高一丢丢精准度也可以使用信息更丰富的**ANi | BLEACH 死神 千年血戰篇-相剋譚- - 1080P | Baha | WEB-DL | AAC AVC | CHT** 这样的标题作为 检索。详情可以直接复制 NEP仓库的标题或在[realsearch](https://search.acgn.es/?cid=0&word=BLEACH+%E6%AD%BB%E7%A5%9E+%E5%8D%83%E5%B9%B4%E8%A1%80%E6%88%B0%E7%AF%87-%E7%9B%B8%E5%89%8B%E8%AD%9A-&sort=time&file_suffix=)里检索（记得去掉剧集号）。
>
>
> ![image.png](/img/deployment/image%2017.png)
>

![image.png](/img/deployment/image%2018.png)

> 这一步完成后，在刚才创建的话题中输入 `/info` 就可以看到简略拉取的番剧信息了。

继续回到bot聊天框输入 `/dashboard` 命令可以看到番剧已经被加载到了。

如果你在本地部署，最好每周花时间点击菜单里的 `执行周常元信息拉取任务` ，如果是服务器或者VPS就可以忽略，默认的执行 `日常番剧放送任务` 是早上8点（东八区）。定时任务时间均可修改。

![image.png](/img/deployment/image%2019.png)

## 精准匹配

由于现行realsearch引擎的设计方向不能满足afanime的需求，这里我会使用更精准的标题匹配方式，可以详细到分辨率、字幕组、繁中简中等。具体用法如下：

点开管理面板的某个番剧，点击【调整动画名匹配串】，这里根据提示。是模糊匹配所以不需要输入很完整的标题也没关系，但我推荐至少设置 标题+分辨率+简体繁体这样的组合。

![独立番剧管理面板](/img/deployment/image%2020.png)

独立番剧管理面板

例如：（把每个条件用 `|` 隔开,一定要把剧集号去掉！！）

**ANi | BLEACH 死神 千年血戰篇-相剋譚 |  1080P | CHT**

**ANi | BLEACH 死神 千年血戰篇-相剋譚 |  1080P | WEB-DL  | CHT**

**ANi | BLEACH 死神 千年血戰篇-相剋譚 |  1080P | Baha | WEB-DL | AAC AVC | CHT**

**得宗字幕組×拾月出雲 |  擅長逃跑的少主 | 1080p | 繁**

**XKsub | Kono Subarashii Sekai ni Shukufuku wo! 为美好的世界献上祝福 S3 | CHS_JAP | 1080P | WEBrip | MP4**

![image.png](/img/deployment/image%2021.png)

💡特别的，如果你在加入一个续集番剧，例如「押しの子 2期」这样不是从第一集开始算的，你需要在单个番剧管理子菜单的【[特殊]动画开始的集数（默认为1）】做出调整，具体也可以参考bangumi里提供的信息。

例如死神这季是从27集开始：

![image.png](/img/deployment/image%2022.png)

## 开始享受推送

完成上述所有配置后，就可以开始美美地等机器人推送了！

你也可以点击 `/dashboard` 出现菜单里的【执行日常番剧放送任务】立即来一次推送。当然，点击番剧名进入独立番剧管理面板单个推送也没问题。

![image.png](/img/deployment/image%2023.png)

效果：

![番剧推送](/img/deployment/image%2024.png)

番剧推送

![放送表](/img/deployment/image%2025.png)

放送表

🖊️当每季度剧集放送完成后，如果发现有没有正常结束的番剧（可能因为SP剧集的出现导致的，未来会改进），只需要在刚刚单个番剧管理面板下点击【标记为完成】就会在下次推送或者拉取中跳过了。

お疲れ様です！感谢观看。如果有bug可以及时反馈到[telegram讨论组](https://t.me/majimaydev)或者[discord server](https://discord.gg/XmNVCj4y6Y)。稍后机器人开源后也可以在Github提交issues。当然我能力有限，欢迎~~动漫~~编程高手来PR，感激不尽 💕。

## 高级：导入历史afanime数据库

### 方法一：手动导入

我这里使用了mongodb-compass，使用mongoshell或者其他数据库都可以到一样的效果

在左侧文件树选择 `afanime->animes` ，然后在空白处点击选择json或者csv的mongodb文件信息：

![image.png](/img/deployment/image%2026.png)

![image.png](/img/deployment/image%2027.png)

### 方法二：创建时导入

在第二步创建`D:\DockerPrograms\afanime`的时候顺带在 `afanime` 目录下创建一个名为 `mongo-seed` 的目录并放入你导出的json文件，重命名为 `animes.json` 。这样你启动docker应用程序的时候数据库里就自动顺带导入了原来的番剧信息！

# 附录：afanime现行命令及其用法

| # | 命令 | 描述 | 仅管理员可用 |
| --- | --- | --- | --- |
|  | /start | 欢迎消息 |  |
|  | /dashboard | 查看番剧管理面板 | √ |
|  | /create | 创建番剧 | √ |
|  | /schedule | 查看本周放送表 |  |
|  | /cron | 通过cron表达式设定定时任务的频率 | √ |
|  | /info | 仅限在频道话题（topic）中使用，查看当前动画的元信息 |  |
|  | /getid | 仅限在频道话题（topic）中使用，查看当前频道话题的ID |  |
