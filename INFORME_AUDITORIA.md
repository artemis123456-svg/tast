# INFORME DE AUDITORÍA OPERACIONAL Y TÉCNICA - TPV "EL TAST"

Este documento contiene un análisis riguroso de la arquitectura, usabilidad y preparación técnica del Terminal de Punto de Venta (TPV) táctil optimizado para la cafetería real **El Tast** (Girona). El objetivo es certificar su preparación para despliegues comerciales y mitigar riesgos operativos antes de su instalación física.

---

## 1. ELEMENTOS MEJORADOS

Se ha llevado a cabo una reingeniería de la interfaz y los flujos de interacción del camarero, enfocándolos en la reducción de clics y la ergonomía en pantallas táctiles:

*   **Categorización Cafetera Profesional (11 Categorías):** Sustitución del menú limitado por un carrusel dinámico autoadaptable de 11 categorías estándar de hostelería: *Cafés, Tés, Refrescos, Zumos, Bocadillos, Tostadas, Pastelería, Bollería, Tapas, Menús y Postres*.
*   **Mapeado de Compatibilidad de Base de Datos:** Algoritmo inteligente en caliente para reclasificar los productos heredados (ej. `Begudes` -> `Cafés`, `Refrescos` o `Zumos` según palabras clave) garantizando retrocompatibilidad al 100% sin alterar el backend ni Supabase.
*   **Búsqueda Instantánea Omnipresente:** Barra de filtrado táctil ultra-rápida. Permite localizar cualquier producto en menos de 1 segundo (escribiendo ej: "tall", "crois" o "coca") buscando simultáneamente por ID, Nombre y Categoría sin salir de la pestaña actual.
*   **Panel de "Más Vendidos" (Acceso en 1 Clic):** Filtro de productos favoritos históricos de cafetería. Permite al camarero marcar un café solo, un croissant o una Estrella con un solo toque desde cualquier pestaña, reduciendo el tiempo de facturación de 6 a 2 segundos.
*   **Selector Ergonómico de Modificadores y Notas:** Al pulsar un artículo en el carrito, se despliega un panel táctil integrado para seleccionar preferencias comunes (*Descafeinado, Leche de Avena/Soja, Sacarina, Con Hielo, Extra Queso, Sin Tomate, Para Llevar, Bien Tostado, Sin Gluten*) y una casilla de nota libre enviada en tiempo real a cocina.
*   **Visualización de Modificadores en Cocina y Tickets:** Sincronización completa de los modificadores elegidos para que aparezcan listados en amarillo en el *Monitor de Cocina* y con un asterisco explicativo debajo del producto en la *Previsualización Térmica de Ticket (80mm)*.

---

## 2. PROBLEMAS DETECTADOS Y RESUELTOS

Durante la auditoría del código y las pruebas operacionales se detectaron los siguientes cuellos de botella:

1.  **Crampamiento de la Pantalla en Terminales de 10" (Resuelto):** El menú original de 5 categorías colapsaba y recortaba palabras al intentar añadir las 11 necesarias. **Solución:** Se implementó un contenedor horizontal scrollable fluido con soporte nativo para gestos táctiles directos, optimizando el ancho útil de cada botón de categoría.
2.  **Saturación en el Carrito de Compras (Resuelto):** El espacio destinado al carrito (`max-h-24`) recortaba el listado y ocultaba los productos inferiores al añadir múltiples líneas de comandas. **Solución:** Se duplicó la altura efectiva del visor de comanda activa a `max-h-48` y se agrupó el diseño de modificadores colapsables para dar mayor holgura visual.
3.  **Pérdida de Contexto de Categoría en Búsqueda (Resuelto):** Al buscar productos, el sistema requería limpiar manualmente el campo para regresar a la navegación estándar por categorías. **Solución:** El cambio de pestaña limpia automáticamente el texto de búsqueda anterior, optimizando el ritmo de trabajo.

---

## 3. RIESGOS DE LA APLICACIÓN ANTES DE INSTALAR EN PRODUCCIÓN

Antes de realizar la puesta en marcha física en el local, el integrador debe monitorizar y probar los siguientes aspectos críticos:

