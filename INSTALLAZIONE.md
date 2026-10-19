# Installare miSmash sul bracciale o sull'orologio

**Italiano** · [English](INSTALL.md) · [Español](INSTALACION.md)

Guida per chi vuole installare l'app sul proprio Xiaomi Smart Band o orologio Xiaomi.
L'app non è nello store di Xiaomi: si installa via Bluetooth con **AstroBox**, uno strumento non ufficiale e gratuito.

## Prima di iniziare

- **Un dispositivo compatibile.** Xiaomi Smart Band 9, Smart Band 10, Smart Band 8 Pro, Smart Band 9 Pro, REDMI Watch 5, Xiaomi Watch S1 Pro, H1, S3, S4, S4 Sport, S5.
  Non funziona su orologi Wear OS (es. Xiaomi Watch 2) né su orologi di altre marche.
- **Il dispositivo già associato a Mi Fitness**, con il tuo account Xiaomi.
- **Il file dell'app**, da scaricare nella pagina **[Releases](../../releases/latest)** del progetto. Ce ne sono due, scegline uno:
  - `com.padelscore.band.debug.<versione>.rpk`: l'app usa la lingua del dispositivo (italiano, inglese o spagnolo);
  - `com.padelscore.band.debug.<versione>-it.rpk`: l'app è sempre in italiano.
  Se compili tu il progetto li trovi in `dist/` dopo `npm run build` e `npm run build:it`.
- **AstroBox** su uno di questi:
  - Mac o Linux: `curl -fsSL https://abox.run/install.sh | bash`
  - Windows e telefono Android: scarica l'installer o l'APK da <https://astrobox.online>

> L'app è provata sullo Smart Band 10. Sugli altri modelli la grafica si adatta alla forma dello schermo ma non è ancora stata provata su un dispositivo reale: se qualcosa risulta tagliato o fuori posto, segnalalo.

## Installazione

I nomi dei menu possono cambiare un po' a seconda del telefono o del bracciale.

1. **Chiudi Mi Fitness sul telefono**: Impostazioni → App → Mi Fitness → **Arresto forzato**.
   Il bracciale accetta un solo collegamento alla volta.
2. **In AstroBox accedi all'account Xiaomi**: Impostazioni → Altre impostazioni → Account Xiaomi.
   Usa lo stesso account di Mi Fitness. Se Xiaomi chiede una verifica (SMS o email), completala.
3. **Sul bracciale**: Impostazioni → **Connetti nuovo telefono**, poi conferma con la spunta blu.
   Resta sulla schermata di attesa.
4. **In AstroBox apri l'elenco dispositivi** (la scheda del dispositivo, in alto a sinistra sul computer o in basso sul telefono).
   Scegli il tuo bracciale e accetta l'abbinamento, sia sul bracciale sia sul computer o telefono.
   Se l'elenco resta vuoto, vai a [AstroBox non trova il dispositivo](#astrobox-non-trova-il-dispositivo).
5. **Installa l'app**: trascina il file `.rpk` dentro AstroBox, oppure dalla pagina del dispositivo scegli **Quick app** → **+** e seleziona il file.
6. Al termine l'app **miSmash** (icona con la pallina gialla) compare nell'elenco app del bracciale.
   Aprila: in fondo alla prima schermata c'è il numero di versione (es. `v1.3.1`).
7. **Riapri Mi Fitness** sul telefono, così il bracciale torna a sincronizzarsi come prima.

## Aggiornare

1. Scarica il nuovo `.rpk` da **[Releases](../../releases/latest)** e installalo come la prima volta, sopra quello vecchio: non serve disinstallare.
2. Apri l'app e controlla il numero di versione in fondo alla prima schermata.
3. Se vedi ancora quella vecchia, chiudi l'app, **riavvia il bracciale** e riaprila.
   Se non cambia ancora, il file che hai installato ha lo stesso numero di versione di quello vecchio: serve un `.rpk` con un numero più alto.

## Disinstallare

Dal bracciale l'app non si può togliere: sul Band 10 non c'è l'opzione nell'elenco app.
Non abbiamo trovato istruzioni ufficiali; prova dalla pagina del dispositivo in AstroBox, nella sezione Quick app.

## AstroBox non trova il dispositivo

