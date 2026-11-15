import { useState } from 'react'
import { Stepper, type Line, type Step } from './ui'

const N = (t: string): Line => ({ t, k: 'new' })
const D = (t: string): Line => ({ t, k: 'dim' })

/* ── 四个引擎 ── */
const ROWS = ['进程形态', '用户要另装什么', '对话历史怎么续', '可用性检查', '不可用时', '审批', '运行中插话', '特有限制']
const ENG: Record<string, string[]> = {
  Claude: ['daemon 进程内调用 Claude Agent SDK；SDK 为每次调用或每条流式连接启动一个 Claude Code 子进程', '不用另装；需要本机 Claude 登录态或 API key（安装向导里三选一）', '每轮成功后保存 SDK 会话 id，下次续接', '只看 Claude Code 程序文件是否存在；只在 daemon 启动时查一次，修好后要重启 daemon', '拒绝执行，回复写明要重装并重启 daemon', '默认 bypassPermissions，不弹审批', '新消息暂存，主会话下一次工具调用结束时交给模型', '内置工具按 15 个核心工具的白名单开放'],
  Codex: ['每个会话一个 codex app-server 子进程，按行收发 JSON-RPC', 'codex CLI，并执行 codex login', '线程：新建、续接，或 fork（复制一份历史，换上新设定继续）', '每次启动会话时检查是否安装、是否已登录；装好后下一条消息即可使用', '拒绝执行，回复写明要安装 codex CLI 并登录', 'approvalPolicy: never；另有沙箱，默认只能写工作区', 'turn/steer 接口直接送进这一轮', '内置工具不可禁用；指令变化要 fork 新线程才生效'],
  Grok: ['每个会话一个 grok agent 子进程，走 ACP 协议', 'grok CLI，并执行 grok login', 'ACP 的 session/load', '只查是否安装，不查登录态；没登录的错误到实际调用时才出现', '拒绝执行，回复写明要安装 grok CLI 并登录', '启动参数 --always-approve', 'Grok 的插话扩展方法', '默认模式下系统提示只在新建会话时传入'],
  pi: ['每个会话一个 pi worker 子进程；worker 随 duoduo 的 npm 包分发', '什么都不用装；需要在 ~/.pi/agent 里配好模型和凭据', 'pi 自己的会话文件，存放在 duoduo 的会话目录下', '不检查，永远列为可用', '没有“不可用”；会话没有配置模型时拒绝执行', '不弹审批', 'pi worker 的插话接口', '没有子代理工具，委派要用 job'],
}
export function EngineTabs() {
  const [e, setE] = useState('Claude')
  return (
    <>
      <div className="tabs" role="tablist">
        {Object.keys(ENG).map(k => <button key={k} role="tab" aria-selected={k === e} onClick={() => setE(k)}>{k}</button>)}
      </div>
      <div className="kv" role="tabpanel">
        {ROWS.map((r, i) => [<div className="k" key={r + 'k'}>{r}</div>, <div key={r + 'v'}>{ENG[e][i]}</div>])}
      </div>
    </>
  )
}

