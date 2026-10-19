# Installing miSmash on your band or watch

[Italiano](INSTALLAZIONE.md) · **English** · [Español](INSTALACION.md)

A guide for anyone who wants to install the app on their Xiaomi Smart Band or Xiaomi watch.
The app is not in Xiaomi's store: it is installed over Bluetooth with **AstroBox**, a free, unofficial tool.

## Before you start

- **A compatible device.** Xiaomi Smart Band 9, Smart Band 10, Smart Band 8 Pro, Smart Band 9 Pro, REDMI Watch 5, Xiaomi Watch S1 Pro, H1, S3, S4, S4 Sport, S5.
  It does not work on Wear OS watches (e.g. Xiaomi Watch 2) or on watches of other brands.
- **The device already paired with Mi Fitness**, with your Xiaomi account.
- **The app file**, from the project's **[Releases](../../releases/latest)** page. There are two, pick one:
  - `com.padelscore.band.debug.<version>.rpk`: the app uses the device language (Italian, English or Spanish);
  - `com.padelscore.band.debug.<version>-it.rpk`: the app is always in Italian.
  If you build the project yourself you'll find them in `dist/` after `npm run build` and `npm run build:it`.
- **AstroBox** on one of these:
  - Mac or Linux: `curl -fsSL https://abox.run/install.sh | bash`
  - Windows and Android phone: download the installer or the APK from <https://astrobox.online>

> The app is tested on the Smart Band 10. On the other models the layout adapts to the screen shape but has not been tested on a real device yet: if something looks cut off or out of place, please report it.

## Installation

The menu names below may be worded slightly differently on your phone or band.

1. **Close Mi Fitness on the phone**: Settings → Apps → Mi Fitness → **Force stop**.
   The band accepts only one connection at a time.
2. **In AstroBox sign in to your Xiaomi account**: Settings → More settings → Xiaomi account.
   Use the same account as Mi Fitness. If Xiaomi asks for a verification (SMS or email), complete it.
3. **On the band**: Settings → **Connect new phone**, then confirm with the blue tick.
   Stay on the waiting screen.
4. **In AstroBox open the device list** (the device card, top left on the computer or at the bottom on the phone).
   Pick your band and accept the pairing, both on the band and on the computer or phone.
   If the list stays empty, go to [AstroBox can't find the device](#astrobox-cant-find-the-device).
5. **Install the app**: drag the `.rpk` file into AstroBox, or from the device page choose **Quick app** → **+** and select the file.
6. When it's done, the **miSmash** app (yellow ball icon) appears in the band's app list.
   Open it: the version number is at the bottom of the first screen (e.g. `v1.3.1`).
7. **Open Mi Fitness again** on the phone, so the band goes back to syncing as before.

## Updating

1. Download the new `.rpk` from **[Releases](../../releases/latest)** and install it like the first time, over the old one: no need to uninstall.
2. Open the app and check the version number at the bottom of the first screen.
3. If you still see the old one, close the app, **restart the band** and open it again.
   If it still doesn't change, the file you installed has the same version number as the old one: you need an `.rpk` with a higher number.

## Uninstalling

The app can't be removed from the band itself: the Band 10 has no such option in the app list.
We haven't found official instructions; try the device page in AstroBox, in the Quick app section.

## AstroBox can't find the device

With Xiaomi accounts registered **outside China** (for example in Europe), AstroBox signs in but doesn't import the devices: the list stays empty.
It's a known AstroBox issue ([issue #96](https://github.com/AstralSightStudios/AstroBox-Public/issues/96)): it only looks for devices on Xiaomi's Chinese servers.

The fix is to connect the band with its **Authkey**, a 32-character key that Mi Fitness writes in its logs.
This method needs an **Android phone** and a computer.

### 1. Turn on USB debugging on the phone

1. Settings → About phone → tap **Build number** 7 times (on Xiaomi phones: **HyperOS/MIUI version**) until "You are now a developer" appears.
2. Settings → Developer options → turn on **USB debugging**.

### 2. Install adb on the computer

- Mac: `brew install --cask android-platform-tools`
- Windows: download "SDK Platform-Tools" from <https://developer.android.com/tools/releases/platform-tools> and extract the folder
- Linux: `sudo apt install adb` (or your distribution's equivalent package)

### 3. Read the key

1. Open Mi Fitness and wait until it connects to the band, so the log is up to date.
2. Connect the phone to the computer with a data cable and, on the phone, accept **Allow USB debugging**.
3. Check that the phone is detected: `adb devices` must show a line ending with `device`.
4. Look for the key in the logs:

   ```bash
   adb shell 'cat /sdcard/Android/data/com.xiaomi.wearable/files/log/*.log* | grep -oE "(encryptKey|authKey|token)[\":= ]+[[:xdigit:]]{32}" | grep -oE "[[:xdigit:]]{32}$" | sort | uniq -c'
   ```

   The result is one or more lines with a number (how many times it appears) and the 32-character key, for example:

   ```
   50 0123456789abcdef0123456789abcdef
   ```

   If there are several keys, you have more than one Xiaomi device or you paired the band again: the right one is the most recent.
   To find out which device a key belongs to, look for the model name on the same log line:

   ```bash
   adb shell 'grep -h "<key>" /sdcard/Android/data/com.xiaomi.wearable/files/log/*.log* | head -1' | grep -oE '"(name|model)": ?"[^"]*"'
   ```

5. If nothing is found, the log has been overwritten: open Mi Fitness, wait for it to sync and try again.

The key changes every time you pair the band with Mi Fitness again. In that case you need to read it again.
Keep it to yourself: it lets anyone connect to your band.

### 4. Connect with the key

1. In AstroBox **sign out of the Xiaomi account**, otherwise it keeps trying to import the devices.
   If AstroBox freezes, close it and delete the Xiaomi credentials file:
   - Mac: `~/Library/Application Support/moe.astralsight.astrobox/accounts/xiaomi_credentials_v1.json`
   - Windows: `%APPDATA%\moe.astralsight.astrobox\accounts\xiaomi_credentials_v1.json`
2. Force stop Mi Fitness and, on the band, choose **Connect new phone** again.
3. In AstroBox open the device list, pick the band, paste the **Authkey** and press **Connect**.
4. Continue from step 5 of the [installation](#installation).

## Common problems

- **The band doesn't show up in the search**: make sure Mi Fitness is really closed (force stop) and the band is on the "Connect new phone" screen.
- **On iPhone pairing fails with "TargetRejected"**: Settings → Bluetooth → tap the (i) next to the band → **Forget This Device**, then try again.
- **After installing, the band no longer syncs with the phone**: open Mi Fitness again and wait for it to reconnect.
- **After an update the app looks the same as before**: see [Updating](#updating).

AstroBox official guide: <https://abox.run/docs/usage>

If you like the app, you can [buy me a coffee](https://www.paypal.com/qrcodes/p2pqrc/QNC3L2PQG7LHG) ☕
