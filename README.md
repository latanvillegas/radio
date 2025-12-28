# Radio Satelital - Wave Player v7.5

Un reproductor de radio web moderno, personalizable y de alto rendimiento. Permite a los usuarios escuchar emisoras de radio en vivo de todo el mundo, filtrar por país y región, y añadir sus propias frecuencias. La interfaz está diseñada para ser una Progressive Web App (PWA), lo que permite a los usuarios "instalarla" en sus dispositivos.

## ✨ Características Principales

-   **Reproductor de Audio Avanzado:** Controles de reproducción, pausa, anterior y siguiente, con un indicador de estado en tiempo real (`En Vivo`, `Cargando`, `Detenida`).
-   **Lista Dinámica de Emisoras:** Las estaciones se cargan desde un archivo `js/stations.js`, facilitando su gestión.
-   **Filtros y Búsqueda:** Filtra emisoras por país y región, y encuentra rápidamente tus estaciones favoritas con un buscador integrado.
-   **Sistema de Favoritos:** Marca y prioriza tus emisoras preferidas para un acceso rápido.
-   **Personalización de Temas:** Cambia la apariencia de la interfaz con múltiples temas predefinidos (Cyber Dark, AMOLED, Gold Luxury, etc.).
-   **Agregar Emisoras Personalizadas:** Un formulario en el menú permite a los usuarios guardar nuevas estaciones en el almacenamiento local de su navegador.
-   **Diseño Responsivo:** La interfaz se adapta fluidamente a dispositivos de escritorio, tabletas y móviles.
-   **Capacidad PWA (Progressive Web App):** Incluye un `manifest.json` y un `Service Worker` para que pueda ser "instalada" en el escritorio o la pantalla de inicio del móvil.

## 🚀 Tecnologías Utilizadas

-   **HTML5:** Para la estructura semántica del sitio.
-   **CSS3:** Para el diseño, las animaciones y la personalización de temas a través de variables CSS.
-   **JavaScript (Vanilla JS):** Para toda la lógica del reproductor, la interactividad de la interfaz y la gestión de datos, sin necesidad de librerías o frameworks externos.

## 📁 Estructura de Archivos

El proyecto está organizado de la siguiente manera para una fácil navegación y mantenimiento:

/ (Carpeta Raíz)
├── README.md # Este archivo.
├── index.html # Archivo principal que contiene la estructura de la aplicación.
├── css/
│ └── style.css # Hoja de estilos principal para el diseño y los temas.
├── js/
│ ├── main.js # Contiene la lógica principal del reproductor, eventos y manipulación del DOM.
│ └── stations.js # Funciona como una base de datos para las emisoras de radio.
├── manifest.json # Archivo de manifiesto para la configuración de la PWA.
└── sw.js # Service Worker que gestiona el caché y el funcionamiento offline.

## ⚙️ Instalación y Uso

No se requiere una instalación compleja. Para ejecutar el proyecto localmente, sigue estos pasos:

1.  Clona o descarga este repositorio en tu computadora.
2.  Navega a la carpeta del proyecto.
3.  Abre el archivo `index.html` directamente en tu navegador web preferido (como Chrome, Firefox, etc.).

¡Y eso es todo! El reproductor cargará las emisoras definidas en `js/stations.js` y estará listo para usar.

## 🎨 Personalización

Puedes personalizar fácilmente varios aspectos del reproductor:

-   **Cambiar el Logo:** El logo es un ícono SVG y se encuentra directamente en el `index.html`, dentro de la etiqueta `<header>`. Puedes reemplazar el código `<svg class="brand-logo" ...>` por tu propio SVG o por una etiqueta `<img>`.

-   **Añadir Redes Sociales:** Los enlaces a las redes sociales están en la sección `<aside class="side-menu">` del `index.html`. Simplemente añade o modifica las etiquetas `<a>` correspondientes.

-   **Añadir Emisoras de Radio:** Para añadir más emisoras de forma permanente, edita el archivo `js/stations.js` y agrega un nuevo objeto al array `stations` con el siguiente formato:
    ```javascript
    {
      name: "Nombre de la Radio",
      country: "País",
      url: "https://url-del-streaming.com"
    }
    ```

## ✒️ Autor

-   **AVELINO LATAN VILLEGAS**