/* ── 一条消息的六步 ── */
const LOG = '事件日志 var/events/2026-11-15.jsonl', MB = '邮箱 var/sessions/<sha256>/mailbox.md', OB = '渠道收到的回复'
const L0 = D('{"id":"evt_7a1","type":"agent.result",…}')
const E1 = '{"id":"evt_8f2","type":"channel.message","text":"帮我看下昨天的部署日志"}'
const MSG: Step[] = [
  { label: '0', title: '用户在飞书群里 @机器人 发了一句话', text: '飞书适配器收到消息，确认消息 @ 了机器人，然后调用 daemon 的入站接口。消息带着飞书给的幂等键（同一条消息重复投递时用来识别的标识）。', files: [[LOG, [L0]], [MB, [D('（空）')]], [OB, [D('（还没有回复）')]]] },
  { label: '①', title: '写日志：先把“收到了”写进磁盘', text: 'daemon 先查幂等键，没见过。它把消息封装成一条带唯一 id 的事件，追加到当天的事件日志，再往索引里追加一行位置记录。从这一刻起，这条消息已经在磁盘上。', files: [[LOG, [L0, N(E1)]], [MB, [D('（空）')]], [OB, [D('（还没有回复）')]]] },
  { label: '②', title: '分流：这不是运维命令', text: '网关看第一个词。这条消息不以 /status、/model 之类的命令开头，所以交给会话处理。如果是 /status，网关在这一步直接回复，后面几步都不发生。', files: [[LOG, [L0, E1]], [MB, [D('（空）')]], [OB, [D('（还没有回复）')]]] },
  { label: '③', title: '写指针：邮箱只记事件 id', text: 'daemon 在这个会话的邮箱里写一行待办。邮箱不复制正文，正文只在事件日志里存一份。', files: [[LOG, [L0, E1]], [MB, [N('- [ ] @evt(evt_8f2)')]], [OB, [D('（还没有回复）')]]] },
  { label: '④', title: '唤醒：找到这个会话的 actor', text: '这个会话键已有 actor（会话在内存里的执行体）就直接用，没有就新建。actor 从渠道会话的并发池里取一个名额，默认 10 个，满了就排队。', files: [[LOG, [L0, E1]], [MB, ['- [ ] @evt(evt_8f2)']], [OB, [D('（还没有回复）')]]] },
  { label: '⑤', title: '处理：合并、装配、调用引擎', text: 'actor 从邮箱取一批待办，这次只有一条。它装配系统提示和每轮瞬时块，送进引擎。模型读日志文件、执行命令，每次工具调用和结果都作为事件追加进日志。', files: [[LOG, [L0, E1, N('{"id":"evt_8f3","type":"agent.tool_use","tool":"Bash",…}'), N('{"id":"evt_8f4","type":"agent.tool_result",…}')]], [MB, ['- [ ] @evt(evt_8f2)']], [OB, [D('（模型正在流式输出…）')]]] },
  { label: '⑥', title: '回执：写出站记录，勾掉待办，推回渠道', text: '这一轮结束。daemon 写一条出站记录，附带 token 用量、费用和实际使用的模型；追加一条结果事件；把邮箱里的待办勾掉。适配器立即收到推送，把回复发回群里。actor 归还并发名额。', files: [[LOG, [L0, E1, D('…tool_use / tool_result…'), N('{"id":"evt_8f5","type":"agent.result",…}')]], [MB, [N('- [x] @evt(evt_8f2)')]], [OB, [N('昨天 21:14 的部署在 migrate 步骤失败……'), D('耗时 38s · 输入 12.4k（缓存命中 91%）· $0.04')]]] },
]
export function MsgStepper() {
  return <Stepper steps={MSG} note={<>文件内容是示意，事件 id 和字段做了简化。文件路径和指针格式 <code>- [ ] @evt(&lt;id&gt;)</code> 是真实的。</>} />
}

