# 07-job-socket 实测结论（@openduo/duoduo v0.8.4，重建 daemon，2026-10-08）

脚本：`scenarios/07-job-socket.sh`。输出：`.build/scenarios/07-job-socket/`。没有调用模型：job 只在 runtime 为 `void`/`codx` 时才到期，到期后在 drain 阶段被拒绝。

**结论：** 只读 TCP 端口以 `-32601` 拒绝 `job.create`，unix socket 上的调用成功。daemon 不校验调用者，日志也不记录调用者。`job.create` 没有 runtime 参数，多传的 `runtime` 字段被忽略，文件里写的是宿主默认引擎，因此经 RPC 创建时 runtime 校验不会生效。job 文件的 runtime 被手工改成 `void` 或 `codx` 后，job 照常被认领和派生，drain 以 `runtime_refused` 拒绝，结算为 never-started，job 保留。

## 被测说法

- **C1（§10.1）**：`job.create` 只接受 id、cron、instruction、owner_session 与 cwd_rel；runtime 填宿主默认引擎，不检查 model 与 acceptance，只追加一条来源为 job 的 job.spawn 审计事件而不派生会话。
- **C2（§10.1）**：创建时校验 id 和调度规则，同一 id 已有活跃 job 时拒绝。
- **C3（§10.1）**：`renderJobFileMarkdown (gut)` 按固定字段顺序写文件；状态文件的初值。
- **C4（§10.2）**：间隔固定为 60 秒，daemon 启动时先扫一次。
- **C5（§10.1/§3.1）**：job 的 runtime 在创建和运行两处由 `validateRunnableRuntimeValue (Wd)` 校验，运行时被拒绝则以 `runtime_refused` 结束。
- **C6（§10.2 第 5 步）**：扫描器追加一条 cadence/job-scanner 来源的 job.spawn。
- **C7（§14.3 第 7 项）**：分区会话的 Bash 能经 socket 调用 `job.create`。
- **C8（§3.1）**：`ALADUO_DEFAULT_RUNTIME=void` 时 daemon 在启动阶段停止。

## 步骤

1. 启动 daemon；经 TCP 调用 `job.create`，再调用 `job.list`。
2. 经 socket 创建 `scn07-far`：调度为 `@in 30d`，owner_session 为不存在的 `nobody:scn07`。
3. 分别提交非法调度 `every tuesday`、重复 id、含 `/` 的 id，以及带多余字段 `runtime:"void"` 的 `scn07-extra`。
4. 调用 `job.list`/`job.get`，保存 job 文件；等待 65 秒，观察第二次扫描；调用 `job.archive` 两次。
5. 创建 `scn07-void`/`scn07-codx`，停止 daemon，把 `runtime:` 改为 `void`/`codx`、`cron:` 改为 `once`，再重新启动。
6. 以 `ALADUO_DEFAULT_RUNTIME=void` 启动。

## 证据

