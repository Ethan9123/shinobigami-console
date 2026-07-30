// 新手学院：从零学会忍神的九节课＋三语术语对照表。
// 独立模块：不 import 项目内其他文件（tests/academy.test.mjs 独立转译）。
// 课程内容为原创教学文本（介绍规则概念与流程，不摘录规则书正文）；
// 英文术语以 Kotodama 英文版公开用语为准，日文术语按原版惯用写法。

export type LocalizedText = { zh: string; en: string; ja: string };

export type AcademyLesson = {
  id: string;
  title: LocalizedText;
  minutes: number;
  goal: LocalizedText;
  body: LocalizedText[];
  points?: LocalizedText[];
  tryIt?: { view: "prep" | "battle" | "director" | "sheet" | "replay" | "tutorial"; label: LocalizedText };
};

export type GlossaryEntry = { zh: string; en: string; ja: string };

export const ACADEMY_PROGRESS_KEY = "shinobigami-console-academy";

export const ACADEMY_LESSONS: AcademyLesson[] = [
  {
    id: "what-is-this",
    minutes: 4,
    title: { zh: "忍神是个什么游戏", en: "So What Kind of Game Is Shinobigami?", ja: "『シノビガミ』ってどんなゲーム？" },
    goal: { zh: "学完这课，你能向朋友解释这个游戏在玩什么。", en: "By the end of this lesson, you'll be able to explain to a friend what this game is all about.", ja: "このレッスンを終えると、このゲームが何をする遊びなのか、友だちに説明できるようになります。" },
    body: [
      { zh: "TRPG（桌上角色扮演游戏）是几个人围着桌子讲一个共同故事：一位 GM（主持人）描述世界、扮演所有配角，其余玩家各自扮演一名角色，用掷骰解决「能不能做到」的争议。没有输赢，只有故事讲到哪里。", en: "A tabletop RPG is a few people around a table telling one shared story: the GM (Game Master) describes the world and plays all the supporting characters, while every other player controls one character of their own, rolling dice to settle any \"can I actually pull this off?\" moments. There's no winning or losing—only where the story ends up.", ja: "TRPG（テーブルトークRPG）とは、数人でテーブルを囲み、ひとつの物語をみんなで紡ぐ遊びです。GM（ゲームマスター）が世界を描写してすべての脇役を演じ、残りのプレイヤーはそれぞれ1人のキャラクターを演じます。「それができるかどうか」で迷ったら、ダイスを振って解決します。勝ち負けはなく、あるのは「物語がどこまで進んだか」だけです。" },
      { zh: "《忍神》的舞台是「与现实几乎相同的现代日本」——只是忍者仍在暗处活动，普通人一无所知。你扮演的忍者白天可能是学生、店员或上班族，晚上执行忍务。这场看不见的争斗被称为「阴影战争」。", en: "Shinobigami is set in a modern Japan almost identical to the real one—except ninja still operate in the shadows, and ordinary people have no idea. Your ninja might be a student, a shop clerk, or an office worker by day, running covert missions by night. This invisible struggle is called the Shadow War.", ja: "『シノビガミ』の舞台は「現実とほぼ同じ現代日本」——ただし忍者たちが今なお闇で暗躍し、一般人は何も知りません。あなたの演じる忍者は、昼は学生や店員、会社員かもしれませんが、夜になれば忍務をこなします。この見えない争いは「影の戦争」と呼ばれています。" },
      { zh: "它和多数 TRPG 最大的不同：每名角色都握有一张不能给别人看的【秘密】，你的目标（使命）可能与同伴暗中冲突。玩家之间可以合作、试探、甚至兵刃相见——猜疑与反转正是乐趣核心。", en: "Here's the big difference from most tabletop RPGs: every character holds a Secret that no one else is allowed to see, and your objective (your Mission) may quietly clash with your teammates'. Players can cooperate, probe each other, even cross blades—suspicion and dramatic reversals are the heart of the fun.", ja: "多くのTRPGとの最大の違いは、各キャラクターが他人に見せてはいけない【秘密】を握っていること。あなたの目標（使命）は、仲間と水面下で衝突しているかもしれません。プレイヤー同士は協力も、探り合いも、時には刃を交えることさえあります——疑心とどんでん返しこそが、この楽しさの核心です。" },
      { zh: "一场标准的忍神团 2~4 小时就能跑完，人数 GM+2~4 人。它节奏快、结构清晰，是公认对新手友好的日式规则。", en: "A standard Shinobigami session wraps up in 2 to 4 hours, with a GM plus 2 to 4 players. It's fast-paced and clearly structured—widely considered one of the most newcomer-friendly Japanese systems around.", ja: "標準的なセッションは2～4時間で完結し、人数はGM+2～4人。テンポが速く構造が明快で、初心者に優しい国産システムとして定評があります。" },
    ],
    points: [
      { zh: "GM 负责世界与裁定，玩家负责自己角色的一切决定。", en: "The GM handles the world and the rulings; players make every decision for their own characters.", ja: "GMは世界と裁定を担当し、プレイヤーは自分のキャラクターに関するすべての決定を担当します。" },
      { zh: "每人都有公开的【使命】和保密的【秘密】。", en: "Everyone has a public Mission and a private Secret.", ja: "全員が、公開される【使命】と、非公開の【秘密】を持っています。" },
      { zh: "玩家对立是规则允许且被期待的——不要因为被骗而生气，要因为被骗得漂亮而鼓掌。", en: "Player-versus-player conflict is allowed and expected—don't get mad that you were deceived; applaud how beautifully it was done.", ja: "プレイヤー同士の対立はルールで認められ、むしろ期待されています——騙されて怒るのではなく、見事に騙されたことに拍手を送りましょう。" },
    ],
  },
  {
    id: "session-shape",
    minutes: 5,
    title: { zh: "一场团的形状：阶段、循环、场景", en: "The Shape of a Session: Phases, Cycles, Scenes", ja: "セッションのかたち：フェイズ・サイクル・シーン" },
    goal: { zh: "学完这课，你能看懂任何一篇跑团实录的结构。", en: "By the end of this lesson, you'll be able to follow the structure of any session replay you read.", ja: "このレッスンを終えると、どんなリプレイを読んでも構造が読み取れるようになります。" },
    body: [
      { zh: "忍神的一场团由四个阶段组成：导入阶段（每人登场、公布使命）→ 主要阶段（游戏主体）→ 高潮阶段（最终决战）→ 结局（各自收尾）。", en: "A Shinobigami session is built from four phases: the Introduction Phase (each character steps on stage and Missions are announced) → the Main Phase (the bulk of the game) → the Climax Phase (the final showdown) → the Ending (everyone's epilogue).", ja: "シノビガミのセッションは4つのフェイズで構成されます：導入フェイズ（各自が登場し、使命を公開）→ メインフェイズ（ゲームの本体）→ クライマックスフェイズ（最終決戦）→ エンディングフェイズ（それぞれの締めくくり）。" },
      { zh: "主要阶段按「循环」推进：一个循环里，每名玩家轮流当一次「场景玩家」，主导一幕属于自己的场景。常见的团是 2~3 个循环。", en: "The Main Phase moves in Cycles: within one Cycle, every player takes a turn as the Scene Player, directing one scene of their own. A typical session runs 2 to 3 Cycles.", ja: "メインフェイズは「サイクル」単位で進みます。1サイクルの間に、各プレイヤーが順番に一度ずつ「シーンプレイヤー」となり、自分のシーンを主導します。よくあるセッションは2～3サイクルです。" },
      { zh: "场景分两种：戏剧场景（调查、谈话、恢复）和战斗场景。作为场景玩家，你可以掷场景表决定舞台氛围，邀请其他角色登场，然后从几种行动里选一种执行。", en: "Scenes come in two kinds: Drama Scenes (investigating, talking, recovering) and Battle Scenes. As the Scene Player, you can roll on the scene table to set the mood, invite other characters on stage, and then pick one of a few actions to carry out.", ja: "シーンには2種類あります：ドラマシーン（調査・会話・回復）と戦闘シーンです。シーンプレイヤーになったら、シーン表を振って舞台の雰囲気を決め（GMに決めてもらってもOK）、ほかのキャラクターを登場させ、いくつかの行動から1つを選んで実行します。" },
      { zh: "这个「每人一幕」的结构保证了所有人的戏份。轮到别人的场景时，你可以被邀请登场，或者安静观看——偷看别人演戏也是情报。", en: "This \"one scene per person\" structure guarantees everybody gets screen time. When it's someone else's scene, you might be invited to appear—or you can just watch quietly. Watching other people's scenes is intel, too.", ja: "この「1人1シーン」の構造が、全員の見せ場を保証してくれます。他人のシーンでは、招かれて登場することも、静かに見守ることもできます——他人の芝居をのぞき見るのも、立派な情報収集です。" },
    ],
    points: [
      { zh: "导入 → 主要（N 个循环）→ 高潮 → 结局。", en: "Introduction → Main (N Cycles) → Climax → Ending.", ja: "導入 → メイン（Nサイクル）→ クライマックス → エンディング。" },
      { zh: "每个循环里每人主导一幕场景。", en: "In each Cycle, every player directs one scene.", ja: "各サイクルで、全員が1回ずつシーンを主導します。" },
      { zh: "本控制台的「场景导演」会替你追踪循环、场次和每个人的行动状态。", en: "The Scene Director in this console tracks Cycles, scene count, and everyone's action status for you.", ja: "このコンソールの「シーン監督」が、サイクル・シーン数・各自の行動状況を代わりに追跡してくれます。" },
    ],
    tryIt: { view: "director", label: { zh: "打开场景导演看看循环追踪", en: "Open the Scene Director to see Cycle tracking", ja: "シーン監督を開いてサイクル進行を見てみる" } },
  },
  {
    id: "mission-secret",
    minutes: 5,
    title: { zh: "使命与秘密：这个游戏的心脏", en: "Mission and Secret: The Heart of the Game", ja: "使命と秘密：このゲームの心臓部" },
    goal: { zh: "学完这课，你不会再犯新手最常见的那个错误。", en: "By the end of this lesson, you won't make the single most common beginner mistake.", ja: "このレッスンを終えると、初心者が最もやりがちなあのミスを犯さなくなります。" },
    body: [
      { zh: "开团时 GM 会发给你一份「手册」（handout）：上面写着你的【使命】（全桌公开）和【秘密】（只有你能看）。秘密里往往藏着你的真实目标、不可告人的过去，甚至「真正的使命」。", en: "At the start of a session, the GM hands you a Handout: it shows your Mission (public to the whole table) and your Secret (for your eyes only). A Secret often hides your true objective, a past you can't speak of—sometimes even your real Mission.", ja: "セッション開始時、GMから「ハンドアウト」が配られます。そこには全員に公開される【使命】と、あなただけが見られる【秘密】が書かれています。秘密にはあなたの本当の目標、人に言えない過去、時には「真の使命」までもが隠されています。" },
      { zh: "铁则：【秘密】不能给别人看，也不能口头把内容告诉别人。别人想知道你的秘密，只有一个正规途径——在场景中做「情报判定」来获取。这是规则，不是礼貌。", en: "The iron rule: you may not show your Secret to anyone, and you may not tell anyone what it says, either. There is exactly one legitimate way for others to learn your Secret—making an Information Check during a scene. That's a rule, not just good manners.", ja: "鉄則：【秘密】は他人に見せてはいけません。内容を口頭で伝えるのもダメです。他人の秘密を知りたければ、正規の方法はただひとつ——シーン中に「情報判定」を行って獲得すること。これはマナーではなく、ルールです。" },
      { zh: "为什么这么严格？因为忍神的整个游戏性都建立在信息差上：谁知道了谁的秘密、什么时候摊牌，就是这个游戏的战略层。秘密被揭开的那一刻，往往是全团最精彩的反转。", en: "Why so strict? Because Shinobigami's entire gameplay runs on information asymmetry: who knows whose Secret, and when to show your hand—that is the game's strategic layer. The moment a Secret comes to light is often the best twist of the whole session.", ja: "なぜここまで厳格なのか？ シノビガミのゲーム性は、すべて情報の非対称の上に成り立っているからです。誰が誰の秘密を知ったか、いつ手の内を明かすか——それこそがこのゲームの戦略レイヤーです。秘密が暴かれる瞬間は、セッション最高のどんでん返しになることが少なくありません。" },
      { zh: "拿到秘密的第一件事：安静读完，控制表情，然后想两个问题——「我的真实目标是什么」「哪些人可能与我冲突」。", en: "The first thing to do with your Secret: read it quietly, keep a straight face, then ask yourself two questions—\"What is my real objective?\" and \"Who at this table might be working against me?\"", ja: "秘密を受け取ったら、まずやること：静かに読み終え、表情を抑え、2つの問いを考えましょう——「自分の本当の目標は何か」「誰と衝突しそうか」。" },
    ],
    points: [
      { zh: "使命公开，秘密保密，直到被情报判定挖出或你主动摊牌。", en: "Missions are public; Secrets stay hidden until an Information Check digs them up—or you choose to reveal yours.", ja: "使命は公開、秘密は非公開——情報判定で暴かれるか、自分から明かすまで。" },
      { zh: "秘密不能口头转述——这是新手最常犯的错误。", en: "You can't paraphrase your Secret out loud either—that's the classic beginner mistake.", ja: "秘密は口頭で伝えてもいけません——これが初心者の一番多いミスです。" },
      { zh: "本控制台的「开团准备」有秘密交付检查清单，GM 不会漏发；「桌面安全」模式可以在共享屏幕时遮住所有秘密。", en: "Session Prep in this console has a Secret-delivery checklist so the GM never misses one, and Table Safe mode hides every Secret while you're screen-sharing.", ja: "このコンソールの「セッション準備」には秘密配布のチェックリストがあり、GMの配り忘れを防ぎます。「卓上セーフモード」を使えば、画面共有中もすべての秘密を隠せます。" },
    ],
    tryIt: { view: "prep", label: { zh: "看看开团准备的秘密交付清单", en: "See the Secret-delivery checklist in Session Prep", ja: "セッション準備の秘密配布チェックリストを見る" } },
  },
  {
    id: "check-2d6",
    minutes: 6,
    title: { zh: "2D6 判定：整个游戏只有一种掷骰", en: "The 2D6 Check: One Roll for the Whole Game", ja: "2D6判定：このゲームのダイスロールはただ1種類" },
    goal: { zh: "学完这课，你能独立完成任何一次判定。", en: "By the end of this lesson, you'll be able to make any Check on your own.", ja: "このレッスンを終えると、どんな判定でも1人でこなせるようになります。" },
    body: [
      { zh: "忍神里所有「能不能做到」的问题都用同一个动作回答：掷两颗六面骰，合计大于等于目标值就成功。基础目标值是 5。", en: "Every \"can I do this?\" question in Shinobigami is answered with the same move: roll two six-sided dice, and if the total is equal to or higher than the target number, you succeed. The base target number is 5.", ja: "シノビガミの「できるかどうか」は、すべて同じ動作で解決します：6面ダイスを2個振り、合計が目標値以上なら成功。基本の目標値は5です。" },
      { zh: "你的角色卡上有一张 6×11 的特技表（六个分野：器术、体术、忍术、谋术、战术、妖术）。判定会指定一项特技：如果你学过它，目标值就是 5；没学过，可以用你学过的、在表上离它最近的特技「代用」——每隔一格，目标值 +1。", en: "Your character sheet carries a 6-by-11 table of Skills (six Categories: Tech, Martial Arts, Stealth, Scheming, Strategy, Sorcery). Each Check names a Skill. If you know it, your target number is 5; if you don't, you can substitute the closest Skill you do know on the table—adding +1 to the target number for every gap between them.", ja: "キャラクターシートには6×11の特技リスト表があります（6つの分野：器術・体術・忍術・謀術・戦術・妖術）。判定には指定特技が示されます。修得していれば目標値は5。修得していなければ、表の上で一番近い修得済みの特技で「代用」できます——1マス離れるごとに、目標値+1です。" },
      { zh: "两个特殊结果凌驾一切：骰出 12（双六）是「大成功」，无条件成功还有奖励；骰出 2（双一）是「大失败」，无条件失败还可能出事。战斗里大失败线还会变化（第七课讲）。", en: "Two special results trump everything: rolling a 12 (double sixes) is a Special—an automatic success with a bonus on top; rolling a 2 (snake eyes) is a Fumble—an automatic failure that can bring trouble. In battle, the Fumble threshold shifts as well (that's Lesson 7).", ja: "2つの特別な出目は、すべてに優先します：出目12（6のゾロ目）は「スペシャル」で、無条件成功に加えてボーナスつき。出目2（1のゾロ目）は「ファンブル」で、無条件失敗のうえ何か悪いことが起きるかもしれません。戦闘中はファンブル値そのものが変動します（第7課で解説）。" },
      { zh: "听起来要数格子很麻烦？这正是本控制台替你做的事：选好特技，它自动找最近的代用、算出目标值和精确成功率。你只需要按「投掷判定」。", en: "Counting squares sounds tedious? That's exactly what this console does for you: pick the Skill, and it finds the nearest substitute, works out the target number, and shows your exact odds of success. All you do is press \"Roll Check.\"", ja: "マス目を数えるのが面倒そう？ それこそ、このコンソールが代わりにやってくれることです。特技を選べば、最寄りの代用特技を自動で探し、目標値と正確な成功率を算出してくれます。あなたは「判定を振る」を押すだけです。" },
    ],
    points: [
      { zh: "2D6 ≥ 目标值（基础 5）即成功。", en: "2D6 equal to or above the target number (base 5) means success.", ja: "2D6 ≥ 目標値（基本5）で成功。" },
      { zh: "代用特技：距离每格 +1；12 大成功、2 大失败。", en: "Substitute Skills: +1 per gap; 12 is a Special, 2 is a Fumble.", ja: "代用特技は1マスごとに+1。出目12はスペシャル、出目2はファンブル。" },
      { zh: "新手请记住：判定前先声明「我要做什么、用什么特技」。", en: "Beginner habit: before you roll, declare \"here's what I'm doing, and here's the Skill I'm using.\"", ja: "初心者の心得：判定の前に「何をしたいか、どの特技を使うか」を宣言しましょう。" },
    ],
    tryIt: { view: "battle", label: { zh: "去战斗控制台掷一次判定", en: "Roll a Check in the Battle Console", ja: "戦闘コンソールで判定を振ってみる" } },
  },
  {
    id: "drama-scene",
    minutes: 5,
    title: { zh: "戏剧场景：调查、谈心与喘息", en: "Drama Scenes: Investigating, Bonding, Catching Your Breath", ja: "ドラマシーン：調査と、語らいと、ひと息" },
    goal: { zh: "学完这课，你知道轮到自己的场景该干什么。", en: "By the end of this lesson, you'll know exactly what to do when it's your scene.", ja: "このレッスンを終えると、自分のシーンで何をすればいいか分かるようになります。" },
    body: [
      { zh: "轮到你当场景玩家时，标准流程三步：① 掷场景表（或让 GM 定舞台）；② 决定谁登场——你可以邀请任何角色，被邀请者一般不该拒绝；③ 从三种判定里选一种执行：情报判定、感情判定、回复判定。", en: "When you're the Scene Player, the standard routine is three steps: 1) roll on the scene table (or let the GM set the stage); 2) decide who appears—you can invite any character, and an invitee generally shouldn't refuse; 3) pick one of three Checks to make: an Information Check, an Emotion Check, or a Recovery Check.", ja: "シーンプレイヤーの番が来たら、標準の流れは3ステップ：① シーン表を振る（またはGMに舞台を決めてもらう）。② 誰を登場させるか決める——どのキャラクターでも招待でき、招かれた側は基本的に断らないのが慣例です。③ 3種類の判定から1つを選んで実行する：情報判定・感情判定・回復判定。" },
      { zh: "情报判定：选一个目标，挖 TA 的【居所】或【秘密】。这是推进剧情的主引擎——大多数场景都花在这上面。", en: "Information Check: pick a target and dig up their Location or their Secret. This is the main engine that drives the plot—most scenes are spent here.", ja: "情報判定：目標を1人選び、その【居所】か【秘密】を暴きます。物語を進めるメインエンジンで、ほとんどのシーンはこれに費やされます。" },
      { zh: "感情判定：和同场景的一名角色互相建立【感情】（双方各掷感情表，各自选正面或负面）。感情不只是演出——它有硬规则效果，下一课讲。", en: "Emotion Check: form a mutual Emotional Bond with one character in the scene (you each roll on the emotion table, and each of you picks a positive or negative feeling). Bonds aren't just roleplay flavor—they carry hard rules effects, covered next lesson.", ja: "感情判定：同じシーンにいるキャラクター1人と、互いに【感情】を結びます（双方が感情表を振り、それぞれプラスかマイナスを選ぶ）。感情はただの演出ではなく、ルール上の効果を持ちます——次の課で解説します。" },
      { zh: "回复判定：疗伤。恢复失去的生命力或解除变调。受了伤别硬撑，忍神的伤是会滚雪球的。", en: "Recovery Check: patch yourself up. Restore lost Life Points or shake off a Status Ailment. Don't tough it out—in Shinobigami, injuries snowball.", ja: "回復判定：傷の手当てです。失った生命力を回復するか、変調を解除します。傷を負ったら無理は禁物。シノビガミのダメージは雪だるま式に膨らみます。" },
    ],
    points: [
      { zh: "场景玩家的三选一：情报／感情／回复。", en: "The Scene Player picks one of three: Information / Emotion / Recovery.", ja: "シーンプレイヤーの三択：情報／感情／回復。" },
      { zh: "被邀请登场是给你戏份，尽量接。", en: "Being invited on stage means screen time for you—take it whenever you can.", ja: "登場に招かれるのは、見せ場をもらえるということ。なるべく受けましょう。" },
      { zh: "不知道演什么的时候，本控制台「场景导演」的场景牌桌会发给你灵感牌，可朗读开场白照着念就行。", en: "Not sure what to play? The scene card table in the Scene Director deals you inspiration cards with read-aloud openers—just read one out and go.", ja: "何を演じればいいか迷ったら、このコンソールの「シーン監督」のカードテーブルがインスピレーションカードを配ってくれます。読み上げ用の幕開けをそのまま音読するだけでもOKです。" },
    ],
    tryIt: { view: "director", label: { zh: "抽一手场景灵感牌", en: "Draw a hand of scene inspiration cards", ja: "シーンのインスピレーションカードを引いてみる" } },
  },
  {
    id: "emotion-intel",
    minutes: 5,
    title: { zh: "感情与情报之网", en: "The Web of Bonds and Intel", ja: "感情と情報のネットワーク" },
    goal: { zh: "学完这课，你会明白为什么老玩家说「感情是武器」。", en: "By the end of this lesson, you'll understand why veterans say \"a Bond is a weapon.\"", ja: "このレッスンを終えると、ベテランが「感情は武器だ」と言う理由が分かります。" },
    body: [
      { zh: "【感情】是双向的纽带，正面（如共感、友情、爱情……共六种）或负面（如不信、愤怒、杀意……共六种）。注意：负面感情也是纽带——「杀意」和「爱情」在规则上同样有用。", en: "An Emotional Bond is a two-way tie, either positive (sympathy, friendship, love, loyalty, admiration, devotion) or negative (distrust, anger, jealousy, contempt, inferiority, murderous intent). Note that a negative feeling is still a Bond—\"murderous intent\" is every bit as useful as \"love\" under the rules.", ja: "【感情】は双方向の絆です。プラス（共感・友情・愛情・忠誠・憧憬・狂信）またはマイナス（不信・怒り・妬み・侮蔑・劣等感・殺意）があります。注意：マイナス感情もれっきとした絆です——「殺意」と「愛情」は、ルール上同じくらい役に立ちます。" },
      { zh: "感情的三大规则效果：① 情报共享——你抱有感情的对象获得新情报时，你自动知道（不再连锁传递）；② 感情修正——每场景一次，为对方的判定 +1 或 -1；③ 凭感情登场——对方进战斗时你可以乱入。", en: "Bonds carry three rules effects: 1) Info sharing—when someone you hold a Bond toward gains new intel, you learn it automatically (it doesn't chain any further); 2) the Bond modifier—once per scene, you can give that character +1 or -1 on a Check; 3) entering through a Bond—when they end up in a battle, you're allowed to crash it.", ja: "感情の三大ルール効果：① 情報共有——感情を結んだ相手が新しい情報を得ると、あなたも自動的にそれを知ります（連鎖はしません）。② 感情修正——1シーンに1回、相手の判定に+1か-1。③ 感情による登場——相手が戦闘に入ったら、乱入できます。" },
      { zh: "情报的三种：【居所】（在哪、能追踪）、【奥义情报】（看穿必杀技，才能尝试破解）、【秘密】（真实目标）。获取顺序通常是：先居所，再秘密。", en: "Intel comes in three kinds: Location (where someone is, so they can be tracked), Ohgi Info (you've seen through their ultimate technique, which is what lets you try to break it), and Secret (their true objective). The usual order: Location first, then Secret.", ja: "情報は3種類：【居所】（どこにいるか・追跡できる）、【奥義情報】（必殺技を見破ってはじめて、奥義破りに挑める）、【秘密】（本当の目標）。獲得の順序はふつう、まず居所、それから秘密です。" },
      { zh: "把这两张网叠起来看：和谁结感情、挖谁的秘密、什么时候共享——这就是忍神的中盘棋。控制台的「人物关系与情报流向」面板会画出这张网。", en: "Now lay the two webs on top of each other: who you bond with, whose Secrets you dig up, when you share what you know—that's Shinobigami's midgame. The console's Relationships & Info Flow panel draws this web for you.", ja: "この2枚の網を重ねて見てください。誰と感情を結ぶか、誰の秘密を暴くか、いつ共有するか——それがシノビガミの中盤戦です。コンソールの「キャラクター関係と情報フロー」パネルが、この網を描き出してくれます。" },
    ],
    points: [
      { zh: "感情=纽带+情报天线+每场景一次的 ±1。", en: "A Bond = a tie + an intel antenna + a once-per-scene +1 or -1.", ja: "感情＝絆＋情報のアンテナ＋シーンごとの±1。" },
      { zh: "情报共享不连锁：只传一层。", en: "Info sharing doesn't chain: it travels exactly one hop.", ja: "情報共有は連鎖しません。伝わるのは一段階だけ。" },
      { zh: "负面感情不是坏事，是另一种深刻的羁绊。", en: "A negative Bond isn't a bad thing—it's just a different kind of deep connection.", ja: "マイナス感情は悪いことではなく、もうひとつの深い絆です。" },
    ],
    tryIt: { view: "director", label: { zh: "看看人物关系与情报流向面板", en: "Open the Relationships & Info Flow panel", ja: "キャラクター関係と情報フローのパネルを見てみる" } },
  },
  {
    id: "battle-plot",
    minutes: 8,
    title: { zh: "布局与战斗：藏在手心里的数字", en: "Plot and Battle: The Number Hidden in Your Palm", ja: "プロットと戦闘：手のひらに隠した数字" },
    goal: { zh: "学完这课，你能打完一场完整的忍神战斗。", en: "By the end of this lesson, you'll be able to fight a full Shinobigami battle from start to finish.", ja: "このレッスンを終えると、シノビガミの戦闘を一戦まるごと戦い抜けるようになります。" },
    body: [
      { zh: "战斗开始时，所有参战者在手心里藏一颗骰子，秘密选 1~6 的一个数——这叫「布局」（Plot）。所有人同时公开。这个数字同时决定三件事，这是全游戏最精彩也最反直觉的设计：", en: "When a battle begins, every combatant hides a die in their palm and secretly picks a number from 1 to 6—this is your Plot. Everyone reveals at the same time. That one number decides three things at once, and it's the most brilliant, most counterintuitive design in the whole game:", ja: "戦闘開始時、参加者全員が手のひらにダイスを1個隠し、1～6のうち1つの数字を秘密裏に選びます——これが「プロット」です。全員同時に公開します。この1つの数字が同時に3つのことを決めます。これこそ、このゲームで最も鮮やかで、最も直感に反するデザインです。" },
      { zh: "① 它是你的速度：数字大的先行动。② 它是你的忍法预算：本轮使用忍法的合计花费不能超过它。③ 它是你的大失败线：本轮判定骰出小于等于它就大失败。选 6 意味着最快、最富、也最危险（2D6≤6 的概率高达 41.7%）。", en: "1) It's your speed: higher numbers act first. 2) It's your Ninpo budget: the total cost of the Ninpo you use this round can't exceed it. 3) It's your Fumble threshold: any Check this round that rolls equal to or under it is a Fumble. Picking 6 makes you the fastest and the richest—and the most exposed (the odds of rolling 6 or less on 2D6 are a whopping 41.7%).", ja: "① あなたの速度：数字が大きい者から先に行動します。② あなたの忍法の予算：そのラウンドで使う忍法のコスト合計は、プロット値を超えられません。③ あなたのファンブル値：そのラウンド、判定の出目がプロット値以下ならファンブルです。6を選ぶことは、最速で、最も豊かで、最も危険という意味です（2D6≤6の確率は41.7%にもなります）。" },
      { zh: "攻击流程：宣言忍法和目标（注意「间合」——你和目标的布局差不能超过忍法的距离）→ 命中判定 → 对方可选回避判定 → 命中则造成伤害（失去生命力分野）或附加变调。", en: "The attack flow: declare a Ninpo and a target (mind the range—the gap between your Plot and the target's can't exceed the Ninpo's range) → roll the attack Check → the target may attempt a Dodge Check → on a hit, you deal damage (the target loses a Life Points Category) or inflict a Status Ailment.", ja: "攻撃の流れ：忍法と目標を宣言（「間合」に注意——自分と目標のプロット差が忍法の間合を超えていると届きません）→ 命中判定 → 相手は回避判定を選べる → 命中すればダメージ（分野の生命力を失わせる）か変調を与えます。" },
      { zh: "【奥义】是你的必杀技：首次使用无条件命中，无需判定。但被人看过之后（获得奥义情报），对方就可以尝试「奥义破解」。什么时候亮底牌，是战斗的胜负手。", en: "Your Ohgi is your ultimate technique: the first time you use it, it hits automatically—no Check needed. But once someone has seen it (gained your Ohgi Info), they can attempt to break it. Choosing when to show your trump card is what decides battles.", ja: "【奥義】はあなたの必殺技：初めて使うときは判定不要で、無条件に命中します。しかし一度見られた後（奥義情報を取られた後）は、相手が「奥義破り」を試みられるようになります。いつ切り札を切るかが、戦闘の勝負どころです。" },
      { zh: "生命力归零或主动认输即「脱落」。战斗的胜者可以拿走战利品、提出要求——但杀死脱落者是选择，不是义务。忍神的战斗常常为了「让对方听我说完」而打。", en: "When your Life Points hit zero, or you concede, you drop out. The winner of a battle can claim the Prize and make demands—but killing someone who dropped out is a choice, never an obligation. Shinobigami battles are often fought just to make the other side hear you out.", ja: "生命力が0になるか、自ら降参すると「脱落」です。戦闘の勝者はプライズを手にし、要求を出せます——ただし、脱落者を殺すかどうかは選択であって、義務ではありません。シノビガミの戦闘は「相手に話を最後まで聞かせるため」に行われることも、よくあるのです。" },
    ],
    points: [
      { zh: "布局 = 速度 + 预算 + 大失败线，三位一体。", en: "Plot = speed + budget + Fumble threshold, three in one.", ja: "プロット＝速度＋予算＋ファンブル値。三位一体。" },
      { zh: "间合：布局差 ≤ 忍法距离才打得到。", en: "Range: you can only hit if the Plot gap is no bigger than the Ninpo's range.", ja: "間合：プロット差 ≤ 忍法の間合でなければ届かない。" },
      { zh: "奥义首发必中；被看穿后可被破解。", en: "An Ohgi auto-hits on its first use; once it's been seen, it can be broken.", ja: "奥義は初撃必中。見破られたら、破られうる。" },
      { zh: "控制台的战斗面板会自动锁流程：宣言→命中→回避→结算，一步都不会漏。", en: "The Battle Console locks in the flow for you—declare → attack → dodge → resolve—so no step ever gets skipped.", ja: "コンソールの戦闘パネルは、宣言→命中→回避→処理の流れを自動で管理し、一歩も漏らしません。" },
    ],
    tryIt: { view: "battle", label: { zh: "去战斗控制台走一遍攻击流程", en: "Walk through an attack in the Battle Console", ja: "戦闘コンソールで攻撃の流れをたどってみる" } },
  },
  {
    id: "be-the-gm",
    minutes: 6,
    title: { zh: "从玩家到 GM：你也可以开团", en: "From Player to GM: You Can Run a Game Too", ja: "プレイヤーからGMへ：あなたにもセッションは開ける" },
    goal: { zh: "学完这课，你敢约朋友开自己的第一团。", en: "By the end of this lesson, you'll feel ready to invite friends to your very first session as GM.", ja: "このレッスンを終えると、友だちを誘って自分の初セッションを立てる勇気が持てます。" },
    body: [
      { zh: "忍神是对新手 GM 最友好的规则之一：结构固定（四阶段 × 循环 × 场景）、判定单一（全是 2D6）、时长可控（一晚跑完）。你不需要「会讲故事」才能开团——结构会替你讲。", en: "Shinobigami is one of the friendliest systems for a first-time GM: the structure is fixed (four phases, Cycles, scenes), there's only one kind of roll (everything is 2D6), and the runtime is predictable (one evening). You don't need to be a born storyteller to run it—the structure tells the story for you.", ja: "シノビガミは、初GMに最も優しいシステムのひとつです。構造は固定（4フェイズ×サイクル×シーン）、判定は1種類（すべて2D6）、時間も読める（一晩で完結）。「物語をうまく語れる」必要はありません——構造が代わりに語ってくれます。" },
      { zh: "开团前：选一个现成剧本（官方模组或社区剧本），给每个 PC 位写好使命与秘密，确认玩家人数与规则版本。本控制台的「开团准备」就是这张检查清单：手册分配、秘密送达、角色卡复核，缺一项它不放行。", en: "Before the session: pick a ready-made scenario (an official module or a community one), write a Mission and a Secret for each PC slot, and confirm your player count and rules version. Session Prep in this console is that exact checklist: Handout assignment, Secret delivery, character sheet review—it won't wave you through with anything missing.", ja: "セッション前：既成のシナリオ（公式シナリオやコミュニティ製シナリオ）を選び、各PC枠に使命と秘密を用意し、プレイヤー人数とルールの版を確認します。このコンソールの「セッション準備」は、まさにそのチェックリストです。ハンドアウトの割り当て、秘密の配布、キャラクターシートの確認——1つでも欠けていれば先に進ませません。" },
      { zh: "开团中：你的工作是描述场景、扮演 NPC、裁定判定。冷场了就用「场景导演」的可朗读开场；不知道给谁镜头就看聚光灯建议；玩家判定失败了用「失败也前进」给剧情一个新方向而不是卡死。", en: "During the session: your job is to describe scenes, play the NPCs, and rule on Checks. If the table goes quiet, use the Scene Director's read-aloud openers; if you're not sure who to give the camera to, check the spotlight suggestions; when a player fails a Check, use \"fail forward\" to push the story in a new direction instead of grinding to a halt.", ja: "セッション中：あなたの仕事は、シーンの描写、NPCの演技、判定の裁定です。場が止まったら「シーン監督」の読み上げ用オープニングを。誰にスポットを当てるか迷ったらスポットライト提案を。プレイヤーの判定が失敗したら「失敗しても前進」で物語に新しい方向を与え、行き止まりにしないこと。" },
      { zh: "两条 GM 心法：① 秘密是玩家的燃料，帮他们把秘密烧得漂亮；② 你不是玩家的对手，你是全桌故事的经纪人。", en: "Two pieces of GM wisdom: 1) Secrets are your players' fuel—help them burn theirs beautifully. 2) You are not the players' opponent; you're the agent for the whole table's story.", ja: "GMの心得2か条：① 秘密はプレイヤーの燃料です。彼らが秘密を美しく燃やせるよう手伝いましょう。② あなたはプレイヤーの敵ではなく、卓全体の物語のマネージャーです。" },
    ],
    points: [
      { zh: "结构会替你讲故事，照着四阶段走就行。", en: "The structure tells the story for you—just follow the four phases.", ja: "構造が物語を語ってくれます。4フェイズに沿って進めるだけでOK。" },
      { zh: "开团准备清单防漏发秘密；导演席防冷场。", en: "The Session Prep checklist prevents missed Secrets; the director's chair prevents dead air.", ja: "セッション準備のチェックリストが秘密の配り忘れを防ぎ、監督席が場の停滞を防ぎます。" },
      { zh: "第一次开团选 2~3 人的短剧本，别贪大。", en: "For your first game, pick a short scenario for 2 to 3 players. Don't overreach.", ja: "初セッションは2～3人用の短いシナリオで。欲張らないこと。" },
    ],
    tryIt: { view: "prep", label: { zh: "走一遍开团准备清单", en: "Walk through the Session Prep checklist", ja: "セッション準備チェックリストを一巡する" } },
  },
  {
    id: "keep-going",
    minutes: 4,
    title: { zh: "下一步：规则书、社区与工具", en: "What's Next: Rulebook, Community, Tools", ja: "次の一歩：ルールブック・コミュニティ・ツール" },
    goal: { zh: "学完这课，你知道去哪里继续变强。", en: "By the end of this lesson, you'll know exactly where to go to keep getting better.", ja: "このレッスンを終えると、どこへ行けばさらに強くなれるかが分かります。" },
    body: [
      { zh: "本学院教的是骨架。要正式开团，你需要一本正版规则书：《忍神》基本规则书（十周年改订版）是唯一必需品——特技的完整数值、五百多个忍法、全部表格都在里面。入门友好的官方「Start Book」也值得一看。", en: "This academy teaches the skeleton. To run a real session you'll need a legitimate copy of the rules: the Shinobigami core rulebook (10th-anniversary revised edition) is the only must-have—the complete Skill values, five-hundred-plus Ninpo, and every table live inside it. The beginner-friendly official Start Book is well worth a look too.", ja: "このアカデミーで教えたのは骨組みです。正式にセッションを開くには、正規のルールブックが必要です。『シノビガミ』基本ルールブック（十周年改訂版）が唯一の必需品——特技の完全なデータ、500以上の忍法、すべての表がここに収録されています。入門に優しい公式「スタートブック」も一読の価値があります。" },
      { zh: "读英文版（Kotodama 译）或日文原版时，注意一个著名的翻译陷阱：中文「忍术」分野在英文版叫 Stealth（潜行），不是 Ninjutsu。下方的三语术语表帮你对齐所有关键词。", en: "If you ever cross-reference the Japanese original (or Chinese fan materials), watch out for one famous translation trap: the Category the English edition (the Kotodama translation) calls Stealth is written \"Ninjutsu\" in Japanese—same Category, very different-sounding name. The trilingual glossary below lines up all the key terms for you.", ja: "英語版（Kotodama 訳）に触れる機会があれば、有名な翻訳の罠にご注意を：英語版では「忍術」分野が Stealth（隠密）と訳されており、Ninjutsu ではありません。海外のプレイヤーと卓を囲むときに混乱しやすいポイントです。下の三か国語用語対照表が、すべてのキーワードの対応づけを助けてくれます。" },
      { zh: "跑完团别忘了复盘：把聊天记录粘进「跑团记录台」做检索，或用「Replay 工房」生成一份戏剧化实录留念——回顾自己的第一团，是进步最快的方式。", en: "After the game, don't skip the debrief: paste your chat log into the Session Log to make it searchable, or use Replay Forge to turn it into a dramatized replay you can keep—rereading your own first session is the fastest way to improve.", ja: "セッションが終わったら、振り返りを忘れずに。チャットログを貼り付けて検索できるログ機能を使うか、「リプレイ工房」でドラマ仕立てのリプレイを生成して記念に残しましょう——自分の初セッションを振り返ることが、いちばん早い上達の道です。" },
      { zh: "最后：本工具是非官方的辅助，它替你算数、防漏、救冷场，但规则的最终解释永远属于规则书与你桌上的 GM。祝你的第一团顺利。", en: "One last thing: this tool is an unofficial helper. It does the math, catches omissions, and rescues dead air—but the final word on the rules always belongs to the rulebook and the GM at your table. Good luck with your first session.", ja: "最後に：このツールは非公式の補助ツールです。計算を代行し、配り忘れを防ぎ、場の停滞を救いますが、ルールの最終的な解釈は、常にルールブックと、あなたの卓のGMのものです。あなたの初セッションがうまくいきますように。" },
    ],
    points: [
      { zh: "基本规则书（改订版）是唯一必需品。", en: "The core rulebook (revised edition) is the only must-have.", ja: "基本ルールブック（改訂版）が唯一の必需品。" },
      { zh: "英文版的 Stealth = 忍术分野，别被骗。", en: "In the English edition, Stealth is the Category called \"Ninjutsu\" in Japanese—don't let the names fool you.", ja: "英語版では「忍術」分野が Stealth と訳されています。混同にご注意を。" },
      { zh: "跑完第一团，回来用 Replay 工房复盘。", en: "After your first session, come back and debrief with Replay Forge.", ja: "初セッションを終えたら、リプレイ工房で振り返りを。" },
    ],
    tryIt: { view: "replay", label: { zh: "看看 Replay 工房", en: "Take a look at Replay Forge", ja: "リプレイ工房を見てみる" } },
  },
];

