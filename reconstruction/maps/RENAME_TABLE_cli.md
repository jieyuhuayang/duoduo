# duoduo 首字符还原：符号名映射表（cli）

下表把 esbuild `--minify` 后的短标识符映射回**真实原名**。名字来源：`__export()` 助手保留的导出符号名（权威）+ 少量逆向推断的内部函数名（标注 *inferred*）。“原行号”指反混淆后的 `cli.pretty.js`。

共 40 个一等公民符号，覆盖 1 个子系统。基于 `@openduo/duoduo` v0.8.3。

## all

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `tk` | `isAquaSession` | __export | 20735 |
| `nk` | `plistPath` | __export | 20739 |
| `b_` | `getUid` | __export | 20742 |
| `_J` | `generatePlist` | __export | 20761 |
| `D_` | `isServiceLoaded` | __export | 20794 |
| `vp` | `getLaunchdPid` | __export | 20802 |
| `rk` | `installAndLoad` | __export | 20817 |
| `ik` | `kickstart` | __export | 20828 |
| `y1` | `unload` | __export | 20832 |
| `ok` | `uninstall` | __export | 20838 |
| `qb` | `PLIST_LABEL` | __export | 20843 |
| `y$e` | `runSessionSubcommand` | __export | 62573 |
| `Yge` | `renderSessionList` | __export | 62674 |
| `Vge` | `renderCompactResult` | __export | 63120 |
| `qge` | `renderConfigResult` | __export | 63490 |
| `nU` | `jobHelp` | __export | 63630 |
| `Kge` | `parseJobCli` | __export | 63635 |
| `$ge` | `renderJobList` | __export | 63732 |
| `Jge` | `renderJobRead` | __export | 63741 |
| `jge` | `renderInterruptReceipt` | __export | 63761 |
| `Xge` | `renderRpcError` | __export | 63772 |
| `nJe` | `runJobSubcommand` | __export | 63784 |
| `iJe` | `runPromptsSubcommand` | __export | 63999 |
| `Uje` | `runMemoryCommand` | __export | 65997 |
| `Zje` | `runSpineCommand` | __export | 66617 |
| `hXe` | `isInstallTargetFilePath` | __export | 74469 |
| `CXe` | `parseRootCli` | __export | 74473 |
| `REe` | `defaultExistingDaemonChoice` | __export | 74521 |
| `SXe` | `parseExistingDaemonChoice` | __export | 74525 |
| `TXe` | `inferOnboardConfigFromProbe` | __export | 74530 |
| `tv` | `readOption` | __export | 74539 |
| `yXe` | `readCliPackageVersion` | __export | 74570 |
| `bEe` | `printHelp` | __export | 74574 |
| `bXe` | `parseRestartArgs` | __export | 74696 |
| `DXe` | `reasonlessRestartRefusal` | __export | 74728 |
| `NXe` | `restartWakeReport` | __export | 74734 |
| `vXe` | `isDetachedUpgradeWorker` | __export | 74751 |
| `wXe` | `parseUpgradeArgs` | __export | 74949 |
| `xXe` | `runUpgradeChannelPhase` | __export | 74975 |
| `QXe` | `main` | __export | 75300 |
