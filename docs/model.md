# Model & Class Explanation

## Model

### Anime

* current_episode: 在Telegram频道中已推送的最大集数，可能是`15`集，默认标记为`0`集。
* eps: 自行设置，默认为`1`，起始集数，例如“【押しの子】2期”  从第`12`集开始
* total_episode: 由Bangumi提供，本季总数目（count），例如“【押しの子】2期”  为`13`个
* last_episode: NEP仓库查询串结果中出现的最大集数
* name_phantom: 目前作为存储动画全匹配串使用