/* ── 提示词装配 ── */
const SYS = ['身份提示 meta-prompt.md，后接角色说明（主会话或成员会话）', '渠道种类的人格 config/feishu.md', '实例提示 descriptor.md', '记忆板 memory/CLAUDE.md', '运行上下文：会话键、渠道种类、引擎名（不含时间）', 'job 任务书（只有 job 会话有）']
const TR = ['重启提示', '自动压缩提示', '网关命令执行说明', '时间流逝 <time-context>', '上一轮 Skip 的说明', '被打断的上下文', 'job 完成回执', 'job 触发信息 <job-tick>', '记忆板更新提示']
const SC: Record<string, { name: string; tr: number[]; miss?: number; note: string }> = {
  next: { name: '5 分钟后的下一轮', tr: [], note: '系统提示逐字不变，整段命中缓存。这一轮没有瞬时块，用户原文直接跟在后面。' },
  gap: { name: '隔了 3 天再聊', tr: [3], note: '距上次交互超过 60 分钟，所以加一块时间流逝说明，写明上次和现在的时间。系统提示不变。但空闲超过 1 小时后引擎进程已被回收，模型服务端的缓存也已过期，所以这一轮要把系统提示重新写入缓存。' },
  board: { name: '后台刚改了记忆板', tr: [8], note: 'Claude 渠道会话的连接不重建，继续用原来的系统提示，缓存不中断。新版记忆板等连接下次重建时才进入系统提示。这一轮先用一个瞬时块告诉模型：记忆板已变，需要时去读。' },
  restart: { name: 'daemon 刚重启', tr: [0], note: 'daemon 重启后，渠道会话的第一轮带上重启提示，写明模型运行在新的 daemon 进程下，以及重启的原因。' },
  role: { name: '渠道人格或角色变了', tr: [], miss: 0, note: '身份、角色、人格都属于“指令”。运行时发现指令指纹变了，Claude 关闭原连接，下一轮用新的系统提示重建并续接原历史。从变化的那一层起，缓存要重新写入。把一个会话设为主会话，也会触发一次这样的重建。' },
}
export function PromptStack() {
  const [k, setK] = useState('next')
  const s = SC[k]
  const missFrom = s.miss ?? 99
  return (
    <>
      <div className="seg" role="group" aria-label="场景">
        {Object.entries(SC).map(([id, v]) => <button key={id} aria-pressed={id === k} onClick={() => setK(id)}>{v.name}</button>)}
      </div>
      <div className="stack">
        <div className="divider">系统提示（固定顺序的六层）</div>
        {SYS.map((t, i) => (
          <div key={i} className={`blk ${i === 5 ? 'off' : ''}`}>
            <span className="n">{i + 1}</span><span>{t}</span>
            {i === 5 ? <span /> : i >= missFrom ? <span className="tag miss">重写缓存</span> : <span className="tag hit">命中缓存</span>}
          </div>
        ))}
        <div className="divider">每轮瞬时块（只放这一轮出现的）</div>
        {s.tr.length === 0 && <div className="blk off"><span className="n">—</span><span>这一轮没有瞬时块</span><span /></div>}
        {s.tr.map(j => <div key={j} className="blk"><span className="n">{j + 1}</span><span>{TR[j]}</span><span className="tag var">每轮变化</span></div>)}
        <div className="divider">用户消息</div>
        <div className="blk"><span className="n">›</span><span>用户原文</span><span /></div>
      </div>
      <p className="small muted" style={{ marginTop: 10 }}>{s.note}</p>
    </>
  )
}

