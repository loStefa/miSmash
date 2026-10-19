# Instalar miSmash en la pulsera o el reloj

[Italiano](INSTALLAZIONE.md) · [English](INSTALL.md) · **Español**

Guía para quien quiera instalar la app en su Xiaomi Smart Band o reloj Xiaomi.
La app no está en la tienda de Xiaomi: se instala por Bluetooth con **AstroBox**, una herramienta gratuita y no oficial.

## Antes de empezar

- **Un dispositivo compatible.** Xiaomi Smart Band 9, Smart Band 10, Smart Band 8 Pro, Smart Band 9 Pro, REDMI Watch 5, Xiaomi Watch S1 Pro, H1, S3, S4, S4 Sport, S5.
  No funciona en relojes Wear OS (p. ej. Xiaomi Watch 2) ni en relojes de otras marcas.
- **El dispositivo ya vinculado a Mi Fitness**, con tu cuenta Xiaomi.
- **El archivo de la app**, en la página **[Releases](../../releases/latest)** del proyecto. Hay dos, elige uno:
  - `com.padelscore.band.debug.<versión>.rpk`: la app usa el idioma del dispositivo (italiano, inglés o español);
  - `com.padelscore.band.debug.<versión>-it.rpk`: la app está siempre en italiano.
  Si compilas tú el proyecto los encuentras en `dist/` después de `npm run build` y `npm run build:it`.
- **AstroBox** en uno de estos:
  - Mac o Linux: `curl -fsSL https://abox.run/install.sh | bash`
  - Windows y teléfono Android: descarga el instalador o el APK desde <https://astrobox.online>

> La app está probada en la Smart Band 10. En los demás modelos el diseño se adapta a la forma de la pantalla pero todavía no se ha probado en un dispositivo real: si algo sale cortado o descolocado, avísame.

## Instalación

Los nombres de los menús pueden variar un poco según el teléfono o la pulsera.

1. **Cierra Mi Fitness en el teléfono**: Ajustes → Aplicaciones → Mi Fitness → **Forzar detención**.
   La pulsera solo acepta una conexión a la vez.
2. **En AstroBox inicia sesión con tu cuenta Xiaomi**: Settings → More settings → Xiaomi account.
   Usa la misma cuenta que en Mi Fitness. Si Xiaomi pide una verificación (SMS o email), complétala.
3. **En la pulsera**: Ajustes → **Conectar nuevo teléfono**, y confirma con la marca azul.
   Quédate en la pantalla de espera.
