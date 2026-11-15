import { Arrow, Box, Fig } from './ui'

/* 图 1：模型是一个无状态的函数 */
export function FigFunction() {
  const notes: [number, string][] = [[95, '不执行任何操作'], [285, '不保存任何东西'], [475, '不会自己开始运行'], [665, '不因为被使用而改变']]
  return (
    <Fig caption={<><b>图 1　模型本身只做一件事。</b>四个"不"都来自"无状态的函数"这一个事实。"不保存任何东西"带来两个缺口：不记得做过什么，也不知道过了多久。</>}>
      <svg viewBox="0 0 760 220" role="img" aria-label="大语言模型是一个无状态的函数：输入一段文本，输出一段文本。它不执行任何操作，不保存任何东西，不会自己开始运行，不因为被使用而改变。">
        <Arrow id="a1" />
        <Box x={20} y={50} w={180} h={60} t="输入：一段文本" s="系统提示 + 历史 + 这一轮的消息" />
        <rect className="bx model" x={290} y={40} width={180} height={80} rx={3} />
        <text className="th" x={380} y={76} textAnchor="middle">大语言模型</text>
        <text className="ts" x={380} y={98} textAnchor="middle">一个无状态的函数</text>
        <Box x={560} y={50} w={180} h={60} t="输出：一段文本" s="回答，或一次工具调用请求" />
        <line className="ln" x1={200} y1={80} x2={288} y2={80} markerEnd="url(#a1)" />
        <line className="ln" x1={470} y1={80} x2={558} y2={80} markerEnd="url(#a1)" />
        <path className="sep" d="M380 120 V150 M95 150 H665 M95 150 V164 M285 150 V164 M475 150 V164 M665 150 V164" />
        {notes.map(([x, t]) => <text key={t} className="tw" x={x} y={184} textAnchor="middle">✕ {t}</text>)}
        <text className="lb" x={95} y={204} textAnchor="middle">缺口 1</text>
        <text className="lb" x={285} y={204} textAnchor="middle">缺口 2、3</text>
        <text className="lb" x={475} y={204} textAnchor="middle">缺口 4</text>
        <text className="lb" x={665} y={204} textAnchor="middle">缺口 5</text>
      </svg>
    </Fig>
  )
}

/* 图 2：调用模型 API 与调用 agent 引擎 */
export function FigEngine() {
  const chips = ['工具执行循环', '子代理编排', '对话历史保存', '工具扩展协议']
  const engines = ['Claude Code', 'Codex', 'Grok', 'pi']
  return (
    <Fig caption={<><b>图 2　两种做法的差别在于"工具执行循环由谁写"。</b>左边，运行时要自己实现并维护四样东西。右边，这四样东西引擎自带，duoduo 只写状态和调度。</>}>
      <svg viewBox="0 0 780 300" role="img" aria-label="左边：运行时直接调用模型 API，必须自己写工具执行循环、子代理编排、对话历史保存和工具扩展协议。右边：duoduo 调用 agent 引擎，引擎自带模型、工具、执行循环和历史，duoduo 运行时只管状态和调度。">
        <Arrow id="a2" />
        <text className="th" x={195} y={26} textAnchor="middle">直观的做法：调用模型 API</text>
        <rect className="bx code" x={30} y={44} width={330} height={150} rx={3} />
        <text className="tc" x={46} y={68}>运行时必须自己写</text>
        {chips.map((c, i) => (
          <g key={c}>
            <rect className="bx" x={46 + (i % 2) * 154} y={84 + Math.floor(i / 2) * 48} width={144} height={36} rx={3} />
            <text className="tt" x={118 + (i % 2) * 154} y={107 + Math.floor(i / 2) * 48} textAnchor="middle">{c}</text>
          </g>
        ))}
        <line className="ln" x1={195} y1={194} x2={195} y2={236} markerEnd="url(#a2)" />
        <Box x={110} y={240} w={170} h={46} k="model" t="模型 API" s="文本进，文本出" />
        <line className="sep" x1={390} y1={12} x2={390} y2={290} />
        <text className="th" x={585} y={26} textAnchor="middle">duoduo：调用 agent 引擎</text>
        <Box x={420} y={44} w={330} h={62} k="code" t="duoduo 运行时" s="只写状态和调度：日志、排队、定时、校验" />
        <line className="ln" x1={585} y1={106} x2={585} y2={150} markerEnd="url(#a2)" />
        <text className="lb" x={595} y={132}>同一份系统提示 + 六个追加的工具</text>
        <rect className="bx model" x={420} y={154} width={330} height={132} rx={3} />
        <text className="tm" x={436} y={178}>agent 引擎（四选一，不自动互换）</text>
        {engines.map((e, i) => (
          <g key={e}>
            <rect className="bx" x={434 + i * 77} y={192} width={70} height={34} rx={3} />
            <text className="tt" x={469 + i * 77} y={214} textAnchor="middle" style={{ fontSize: 11 }}>{e}</text>
          </g>
        ))}
        <text className="ts" x={585} y={252} textAnchor="middle">引擎自带：模型 + 工具 + 执行循环</text>
        <text className="ts" x={585} y={270} textAnchor="middle">+ 子代理 + 对话历史</text>
      </svg>
    </Fig>
  )
}

