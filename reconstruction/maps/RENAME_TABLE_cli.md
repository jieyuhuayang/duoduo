# duoduo 首字符还原：符号名映射表（cli）

下表把 esbuild `--minify` 后的短标识符映射回**真实原名**。名字来源：`__export()` 助手保留的导出符号名（权威）+ 少量逆向推断的内部函数名（标注 *inferred*；其中标注 *published source* 的名字是上游在同作者的公开源码包里的拼写，由 `maps/published_cli.json` 记录；标注 *historical export* 的名字是上游在旧版本 `__export` 块里的拼写，经版本配对追到本版本，由 `maps/historical_cli.json` 记录）。“原行号”指反混淆后的 `cli.pretty.js`。

共 79 个一等公民符号，覆盖 1 个子系统。基于 `@openduo/duoduo` v0.8.9。

## all

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `_c` | `resolveHostEnvFilePath` | inferred | 2539 |
| `m3` | `readDaemonTokenFromEnvFile` | inferred | 2645 |
| `_3` | `writeDaemonTokenToEnvFile` | inferred | 2657 |
| `Ym` | `initCliHostEnvKeysModule` | inferred | 2690 |
| `M3` | `resolveRestartReasonFilePath` | inferred | 2778 |
| `x3` | `writeRestartReasonFile` | inferred | 2781 |
| `k3` | `clearOwnRestartReasonFile` | inferred | 2784 |
| `FB` | `plistPath` | __export | 24162 |
| `Z_` | `getUid` | __export | 24165 |
| `UB` | `plistProgramArgumentsFor` | __export | 24184 |
| `TZ` | `generatePlist` | __export | 24200 |
| `PB` | `resolveLauncherBundle` | __export | 24230 |
| `LF` | `plistProgramArguments` | __export | 24245 |
| `MF` | `withProgramArguments` | __export | 24250 |
| `xF` | `installedPlist` | __export | 24253 |
| `ku` | `isServiceLoaded` | __export | 24260 |
| `Wf` | `getLaunchdPid` | __export | 24268 |
| `kF` | `installAndLoad` | __export | 24283 |
| `GB` | `loadPlist` | __export | 24286 |
| `FF` | `kickstart` | __export | 24315 |
| `s1` | `unload` | __export | 24319 |
| `UF` | `uninstall` | __export | 24325 |
| `kB` | `PLIST_LABEL` | __export | 24330 |
| `R8e` | `generateDaemonTokenHex` | inferred | 24778 |
| `wZ` | `createDaemonToken` | inferred | 24781 |
| `VF` | `restartDaemonWithReason` | inferred | 24792 |
| `LZ` | `notifyRestartWakeTargets` | inferred | 24838 |
| `WB` | `defaultCallerVerdict` | __export | 25258 |
| `q8e` | `runSessionSubcommand` | __export | 25264 |
| `eee` | `sessionHelpText` | inferred | 25311 |
| `J8e` | `renderSessionMainColumn` | inferred | 25365 |
| `Aee` | `renderSessionList` | __export | 25369 |
| `lee` | `parseAliasArgs` | __export | 25463 |
| `Z8e` | `runSessionAliasCommand` | inferred | 25491 |
| `tYe` | `runSessionNotifyCommand` | inferred | 25606 |
| `cee` | `renderCompactResult` | __export | 25845 |
| `uee` | `renderConfigResult` | __export | 26217 |
| `G9` | `jobHelp` | __export | 67880 |
| `r_e` | `parseJobCli` | __export | 67885 |
| `i_e` | `renderJobList` | __export | 67982 |
| `o_e` | `renderJobRead` | __export | 67991 |
| `s_e` | `renderInterruptReceipt` | __export | 68011 |
| `hb` | `renderRpcError` | __export | 68022 |
| `grt` | `runJobSubcommand` | __export | 68034 |
| `Y9` | `dashboardHelp` | __export | 68119 |
| `c_e` | `parseDashboardCli` | __export | 68124 |
| `d_e` | `renderShare` | __export | 68179 |
| `g_e` | `renderStatus` | __export | 68184 |
| `E_e` | `renderStop` | __export | 68190 |
| `Ert` | `runDashboardSubcommand` | __export | 68195 |
| `prt` | `runPromptsSubcommand` | __export | 68366 |
| `Xit` | `runMemoryCommand` | __export | 70364 |
| `uot` | `runSpineCommand` | __export | 70988 |
| `Bhe` | `parseSpineArgs` | __export | 71017 |
| `Rhe` | `executeSpine` | __export | 71026 |
| `got` | `spineParamsToArgs` | __export | 71034 |
| `DT` | `SpineCommandError` | __export | 71460 |
| `e0` | `createStdioDaemonClient` | inferred | 76539 |
| `Lot` | `isInstallTargetFilePath` | __export | 78263 |
| `Mot` | `parseRootCli` | __export | 78267 |
| `qhe` | `defaultExistingDaemonChoice` | __export | 78318 |
| `xot` | `parseExistingDaemonChoice` | __export | 78322 |
| `kot` | `inferOnboardConfigFromProbe` | __export | 78327 |
| `BT` | `readOption` | __export | 78336 |
| `Fot` | `readCliPackageVersion` | __export | 78367 |
| `Whe` | `printHelp` | __export | 78371 |
| `Got` | `parseRestartArgs` | __export | 78493 |
| `Hot` | `reasonlessRestartRefusal` | __export | 78525 |
| `Yot` | `restartWakeReport` | __export | 78531 |
| `Vot` | `isDetachedUpgradeWorker` | __export | 78549 |
| `qot` | `isDetachedRestartWorker` | __export | 78553 |
| `Jot` | `parseUpgradeArgs` | __export | 78784 |
| `zot` | `runUpgradeChannelPhase` | __export | 78810 |
| `$ot` | `runUpgradeCommand` | inferred | 78893 |
| `jot` | `runChannelCommand` | inferred | 79012 |
| `Xot` | `channelVerbInSession` | __export | 79186 |
| `Zot` | `renderChannelNotInstalled` | __export | 79190 |
| `Ghe` | `runDeclaredChannelVerb` | __export | 79193 |
| `est` | `main` | __export | 79203 |