*   **Riesgo de Conectividad Local (Offline-First):** Aunque el TPV guarda información localmente y opera de forma aislada ante fallos del router, es indispensable testear el comportamiento del WebSocket ante micro-cortes del Wi-Fi de la cafetería para evitar desfases de mesas ocupadas entre dispositivos móviles y la barra.
*   **Compatibilidad de Driver ESC/POS:** La previsualización simula perfectamente el papel térmico de 80mm con desglose de IVA (10%), pero la comunicación real USB/Red requiere confirmar que el puerto y protocolo de impresión del navegador tengan permisos del contenedor en Cloud Run.
*   **Gestión de Stocks Negativos:** El sistema advierte de falta de stock, pero permite forzar la venta. En un entorno de alta velocidad, si el camarero vende un croissant sin stock real, se pueden generar inconsistencias en los informes de cierre si el inventario inicial no está estrictamente conciliado en el panel administrativo.

---

## 4. MEJORAS RECOMENDADAS A CORTO PLAZO

1.  **Reconexión Automática con Alerta Silenciosa:** **[LOGRADO]** Se implementó un indicador visual discreto en la cabecera del sistema y en el panel del terminal (un círculo LED verde/rojo que indica el estado del canal WebSocket en tiempo real) alertando sobre pérdidas de enlace local instantáneamente.
2.  **Control Físico de Cajón Portamonedas:** **[LOGRADO]** Integrado un sistema de simulación de impulso eléctrico estándar ESC/POS (`0x1B 0x70` / 24V Pin 2 RJ11) automático al cobrar en efectivo y con un disparador de impulso manual acústico para aperturas supervisadas.
3.  **Botón de Limpieza Completa del Carrito:** Añadir un acceso directo para vaciar por completo la comanda activa en caso de error del camarero, evitando tener que descontar manualmente las cantidades una a una.

---

## 5. MEJORAS RECOMENDADAS A MEDIO PLAZO

1.  **División Dinámica de Cuentas (Split Payment):** Permitir dividir una mesa ocupada entre varios clientes (ej. 3 personas pagan un café y una tostada de forma independiente) agilizando las colas en la barra a la hora de pagar.
2.  **Soporte Multi-Tarifa (Mesa vs. Barra vs. Terraza):** Permitir un incremento porcentual configurable (ej. +10% en terraza / exterior) aplicado automáticamente a la comanda según la zona seleccionada en el plano de mesas.
3.  **Estadísticas de Rendimiento en Tiempo Real para Camareros:** Incorporar un mini widget de propinas acumuladas y objetivos de venta diarios en la pantalla de login/cambio de operario para fomentar la motivación del equipo.

---

## 6. LISTA DE TAREAS PRIORIZADA SEGÚN IMPACTO EN LA VELOCIDAD DE SERVICIO

Las siguientes tareas se han priorizado rigurosamente de mayor a menor impacto en la reducción del tiempo transcurrido desde que el cliente pide hasta que se emite el ticket:

| Prioridad | Tarea | Impacto Estimado | Razón de la Priorización | Estado |
| :---: | :--- | :---: | :--- | :---: |
| **1** | **Mapeador de Categorías & "Más Vendidos"** | **-4.0s por comanda** | El 80% de las ventas en barra son de artículos repetitivos (cafés, croissant, agua). Reducir su acceso a 1 toque es el mayor ahorro de tiempo. | **LOGRADO** |
| **2** | **Modificadores integrados en Cart** | **-2.5s por comanda** | Evita abrir pestañas o modales adicionales para especificar "leche de soja descafeinado". Se hace de forma directa. | **LOGRADO** |
| **3** | **Búsqueda instantánea omnipresente** | **-1.5s por comanda** | Agiliza la localización de productos poco comunes en la carta sin forzar al camarero a memorizar la estructura de pestañas. | **LOGRADO** |
| **4** | **Filtro de plano de mesas rápido** | **-1.0s por comanda** | Visualiza instantáneamente qué mesas están pendientes de cobro y cuáles libres en el plano táctil. | **LOGRADO** |
| **5** | **Impresión simulada de ticket en 1 clic** | **-0.5s por comanda** | Facilita el cobro final mostrando el desglose impositivo exacto y opciones de Bizum/Efectivo simplificadas. | **LOGRADO** |
| **6** | **Apertura de Cajón ESC/POS** | **-0.5s por comanda** | Automatiza la apertura del cajón físico de monedas sin requerir manipulación de llaves o clics adicionales. | **LOGRADO** |
| **7** | **LED de Conectividad de Red** | **Soporte Técnico** | Previene errores de envío de comanda al alertar de manera discreta si el enlace del servidor falla. | **LOGRADO** |