/* 图 3：一条消息的路径 */
export function FigMessage() {
  const xs = [20, 150, 280, 410, 540, 670]
  const bx: [string, string, string][] = [['', '渠道适配器', '飞书等'], ['disk', '① 事件日志', '先写进磁盘'], ['code', '② 网关', '分流'], ['disk', '③ 会话邮箱', '只写一行指针'], ['code', '④ 会话 actor', '排队、合并'], ['model', '⑤ 引擎', '模型 + 工具']]
  return (
    <Fig caption={<><b>图 3　一条消息先落盘，再处理。</b>实线是普通消息的路径。虚线是运维命令的路径，它不经过模型。绿色的两个方框是磁盘文件，进程崩溃后运行时靠它们找回没做完的待办。</>}>
      <svg viewBox="0 0 800 280" role="img" aria-label="一条消息从渠道适配器进入，第一步写进事件日志，第二步由网关分流，第三步在会话邮箱写一行指针，第四步唤醒会话 actor，第五步调用引擎，第六步写回执并推回渠道。运维命令由网关直接回复，不调用模型。">
        <Arrow id="a3" />
        {bx.map(([k, t, s], i) => <Box key={t} x={xs[i]} y={96} w={110} h={64} k={k} t={t} s={s} />)}
        {xs.slice(0, 5).map((x, i) => <line key={i} className="ln" x1={x + 110} y1={128} x2={x + 128} y2={128} markerEnd="url(#a3)" />)}
        <path className="ln dash" d="M335 96 V52 H75 V94" markerEnd="url(#a3)" />
        <text className="lb" x={205} y={42} textAnchor="middle">/status 等运维命令：网关直接回复，不调用模型</text>
        <path className="ln" d="M725 160 V206 H75 V162" markerEnd="url(#a3)" />
        <text className="lb" x={400} y={198} textAnchor="middle">⑥ 回执：写出站记录和结果事件，勾掉邮箱里的待办，推回渠道</text>
        <text className="td" x={400} y={248} textAnchor="middle">进程崩溃后：运行时重读 ③ 的指针，再按指针从 ① 读回正文，接着处理没勾掉的待办</text>
      </svg>
    </Fig>
  )
}