/* ── 心跳模拟 ── */
const PL: [string, string][] = [['gradient-distiller', '5 次心跳 / 35 分钟'], ['intuition-weaver', '5 次心跳 / 35 分钟'], ['pattern-tracker', '7 次心跳 / 15 分钟'], ['memory-committer', '3 次心跳 / 30 分钟']]
const ST: Record<string, string> = { ok: '可运行', cool: '冷却中', back: '失败退避中', off: '已停用' }
export function CadenceSim() {
  const [busy, setBusy] = useState(false)
  const [stop, setStop] = useState(false)
  const [fp, setFp] = useState(true)
  const [act, setAct] = useState(1)
  const [st, setSt] = useState(['ok', 'cool', 'ok', 'ok'])
  const steps: [boolean, string][] = []
  const run: number[] = []
  const c1 = !busy && !stop
  steps.push([c1, '检查 1 · 上一次是否结束：' + (c1 ? '通过。' : (busy ? '上一次心跳启动的分区会话还在运行' : 'daemon 正在停止') + '，这次不运行分区。')])
  if (c1) {
    steps.push([fp, '检查 2 · 有没有变化：' + (fp ? '活动指纹变了，通过。' : '活动指纹没变，这次不运行分区。')])
    if (fp) {
      const elig = PL.map((_, i) => i).filter(i => st[i] === 'ok')
      const skipped = PL.map((p, i) => st[i] !== 'ok' ? `${p[0]}（${ST[st[i]]}）` : '').filter(Boolean)
      steps.push([elig.length > 0, '检查 3 · 冷却与退避：' + (skipped.length ? '跳过 ' + skipped.join('、') + '。' : '没有需要跳过的分区。') + (elig.length ? '' : '没有可运行的分区。')])
      if (elig.length) {
        run.push(elig[0])
        if (act <= 1 && elig.length > 1) run.push(elig[1])
        steps.push([true, `检查 4 · 前台优先：活跃会话 ${act} 个，` + (act <= 1 ? (elig.length > 1 ? '不超过 1 个，这次心跳再运行下一个可运行的分区。' : '不超过 1 个，但没有第二个可运行的分区。') : '超过 1 个，这次只运行一个分区。')])
      }
    }
  }
  return (
    <div className="sim">
      <fieldset>
        <legend>心跳时的状态</legend>
        <label><input id="sim-busy" type="checkbox" checked={busy} onChange={e => setBusy(e.target.checked)} /> 上一次心跳启动的分区会话还在运行</label>
        <label><input id="sim-stop" type="checkbox" checked={stop} onChange={e => setStop(e.target.checked)} /> daemon 正在停止</label>
        <label><input id="sim-fp" type="checkbox" checked={fp} onChange={e => setFp(e.target.checked)} /> 自上次心跳以来，记忆目录里的碎片或档案有改动，或者有新的外部事件</label>
        <label style={{ display: 'grid', gap: 4 }}><span>当前活跃会话数：<b>{act}</b></span><input id="sim-act" type="range" min={0} max={6} value={act} onChange={e => setAct(+e.target.value)} /></label>
      </fieldset>
      <fieldset>
        <legend>轮转表 playlist.md</legend>
        {PL.map((p, i) => (
          <div key={p[0]} className={`pl-row ${run.includes(i) ? 'run' : ''}`}>
            <span><span className="nm">- [ ] {p[0]}</span><br /><span className="muted" style={{ fontSize: 12 }}>冷却 / 超时：{p[1]}</span></span>
            <select id={`sim-pl${i}`} aria-label={`${p[0]} 的状态`} value={st[i]} onChange={e => setSt(st.map((v, k) => k === i ? e.target.value : v))}>
              {Object.entries(ST).map(([v, t]) => <option key={v} value={v}>{t}</option>)}
            </select>
          </div>
        ))}
      </fieldset>
      <div className="verdict" aria-live="polite">
        <div className="big">{run.length ? `运行 ${run.length} 个分区：${run.map(i => PL[i][0]).join(' → ')}` : '不运行分区，也不调用模型'}</div>
        <ol>{steps.map((s, i) => <li key={i} className={s[0] ? '' : 'fail'}>{s[1]}</li>)}</ol>
        <p className="small muted" style={{ marginTop: 8 }}>{run.length > 1 ? '两个分区依次运行，不并行。' : '不论结果如何，心跳的维护步骤（只读检查、清理、写心跳事件）都照常进行，它们不调用模型。'}</p>
      </div>
    </div>
  )
}