Con gli account Xiaomi registrati **fuori dalla Cina** (ad esempio in Europa), AstroBox accede all'account ma non importa i dispositivi: l'elenco resta vuoto.
È un problema noto di AstroBox ([segnalazione #96](https://github.com/AstralSightStudios/AstroBox-Public/issues/96)): cerca i dispositivi solo sui server cinesi di Xiaomi.

Si risolve collegando il bracciale con la sua **Authkey**, una chiave di 32 caratteri che Mi Fitness scrive nei suoi log.
Questo metodo richiede un **telefono Android** e un computer.

### 1. Attiva il debug USB sul telefono

1. Impostazioni → Info sul telefono → tocca 7 volte **Numero build** (sugli Xiaomi: **Versione HyperOS/MIUI**) finché compare "Sei uno sviluppatore".
2. Impostazioni → Opzioni sviluppatore → attiva **Debug USB**.

### 2. Installa adb sul computer

- Mac: `brew install --cask android-platform-tools`
- Windows: scarica "SDK Platform-Tools" da <https://developer.android.com/tools/releases/platform-tools> ed estrai la cartella
- Linux: `sudo apt install adb` (o il pacchetto equivalente della tua distribuzione)

### 3. Leggi la chiave

1. Apri Mi Fitness e aspetta che si colleghi al bracciale, così il log è aggiornato.
2. Collega il telefono al computer con un cavo dati e, sul telefono, accetta **Consenti debug USB**.
3. Controlla che il telefono sia visto: `adb devices` deve mostrare una riga che finisce con `device`.
4. Cerca la chiave nei log:

   ```bash
   adb shell 'cat /sdcard/Android/data/com.xiaomi.wearable/files/log/*.log* | grep -oE "(encryptKey|authKey|token)[\":= ]+[[:xdigit:]]{32}" | grep -oE "[[:xdigit:]]{32}$" | sort | uniq -c'
   ```

   Il risultato è una o più righe con un numero (quante volte compare) e la chiave di 32 caratteri, ad esempio:

   ```
   50 0123456789abcdef0123456789abcdef
   ```

   Se compaiono più chiavi, hai più dispositivi Xiaomi o hai riassociato il bracciale: quella giusta è la più recente.
   Per sapere a quale dispositivo appartiene una chiave, cerca il nome del modello nella stessa riga del log:

   ```bash
   adb shell 'grep -h "<chiave>" /sdcard/Android/data/com.xiaomi.wearable/files/log/*.log* | head -1' | grep -oE '"(name|model)": ?"[^"]*"'
   ```

5. Se non trova niente, il log è stato sovrascritto: apri Mi Fitness, aspetta la sincronizzazione e riprova.

La chiave cambia ogni volta che riassoci il bracciale a Mi Fitness. In quel caso va letta di nuovo.
Tienila per te: permette di collegarsi al tuo bracciale.

### 4. Collegati con la chiave

1. In AstroBox **esci dall'account Xiaomi**, altrimenti continua a provare a importare i dispositivi.
   Se AstroBox si blocca, chiudilo e cancella il file delle credenziali Xiaomi:
   - Mac: `~/Library/Application Support/moe.astralsight.astrobox/accounts/xiaomi_credentials_v1.json`
   - Windows: `%APPDATA%\moe.astralsight.astrobox\accounts\xiaomi_credentials_v1.json`
2. Forza l'arresto di Mi Fitness e, sul bracciale, scegli di nuovo **Connetti nuovo telefono**.
3. In AstroBox apri l'elenco dispositivi, scegli il bracciale, incolla l'**Authkey** e premi **Connetti**.
4. Riprendi dal passo 5 dell'[installazione](#installazione).

## Problemi frequenti

- **Il bracciale non compare nella ricerca**: controlla che Mi Fitness sia davvero chiuso (arresto forzato) e che il bracciale sia sulla schermata "Connetti nuovo telefono".
- **Su iPhone l'abbinamento fallisce con "TargetRejected"**: Impostazioni → Bluetooth → tocca la (i) accanto al bracciale → **Dissocia**, poi riprova.
- **Dopo l'installazione il bracciale non si sincronizza più con il telefono**: riapri Mi Fitness e aspetta che si ricolleghi.
- **Dopo un aggiornamento l'app sembra uguale a prima**: vedi [Aggiornare](#aggiornare).

Guida ufficiale di AstroBox: <https://abox.run/docs/usage>

Se l'app ti piace, puoi [offrirmi un caffè](https://www.paypal.com/qrcodes/p2pqrc/QNC3L2PQG7LHG) ☕