export const GLOSSARY: GlossaryEntry[] = [
  { zh: "判定", en: "Check / Action Resolution", ja: "判定" },
  { zh: "特技", en: "Skill", ja: "特技" },
  { zh: "特技表", en: "Skill Matrix", ja: "特技リスト表" },
  { zh: "分野", en: "Category", ja: "分野" },
  { zh: "器术", en: "Tech", ja: "器術" },
  { zh: "体术", en: "Martial Arts", ja: "体術" },
  { zh: "忍术", en: "Stealth", ja: "忍術" },
  { zh: "谋术", en: "Scheming", ja: "謀術" },
  { zh: "战术", en: "Strategy", ja: "戦術" },
  { zh: "妖术", en: "Sorcery", ja: "妖術" },
  { zh: "忍法", en: "Ninpo (Ninja Arts)", ja: "忍法" },
  { zh: "奥义", en: "Ohgi (Secret Technique)", ja: "奥義" },
  { zh: "指定特技", en: "Assigned Skill", ja: "指定特技" },
  { zh: "使命", en: "Mission", ja: "使命" },
  { zh: "秘密", en: "Secret", ja: "秘密" },
  { zh: "居所", en: "Location", ja: "居所" },
  { zh: "奥义情报", en: "Ohgi Info", ja: "奥義情報" },
  { zh: "感情", en: "Emotional Bond (EmoBond)", ja: "感情" },
  { zh: "感情修正", en: "EmoMod", ja: "感情修正" },
  { zh: "情报共享", en: "Info Share", ja: "情報共有" },
  { zh: "变调", en: "Status Ailment", ja: "変調" },
  { zh: "大成功（双六）", en: "Special", ja: "スペシャル" },
  { zh: "大失败", en: "Fumble", ja: "ファンブル" },
  { zh: "大失败值", en: "Fumble Value", ja: "ファンブル値" },
  { zh: "达成值", en: "Achievement Value", ja: "達成値" },
  { zh: "布局", en: "Plot (Value)", ja: "プロット（値）" },
  { zh: "速度系统", en: "Velocity System", ja: "ヴェロシティシステム" },
  { zh: "场景", en: "Scene", ja: "シーン" },
  { zh: "场景玩家", en: "Scene Player", ja: "シーンプレイヤー" },
  { zh: "戏剧场景", en: "Drama Scene", ja: "ドラマシーン" },
  { zh: "战斗场景", en: "Battle Scene", ja: "戦闘シーン" },
  { zh: "循环", en: "Cycle", ja: "サイクル" },
  { zh: "阶段", en: "Phase", ja: "フェイズ" },
  { zh: "功绩点", en: "Merit", ja: "功績点" },
  { zh: "生命力", en: "Life Points", ja: "生命力" },
  { zh: "忍具", en: "Ninja Gear", ja: "忍具" },
  { zh: "兵粮丸", en: "Bead of Life", ja: "兵糧丸" },
  { zh: "神通丸", en: "Soma Pill", ja: "神通丸" },
  { zh: "遁甲符", en: "Prayer Seal", ja: "遁甲符" },
  { zh: "战利品", en: "Prize", ja: "プライズ" },
  { zh: "手册", en: "Handout", ja: "ハンドアウト" },
  { zh: "情报判定", en: "Information Check", ja: "情報判定" },
  { zh: "感情判定", en: "Emotion Check", ja: "感情判定" },
  { zh: "回复判定", en: "Recovery Check", ja: "回復判定" },
  { zh: "回避判定", en: "Dodge Check", ja: "回避判定" },
  { zh: "流派", en: "Clan", ja: "流派" },
  { zh: "阴影战争", en: "Shadow War", ja: "影の戦争" },
  { zh: "脱落", en: "Drop out", ja: "脱落" },
];

export function normalizeAcademyProgress(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const known = new Set(ACADEMY_LESSONS.map((lesson) => lesson.id));
  return [...new Set(value.filter((item): item is string => typeof item === "string" && known.has(item)))];
}
