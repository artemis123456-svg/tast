# DOCUMENTACIÓN PARA DISTRIBUCIÓN COMERCIAL
## EL TAST TPV - SOFTWARE DE PUNTO DE VENTA PARA WINDOWS

Esta guía documenta los pasos necesarios para empaquetar, compilar y preparar el software **El Tast TPV** en un formato instalable comercial autónomo para plataformas **Windows 10** y **Windows 11**, distribuible mediante pendrive USB sin necesidad de que el cliente final disponga de conocimientos técnicos.

---

## 1. REQUISITOS DEL SISTEMA (CLIENTE FINAL)

El hardware de cobro (terminal TPV o PC táctil) del cliente final debe cumplir con las siguientes especificaciones técnicas mínimas:

*   **Sistema Operativo:** Windows 10 (64-bit) versión 1903 o superior, o Windows 11.
*   **Procesador:** Intel Celeron J4125 / AMD Athlon Gold (mínimo) | Intel Core i3 / Ryzen 3 (recomendado para fluidez de animación).
*   **Memoria RAM:** 4 GB DDR4 (mínimo) | 8 GB DDR4 (recomendado).
*   **Almacenamiento:** 500 MB de espacio disponible en disco sólido SSD. *(Es crucial usar SSD para garantizar que la base de datos local JSON escriba de forma instantánea sin latencias de disco mecánico).*
*   **Pantalla:** Resolución mínima de **1024x768** píxeles (Recomendado **1920x1080** Full HD) con soporte táctil capacitivo.
*   **Componentes de Runtime:** 
    1.  **Microsoft WebView2 Runtime** (Requerido para que la interfaz web de React compile en la ventana nativa mediante Tauri/Electron. El instalador provisto abajo lo detectará e instalará automáticamente).
    2.  **Microsoft Visual C++ Redistributable 2015-2022** (Para la ejecución nativa de dependencias del motor gráfico y de base de datos local).

---

## 2. GUÍA DE COMPILACIÓN DE CÓDIGO (DEVELOPER)

Sigue estos pasos en tu máquina de desarrollo para compilar la aplicación React y el servidor Express unificado:

