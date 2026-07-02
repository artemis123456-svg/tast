# Manual de Distribución y Despliegue en Windows: Tast TPV
**Autor:** Senior Software Architect
**Cliente:** Verini  
**Producto:** Tast TPV  
**Versión:** 1.0.0  
**Fecha:** Julio de 2026  

---

## 1. Análisis Arquitectónico y Selección de Tecnología

Al auditar la base de código actual, detectamos la presencia de configuraciones tanto para **Tauri** como para **Electron**. Para la distribución en entornos reales de producción (TPV de restauración), la decisión de ingeniería óptima es utilizar **Electron**.

### Justificación de Ingeniería: Electron vs Tauri
1. **Soporte de Backend Express Unificado:** Tast TPV utiliza un servidor local robusto basado en Node.js Express (`server.ts` compilado a CommonJS en `dist/server.cjs`) para gestionar la base de datos local SQLite/JSON (`db.json`), flujos de WebSocket de baja latencia con Socket.IO para terminales móviles de camareros, caché de imágenes locales optimizadas mediante Sharp y generación en tiempo real de tickets de caja en PDF mediante PDFKit.
2. **Limitaciones Críticas de Tauri:** Tauri es un marco basado en Rust. Para ejecutar un servidor de Node.js, requiere empaquetar un binario "sidecar" de Node.js. Esto es sumamente frágil en sistemas operativos Windows embebidos o cerrados de cajas registradoras, genera problemas de empaquetado y dependencias externas ausentes y aumenta el tamaño de runtime debido a la duplicidad de hilos de ejecución.
3. **Ventajas de Electron:** Electron ejecuta un motor Node.js nativo en su proceso principal. Esto permite realizar un `fork` nativo y limpio del archivo `server.cjs` compilado de manera aislada, reutilizando el puerto TCP 3000 de forma local. No requiere un runtime de Node.js instalado en la máquina de destino, ofrece compatibilidad offline garantizada y permite integrar llamadas nativas del sistema operativo de manera uniforme.

---

## 2. Preparación y Estructura de Datos (Seguridad contra Pérdidas)

Para garantizar la estabilidad operativa del TPV de **EL TAST** y evitar que las actualizaciones de software borren los datos de venta de los clientes, la persistencia se ha desacoplado del directorio de instalación del programa:

* **Directorio de Ejecutables (Solo Lectura):** `C:\Program Files\Tast TPV` o el elegido por el usuario.
* **Directorio de Datos Persistentes (Lectura y Escritura):** Se localiza en la carpeta de AppData protegida del perfil de usuario de Windows:
  `%APPDATA%\Tast TPV\` (que resuelve a `C:\Users\<Usuario>\AppData\Roaming\Tast TPV`).
  
En este directorio se almacenan automáticamente y de manera aislada:
* Base de datos JSON: `%APPDATA%\Tast TPV\data\db.json`
* Caché de imágenes: `%APPDATA%\Tast TPV\data\image-cache.json`
* Galería de imágenes de productos: `%APPDATA%\Tast TPV\data\images\`
* Reportes en PDF y cierres de caja: `%APPDATA%\Tast TPV\Reportes\`
* Registros de depuración del terminal: `%APPDATA%\Tast TPV\Logs\tpv-desktop.log`

> **Nota:** Desinstalar o actualizar **Tast TPV** preservará intacta la carpeta de datos de AppData, salvaguardando la información histórica de ventas de la cafetería.

---

## 3. Comportamiento en Primera Ejecución (Zero-Config)

Si el sistema detecta que es el primer inicio del programa (es decir, no existe el archivo `db.json` en AppData), el backend inicializará automáticamente el entorno sin mostrar molestos asistentes de configuración:
* **Nombre de la Empresa:** Preconfigurado como **EL TAST**.
* **IVA por defecto:** Configurado al **10%** (estándar de hostelería en España).
* **Idioma:** Español con textos predefinidos para la impresión de tickets de caja (ej. "¡Gracias por su visita!", "Impresora Térmica 80mm", etc.).

---

## 4. Dependencias del Entorno Windows

El instalador ha sido diseñado para gestionar y notificar las siguientes dependencias de sistema necesarias para Windows:

1. **Microsoft Edge WebView2 Runtime (Requerido):** Es el motor utilizado por Electron/Chromium para renderizar la interfaz web moderna en Windows 10 y 11. Normalmente viene preinstalado en sistemas Windows actualizados.
2. **Microsoft Visual C++ Redistributable 2015-2022 (Requerido):** Necesario para las librerías nativas como `sharp` (compresión de imágenes en el servidor).
3. **Drivers de Impresora POS de 80mm:** Para la comunicación con la impresora térmica mediante el puerto USB preconfigurado (`USB001`).

---

## 5. Instrucciones de Compilación y Generación del Instalador

Sigue estos pasos en la consola de comandos dentro de la raíz de la aplicación para generar los archivos distribuibles en una máquina Windows:

### Paso 1: Instalar dependencias del proyecto
```bash
npm install
```

### Paso 2: Compilar el código fuente (Frontend y Backend)
Este paso genera la aplicación de React y compila el backend `server.ts` en un bundle optimizado de CommonJS (`dist/server.cjs`):
```bash
npm run build
```

### Paso 3: Empaquetar y construir los ejecutables de Windows
Ejecuta el empaquetador de Electron Builder. Este compilará los activos y generará el instalador final en el directorio `/distribucion`:
```bash
npm run dist:win
```

### Resultados Generados en `/distribucion`:
* **`TastTPV.exe`:** El ejecutable directo empaquetado de la aplicación.
* **`TastTPV_Setup.exe`:** El instalador profesional listo para entregar al cliente.

---

## 6. Configuración del Instalador (NSIS)

La configuración de empaquetado definida en `package.json` incluye las siguientes características de grado industrial:
* **Instalación no intrusiva:** Permite al usuario elegir el directorio de destino y muestra una interfaz clara.
* **Iconos Corporativos:** Utiliza el icono oficial en el instalador, desinstalador y accesos directos.
* **Acceso Directo en Escritorio:** Crea automáticamente un acceso directo en el escritorio para el operario de caja.
* **Acceso en el Menú Inicio:** Registra la aplicación bajo el menú Inicio con el nombre "Tast TPV".
* **Desinstalador Completo:** Añade una entrada limpia en el "Panel de Control > Agregar o quitar programas" para permitir una desinstalación total y segura que no deja basura en el sistema de archivos del cliente.
* **Ejecución al Finalizar:** Ofrece una casilla para lanzar automáticamente **Tast TPV** inmediatamente al terminar el asistente de instalación.

---

## 7. Protocolo de Pruebas en el Terminal de Destino

Antes de entregar el terminal de cobro a los operarios de **EL TAST**, el técnico de campo debe realizar el siguiente checklist de control:

1. **Instalación Limpia:**
   * Ejecuta `TastTPV_Setup.exe` en la máquina TPV de destino.
   * Verifica que se cree el acceso directo en el escritorio con el icono correcto.
   * Permite que el instalador inicie la aplicación de forma automática.
2. **Verificación de Primera Ejecución:**
   * Abre los ajustes del TPV en la interfaz y comprueba que el nombre del negocio muestre **EL TAST**.
   * Comprueba que los productos iniciales de muestra (Entrepans Freds, Calents, Begudes, etc.) se carguen correctamente.
3. **Prueba de Red Local (Terminal de Camarero):**
   * Conecta una tablet o móvil de camarero a la misma red Wi-Fi del TPV principal.
   * Accede desde la tablet a la IP local del TPV (ej. `http://192.168.1.100:3000`).
   * Realiza un pedido de prueba y comprueba que se reciba instantáneamente en la cola de cocina del TPV principal en tiempo real.