/* 图 4：时间放在哪里，决定缓存能不能命中 */
export function FigCache() {
  const sysA: [string, number][] = [['当前时间', 64], ['身份与角色', 92], ['渠道人格', 76], ['实例提示', 70], ['记忆板', 70], ['运行上下文', 80]]
  const sysB: [string, number][] = [['身份与角色', 100], ['渠道人格', 84], ['实例提示', 78], ['记忆板', 78], ['运行上下文', 88]]
  let xa = 150, xb = 150
  return (
    <Fig caption={<><b>图 4　同样的信息，放的位置不同，花费不同。</b>输入缓存只认开头逐字相同的那一段。时间写在开头，后面全部重新计费。时间写在末尾，前面的系统提示每轮都命中缓存。</>}>
      <svg viewBox="0 0 780 250" role="img" aria-label="上面一行：把当前时间写在系统提示开头，每一轮开头都不同，整段输入都不能命中缓存。下面一行是 duoduo 的做法：系统提示五层内容逐字不变，命中缓存；时间等每轮变化的信息写成瞬时块，放在用户消息前面。">
        <defs>
          <pattern id="hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="7" stroke="currentColor" strokeWidth="1.2" opacity=".28" />
          </pattern>
        </defs>
        <text className="tt" x={20} y={58}>直观的做法</text>
        <text className="ts" x={20} y={76}>时间写在系统提示里</text>
        {sysA.concat([['用户消息', 80]]).map(([t, w]) => {
          const x = xa; xa += w
          return <g key={'a' + t}><rect className="bx miss" x={x} y={40} width={w} height={44} fill="url(#hatch)" style={{ fill: 'url(#hatch)' }} /><text className="ts" x={x + w / 2} y={66} textAnchor="middle" style={{ fill: 'var(--ink)' }}>{t}</text></g>
        })}
        <text className="tw" x={150} y={106}>开头每轮都变 → 后面全部不能命中缓存，每轮按全价计费</text>
        <line className="sep" x1={20} y1={126} x2={760} y2={126} />
        <text className="tt" x={20} y={166}>duoduo 的做法</text>
        <text className="ts" x={20} y={184}>时间写在用户消息前</text>
        {sysB.map(([t, w]) => {
          const x = xb; xb += w
          return <g key={'b' + t}><rect className="hit" x={x} y={148} width={w} height={44} strokeWidth={1.2} /><text className="ts" x={x + w / 2} y={174} textAnchor="middle" style={{ fill: 'var(--ink)' }}>{t}</text></g>
        })}
        <rect className="bx model" x={578} y={148} width={96} height={44} />
        <text className="ts" x={626} y={174} textAnchor="middle" style={{ fill: 'var(--ink)' }}>每轮瞬时块</text>
        <rect className="bx" x={674} y={148} width={80} height={44} />
        <text className="ts" x={714} y={174} textAnchor="middle" style={{ fill: 'var(--ink)' }}>用户消息</text>
        <text className="td" x={150} y={214}>系统提示逐字不变 → 每轮命中缓存，按折扣计费</text>
        <text className="tm" x={578} y={214}>每轮变化，量很小</text>
        <text className="lb" x={578} y={232}>“距上次交互已过去 3 天”</text>
      </svg>
    </Fig>
  )
}

