# Model &  Class Explanation

## Model

### Anime
(be aware that NUM always start with 1)
* current_episode: the latest episode NUM appears in your Telegram channel(pushed video)
* eps: the start NUM of the Anime, 1 by default(  may set to 13 if current anime is the season 2 or part 2 from a  series)
* total_episode: episode count of current season, provided by Bangumi(may contain special shows)
* name_phantom: additional info seprarted by `,` to match anime title when grabbing video info from NEP library, by default allows both CN name and JP name of desired anime, example: `孤独摇滚,ぼっち・ざ・ろっく！`(change it to match more titles in case of abnormal naming convention)
