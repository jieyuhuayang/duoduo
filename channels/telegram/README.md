# duoduo-channel-telegram

这是 duoduo 的 Telegram 渠道适配器，非官方，与 openduo 无关。它让你在 Telegram 私聊里和 duoduo 对话：每个私聊是一个 duoduo 渠道会话，会话键为 `telegram:<chat_id>`，回复由 duoduo 的引擎（Claude、Codex、Grok 或 pi）生成，带 duoduo 的系统提示、记忆板和工作目录，和飞书、stdio 会话没有区别。

适配器是一个 Node 脚本（`plugin.mjs`），没有任何依赖，只要 Node 20.3 或更新版本。它经 `duoduo channel install` 安装，由 duoduo CLI 启停。

| 能做 | 不能做（这一版） |
|---|---|
| 私聊收发文字，长回复自动拆成多条 | 群聊：群里的消息一律忽略 |
| 收图片、文件、语音、视频，交给会话（存进工作目录的 `inbox/`） | 让模型发文件给你（原因见“设计决定”） |
| `/status`、`/clear`、`/model`、`/compact` 等 duoduo 命令 | 流式输出：回复在一轮结束后整条到达 |
| 只接受白名单里的 Telegram 用户 | Markdown 渲染：回复按纯文本发送 |
| 适配器或 daemon 重启后不丢消息、不重复发送 | |

## 安装

1. 在 Telegram 里找 @BotFather，发送 `/newbot`，记下它给的 bot token。
2. 查自己的数字 user id。一种办法是问 @userinfobot。另一种办法是第 3 步先把 `TELEGRAM_ALLOW_FROM` 填成 `0`，启动后给 bot 发一条消息，适配器日志会打印 `ignored message from user <id>`；把这个 id 填回 `.env`，再 `stop` 和 `start` 渠道。
3. 在 `~/.config/duoduo/.env` 里加入下面几行（文件权限保持 0600）：

   ```
   TELEGRAM_BOT_TOKEN=<BotFather 给的 token>
   TELEGRAM_ALLOW_FROM=<你的 user id>
   ```

   如果这台机器要经代理才能访问 `api.telegram.org`，再加一行（需要 Node 24.5 或更新版本）：

   ```
   TELEGRAM_PROXY=http://127.0.0.1:7897
   ```

   不要用 `HTTPS_PROXY` 代替它。daemon 启动时也读这个 `.env`，写进去的 `HTTPS_PROXY` 会在下次 daemon 重启后作用到 daemon 和它启动的引擎进程，让模型流量也走代理。`TELEGRAM_PROXY` 只作用于适配器发往 Telegram 的请求。

4. 打包并安装（在本目录执行）：

   ```bash
   npm pack
   ```

   ```bash
   duoduo channel install --from-path ./duoduo-channel-telegram-0.1.0.tgz
   ```

5. 启动并检查：

   ```bash
   duoduo channel telegram start
   ```

   ```bash
   duoduo channel telegram logs
   ```

   日志里出现 `connected to Telegram as @<bot 名>` 和 `daemon reachable` 就说明两端都连上了。在 Telegram 里给 bot 发 `/start`，再发一句话。

6. 如果 daemon 由 systemd 管理，在 unit 里 feishu 那两行旁边加上同样的两行，让 Telegram 渠道随开机启动、随服务停止：

   ```
   ExecStart=<duoduo 路径> channel telegram start
   ExecStop=-<duoduo 路径> channel telegram stop
   ```

   然后执行 `systemctl --user daemon-reload`。

安装时 CLI 把包里的 `config/telegram.md` 复制到内核的 `config/telegram.md`，已存在时不覆盖。这个文件是 Telegram 渠道的种类配置：正文是给模型的渠道提示（回复用纯文本、适合手机阅读），frontmatter 可以写 `new_session_workspace`、`runtime` 等键，格式与 `config/stdio.md` 相同。不写 `new_session_workspace` 时，会话的工作目录是 daemon 的 `work_dir`。

升级适配器：重新 `npm pack` 和 `install`，然后 `duoduo channel telegram stop` 再 `start`。`install` 不会重启正在运行的进程。

## 环境变量

| 变量 | 必需 | 默认值 | 作用 |
|---|---|---|---|
| `TELEGRAM_BOT_TOKEN` | 是 | — | bot token。缺失时适配器以退出码 2 结束 |
| `TELEGRAM_ALLOW_FROM` | 是 | — | 允许的 Telegram user id，逗号或空格分隔。为空时适配器拒绝启动 |
| `TELEGRAM_STATE_DIR` | 否 | `~/.cache/telegram-channel` | 状态文件 `state.json` 所在目录：Telegram 的 offset 和已知会话列表 |
| `TELEGRAM_OUTBOX_POLL_MS` | 否 | `1500` | 活跃会话拉取回复的间隔（毫秒）；30 分钟没有消息的会话每 10 秒拉一次 |
| `TELEGRAM_API_BASE` | 否 | `https://api.telegram.org` | Bot API 地址；测试时指向假服务，也可以指向自建的反向代理 |
| `TELEGRAM_PROXY` | 否 | — | HTTP 代理地址，例如 `http://127.0.0.1:7897`。只用于发往 Telegram 的请求，发往 daemon 的请求总是直连。需要 Node 24.5 或更新版本（按 agent 设置代理的 `proxyEnv` 选项），版本不够时适配器拒绝启动 |
| `TELEGRAM_LOG_LEVEL` | 否 | `info` | `debug`、`info`、`warn`、`error` |

