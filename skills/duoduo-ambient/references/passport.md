# The Passport: pairing and using it

The FoloToy AI Passport running pocket firmware is a push-to-talk accessory of the 多多随身 app:
hold OK and speak, the phone sends one voice note per press, and the latest answer appears on the
Passport's screen. Read this at `SKILL.md` step 7, or when the owner asks about the device.
Source: [openduo/pocket-passport](https://github.com/openduo/pocket-passport) (`docs/pocket/README.md`)
and the phone side in [openduo/pocket-ios](https://github.com/openduo/pocket-ios)
(`docs/ble-protocol.md`). Flashing the firmware is not this skill's work.

Contents:

- Pair
- Use
- Settings on the device
- Re-pair
- Troubleshooting

## Pair

The link is BLE with LE Secure Connections, bonding and numeric comparison. There is no PIN to
type.

1. In the app: onboarding step 3, or the device chip at the top right, 添加 Passport / Add
   Passport. The app scans; the Passport advertises as `DuoDuo Pocket XXXX` (the last two bytes of
   its Bluetooth address).
2. Pick the device. iOS shows a pairing alert with a number, and the Passport shows a number.
3. If the numbers match: press OK on the Passport first, then 配对 / Pair on the iPhone. DOWN on
   the Passport rejects.
4. The chip shows the battery and the sheet shows 已连接 · 加密配对 (connected, encrypted pairing).

The Passport accepts pairing while it has no bond, or when its bonded phone re-pairs. It keeps the
bond across reboots and deep sleep.

## Use

| Input                               | Action                                                                                       |
| ----------------------------------- | -------------------------------------------------------------------------------------------- |
| Hold OK (at least 300 ms)           | Talk; release sends. Shorter taps are ignored                                                |
| OK while the phone is not connected | Nothing is recorded; the screen says the phone is not connected                              |
| UP / DOWN                           | Scroll the shown reply a page; at the top or bottom, step to the older or newer stored reply |
| Long-press UP                       | Open or close settings                                                                       |
| OK while the screen is dark         | Lights the screen and starts the press at once                                               |

After a press: the transcript shows with a working label (received, thinking, looking it up),
then the answer replaces it. The same exchange appears in the app's conversation. Answers longer
than the link's 4096-byte message limit are cut on the Passport with a note that the full text is
on the phone.

- A new answer lights the screen and plays a short tone, once per answer, including answers the
  phone forwards without a press. Both alerts have their own setting.
- Replies are stored on the device and survive reboot and deep sleep.
- The Passport's UI language follows the phone's app language (Simplified Chinese or English).
  Text from 多多 is shown as sent.
- The phone must have the app running or able to wake in the background for the Passport to work:
  the Passport talks only to the phone, and the phone talks to the channel.

## Settings on the device

Long-press UP. Rows: pre-roll, brightness, screen off, deep sleep, new-reply screen, new-reply
tone, re-pair.

| Setting                          | Values                            | Notes                                                                                                                  |
| -------------------------------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Screen off                       | 15 s, 30 s (default), 60 s, never | The BLE link stays up while the screen is dark                                                                         |
| Deep sleep                       | 30 min, 1 h (default), 4 h, never | After no event for that long. The link drops; any key boots it again, and that press only reconnects, it never records |
| Pre-roll                         | on / off                          | Keeps the last 320 ms before the press while the screen is lit                                                         |
| New-reply screen, new-reply tone | on (default) / off                | The alerts above                                                                                                       |
| Re-pair                          | —                                 | Deletes the bond and the stored replies, then waits for pairing                                                        |

## Re-pair

When the Passport and the phone no longer connect after a change (a new phone, a reset device):

1. On the iPhone: Settings › Bluetooth, forget the Passport.
2. On the Passport: long-press UP, re-pair.
3. In the app: the device chip, then 重新配对 / Pair Again, and confirm the number as above.

忘记此设备 / Forget This Device in the app only makes the app look for a device again; the iOS
pairing record must still be removed in Settings › Bluetooth.

## Troubleshooting

| The app or device shows                | Meaning and fix                                                                                            |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| 未配对 / Not paired                    | No Passport paired yet: pair it                                                                            |
| 未连接, "靠近手机会自动连上"           | Out of range or asleep. Bring it close; press a key to wake it from deep sleep                             |
| 版本不匹配 (version mismatch), on both | The app and firmware speak different link major versions. Update whichever is older (app or firmware repo) |
| 蓝牙已关闭，Passport 连不上            | Bluetooth is off or not allowed for the app                                                                |
| Pairing never shows a number           | A previously paired record on either side: re-pair as above                                                |
| The press records but no answer comes  | The phone cannot reach the channel: open the app and check its banner ([pocket-app.md](pocket-app.md))     |
| Battery shows, charging shows unknown  | Expected: the board has no charge-status signal                                                            |

To hand a problem to a developer: 导出 Passport 日志 in the Passport sheet shares the app, tsnet and
Passport logs.