/* 图 5：两套定时器 */
export function FigTimers() {
  const beats: [number, boolean, string, string][] = [[130, true, '运行后台分区', '有新的用户消息'], [321.2, false, '不运行', '没有变化，不调用模型'], [512.3, true, '运行后台分区', '上一个分区写了新文件'], [703.5, false, '不运行', '没有变化']]
  return (
    <Fig caption={<><b>图 5　两小时内两套定时器各自的动作。</b>job 扫描器每 60 秒检查一次，到期的 job 立即启动。心跳约 37 分钟一次，实心点表示这次心跳调用了模型，空心点表示没有调用。</>}>
      <svg viewBox="0 0 780 214" role="img" aria-label="两小时时间轴。job 扫描器每 60 秒检查一次，到期的 job 立即启动。心跳约 37 分钟一次：有变化的那次运行后台分区，没有变化的那次不运行，也不调用模型。">
        <defs><pattern id="tk" patternUnits="userSpaceOnUse" x="130" y="0" width="5.1667" height="214"><line x1="0.5" y1="0" x2="0.5" y2="214" stroke="currentColor" strokeWidth="1" opacity=".3" /></pattern></defs>
        {[[130, '0'], [285, '30 分钟'], [440, '60 分钟'], [595, '90 分钟'], [750, '120 分钟']].map(([x, t]) => <text key={t} className="lb" x={x as number} y={20} textAnchor={x === 750 ? 'end' : 'middle'}>{t}</text>)}
        <text className="tt" x={10} y={64}>job 扫描器</text>
        <text className="ts" x={10} y={82}>替用户做事</text>
        <rect x={130} y={56} width={620} height={22} fill="url(#tk)" />
        <line className="tick" x1={440} y1={48} x2={440} y2={86} />
        <text className="tm" x={448} y={46}>到期的 job 启动；结果交回布置它的会话</text>
        <text className="tt" x={10} y={146}>心跳</text>
        <text className="ts" x={10} y={164}>替 agent 整理记忆</text>
        <line className="ln" x1={130} y1={144} x2={750} y2={144} />
        {beats.map(([x, run, t, s], i) => (
          <g key={i}>
            <circle cx={x} cy={144} r={7} className={run ? 'dot-run' : 'dot-skip'} />
            <text className="tt" x={i === 0 ? x + 8 : x} y={176} textAnchor={i === 0 ? 'start' : 'middle'}>{t}</text>
            <text className="ts" x={i === 0 ? x + 8 : x} y={194} textAnchor={i === 0 ? 'start' : 'middle'}>{s}</text>
          </g>
        ))}
      </svg>
    </Fig>
  )
}

/* 图 6：自我改进的循环 */
export function FigLoop() {
  const parts: [string, string][] = [['distiller', '提炼证据'], ['weaver', '改记忆板'], ['tracker', '写规则'], ['committer', '提交 git']]
  return (
    <Fig caption={<><b>图 6　经验沿一个方向走完一圈。</b>外部世界只经事件日志进入后台。后台只经记忆文件影响前台。蓝色的一步由代码完成，琥珀色的一步由模型完成。</>}>
      <svg viewBox="0 0 800 320" role="img" aria-label="一个循环：前台对话写进事件日志；代码在每次心跳做只读检查，发现待处理的内容就写任务单；后台分区会话里的模型读日志、改写记忆文件；改动提交进 git；下一次对话的系统提示带上新版记忆板。">
        <Arrow id="a6" />
        <Box x={20} y={30} w={150} h={60} t="前台对话" s="你纠正了它一次" />
        <Box x={225} y={30} w={150} h={60} k="disk" t="事件日志" s="只追加，不修改" />
        <Box x={430} y={30} w={150} h={60} k="code" t="只读检查" s="代码测量，写任务单" />
        <Box x={635} y={30} w={145} h={60} k="model" t="后台分区会话" s="模型读日志、改文件" />
        <line className="ln" x1={170} y1={60} x2={223} y2={60} markerEnd="url(#a6)" />
        <line className="ln" x1={375} y1={60} x2={428} y2={60} markerEnd="url(#a6)" />
        <line className="ln" x1={580} y1={60} x2={633} y2={60} markerEnd="url(#a6)" />
        <text className="lb" x={196} y={22} textAnchor="middle">记录</text>
        <text className="lb" x={402} y={22} textAnchor="middle">每次心跳</text>
        <text className="lb" x={607} y={22} textAnchor="middle">任务单</text>
        <Box x={560} y={150} w={220} h={60} k="disk" t="记忆文件（Markdown）" s="记忆板 + 档案" />
        <Box x={560} y={252} w={220} h={50} k="disk" dash t="git 提交" s="每次改动都能 revert" />
        <line className="ln" x1={707} y1={90} x2={707} y2={148} markerEnd="url(#a6)" />
        <text className="lb" x={715} y={124}>改写</text>
        <line className="ln" x1={670} y1={210} x2={670} y2={250} markerEnd="url(#a6)" />
        <text className="lb" x={678} y={236}>提交</text>
        <path className="ln" d="M560 180 H95 V92" markerEnd="url(#a6)" />
        <text className="lb" x={328} y={172} textAnchor="middle">下一次对话的系统提示带上新版记忆板（写进磁盘即生效）</text>
        <text className="lb" x={20} y={242}>四个出厂分区，由心跳轮流唤醒：</text>
        {parts.map(([n, d], i) => (
          <g key={n}>
            <rect className="bx model" x={20 + i * 130} y={254} width={120} height={46} rx={3} />
            <text className="tt" x={80 + i * 130} y={274} textAnchor="middle">{n}</text>
            <text className="ts" x={80 + i * 130} y={291} textAnchor="middle">{d}</text>
          </g>
        ))}
      </svg>
    </Fig>
  )
}