### Paso 2.1: Instalación de Dependencias de Compilación
Asegúrate de tener instalado [Node.js v18 o superior](https://nodejs.org/) y ejecuta el comando de instalación en la raíz del proyecto para descargar las librerías de empaquetado:

```bash
# Instalar dependencias base de la aplicación
npm install

# Instalar los empaquetadores del entorno de escritorio (en caso de no estar preconfigurados)
npm install --save-dev electron electron-builder
```

### Paso 2.2: Construcción de Recursos Unificados
Para compilar la interfaz de usuario en producción (archivos estáticos optimizados en la carpeta `dist/`) y empaquetar el servidor de base de datos y lógica Express en un único archivo CJS robusto, ejecuta:

```bash
npm run build
```

Este comando ejecuta de forma secuencial:
1.  La optimización de componentes React mediante **Vite**.
2.  La consolidación del servidor Express TypeScript en un único bundle inmutable ubicado en `dist/server.cjs` a través de **Esbuild**.

---

## 3. GUÍA PARA CREAR EL INSTALADOR PROFESIONAL (.EXE)

Hemos configurado la aplicación con **Electron Builder** para automatizar por completo el proceso de creación de un instalador nativo de Windows mediante la tecnología de instalación silenciosa **NSIS**.

### Paso 3.1: Configuración de la Identidad Visual
Los iconos de la aplicación se encuentran en `public/favicon.ico`. El instalador NSIS usará automáticamente este archivo para:
*   El icono del archivo `.exe` del propio instalador.
*   El icono del acceso directo en el Escritorio.
*   El icono en el Menú Inicio de Windows.
*   La imagen mostrada en la pantalla de "Agregar o quitar programas" del panel de control de Windows.

### Paso 3.2: Generar el Instalador de Windows
Ejecuta el siguiente comando en tu consola para iniciar el empaquetado del instalador:

```bash
npm run dist:win
```

Este proceso:
1.  Compila los binarios nativos de Windows correspondientes a la arquitectura del sistema (x64).
2.  Crea un instalador único en la carpeta `/distribucion/` denominado `El Tast TPV Setup 1.0.0.exe`.
3.  **Compresión NSIS:** Comprime todos los componentes (Frontend React + Backend Node.js Server + Base de datos vacía semilla) en un único ejecutable auto-extraíble de aproximadamente 60-70 MB.

---

## 4. MODO OFFLINE AUTOMÁTICO Y SINCRONIZACIÓN

La aplicación se comporta de forma híbrida e inteligente para tolerar fallos totales de red o funcionar en entornos 100% aislados:

1.  **Ejecución Local de Datos:** El instalador monta un servidor backend local integrado dentro de la propia aplicación que corre en `localhost:3000`. Esto significa que el almacenamiento físico en disco (`data/db.json`) ocurre localmente y **no requiere de internet para el cobro, comanda, facturación legal o emisión de reportes**.
2.  **Cola de Comandas Offline:** Si un camarero comanda desde un dispositivo móvil de red y el router del establecimiento se apaga o pierde el enlace wifi, el frontend intercepta el fallo de inmediato:
    *   Registra el pedido en una cola de memoria interna local (`localStorage` robusto mediante la librería `/src/lib/offlineSync.ts`).
    *   Muestra una advertencia flotante amarilla no bloqueante indicando: **"🛜 CONEXIÓN OFFLINE: El pedido se ha guardado localmente."**
    *   El cajero o camarero puede seguir cobrando y operando sin detención.
3.  **Sincronización Silenciosa:** Un script supervisor interroga continuamente al canal WebSocket y la red `navigator.onLine`. En el instante en que el router de red se reconecta o el servidor vuelve a responder, el software procesa de forma secuencial todas las comandas en cola, deduciendo stock y actualizando estadísticas sin pérdida de información ni duplicados.

---

## 5. COPIAS DE SEGURIDAD (DISASTER RECOVERY)

Para cumplir con las exigencias del soporte comercial, se ha implementado un sistema inmutable de recuperación ante desastres:

*   **Copias Automáticas:** Cada vez que el administrador realiza una modificación de tarifas, o de manera programada en el cliente, el sistema genera un snapshot inmutable en formato `.json` denominado `backup_YYYY-MM-DD-HH-mm-ss.json` en la carpeta física `/data`.
*   **Restauración con un Clic:** Desde el menú **⚙️ Oficina > Copias de Seguridad**, el operario técnico puede visualizar el listado cronológico de instantáneas. Al pulsar **Restaurar**, la aplicación sobrescribe el archivo semilla `db.json` de manera atómica, reconecta los WebSockets y recarga el navegador de forma transparente para volver al estado seleccionado sin reiniciar la máquina física.

---

## 6. GUÍA PARA CREAR EL PENDRIVE DE INSTALACIÓN COMERCIAL

Para distribuir el software comercialmente mediante un pendrive USB de instalación autónoma y "cero clics adicionales", estructura el almacenamiento del USB de la siguiente manera:

### Estructura de Carpetas del USB:
```text
[Raíz del Pendrive USB]
 │
 ├── 1_INSTALADOR_TPV.exe (Renombrar "El Tast TPV Setup 1.0.0.exe")
 ├── 2_MANUAL_USUARIO.pdf (Manual de usuario final)
 │
 └── [Soporte_Tecnico]
      ├── MicrosoftEdgeWebview2Setup.exe (Instalador offline de WebView2)
      ├── VC_redist.x64.exe (Microsoft Visual C++ 2015-2022 Redistributable)
      └── LEEME_SOPORTE.txt (Instrucciones rápidas para técnicos de campo)
```

### Paso 6.1: Descarga de Requisitos Offline
Para garantizar que el instalador funcione en locales comerciales donde **no hay conexión a Internet en absoluto durante la instalación**, descarga previamente los siguientes componentes de instalación silenciosa offline de Microsoft y cópialos en la carpeta `Soporte_Tecnico`:

1.  **WebView2 Runtime Evergreen Standalone Installer:** Descargar el instalador x64 independiente desde el [Portal Oficial de Microsoft Edge WebView2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/).
2.  **VC++ Redistributable x64:** Descargar el instalador `VC_redist.x64.exe` desde el portal de descargas de soporte de Microsoft.

### Paso 6.2: Automatización de Arranque del Pendrive (Opcional)
Puedes incluir un script de PowerShell o un archivo de procesamiento por lotes `instalar.bat` en la raíz del USB para realizar una pre-instalación automatizada con un doble clic:

```bat
:: instalar.bat
@echo off
title Instalador Automatizado El Tast TPV
echo =======================================================
echo INSTALANDO REQUISITOS DEL SISTEMA (Modo Silencioso)...
echo =======================================================
echo 1. Instalando Microsoft Visual C++...
start /wait "" "%~dp0Soporte_Tecnico\VC_redist.x64.exe" /q /norestart
echo 2. Instalando Microsoft WebView2 Runtime...
start /wait "" "%~dp0Soporte_Tecnico\MicrosoftEdgeWebview2Setup.exe" /silent /install
echo =======================================================
echo INSTALANDO SOFTWARE EL TAST TPV...
echo =======================================================
start /wait "" "%~dp01_INSTALADOR_TPV.exe"
echo Instalación finalizada correctamente. Puede retirar el Pendrive USB.
pause
```

---

## 7. MANUAL TÉCNICO DE MANTENIMIENTO Y SOPORTE DE CAMPO

### Localización Física de Archivos de Datos (Windows)
*   **Base de datos local (JSON semilla):** `%USERPROFILE%\AppData\Local\TouchFlowPOS\data\db.json` (o dentro de la ruta local de instalación de la aplicación según la configuración de Electron-builder).
*   **Reportes de Cierre de Caja Diarios y PDFs oficiales:** `%USERPROFILE%\AppData\Local\TouchFlowPOS\Reportes\`
*   **Historial de Logs Técnicos:** `%USERPROFILE%\AppData\Local\TouchFlowPOS\Logs\tpv-desktop.log`

### Procedimiento ante fallos comunes:

#### 1. "La pantalla se queda en negro o muestra 'No se puede conectar a http://localhost:3000'"
*   **Causa:** El puerto 3000 está ocupado por otro software en la red local o el antivirus ha bloqueado el proceso Express.
*   **Solución:**
    1. Abre la consola de comandos de Windows (cmd) como administrador y ejecuta: `netstat -ano | findstr :3000`. Si hay un proceso activo, mátalo con `taskkill /PID <ID_PROCESO> /F`.
    2. Comprueba el log técnico en `%USERPROFILE%\AppData\Local\TouchFlowPOS\Logs\tpv-desktop.log` para ver si hay errores de sintaxis en el archivo `db.json` (por ejemplo, si se cortó la energía de golpe mientras escribía el archivo JSON). Si el archivo se corrompió, copia el backup más reciente ubicado en la misma carpeta renombrándolo a `db.json`.

#### 2. "La aplicación no responde a los gestos de zoom táctiles o el tamaño del texto es demasiado pequeño"
*   **Solución:** Se ha desactivado el zoom por defecto en la cabecera HTML para que se comporte como una pantalla nativa sin zoom accidental. Si necesitas calibrar la resolución o escala en un terminal pequeño de 10 pulgadas:
    *   Haz clic derecho en el escritorio de Windows > **Configuración de pantalla**.
    *   En la sección de **Escala y distribución**, ajusta el valor de la escala a 100% o 125% para aumentar la densidad de botones del TPV.

#### 3. "La impresora térmica de tickets USB no responde"
*   **Solución:** Abre la sección **⚙️ Oficina > Configuración de Tickets e Impresoras**. Asegúrate de que el nombre de la impresora seleccionada coincida exactamente con el nombre asignado en el panel de control de Windows (ej. "Generic / Text Only" o "POS-80"). El backend del software redirigirá la orden de impresión mediante los comandos nativos configurados.

---
**El Tast S.L. - Soluciones Tecnológicas de Hostelería**  
*Documento de Ingeniería de Software para Distribución de Equipamiento POS (2026).*