4. **En AstroBox abre la lista de dispositivos** (la tarjeta del dispositivo, arriba a la izquierda en el ordenador o abajo en el teléfono).
   Elige tu pulsera y acepta la vinculación, tanto en la pulsera como en el ordenador o el teléfono.
   Si la lista se queda vacía, ve a [AstroBox no encuentra el dispositivo](#astrobox-no-encuentra-el-dispositivo).
5. **Instala la app**: arrastra el archivo `.rpk` a AstroBox, o desde la página del dispositivo elige **Quick app** → **+** y selecciona el archivo.
6. Al terminar, la app **miSmash** (icono con la pelota amarilla) aparece en la lista de apps de la pulsera.
   Ábrela: abajo en la primera pantalla aparece el número de versión (p. ej. `v1.3.1`).
7. **Vuelve a abrir Mi Fitness** en el teléfono, para que la pulsera siga sincronizándose como antes.

## Actualizar

1. Descarga el nuevo `.rpk` desde **[Releases](../../releases/latest)** e instálalo como la primera vez, encima del antiguo: no hace falta desinstalar.
2. Abre la app y comprueba el número de versión abajo en la primera pantalla.
3. Si sigue apareciendo el antiguo, cierra la app, **reinicia la pulsera** y vuelve a abrirla.
   Si aun así no cambia, el archivo que has instalado tiene el mismo número de versión que el antiguo: hace falta un `.rpk` con un número más alto.

## Desinstalar

La app no se puede quitar desde la pulsera: en la Band 10 no existe esa opción en la lista de apps.
No hemos encontrado instrucciones oficiales; prueba desde la página del dispositivo en AstroBox, en la sección Quick app.

## AstroBox no encuentra el dispositivo

Con las cuentas Xiaomi registradas **fuera de China** (por ejemplo en Europa), AstroBox inicia sesión pero no importa los dispositivos: la lista se queda vacía.
Es un problema conocido de AstroBox ([incidencia #96](https://github.com/AstralSightStudios/AstroBox-Public/issues/96)): solo busca los dispositivos en los servidores chinos de Xiaomi.

Se soluciona conectando la pulsera con su **Authkey**, una clave de 32 caracteres que Mi Fitness escribe en sus registros.
Este método necesita un **teléfono Android** y un ordenador.

### 1. Activa la depuración USB en el teléfono

1. Ajustes → Información del teléfono → toca 7 veces **Número de compilación** (en los Xiaomi: **Versión de HyperOS/MIUI**) hasta que aparezca "Ya eres desarrollador".
2. Ajustes → Opciones de desarrollador → activa **Depuración USB**.

### 2. Instala adb en el ordenador

- Mac: `brew install --cask android-platform-tools`
- Windows: descarga "SDK Platform-Tools" desde <https://developer.android.com/tools/releases/platform-tools> y extrae la carpeta
- Linux: `sudo apt install adb` (o el paquete equivalente de tu distribución)

### 3. Lee la clave

1. Abre Mi Fitness y espera a que se conecte a la pulsera, para que el registro esté actualizado.
2. Conecta el teléfono al ordenador con un cable de datos y, en el teléfono, acepta **Permitir depuración USB**.
3. Comprueba que el teléfono se detecta: `adb devices` debe mostrar una línea que termina en `device`.
4. Busca la clave en los registros:

   ```bash
   adb shell 'cat /sdcard/Android/data/com.xiaomi.wearable/files/log/*.log* | grep -oE "(encryptKey|authKey|token)[\":= ]+[[:xdigit:]]{32}" | grep -oE "[[:xdigit:]]{32}$" | sort | uniq -c'
   ```

   El resultado son una o más líneas con un número (cuántas veces aparece) y la clave de 32 caracteres, por ejemplo:

   ```
   50 0123456789abcdef0123456789abcdef
   ```

   Si aparecen varias claves, tienes más de un dispositivo Xiaomi o has vuelto a vincular la pulsera: la buena es la más reciente.
   Para saber a qué dispositivo pertenece una clave, busca el nombre del modelo en la misma línea del registro:

   ```bash
   adb shell 'grep -h "<clave>" /sdcard/Android/data/com.xiaomi.wearable/files/log/*.log* | head -1' | grep -oE '"(name|model)": ?"[^"]*"'
   ```

5. Si no encuentra nada, el registro se ha sobrescrito: abre Mi Fitness, espera a que sincronice y vuelve a intentarlo.

La clave cambia cada vez que vuelves a vincular la pulsera con Mi Fitness. En ese caso hay que leerla otra vez.
No la compartas: permite conectarse a tu pulsera.

### 4. Conéctate con la clave

1. En AstroBox **cierra la sesión de la cuenta Xiaomi**, si no seguirá intentando importar los dispositivos.
   Si AstroBox se bloquea, ciérralo y borra el archivo de credenciales de Xiaomi:
   - Mac: `~/Library/Application Support/moe.astralsight.astrobox/accounts/xiaomi_credentials_v1.json`
   - Windows: `%APPDATA%\moe.astralsight.astrobox\accounts\xiaomi_credentials_v1.json`
2. Fuerza la detención de Mi Fitness y, en la pulsera, elige otra vez **Conectar nuevo teléfono**.
3. En AstroBox abre la lista de dispositivos, elige la pulsera, pega la **Authkey** y pulsa **Connect**.
4. Sigue desde el paso 5 de la [instalación](#instalación).

## Problemas frecuentes

- **La pulsera no aparece en la búsqueda**: comprueba que Mi Fitness esté realmente cerrado (forzar detención) y que la pulsera esté en la pantalla "Conectar nuevo teléfono".
- **En iPhone la vinculación falla con "TargetRejected"**: Ajustes → Bluetooth → toca la (i) junto a la pulsera → **Omitir dispositivo**, y vuelve a intentarlo.
- **Después de instalar, la pulsera ya no se sincroniza con el teléfono**: vuelve a abrir Mi Fitness y espera a que se reconecte.
- **Después de una actualización la app parece igual que antes**: ver [Actualizar](#actualizar).

Guía oficial de AstroBox: <https://abox.run/docs/usage>

Si te gusta la app, puedes [invitarme a un café](https://www.paypal.com/qrcodes/p2pqrc/QNC3L2PQG7LHG) ☕
