export default function RulesCheatsheet() {
  return (
    <div className="rules-list">
      <article><span>01</span><div><h3>行为判定</h3><p>目标值＝5＋指定特技到所用已习得特技的格数。默认选择最近特技，玩家也可以主动选择更远的特技代用；目标值不封顶。</p></div></article>
      <article><span>02</span><div><h3>特殊骰点</h3><p>大成功与大失败只看修正前骰点。通常 12 为大成功、2 为大失败；战斗从攻击处理到回合结束，大失败值改为当前布局值并造成逆止。</p></div></article>
      <article><span>03</span><div><h3>布局与行动</h3><p>秘密选择 1–6 后同时公开，由高到低行动；高布局更快，但大失败风险也更高。公开时违规的布局记为 0：最后行动，大失败值为 2。</p></div></article>
      <article><span>04</span><div><h3>距离与花费</h3><p>双方布局差不得超过忍法距离，目标布局为 0 时无视距离；同回合忍法累计花费不得超过自己的布局值；攻击忍法只能在自己行动时宣言，一回合一次。</p></div></article>
      <article><span>05</span><div><h3>伤害</h3><p>接近战随机失去分野生命力；射击战由受伤者选择；集团战通常获得变调。</p></div></article>
      <article><span>06</span><div><h3>BCDice 风格</h3><p>本工具日志记录 SG 命令。额外骰池采用 nSG 的“投 n 颗、取高 2 颗”方式。</p></div></article>
      <article><span>07</span><div><h3>情报共享</h3><p>当你抱有感情的角色直接获得情报时，你自动获得同一情报；共享所得不会继续触发连锁共享。</p></div></article>
      <article><span>08</span><div><h3>巡与场景</h3><p>主要阶段每位 PC 每巡有一次主要行动。剧情场景从回复、情报、感情中择一；GM 还可按剧本设置计划判定。辅助判定是 GM 设置的简单行动，不消耗主要行动。</p></div></article>
      <article><span>09</span><div><h3>宣言窗口</h3><p>同一时机可能有多个效果时，先询问是否继续宣言；确认无人追加后再推进回避或效果，避免错过时机后回溯。</p></div></article>
      <article><span>10</span><div><h3>同速批次</h3><p>同一布局的攻击视为同时发生；先完成同速角色的攻击，再统一应用生命减少、逆止、变调与附带效果。</p></div></article>
    </div>
  );
}