4. **Prueba de Persistencia ante Actualizaciones:**
   * Agrega un producto personalizado o camarero en la base de datos de administración.
   * Cierra el programa.
   * Desinstala el programa desde el Panel de Control de Windows.
   * Vuelve a instalarlo utilizando `TastTPV_Setup.exe`.
   * Verifica que el producto personalizado y el historial de ventas sigan apareciendo intactos (lo cual demuestra el funcionamiento del directorio de AppData desacoplado).

---

## 8. Creación del USB de Instalación para Técnicos de Campo

Para facilitar el despliegue físico por parte de los técnicos de **Verini** sin depender de una conexión a Internet, se debe preparar un lápiz de memoria USB autoejecutable.

### Estructura de Carpetas del USB
Formatea una unidad USB en formato **FAT32** o **NTFS** con la etiqueta `TAST_TPV` y monta la siguiente estructura:

```text
TAST_TPV/ (Raíz de la unidad USB)
│
├── 1_Instalador/
│   └── TastTPV_Setup.exe                   <-- El archivo de instalación generado
│
├── 2_Dependencias/
│   ├── VC_redist.x64.exe                   <-- Microsoft Visual C++ Redistributable (Offline)
│   └── MicrosoftEdgeWebview2Setup.exe      <-- WebView2 Runtime Bootstrap o instalador offline
│
├── 3_Herramientas/
│   └── Drivers_Impresora_Termica_80mm/    <-- Controladores USB/Serie de la impresora térmica
│
├── LEEME_PRIMERO.txt                        <-- Instrucciones de arranque rápido para el técnico
└── autorun.inf                             <-- Archivo de reproducción automática de Windows (opcional)
```

### Contenido de `LEEME_PRIMERO.txt`
```text
============================================================
GUÍA DE INSTALACIÓN RÁPIDA - TAST TPV (VERINI)
============================================================

Pasos obligatorios para la puesta en marcha en el terminal:

1. Instalar la dependencia VC++ en '2_Dependencias/VC_redist.x64.exe'.
2. Instalar WebView2 si la máquina no cuenta con Microsoft Edge instalado.
3. Conectar la impresora térmica de tickets por USB y encenderla. Instalar los drivers correspondientes situados en '3_Herramientas/'.
4. Ejecutar '1_Instalador/TastTPV_Setup.exe' y seguir las instrucciones en pantalla.
5. Iniciar la aplicación y definir el PIN de acceso por defecto ('1234') para validar el terminal.
```