/* 图 7：谁能从哪个入口控制 daemon */
export function FigDoors() {
  const rows: [number, string, string, string, string, string, boolean][] = [
    [40, 'CLI、渠道适配器', '同一个系统账号下的程序', 'unix socket', '文件权限 0600', '全部方法', false],
    [115, '浏览器、本机其他程序', '', '127.0.0.1:20233', '只读', '6 个只读方法 + dashboard', false],
    [190, '另一台机器', '', '远程监听', '默认关闭；要配地址、口令、端口', '全部方法；每个请求验口令', true],
  ]
  return (
    <Fig caption={<><b>图 7　三个入口的权限由代码分层。</b>能改变 daemon 状态的入口只有 unix socket，由文件权限决定谁能打开。本机网络端口只能读。远程入口默认不存在。</>}>
      <svg viewBox="0 0 800 264" role="img" aria-label="控制 daemon 的三个入口：同一系统账号下的程序经 unix socket 可以调用全部方法；浏览器和本机其他程序经本机 20233 端口只能调用 6 个只读方法和查看 dashboard；另一台机器经远程监听可以调用全部方法，但远程监听默认关闭，并且每个请求都要验证口令。">
        <Arrow id="a7" />
        <rect className="bx none" x={590} y={20} width={195} height={228} rx={3} />
        <text className="tc" x={604} y={18 + 22}>daemon 的控制面</text>
        {rows.map(([y, a, as, d, ds, r, dash]) => (
          <g key={d}>
            <Box x={15} y={y} w={190} h={52} t={a} s={as || undefined} />
            <Box x={290} y={y} w={215} h={52} k="code" dash={dash} t={d} s={ds} />
            <line className={`ln ${dash ? 'dash' : ''}`} x1={205} y1={y + 26} x2={288} y2={y + 26} markerEnd="url(#a7)" />
            <line className={`ln ${dash ? 'dash' : ''}`} x1={505} y1={y + 26} x2={598} y2={y + 26} markerEnd="url(#a7)" />
            <text className="tt" x={606} y={y + 14 + 16} style={{ fontSize: 12 }}>{r}</text>
          </g>
        ))}
      </svg>
    </Fig>
  )
}