/* ── 一次纠正怎样变成记忆 ── */
const PIPE: [string, string][] = [['log', '事件日志'], ['lint', '只读检查（代码）'], ['distiller', 'distiller'], ['weaver', 'weaver'], ['tracker', 'tracker'], ['front', '前台会话'], ['committer', 'committer']]
const IMP: Step[] = [
  { label: '1', hot: ['log'], title: '用户在飞书上纠正 agent', text: '用户说：“发周报之前先核对上周的数字。”这条消息作为外部事件写进事件日志。', files: [['事件日志 var/events/2026-11-15.jsonl', [N('{"type":"channel.message","text":"发周报之前先核对上周的数字",…}')]]] },
  { label: '2', hot: ['lint'], title: '代码发现有一段外部事件还没提炼', text: '最后一条用户消息之后过了一个心跳间隔。下一次心跳的只读检查给 distiller 的收件箱投一张任务单，写明要处理的时间区间。这一步不调用模型。', files: [['var/subconscious/gradient-distiller/inbox/', [N('scan-gap.pending（区间：2026-11-15 09:00–10:12）')]]] },
  { label: '3', hot: ['distiller'], title: 'distiller 读日志，写一条碎片', text: '轮到 distiller 时，它读出这段区间里的外部事件，逐条对照记忆板。记忆板上没有相关的行，所以它写一条“新信号”碎片。处理完，它删掉任务单。', files: [['memory/fragments/2026-11-15/…md', [N('label: NEW_SIGNAL'), N('source: <事件 id>'), N('用户要求发周报前核对上周数字')]]] },
  { label: '4', hot: ['weaver'], title: 'weaver 决定在记忆板上加一行', text: '新碎片比 weaver 上次运行更新，所以下一次心跳给 weaver 投一张任务单。weaver 判断这是用户明确提出的长期要求，在记忆板上新增一行：触发条件、一句方向、可选的档案链接。', files: [['memory/CLAUDE.md（记忆板）', [D('…原有各行…'), N('发周报之前 → 先核对上周的数字 [[weekly-report]]')]]] },
  { label: '5', hot: ['tracker'], title: 'tracker 可能另写一个规则文件', text: '如果 tracker 从碎片里看到一次完整的纠正经过（偏离、人纠正、按纠正做成功），它另写一个 lesson 文件，内容是触发条件和执行步骤。', files: [['memory/topics/lesson-weekly-report-check.md', [N('触发：准备发送周报'), N('步骤：1. 取上周数字  2. 与本周对比  3. 差异写进周报')]]] },
  { label: '6', hot: ['front'], title: '写进磁盘即生效，不等提交', text: 'weaver 写完记忆板之后，新开的会话在系统提示里直接带上这一行。正在运行的渠道会话在下一轮收到“记忆板已变”的提示。', files: [['下一轮的每轮瞬时块', [N('记忆板已更新，需要时读取 memory/CLAUDE.md')]]] },
  { label: '7', hot: ['committer'], title: 'committer 把改动做成一个 git 提交', text: 'committer 下一次运行时，把允许范围内的改动合成至多一个提交。这一步只留下可以撤销的历史，不影响第 6 步。改坏了，用户执行一次 git revert 撤销。', files: [['~/aladuo（git log）', [N("memory(weekly-report): add pre-send check of last week's numbers")]]] },
]
export function ImproveStepper() {
  return <Stepper steps={IMP} pipe={PIPE} note="步骤之间隔着若干次心跳。文件内容是示意。" />
}

