# duoduo 首字符还原：符号名映射表（cli）

下表把 esbuild `--minify` 后的短标识符映射回**真实原名**。名字来源：`__export()` 助手保留的导出符号名（权威）+ 少量逆向推断的内部函数名（标注 *inferred*）。“原行号”指反混淆后的 `cli.pretty.js`。

共 46 个一等公民符号，覆盖 1 个子系统。基于 `@openduo/duoduo` v0.8.4。

## all

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `sk` | `isAquaSession` | __export | 20755 |
| `ak` | `plistPath` | __export | 20759 |
| `b_` | `getUid` | __export | 20762 |
| `yJ` | `generatePlist` | __export | 20781 |
| `D_` | `isServiceLoaded` | __export | 20814 |
| `Op` | `getLaunchdPid` | __export | 20822 |
| `lk` | `installAndLoad` | __export | 20837 |
| `ck` | `kickstart` | __export | 20848 |
| `I1` | `unload` | __export | 20852 |
| `uk` | `uninstall` | __export | 20858 |
| `$b` | `PLIST_LABEL` | __export | 20863 |
| `K$e` | `runSessionSubcommand` | __export | 62659 |
| `jge` | `renderSessionList` | __export | 62760 |
| `Xge` | `renderCompactResult` | __export | 63210 |
| `Zge` | `renderConfigResult` | __export | 63582 |
| `lU` | `jobHelp` | __export | 63723 |
| `npe` | `parseJobCli` | __export | 63728 |
| `rpe` | `renderJobList` | __export | 63825 |
| `ipe` | `renderJobRead` | __export | 63834 |
| `ope` | `renderInterruptReceipt` | __export | 63854 |
| `spe` | `renderRpcError` | __export | 63865 |
| `DJe` | `runJobSubcommand` | __export | 63877 |
| `vJe` | `runPromptsSubcommand` | __export | 64092 |
| `dXe` | `runMemoryCommand` | __export | 66090 |
| `IXe` | `runSpineCommand` | __export | 66714 |
| `hEe` | `parseSpineArgs` | __export | 66743 |
| `SEe` | `executeSpine` | __export | 66752 |
| `bXe` | `spineParamsToArgs` | __export | 66760 |
| `YT` | `SpineCommandError` | __export | 67186 |
| `zXe` | `isInstallTargetFilePath` | __export | 74651 |
| `KXe` | `parseRootCli` | __export | 74655 |
| `FEe` | `defaultExistingDaemonChoice` | __export | 74703 |
| `$Xe` | `parseExistingDaemonChoice` | __export | 74707 |
| `JXe` | `inferOnboardConfigFromProbe` | __export | 74712 |
| `tv` | `readOption` | __export | 74721 |
| `jXe` | `readCliPackageVersion` | __export | 74752 |
| `PEe` | `printHelp` | __export | 74756 |
| `eZe` | `parseRestartArgs` | __export | 74878 |
| `tZe` | `reasonlessRestartRefusal` | __export | 74910 |
| `nZe` | `restartWakeReport` | __export | 74916 |
| `rZe` | `isDetachedUpgradeWorker` | __export | 74933 |
| `sZe` | `parseUpgradeArgs` | __export | 75131 |
| `aZe` | `runUpgradeChannelPhase` | __export | 75157 |
| `uZe` | `renderChannelNotInstalled` | __export | 75508 |
| `MEe` | `runDeclaredChannelVerb` | __export | 75511 |
| `dZe` | `main` | __export | 75520 |