- **TCP**：`{"code":-32601,"message":"Method not available on read-only endpoint"}`，日志为 `[WARN] [daemon] rejected write method on read-only port { method: 'job.create' }`。TCP 上的 `job.list` 在 allowlist 里，返回结果。
- **socket 创建**：返回 `{"id":"scn07-far","cron":"@in 30d"}`。info 级日志只有 `[JobManager] Created job scn07-far { cron: '@in 30d' }`，没有调用者信息。调用链：`createDaemon>R` → `isJobCreateParams` → `resolveDefaultRuntime` → `validateJobScheduleExpression` → `parseScheduleDurationMs` → `assertScheduleDurationRepresentable` → `buildJobSessionKey` → `renderJobFileMarkdown` → `ensureSessionDescriptorAndStateFiles` → `createSpineEvent` → `atomicAppendEvent`。这一阶段没有 `scanAndSpawnDueJobs`，也没有 `spawnJobSession`。
- **拒绝**：三种拒绝都返回 `-32603 Internal error`，理由在 `data`：非法调度 `Job scn07-bad has an unparsable cron schedule "every tuesday": …`；重复 id `Job scn07-far already exists`；含 `/` 的 id `Invalid job id "a/b": a job id is used verbatim as a filename…`。带多余字段 `runtime:"void"` 的请求成功，文件里是 `runtime: "claude"`。
- **定义文件**：frontmatter 只有 `type`、`cron`、`created_at`、`owner_session`、`runtime` 五个字段。状态文件为 `{"last_run_at":null,"last_result":"unknown","run_count":0}`，扫描后不变。同时出现 `workspaces/by-id/scn07-far-<hash>/workspace.json` 和 `var/sessions/<hash>/{meta.md,state.json}`（会话键 `job:scn07-far.2b58528`，没有 mailbox）。事件日志只多一条 `job.spawn`：source 为 `{kind:job,name:scn07-far}`，payload 为 `{job_id,cron}`。
- **扫描器**：`[job-scheduler] started { intervalMs: 60000 }`，启动时调用了 `scanAndSpawnDueJobs` 和 `fireDueWakeRecords`；两次扫描在 trace 中的时间分别是 t=114 ms 和 t=60114 ms。第二次扫描对每个 job 调用 `isOneShotJobSchedule("@in 30d")` 和 `isJobScheduleDue("@in 30d", null, …)`，之后没有派生。
- **归档**：返回 `{"archived":true,"session_key":"job:scn07-far.2b58528","sidecar_orphan_path":null}`。调用链 `moveSessionDirToArchive` → `resolveSessionsArchiveRoot`（目标 `var/sessions-archive`）。文件移到 `var/jobs/archive/`，私有工作目录保留，不写事件。再次归档返回 `-32603`：`Job scn07-far is archived — no longer active.`
- **runtime 被拒绝的 job**：每个 job 的事件依次为 `job.spawn`（来源 cadence/job-scanner，payload 含 `tick`）、`job.spawn`（来源 job，payload 只有 `job_id`，由 `spawnJobSession` 写入）、`agent.result`、`agent.error {"stage":"runtime_refused","error":"Job \"scn07-void\" sets runtime \"void\", which never runs a model, so it cannot run there. …"}`、`job.fail`。codx 的理由是 `…sets runtime "codx", which is not a runtime this duoduo knows. Valid runtimes: …`。状态文件 `last_result: failure`，`run_count: 0`，job 仍在 `active/`。调用链：`spawnJobSession` → `validateRunnableRuntimeValue` → `validateKnownRuntimeValue` → `drainSessionMailbox` → `handleDrainError` → `emitDrainOutputRecords` → `createJobSessionFinalizer`。没有调用任何引擎函数。
- **默认 runtime 为 void**：daemon 没有起来，日志为 `fatal startup error … InvalidRuntimeError: ALADUO_DEFAULT_RUNTIME sets runtime "void"…`，栈为 `resolveDefaultRuntime` ← `main`。

## 判定

| 编号 | 判定 | 理由 |
|---|---|---|
| C1 | confirmed | 多余的 runtime 被忽略，文件写默认引擎；只追加一条审计 job.spawn；不派生。 |
| C2 | confirmed，有补充 | 三项拒绝都成立；拒绝用的是 `-32603`，不是 `-32602`。 |
| C3 | confirmed，有补充 | 字段顺序一致，但只写有值的字段。 |
| C4 | confirmed | 启动时扫一次，60 秒后扫第二次。 |
| C5 | 运行时 confirmed；创建时对 RPC 路径不成立 | RPC 路径上没有创建时的 runtime 校验。 |
| C6 | confirmed，另有一条 | 每次派生写两条 job.spawn，第二条由 spawnJobSession 写入。 |
| C7 | confirmed | 同一用户的任何进程都能经 socket 创建 job，daemon 不记录调用者。 |
| C8 | confirmed | 见启动日志。 |

## 建议写入文档的句子

- **§10.1**：`job.create` 只接受 id、cron、instruction、owner_session 与 cwd_rel（`isJobCreateParams (xR)`）。多传的字段被忽略，`createDaemon (Svt)` 总是把 runtime 填为 `resolveDefaultRuntime (ho)` 的结果，所以经这个方法创建的 job 不会在创建时被 runtime 校验拒绝；它不检查 owner_session 指向的会话是否存在；校验失败时返回 `-32603`，理由在 `data` 字段。
- **§10.1**：`renderJobFileMarkdown (gut)` 只写有值的字段。
- **§10.1 runtime 段**：job 文件的 runtime 被手工改为 `void` 或未知值后，扫描器照常认领并派生，drain 追加 `stage: "runtime_refused"` 的 agent.error，job 保留在 active 目录（`validateRunnableRuntimeValue (Wd)`、`drainSessionMailbox (zxe)`、`createJobSessionFinalizer (fRe)`）。
- **§10.2 第 5 步**：spawnJobSession 再追加一条来源为 job、payload 只有 job_id 的 job.spawn，每次派生在事件日志里有两条 job.spawn。
- **归档**：`job.archive` 由 `moveSessionDirToArchive (Ob)` 把会话目录移到 `var/sessions-archive/`，不追加事件；对已归档的 job 再次归档返回 `-32603`。
- **§14.3 第 7 项改写为 confirmed**：控制面不区分调用者。
