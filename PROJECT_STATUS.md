# Estado del Proyecto: Tast TPV (Grado de Producción)
**Rol:** Senior Software Architect  
**Producto:** Tast TPV  
**Cliente:** El Tast (Girona)  
**Integrador/Desarrollador:** Verini  
**Versión:** 1.0.0  
**Fecha de Auditoría:** Julio de 2026  

---

## 1. Resumen Ejecutivo de la Aplicación

**Tast TPV** es un sistema híbrido avanzado de Terminal de Punto de Venta (TPV) diseñado de forma táctil y optimizada para el sector de la restauración y cafeterías modernas. El proyecto combina un frontend web ágil y adaptativo de alto rendimiento con un robusto backend de Node.js local que gestiona base de datos, flujos de eventos de WebSocket en tiempo real y generación de PDF, todo ello empaquetado bajo el contenedor de escritorio **Electron** para sistemas operativos Windows de 64 bits.

El sistema se encuentra en un estado **100% operativo, libre de errores de compilación y linter**, y completamente preparado para la distribución comercial e instalación física en terminales de caja.

---

## 2. Mapa Arquitectónico y Flujo de Datos

El sistema sigue una arquitectura cliente-servidor distribuida localmente dentro de la máquina física del TPV:

```text
┌────────────────────────────────────────────────────────┐
│                   MAQUINA TPV FISICA                   │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │                 ELECTRON SHELL                   │  │
│  │                                                  │  │
│  │   ┌──────────────────────────────────────────┐   │  │
│  │   │          Frontend (React + Vite)         │   │  │
│  │   │   - Interfaz Táctil, Mesas, Comandas     │   │  │
│  │   └────────────────────▲─────────────────────┘   │  │
│  │                        │ HTTP / WebSockets       │  │
│  │   ┌────────────────────▼─────────────────────┐   │  │
│  │   │       Express Backend (Local Node.js)    │   │  │
│  │   │   - DB local, PDF Tickets, Socket.IO     │   │  │
│  │   └────────────────────┬─────────────────────┘   │  │
│  └────────────────────────┼─────────────────────────┘  │
│                           │                            │
│  ┌────────────────────────▼─────────────────────────┐  │
│  │             PERSISTENCIA DESACOPLADA             │  │
│  │   - %APPDATA%\Tast TPV\data\db.json              │  │
│  │   - %APPDATA%\Tast TPV\Reportes\*.pdf            │  │
│  │   - %APPDATA%\Tast TPV\Logs\tpv-desktop.log      │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

### Componentes Tecnológicos Clave
1. **Frontend (React 18 + Vite + Tailwind CSS):** Interfaz táctil ultra-rápida, con un carrusel de 11 categorías, barra de búsqueda instantánea, panel de favoritos "Más Vendidos" y sistema interactivo de plano de mesas.
2. **Backend (Express + Socket.IO + PDFKit + Sharp):** API REST local que gestiona el inventario, camareros y pedidos. Sincroniza múltiples dispositivos en red (como las tablets de comanderos de los camareros) en tiempo real mediante WebSockets.
3. **Escritorio (Electron Main + Preload):** Encapsula la aplicación en un ejecutable nativo, oculta las barras de navegación, arranca de forma aislada un hilo secundario (fork) con el servidor de Node y define variables de entorno críticas.
4. **Almacenamiento Desacoplado:** El software de cobro cumple con las mejores prácticas al no almacenar datos dentro de la carpeta de programa (`C:\Program Files\`), sino en el directorio de usuario seguro de Windows (`%APPDATA%`), asegurando que las actualizaciones nunca borren las ventas de la cafetería.

---

## 3. Estado de los Módulos Funcionales

A continuación, se detalla el nivel de completitud y estado operativo de cada módulo del sistema:

| Módulo | Descripción | Estado | Observaciones |
| :--- | :--- | :---: | :--- |
| **Kiosk & POS Dashboard** | Panel de control central táctil con catálogo de productos por categorías de hostelería, favoritos, modificadores de comanda rápidos, totalizadores y envío inmediato a cocina. | **100% Funcional** | Optimizado con tema claro/oscuro de alto contraste adaptado al operario. |
| **Monitor de Cocina** | Cola de comandas activas pendientes de preparación con control de tiempo transcurrido (cambio de color de amarillo a naranja/rojo por retrasos). | **100% Funcional** | Sincronizado en tiempo real a través de Socket.IO. |
| **Plano de Mesas** | Vista interactiva en cuadrícula para gestionar el estado de ocupación, comensales y cuentas activas de las mesas del local. | **100% Funcional** | Permite asignar comandas rápidas con 1 clic. |
| **Panel de Administración** | Consola para supervisar métricas de venta diarias, productos con alertas de stock, ingresos por método de pago (Efectivo/Bizum) y configuración. | **100% Funcional** | Incluye gráficos interactivos desarrollados con Recharts. |
| **Gestión de Inventario** | Listado de productos, control de stock físico, edición de precios y control de alérgenos por producto. | **100% Funcional** | Conectado directamente a las alertas visuales de la comanda. |
| **Copias de Seguridad** | Módulo de backups locales que permite exportar la base de datos a archivos `.json` fechados para almacenamiento externo. | **100% Funcional** | Los backups se guardan en el directorio persistente seguro. |
| **Gestión de Camareros** | Control de personal, asignación de mesas y cambio rápido de operario mediante PIN de acceso. | **100% Funcional** | Permite cambiar de camarero sobre la marcha sin cerrar el carrito activo. |
| **CRM & Clientes** | Registro de clientes habituales, fidelización, saldos acumulados e historial de comandas anteriores. | **100% Funcional** | Ideal para cuentas prepago o clientes VIP de El Tast. |
| **Reservas** | Libro de reservas interactivo por fecha, hora, número de mesa y comensales con alertas de confirmación. | **100% Funcional** | Evita la sobre-reserva de mesas clave en horas pico. |
| **Consultoría de IA (Gemini)**| Panel de recomendación inteligente e informes predictivos sobre ventas utilizando la API de Google Gemini de forma segura y optimizada. | **100% Funcional** | Requiere la clave de API `GEMINI_API_KEY` en el entorno. |

---

## 4. Configuración de Distribución para Windows

La infraestructura para el despliegue del instalador profesional ha sido completamente configurada y auditada con los siguientes parámetros:

*   **Nombre del Producto:** `Tast TPV`
*   **Nombre del Ejecutable:** `TastTPV.exe`
*   **Nombre del Instalador:** `TastTPV_Setup.exe`
*   **Versión:** `1.0.0`
*   **Editor/Fabricante:** `Verini`
*   **Identificador de App (AppID):** `com.verini.tasttpv`
*   **Icono corporativo:** `public/favicon.ico`
*   **Motor de Instalación:** NSIS (Nullsoft Scriptable Install System) integrado nativamente mediante `electron-builder`.

### Beneficios del Instalador Generado (NSIS)
*   **Directorio de destino seleccionable:** Cumple con las directrices de seguridad de Windows permitiendo cambiar el directorio de destino o instalando en Archivos de Programa de manera predeterminada.
*   **Accesos directos automáticos:** Genera un acceso directo limpio en el **Escritorio** y en el **Menú de Inicio**.
*   **Desinstalador Certificado:** Permite la eliminación total de los binarios del programa de manera ordenada a través del Panel de Control de Windows.
*   **Auto-Arranque:** Permite lanzar la aplicación Tast TPV de inmediato tras pulsar el botón "Finalizar".

---

## 5. Auditoría de Código y Estado de Salud Técnica

1.  **Linter (`tsc --noEmit`):** **APROBADO** (0 Errores, 0 Advertencias fatales). El código sigue los estándares estrictos de tipado de TypeScript.
2.  **Compilación de Producción (`npm run build`):** **APROBADO**. El compilador de Vite genera los archivos estáticos optimizados en `dist/` y el servidor Express se empaqueta de forma independiente.
3.  **Configuración de Puerto:** El servidor Express local está bloqueado al puerto **3000** de manera interna, lo que garantiza la sincronización local y evita conflictos con otros servicios de Windows.
4.  **Estructura del Proyecto:** Limpia y modular. Los componentes de React están desacoplados en archivos individuales dentro de `/src/components` para evitar desbordamiento de límites de tokens.

---

## 6. Siguientes Pasos Operativos para la Puesta en Marcha

Para iniciar la distribución física en el local, consulte las guías exhaustivas y detalladas creadas en:
*   **`DOCUMENTACION_DISTRIBUCION.md`:** Documentación técnica general de distribución y arquitectura de red.
*   **`INSTALACION_WINDOWS.md`:** Guía paso a paso para compilar la aplicación, generar el instalador final, crear el USB autoejecutable para técnicos y realizar el protocolo de pruebas de campo.