/* ── 术语表 ── */
const GL: [string, string][] = [
  ['live context', '官网对 duoduo 所保存内容的总称：事件日志、进行中的工作（会话与 job 的文件）、记忆板。官网把 duoduo 定位为 agent 三个组成部分（模型、环境、上下文）里的上下文。'],
  ['运行时', '本文指 duoduo 这个常驻程序本身：调度、日志、心跳等确定性逻辑。它不做推理。'],
  ['引擎（配置字段 runtime）', 'claude、codex、grok、pi 四选一，真正调用模型、执行工具的部件。官网叫 harness。渠道还可以写 void，表示这个渠道的会话从不调用模型。'],
  ['daemon', 'duoduo 的常驻进程。调度、会话、邮箱、日志、心跳都在这个进程里。'],
  ['网关', 'daemon 里接收所有入站消息、决定要不要调用模型的组件。'],
  ['事件日志', '只追加的事件文件，按日期分文件存放。官网叫 Spine。每条输入先写进这里，再处理。'],
  ['会话 / actor', '会话是一段对话或一次后台任务。actor 是它在内存里的执行体。一个会话键至多对应一个 actor。'],
  ['会话键', '会话的唯一名字。前缀决定类型：job: 开头是 job 会话，其余大多是渠道会话。'],
  ['渠道会话 / job 会话 / 分区会话', '渠道会话是有人在聊天平台上对话的会话。job 会话执行一个 job。分区会话是心跳唤醒的一次性后台会话。'],
  ['主会话', '显示别名为 main 的那个渠道会话，至多一个。它是用户自己的对话，也接收别处放不下的投递：owner 收不了的 job 结果，以及目标写 main 的通知。其他渠道会话叫成员会话。'],
  ['角色说明', '接在身份提示后面的一段文字。主会话读 roles/main.md，成员会话读 roles/member.md。'],
  ['邮箱', '每个会话的待办文件，只存事件指针 - [ ] @evt(<id>)，不存正文。'],
  ['一轮（turn）', '对引擎的一次调用。多条相邻消息可以合并成一轮。'],
  ['插话（steer）', '模型正在运行一轮时，把用户新发来的消息送进这一轮，而不是等它结束或中止它。'],
  ['回执', '一轮结束后写下的结果记录：一条出站记录（outbox）和一条结果事件。'],
  ['系统提示', '每次调用都放在最前面的文本，讲身份和规则。duoduo 的系统提示是固定顺序的六层。'],
  ['每轮瞬时块', '放在用户消息之前的文本块：时间流逝、被打断、job 回执等每轮可能变化的信息。它们不进系统提示。'],
  ['输入缓存', '模型服务缓存输入开头逐字相同的那一段。命中的部分按折扣计费，响应也更快。'],
  ['内核（~/aladuo）', '一个 git 仓库，存放 agent 可以修改的设定与记忆：渠道人格、记忆板与档案、后台分区提示词。'],
  ['运行数据（~/.aladuo）', 'daemon 运行时读写的数据：事件日志、会话状态与邮箱、job 定义、用量账本、锁和 socket。'],
  ['身份提示', 'meta-prompt.md，出厂的身份与行为准则。它随安装包分发，不复制进内核。'],
  ['记忆板', 'memory/CLAUDE.md。官网叫 intuition layer 或 intuition board。正文放进系统提示。至多 100 个非空行，每行至多 200 字符。'],
  ['档案', '记忆板上 [[名字]] 链接指向的文件：实体档案、lesson-*（纠错规则）、groove-*（重复任务的固定流程）。'],
  ['碎片', '官网叫 text gradient（文本梯度）。distiller 从事件日志提炼出的一条证据，指向记忆板的某一行，或标为新信号。'],
  ['效果记录', '由碎片汇总出的统计：记忆板每一行起作用了几次。'],
  ['心跳', '后台定时器，默认每 2,220,000 毫秒（约 37 分钟）触发一次。'],
  ['后台分区', '一个提示词目录。心跳唤醒它，运行一次不保存历史的分区会话。上游叫 subconscious。出厂四个。'],
  ['轮转表', 'playlist.md。用勾选框书写，决定下一次心跳轮到哪个分区。'],
  ['冷却 / 退避', '冷却是分区两次运行之间至少隔的心跳次数。退避是分区失败后推迟下次运行的时间，有上限。'],
  ['只读检查', '心跳里代码对记忆文件的测量：是否太长、链接是否断了、有没有走不到的文件。它只测量，发现问题就写任务单。'],
  ['任务单', '只读检查发现问题时写的一份文本工单，投进某个分区的收件箱。分区处理完就删掉它。'],
  ['活动指纹', '对记忆目录的最新修改时间和最新一条外部事件算的哈希。它没变时，这次心跳不运行分区。'],
  ['指令指纹', '对身份提示、角色说明、渠道人格、实例提示、记忆板、job 任务书算的哈希。运行时用它发现指令变了。'],
  ['job', '用户或前台会话布置的定时或一次性任务，由一个 Markdown 文件定义。布置它的会话叫它的 owner。'],
  ['渠道适配器', '把 duoduo 接到某个聊天平台的独立进程，例如飞书适配器。'],
  ['自操作工具', 'duoduo 追加给模型、用来操作 duoduo 自身的六个工具：ManageJob、RemindDuoduo、ViewSessions、Notify、QueueOutboundAttachment、Skip。'],
  ['控制面', '外部程序向 daemon 发指令的接口：unix socket（完整权限）、本机 20233 端口（只读）、可选的远程监听。'],
]
export function Glossary() {
  const [q, setQ] = useState('')
  const k = q.trim().toLowerCase()
  const list = GL.filter(g => !k || (g[0] + g[1]).toLowerCase().includes(k))
  return (
    <>
      <input id="gl-q" className="gl-q" type="search" placeholder="输入关键词筛选，例如 邮箱、指纹、主会话" aria-label="筛选术语" value={q} onChange={e => setQ(e.target.value)} />
      {list.length ? <dl className="gl">{list.map(g => [<dt key={g[0]}>{g[0]}</dt>, <dd key={g[0] + 'd'}>{g[1]}</dd>])}</dl> : <p className="muted">没有匹配的术语。换一个关键词再试。</p>}
    </>
  )
}
