# Model & Class Explanation

## Model

### Anime

* current_episode: 在Telegram频道中已推送的最大集数，可能是`15`集，默认标记为`0`集。
* eps: 自行设置，默认为`1`，起始集数，例如“【押しの子】2期”  从第`12`集开始
* total_episode: 由Bangumi提供，本季总数目（count），<del>例如“【押しの子】2期”  为`13`个</del> 例如“【押しの子】2期”  为`12`个，去掉SP剧集
* last_episode: NEP仓库查询串结果中出现的最大集数
* name_phantom: 目前作为存储动画全匹配串使用

## Class

### AniSub

描述：为番剧自身提供服务。

* maxInBangumi: 如从12集开始，一共为12集，则最大为24，这个信息抓取自eps字段的count而非total_episodes，因为后者也包含了SP剧集。

> 例如：https://api.bgm.tv/v0/subjects/404809；