/* 图 8：全景 */
export function FigWhole() {
  return (
    <Fig caption={<><b>图 8　六个决定在同一张图上的位置。</b>一个常驻进程管前台和后台。四个引擎是它启动的子进程。两个目录分别存运行数据和 agent 可以修改的设定。圆圈里的数字是推导的编号。</>}>
      <svg viewBox="0 0 820 470" role="img" aria-label="全景图：渠道适配器把消息送进 daemon。daemon 的前台按六步处理消息，后台有 job 扫描器和心跳两套定时器。daemon 调用四个引擎之一。运行数据存在带点的目录里，agent 可以修改的设定和记忆存在不带点的内核 git 仓库里。后台分区会话改写内核里的记忆，记忆板再进入前台的系统提示。">
        <Arrow id="a8" />
        <Box x={20} y={16} w={780} h={44} t="渠道适配器进程：飞书 / 终端 / 编辑器（每个平台一个独立进程）" />
        <line className="ln" x1={200} y1={60} x2={200} y2={98} markerEnd="url(#a8)" />
        <text className="lb" x={208} y={84}>消息</text>
        <line className="ln" x1={430} y1={100} x2={430} y2={62} markerEnd="url(#a8)" />
        <text className="lb" x={438} y={84}>回复</text>
        <rect className="bx none" x={20} y={100} width={570} height={226} rx={3} style={{ stroke: 'var(--code)' }} />
        <text className="tc" x={34} y={122}>daemon（一个常驻进程）</text>
        <text className="lb" x={576} y={122} textAnchor="end">⑥ 边界检查贯穿每一步</text>
        <rect className="bx code" x={36} y={134} width={538} height={82} rx={3} />
        <text className="tt" x={50} y={158}>前台：有人说话时</text>
        <text className="lb" x={560} y={158} textAnchor="end">② 先记录再执行　③ 时间写成文本</text>
        <text className="ts" x={50} y={182} style={{ fill: 'var(--ink)' }}>写日志 → 网关分流 → 邮箱写指针 → 唤醒 actor → 调用引擎 → 回执</text>
        <text className="ts" x={50} y={202}>系统提示（固定六层）+ 每轮瞬时块 + 用户原文</text>
        <rect className="bx code" x={36} y={226} width={538} height={86} rx={3} />
        <text className="tt" x={50} y={250}>后台：没人说话时</text>
        <text className="lb" x={560} y={250} textAnchor="end">④ 两套定时器　⑤ 经验写进文件</text>
        <text className="ts" x={50} y={274} style={{ fill: 'var(--ink)' }}>job 扫描器（每 60 秒）→ 到期的 job → job 会话 → 结果交回 owner</text>
        <text className="ts" x={50} y={296} style={{ fill: 'var(--ink)' }}>心跳（约 37 分钟）→ 只读检查 → 任务单 → 后台分区会话</text>
        <rect className="bx model" x={640} y={100} width={160} height={226} rx={3} />
        <text className="tm" x={654} y={122}>引擎子进程</text>
        <text className="lb" x={786} y={122} textAnchor="end">①</text>
        {['Claude Code', 'Codex', 'Grok', 'pi'].map((e, i) => (
          <g key={e}><rect className="bx" x={656} y={136 + i * 44} width={128} height={34} rx={3} /><text className="tt" x={720} y={158 + i * 44} textAnchor="middle">{e}</text></g>
        ))}
        <line className="ln" x1={590} y1={176} x2={638} y2={176} markerEnd="url(#a8)" />
        <line className="ln" x1={640} y1={266} x2={592} y2={266} markerEnd="url(#a8)" />
        <text className="lb" x={615} y={168} textAnchor="middle">提示</text>
        <text className="lb" x={615} y={258} textAnchor="middle">结果</text>
        <Box x={20} y={372} w={380} h={78} k="disk" t="~/.aladuo　运行数据" s="事件日志 · 会话与邮箱 · job 定义 · 用量账本 · 锁与 socket" />
        <Box x={420} y={372} w={380} h={78} k="disk" t="~/aladuo　内核（git 仓库）" s="渠道人格 · 记忆板与档案 · 后台分区提示词" />
        <line className="ln" x1={200} y1={326} x2={200} y2={370} markerEnd="url(#a8)" />
        <text className="lb" x={208} y={352}>读写</text>
        <line className="ln" x1={720} y1={326} x2={720} y2={370} markerEnd="url(#a8)" />
        <text className="lb" x={712} y={352} textAnchor="end">分区会话改写记忆</text>
        <line className="ln" x1={480} y1={372} x2={480} y2={328} markerEnd="url(#a8)" />
        <text className="lb" x={472} y={352} textAnchor="end">记忆板进入系统提示</text>
      </svg>
    </Fig>
  )
}
