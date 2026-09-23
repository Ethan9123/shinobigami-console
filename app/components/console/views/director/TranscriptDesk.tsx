import { useConsole } from "../../context";

export default function TranscriptDesk() {
  // 两个文件输入互斥渲染（未导入 / 已导入），共用控制器里的同一个 transcriptRef
  const {
    appendTranscriptEntry, filteredTranscript, importTranscriptFile, loadTranscript, setTranscript, setTranscriptDraft,
    setTranscriptQuery, setTranscriptSceneId, setTranscriptSpeaker, tableSafe, transcript, transcriptDraft,
    transcriptQuery, transcriptRef, transcriptSceneId, transcriptSpeaker,
  } = useConsole();

  return (
    <section className="panel transcript-panel">
      <div className="panel-heading battle-heading">
        <div><span>LOCAL REPLAY DESK</span><h2>跑团记录台</h2></div>
        <span className="selection-count">{transcript ? `${transcript.scenes.length} 段 · ${transcript.entries.length} 行` : "尚未导入"}</span>
      </div>
      {!transcript ? <div className="transcript-empty">
        <div><strong>把论坛 Log 或聊天记录变成可检索的场景索引</strong><p>识别「导入场景」「第×巡」「高潮阶段」与 &lt;角色名&gt; 对话；只在当前设备解析，不预置或上传模组正文与秘密。</p><button onClick={() => transcriptRef.current?.click()}>选择 UTF-8 文本</button></div>
        <textarea value={transcriptDraft} onChange={(event) => setTranscriptDraft(event.target.value)} placeholder={"也可以直接粘贴记录……\n导入场景：召集\n<角色名> 台词"} />
        <button className="parse-transcript" onClick={() => loadTranscript(transcriptDraft, "粘贴记录")} disabled={!transcriptDraft.trim()}>解析粘贴内容</button>
        <input ref={transcriptRef} type="file" accept="text/plain,.log,.txt" onChange={importTranscriptFile} hidden />
      </div> : <>
        <div className="transcript-toolbar">
          <input aria-label="搜索跑团记录" value={transcriptQuery} onChange={(event) => setTranscriptQuery(event.target.value)} placeholder="搜索台词、判定或关键词" />
          <select aria-label="筛选记录片段" value={transcriptSceneId} onChange={(event) => setTranscriptSceneId(event.target.value)}><option value="all">全部片段</option>{transcript.scenes.map((scene) => <option value={scene.id} key={scene.id}>{scene.title}（{scene.entryCount}）</option>)}</select>
          <select aria-label="筛选发言者" value={transcriptSpeaker} onChange={(event) => setTranscriptSpeaker(event.target.value)}><option value="">全部发言者</option>{transcript.speakers.map((speaker) => <option value={speaker.name} key={speaker.name}>{speaker.name}（{speaker.count}）</option>)}</select>
          <button onClick={() => transcriptRef.current?.click()}>换一份记录</button>
          <button className="remove-transcript" onClick={() => setTranscript(null)}>移除</button>
          <input ref={transcriptRef} type="file" accept="text/plain,.log,.txt" onChange={importTranscriptFile} hidden />
        </div>
        <div className={`transcript-list ${tableSafe ? "masked-transcript" : ""}`}>
          {tableSafe ? <div className="transcript-mask"><strong>桌面安全模式</strong><span>跑团记录可能包含秘密，当前已整体遮盖。</span></div> : filteredTranscript.length ? filteredTranscript.map((entry) => <article className={entry.kind} key={entry.id}>
            <span>{entry.line}</span><div>{entry.speaker && <b>{entry.speaker}</b>}<p>{entry.text}</p></div><button onClick={() => appendTranscriptEntry(entry)}>加入场景笔记</button>
          </article>) : <p className="empty-log">没有符合筛选条件的记录。</p>}
        </div>
        <div className="transcript-foot"><span>{transcript.sourceName}</span><em>显示 {filteredTranscript.length} 条{transcript.truncated ? " · 超长记录已截取前 5000 条" : ""}</em></div>
      </>}
    </section>
  );
}