这些变量都列在 `package.json` 的 `aladuo.channel.envAllowlist` 里。CLI 启动适配器时只传白名单里的变量，没列进去的变量写在 `.env` 里也传不进来。日志不打印 token，也不打印消息正文，只打印 chat id、消息 id 和字数。

## 工作原理

```
Telegram ──getUpdates(长轮询)──▶ 适配器 ──channel.file.upload──▶ daemon（附件存入 inbox/）
                                       ──channel.ingress──────▶ daemon（写事件日志，唤醒会话）

daemon ──channel.pull(HTTP，每 1.5 s)──▶ 适配器 ──sendMessage──▶ Telegram
       ◀──channel.ack(Telegram 接受之后)──
```

入站方向，适配器用 `getUpdates` 长轮询收消息。白名单之外的用户和非私聊的消息只记日志，不送进 daemon。私聊消息的附件先下载，再经 `channel.file.upload` 存进 daemon 工作目录的 `inbox/`。然后适配器调用 `channel.ingress`，`source_kind` 是 `telegram`，`channel_id` 是 `telegram-<chat_id>`，幂等键是 `telegram:<chat_id>:<message_id>`。daemon 接受之后，适配器才把 Telegram 的 offset 推进并写入状态文件。

出站方向，适配器为每个已知会话定期调用 HTTP 上的 `channel.pull`，消费者 id 是 `telegram-gw`。每条出站记录发到 Telegram 成功之后，适配器调用 `channel.ack` 提交游标。等待回复期间，适配器每 4.5 秒发一次“正在输入”状态，最长 10 分钟。

两个方向都是“至少一次”投递。daemon 不可达时，offset 不推进，Telegram 会把消息再给一次；如果 daemon 其实已经收下了，幂等键让它不会写第二次。Telegram 发送失败时，游标不推进，下一轮会重发。代价是极少数情况下（一条长回复发到一半时网络断开）同一段文字会收到两次。Telegram 明确拒绝的记录（4xx，例如 bot 被你屏蔽）记一条错误日志后丢弃，不阻塞后面的消息。

## 设计决定

**出站用 HTTP 轮询，不用 WebSocket 订阅。** 官方飞书适配器为每个会话开一条 WebSocket，由 daemon 推送回复，可以显示流式输出。这里选择轮询，原因有两个：`duoduo channel install` 只解压安装包、不安装依赖，而 Node 内置的 WebSocket 客户端连不了 unix socket；只用 `node:http` 就能完成全部调用，适配器因此没有依赖。代价有三个：

1. 回复最多晚 1.5 秒到达（可用 `TELEGRAM_OUTBOX_POLL_MS` 调小）。
2. 看不到流式输出和工具调用过程，只收到每轮的最终回复。
3. 模型发不出文件。daemon 只在 WebSocket 订阅时记录渠道声明的 `accept_mime`，没有声明的渠道，附件工具一律拒绝发送（依据：daemon 代码中 `channel.pull` 只在 WebSocket 分支调用 `recordChannelCapabilityDeclaration`）。记录里如果本来就带附件（例如网关回复），适配器会用 `sendDocument` 发出。

**会话按 chat 划分，不在适配器里另建会话表。** 会话键 `telegram:<chat_id>` 由 chat id 直接算出，适配器重启后靠状态文件里的会话列表继续拉取，没送达的回复由 daemon 的出站记录保存。

## 测试

`test/e2e.sh` 起一个隔离的 duoduo daemon（独立 HOME、端口和 socket）、一个假 Telegram 服务（`test/fake-telegram.mjs`），经 CLI 安装并启动适配器，然后检查 19 项行为，包括代理、白名单、命令、附件、去重、长文本拆分、适配器重启和 daemon 掉线。测试里 Telegram 的地址是一个解析不了的主机名，假服务同时充当 `TELEGRAM_PROXY`，所以每个 Telegram 请求都只能经代理到达。测试把种类配置设为 `runtime: void`，所以不调用任何模型：每条消息的文字原样作为出站记录回来，`/status` 由 daemon 网关直接回答，两者走的都是模型回复走的同一条 `channel.pull` 路径。

```bash
npm install --prefix /tmp/duoduo-pkg @openduo/duoduo@0.8.8
```

```bash
PKG=/tmp/duoduo-pkg/node_modules/@openduo/duoduo/dist/release bash test/e2e.sh
```

`PKG` 必须是单独安装的副本，不要指向全局安装：正在运行的 daemon 用的是全局那一份。

测试没有覆盖两件事：真实的 Telegram 服务器，以及一轮真正调用模型的对话。
