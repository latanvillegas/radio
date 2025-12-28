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
├── README.md
├── index.html
├── manifest.json
├── sw.js
├── css/
│   └── style.css
└── js/
    ├── main.js
    └── stations.js

