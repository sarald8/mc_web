pendiente:

- completar servicio correo para formulario, poner dominio para la pagina de gracias al enviar correo. y poner que se envie al correo de monocromatics

- mejorar apariencia movil
- añadir animaciones en la pagina principal o decoraciones chulas chulas ¿?¿?¿?

- completar las paginas de las fiestas ke hubo cada mes (para mucho mas alante)
- mapa con las salas marcadas asi bonitas donde estuvimos (para mucho mas alante)

------------------------
Decisiones de infraestructura ya cerradas (para cuando despliegues)
Fotos → Cloudflare R2, no al repo.
Código → GitHub, desplegado vía Cloudflare Pages.
generar_galeria.py → cuando muevas fotos a R2, habrá que adaptarlo para que suba ahí en vez de a una carpeta local (pendiente de hacer cuando llegues a esa parte).





tree actual 


E:\0MONOCROMATICS
|   .gitignore
|   estructuraweb.md
|   generar_galeria.py
|   index.html
|   
+---.vscode
|       extensions.json
|       
+---css
|       base.css
|       contacto.css
|       fiestas.css
|       footer.css
|       galeria.css
|       header.css
|       home.css
|       responsive.css
|       sesiones.css
|       
+---imagenes
|   |   cartel_pedro.jpg
|   |   kehr.jpg
|   |   mapa_galicia.png
|   |   
|   +---artistas
|   |        fotos
|   |       
|   +---fiestas
|   |   +---blinblin
|   |        fotos
|   |   |       
|   |   \---variadas
|   |        fotos
|   |           
|   \---logos
|           logos
|           
+---js
|       artistas.js
|       fiestas_anteriores.js
|       galeria.js
|       main.js
|       proximas_fechas.js
|       proxima_fiesta.js
|       
\---paginas
    |   contacto.html
    |   galeria.html
    |   galeria_apartado1.html
    |   galeria_apartado2.html
    |   galeria_apartado3.html
    |   gracias.html
    |   sesiones.html
    |   
    \---fiestas
            agosto.html
            julio.html
            septiembre.html
            

arqui
                 ┌──────────────────┐
                 │     GitHub       │
                 │                  │
                 │ HTML / CSS / JS  │
                 │ Python / config  │
                 └────────┬─────────┘
                          │
                     push / deploy
                          │
                          ▼
                 ┌──────────────────┐
                 │ Cloudflare Pages │
                 │                  │
                 │     WEB/CDN      │
                 └────────┬─────────┘
                          │
                          │
              ┌───────────┴───────────┐
              │                       │
              ▼                       ▼
       HTML / CSS / JS          Imágenes de R2
                                   │
                                   ▼
                            ┌──────────────┐
                            │ Cloudflare R2│
                            │              │
                            │ Fotos        │
                            │ Galerías     │
                            └──────────────┘


GitHub
→ guarda el código y controla las versiones.

Cloudflare Pages
→ publica tu web y sirve HTML/CSS/JS.

Cloudflare R2
→ almacena las fotografías.

Eso encaja perfectamente con tu proyecto.

FOTOS
Hay una cosa importante en tu árbol actual

Ahora mismo tienes:

imagenes/
├── cartel_pedro.jpg
├── kehr.jpg
├── mapa_galicia.png
├── artistas/
└── fiestas/

Eso está bien mientras desarrollas localmente.

No necesitas empezar a modificarlo ahora simplemente porque hayas decidido utilizar R2.

Cuando lleguemos al despliegue, la idea será pasar principalmente las fotos de las galerías a R2.


Desarrollo

Código → GitHub
Fotos durante desarrollo → carpeta imagenes/
Web → HTML + CSS + JS
Generación de galerías → generar_galeria.py

Producción

Código → GitHub
Hosting/CDN → Cloudflare Pages
Fotografías → Cloudflare R2
generar_galeria.py → adaptar posteriormente para trabajar con R2


### Sistema de funcionamiento de Monocromatics

# Decisión: stack de hosting (Monocromatics)

Esto **no es "la única opción correcta"**, es la mejor combinación para mis prioridades (gratis + rendimiento + comodidad) dado mi caso: web estática, sin backend, tráfico moderado, fotos como principal "peso" del proyecto. Otras combinaciones (Vercel/Netlify + Backblaze B2, etc.) también son válidas — elegí esta por las razones de abajo.

**GitHub (repo) + Cloudflare Pages (hosting/CDN) + Cloudflare R2 (fotos)**

## Por qué

### GitHub → solo el repo (control de versiones del código)
- No es "donde vive la web", es el origen del código fuente. El hosting real lo hace Cloudflare Pages.
- Es el estándar de facto para conectar con servicios de despliegue automático (push → build → deploy). GitLab sería equivalente si prefiriese esa alternativa.
- Gratis para repos públicos y privados a mi escala (sin fotos dentro, ver nota abajo).

### Cloudflare Pages → hosting + CDN de la web
Comparado con las otras opciones gratuitas serias (Vercel, Netlify, GitHub Pages, Firebase Hosting):
- **CDN**: una de las redes más grandes y rápidas que existen gratis.
- **Ancho de banda**: sin techo molesto en el plan free. Vercel y Netlify limitan a ~100 GB/mes gratis — con fotos de una fiesta compartiéndose bien, podría acercarme a ese límite si no las optimizo.
- **Despliegue automático** conectando el repo (igual que Vercel/Netlify).
- **Mismo ecosistema que R2**: si más adelante necesito un Worker (por ejemplo para servir fotos desde R2 con caché/control de acceso), todo vive en el mismo panel y credenciales. Menos sitios distintos que gestionar.
- GitHub Pages queda descartado frente a esto: mismo coste (gratis) pero CDN más limitada y sin extras tipo Workers.

### Cloudflare R2 → almacenamiento de fotos
- Explicado en la nota anterior (`decision-fotos-galeria.md`): object storage, no control de versiones. Evita que el repo de Git crezca indefinidamente con binarios.
- **10 GB gratis/mes** y, clave, **0 € de coste de egress** (tráfico de salida) — a diferencia de AWS S3, donde cada foto vista desde la web cuesta dinero según se acumula tráfico.
- Con fotos optimizadas (~300-500 KB c/u), esos 10 GB dan para miles de fotos.

## Cuándo esta decisión dejaría de ser la mejor
- Si quisiera evitar depender de un solo proveedor (Cloudflare) para todo: código desplegado + CDN + storage. Alternativa: Netlify/Vercel (hosting) + Backblaze B2 (fotos, también sin egress si se combina con su CDN gratuita) — un poco más de fricción para montar, pero reparte el riesgo entre proveedores.
- Si el tráfico creciera mucho más allá de lo esperado (miles de visitas simultáneas, muchos GB de fotos por fiesta) — ahí ya habría que revisar límites de planes free en detalle, no solo "gratis a día de hoy".
- Para este proyecto (una web de fiestas de tamaño moderado), esa preocupación de vendor lock-in es más teórica que práctica: no compensa la complejidad extra ahora mismo.

## Conclusión
GitHub + Cloudflare Pages + Cloudflare R2 es la opción que mejor cumple gratis + rendimiento + comodidad **para mi situación actual**. No es una verdad absoluta de ingeniería, es la decisión correcta dado el contexto y el tamaño del proyecto.