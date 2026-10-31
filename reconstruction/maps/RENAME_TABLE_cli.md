# duoduo 首字符还原：符号名映射表（cli）

下表把 esbuild `--minify` 后的短标识符映射回**真实原名**。名字来源：`__export()` 助手保留的导出符号名（权威）+ 少量逆向推断的内部函数名（标注 *inferred*；其中标注 *published source* 的名字是上游在同作者的公开源码包里的拼写，由 `maps/published_cli.json` 记录；标注 *historical export* 的名字是上游在旧版本 `__export` 块里的拼写，经版本配对追到本版本，由 `maps/historical_cli.json` 记录）。“原行号”指反混淆后的 `cli.pretty.js`。

共 67 个一等公民符号，覆盖 1 个子系统。基于 `@openduo/duoduo` v0.8.7。

## all

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `mc` | `resolveHostEnvFilePath` | inferred | 2539 |
| `e3` | `readDaemonTokenFromEnvFile` | inferred | 2645 |
| `t3` | `writeDaemonTokenToEnvFile` | inferred | 2657 |
| `Gm` | `initCliHostEnvKeysModule` | inferred | 2690 |
| `_3` | `resolveRestartReasonFilePath` | inferred | 2778 |
| `h3` | `writeRestartReasonFile` | inferred | 2781 |
| `C3` | `clearOwnRestartReasonFile` | inferred | 2784 |
| `IF` | `isAquaSession` | __export | 23972 |
| `SF` | `plistPath` | __export | 23976 |
| `j_` | `getUid` | __export | 23979 |
| `tZ` | `generatePlist` | __export | 23998 |
| `$_` | `isServiceLoaded` | __export | 24031 |
| `Hf` | `getLaunchdPid` | __export | 24039 |
| `TF` | `installAndLoad` | __export | 24054 |
| `yF` | `kickstart` | __export | 24065 |
| `r1` | `unload` | __export | 24069 |
| `DF` | `uninstall` | __export | 24075 |
| `MB` | `PLIST_LABEL` | __export | 24080 |
| `U4e` | `generateDaemonTokenHex` | inferred | 24500 |
| `AZ` | `createDaemonToken` | inferred | 24503 |
| `QF` | `restartDaemonWithReason` | inferred | 24514 |
| `lZ` | `notifyRestartWakeTargets` | inferred | 24554 |
| `PB` | `defaultCallerVerdict` | __export | 24974 |
| `n8e` | `runSessionSubcommand` | __export | 24980 |
| `bZ` | `sessionHelpText` | inferred | 25027 |
| `o8e` | `renderSessionMainColumn` | inferred | 25081 |
| `kZ` | `renderSessionList` | __export | 25085 |
| `FZ` | `parseAliasArgs` | __export | 25179 |
| `c8e` | `runSessionAliasCommand` | inferred | 25207 |
| `d8e` | `runSessionNotifyCommand` | inferred | 25322 |
| `UZ` | `renderCompactResult` | __export | 25561 |
| `PZ` | `renderConfigResult` | __export | 25933 |
| `N9` | `jobHelp` | __export | 67576 |
| `Ome` | `parseJobCli` | __export | 67581 |
| `wme` | `renderJobList` | __export | 67678 |
| `Lme` | `renderJobRead` | __export | 67687 |
| `Mme` | `renderInterruptReceipt` | __export | 67707 |
| `xme` | `renderRpcError` | __export | 67718 |
| `Int` | `runJobSubcommand` | __export | 67730 |
| `Tnt` | `runPromptsSubcommand` | __export | 67945 |
| `oit` | `runMemoryCommand` | __export | 69943 |
| `_it` | `runSpineCommand` | __export | 70567 |
| `z_e` | `parseSpineArgs` | __export | 70596 |
| `j_e` | `executeSpine` | __export | 70605 |
| `Cit` | `spineParamsToArgs` | __export | 70613 |
| `IT` | `SpineCommandError` | __export | 71039 |
| `zR` | `createStdioDaemonClient` | inferred | 76109 |
| `Git` | `isInstallTargetFilePath` | __export | 77833 |
| `Hit` | `parseRootCli` | __export | 77837 |
| `ghe` | `defaultExistingDaemonChoice` | __export | 77885 |
| `Yit` | `parseExistingDaemonChoice` | __export | 77889 |
| `Vit` | `inferOnboardConfigFromProbe` | __export | 77894 |
| `TT` | `readOption` | __export | 77903 |
| `qit` | `readCliPackageVersion` | __export | 77934 |
| `Ehe` | `printHelp` | __export | 77938 |
| `Jit` | `parseRestartArgs` | __export | 78060 |
| `zit` | `reasonlessRestartRefusal` | __export | 78092 |
| `jit` | `restartWakeReport` | __export | 78098 |
| `$it` | `isDetachedUpgradeWorker` | __export | 78115 |
| `eot` | `parseUpgradeArgs` | __export | 78318 |
| `tot` | `runUpgradeChannelPhase` | __export | 78344 |
| `not` | `runUpgradeCommand` | inferred | 78427 |
| `rot` | `runChannelCommand` | inferred | 78546 |
| `iot` | `channelVerbInSession` | __export | 78720 |
| `oot` | `renderChannelNotInstalled` | __export | 78724 |
| `lhe` | `runDeclaredChannelVerb` | __export | 78727 |
| `sot` | `main` | __export | 78737 |
