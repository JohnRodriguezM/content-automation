# Guía para escribir los guiones diarios

La sigue la sesión programada que corre cada mañana (5:41 am, Bogotá): radar de noticias + guiones para completar el calendario de 3 videos diarios. También sirve para escribir uno a mano.

Antes de escribir, lee [`personalidad.md`](personalidad.md) completo (línea editorial, voz, reglas de veracidad, visual) y `temas/historial.json`.

## Foco y calendario (desde el 18-nov)

**Categoría única: marcas y plata de Colombia.** Marcas que la gente usa en Colombia: quién es el dueño, cómo gana plata, qué decisión las cambió, cómo le toca al bolsillo de quien ve. Trae el 91 % de las vistas de la cuenta; GTA y marcas globales sin ángulo colombiano no van.
- Serie **"¿De quién es?"**: cuando el video revela el dueño de una marca, `portada.serie = "¿De quién es?"`.
- Narrador: `john`. Pilar: `negocios`, `biografias` (personas detrás de la marca) o `tecnologia` (apps, telcos, fintech).
- **3 videos al día** (publicación 7:30 am, 12:30 pm y 7:30 pm, hora Bogotá). El `id` lleva la fecha en que se publica.
- **Noticia del día (opcional, máx. 1):** si en las últimas 24-36 h salió una noticia fuerte de una marca colombiana (cambio de dueño, quiebra, multa, precio, lanzamiento) con 2 fuentes serias, se escribe ese mismo día con la fecha de hoy y slug que termine en `-noticia`. Va a las 12:30 pm y el video de las 12:30 pasa a las 4:30 pm. La inmediatez manda: mejor un video correcto hoy que uno perfecto mañana.
- En `temas/historial.json` cada entrada de esta categoría lleva `"categoria": "marcas-colombia"`, `"franja"` (`"07:30"`, `"12:30"` o `"19:30"`; la noticia va en `"12:30"` y el video que tenía esa franja pasa a `"16:30"`) y `"tipo": "noticia"` si aplica. El tema más fuerte del día va a las 19:30.

## Cómo elegir un tema

**Regla #1: marcas que la gente usa.** El tema tiene que tocar algo con lo que el espectador tiene contacto: lo que come, compra, paga, usa en el celular o en la calle (apps, comida, bebidas, ropa, supermercados, bancos y billeteras, telefonía, aerolíneas, carros, plataformas, deportes). Una cementera, una petroquímica o una minera no le importan a la mayoría, aunque la noticia sea grande.
- Pregunta de control antes de escribir: *¿el espectador ha usado, comprado o visto esta marca esta semana?* Si no, descarta el tema o búscale el ángulo de consumo.
- Si la noticia es de una empresa B2B, solo sirve cuando afecta algo cotidiano y el video arranca por ahí ("El cemento de tu casa va a costar más porque…", "Tu celular tiene cobre chileno…").
- El gancho arranca desde la experiencia del espectador, no desde la empresa: "La tarjeta con la que pagas el almuerzo…", "Ese combo que compras en Costco…".
- Ejemplos que sí: Frisby, Crepes & Waffles, Rappi, Nequi, Mercado Libre, Coca-Cola, Avianca, Netflix, McDonald's, Juan Valdez, Totto, Falabella, Claro. Ejemplos que no (salvo con ángulo de consumo): Cemex, Holcim, Braskem, Codelco.

Un buen tema tiene: una **decisión concreta** de una persona o empresa real, una **consecuencia** medible y una **lección** que alguien que emprende o trabaja pueda aplicar. Busca historias poco contadas o un ángulo nuevo de una conocida. Evita temas que solo existan como rumor o que no tengan al menos dos fuentes serias.

## Investigación y fuentes

- Cada cifra, fecha o hecho sobre una empresa o persona real va en `fuentes` con la URL de donde salió (medio reconocido, reporte anual, libro, entrevista, documento oficial). Mínimo 2 fuentes, salvo en tecnología conceptual.
- Lee la fuente (no solo el snippet del buscador) antes de usar un dato.
- Si un dato no se puede verificar: quítalo o generalízalo. Si las fuentes no coinciden, usa la cifra más conservadora o dilo.
- Nada de citas textuales sin fuente primaria. Nada de atribuir pensamientos privados como hechos.

## Estructura y longitud

- Escenas en orden: gancho → contexto → decisión → consecuencia → aprendizaje → cierre (puede haber 2 escenas del mismo bloque seguidas).
- **80 a 100 palabras** de narración (≈35-40 s); el validador avisa desde 106. **Tope duro: 1:30 con la tarjeta final** → máximo 210 palabras.
- **Narración dinámica:** frases cortas (idealmente ≤12 palabras), un dato concreto por escena (cifra, fecha, nombre), nada de relleno. Cada frase debe aportar información nueva para que la gente siga pendiente.
- **Gancho:** la primera frase tiene máximo 10 palabras, con un número o un contraste concreto, y deja una pregunta abierta. Nada de arrancar con contexto ("Una empresa peruana acaba de..."). Ej.: "Vendió 45% más. Y la bolsa lo castigó."
- **Título del gancho:** sale arriba de la foto en el arranque, debajo del logo: 2-5 palabras, idealmente con el número ("De $140 a $9", "1.000 tiendas por $53M"). Obligatorio.
- **Cierre (corto, ≈3 s, máx. 15 palabras): UNA sola llamada, nunca dos.** O una **pregunta con bando** que se contesta en una palabra y divide opiniones ("¿Tú le habrías vendido a Gilinski o a los Calleja?", "¿Equipo Adidas o equipo Puma?"), o un **envío dirigido** a una persona concreta ("Mándaselo a quien todavía cree que Totto es italiana"). Los envíos por DM son la señal que más alcance da. Prohibido "Te leo en los comentarios" (relleno) y "comenta SÍ si…" (cebo de interacción, lo castigan). Nada de "síguenos" en la voz: el `caption` termina con la pregunta y la línea "Síguenos: cada día contamos una decisión que cambió una empresa." La tarjeta final (foto + @ del narrador) la pone el render solo si existe `public/marca/<narrador>.jpg`.
- **No uses frases fijas.** Prohibido "La lección es esta". Varía cómo llegas a la lección: una pregunta ("¿Qué falló?"), un contraste ("No fue el producto. Fue el precio."), una regla corta ("Volumen sin margen es frágil."). Varía también el arranque de cada bloque entre videos.

## Retención (meta: ≥30 % ve el video completo)

En la cuenta, lo que más predice el alcance es el porcentaje que ve el video completo (los que pegaron estuvieron en 22-24 %, la mediana en 12 %). Casi todos pierden gente en los segundos 1-2. Reglas:
1. **Corto:** 80-100 palabras, 7-9 escenas de 1-2 frases. Nada de contexto antes de la tensión: el contexto cabe en una frase.
2. **Gancho que promete y no paga todavía:** la primera frase (≤10 palabras) plantea el dato o la pregunta; **la respuesta completa llega en el último 20 % del video**. Ej.: no "Ara no es colombiana. Es portuguesa." sino "Ara no es colombiana. Y su dueño manda en Polonia." … y "portuguesa" se revela al final.
3. **Un dato nuevo cada 3-4 s:** cifra, nombre, fecha o giro. Si una frase no aporta nada nuevo, se borra.
4. **Giro a la mitad** ("Pero…", "Lo curioso:") para retener el bajón del segundo 15-20.
5. **Cierre en loop:** la pregunta de bando (≤8 palabras) y, si cabe, un puente de ≤5 palabras que empate con la primera frase cuando el video vuelve a empezar (ej. cierre "¿D1 o Ara? Porque te repito:" → arranca "Ara no es colombiana."). Las repeticiones cuentan como vistas completas.
6. El primer cuadro ya tiene la foto más fuerte con el título encima (el render le da un golpe de cámara y un impacto de sonido al arrancar); el `titulo` del gancho es la promesa en 2-5 palabras.

## Etiquetas de voz (expresividad)

La voz usa Eleven v4 (con alta similitud a la voz clonada), que interpreta etiquetas entre corchetes dentro de `narracion`. No salen en los subtítulos ni cuentan como palabras.
- En inglés, minúsculas: `[curious]`, `[thoughtful]`, `[serious]`, `[excited]`, `[sighs]`, `[laughs softly]`, `[pause]`, `[whispers]`.
- 3 a 6 por guion. Donde cambia la emoción: curiosidad en el gancho, un suspiro antes del giro, emoción en el resultado, tono serio en la lección.
- Nunca en el cierre fijo. Nunca dos seguidas. La risa solo cuando el hecho es de verdad irónico o gracioso.

## Imágenes (`imagenes`, 3-5 por escena)

Más imágenes = escenas más dinámicas: en el estilo tablero caen una tras otra cada ~1,5-2 s. Apunta a 3-5 por escena (máx. 6), todas específicas (objetos, lugares, productos, la persona por su nombre).

Se buscan solas en Wikimedia Commons. La búsqueda decide si la foto sale bien:
- **Específica y en inglés:** nombre de la persona, edificio, producto o lugar real ("Steve Jobs 2007", "Blockbuster store", "Avianca Boeing 787"). Commons tiene muy buen material de empresas, sedes, productos y fundadores.
- **Cuidado con nombres que son palabras comunes:** "Mercado Pago" trajo un mercado de abastos en Cádiz. Para marcas así, busca algo inequívoco ("MercadoLibre logo", "Mercadolibre edificio") o fija la imagen con `url` (formato `https://commons.wikimedia.org/wiki/Special:FilePath/<Archivo>?width=1600`) más `credito`, `licencia` y `pagina`.
- **Errores reales de búsqueda:** "Coke" trajo una planta de coque y la foto de un actor; "Nubank card" trajo guacamayas; "Atari Lynx" trajo un lince; "Avenida Paulista" trajo una protesta política. Para marcas, productos y lugares con gente, fija la imagen.
- **"Amazon" a secas trae loros y la selva:** para empresas cuyo nombre es también un animal, lugar o palabra común, fija la imagen.
- **Nunca búsquedas de una persona + otra palabra** ("Sara Blakely Spanx" trajo la foto de otra mujer): busca solo el nombre.
- **Nunca b-roll genérico de apps** ("messaging app" trajo el logo de Threema, competidor de WhatsApp): usa la app real o un objeto.
- **Nunca búsquedas genéricas de personas** ("businessmen meeting", "office 1970s"): devuelven gente real identificable que no tiene nada que ver (pasó con Gerald Ford).
- Si la escena lleva `rotulo` con un nombre, una de sus imágenes debe buscar a esa persona por nombre.
- Para b-roll genérico usa objetos o lugares sin personas ("film camera", "empty factory interior", "stock market screen").
- `modo`: `relleno` (fotos horizontales, de archivo, retratos) o `completa` (verticales, texturas, b-roll). `filtro`: `bn` o `sepia` para material antiguo.

## Logo (`logo`, en casi todos)

Sale arriba, sobre el título del gancho, durante los primeros ~3 segundos. Fíjalo siempre con `url` (formato `https://commons.wikimedia.org/wiki/Special:FilePath/<Archivo>?width=800`, sirve SVG o PNG) más `credito`, `licencia` y `pagina`: la búsqueda automática de logos trae marcas equivocadas (pasó con Cemex). Si no hay un logo confiable en Commons, no pongas `logo`.

## Gráficos (`motion`, 1-3 por escena, en casi todas)

En el formato mixto, cada escena abre con la foto y luego entra el gráfico sobre la foto oscurecida. Escoge el gráfico que haga visible la idea de esa escena:
- `contraste`: antes → después (ideal para el gancho: "1975 → 2012").
- `dato`: un número que cuenta (`valor` ≤10 caracteres, `etiqueta`), con `progreso` 0-1 para porcentajes o con `icono`.
- `iconos`: 1-3 pasos o elementos con ícono y texto corto (≤36 caracteres).
- `titulo`: frase de la lección con `[[marcador]]` en la palabra clave e ícono opcional.

Íconos disponibles: `camara_digital`, `rollo`, `edificio`, `grafica_baja`, `tv`, `dinero`, `documentos`, `bombilla`, `pregunta`, `celular`, `cassette`, `reloj`. No inventes otros (el esquema los rechaza).

## Texto para publicar

- `caption`: ≤1.800 caracteres. **Mini-artículo** (estilo documental): 3-5 párrafos cortos con las cifras, fechas y citas del video, cada dato con su fuente ("según Forbes"), una línea final `Fuentes: medio (fecha), …` y termina con la pregunta del cierre. Si es una serie, primera línea "Parte N de M · …". El pipeline agrega solo el crédito de fotos y los hashtags.
- `hashtags`: 5-8, mezcla de amplios (#negocios #emprendimiento) y específicos del tema.
- `destacar`: 1-3 palabras por escena que salen en serif dorada en los subtítulos (números, la palabra clave).

## Antes de subir

1. `npm run validar -- guiones/<id>.json` para cada uno: cero errores.
2. Releer cada afirmación contra su fuente y quitar la que no se pueda defender.
3. Agregarlos a `temas/historial.json` (`id`, `tema`, `pilar`, `narrador`, `protagonistas`, `categoria`, y `tipo` si es noticia).
4. Un solo commit con los guiones + historial, push a `main`. El push dispara el render y la subida a Drive.

Ejemplo completo: `guiones/2026-11-05-kodak-camara-digital.json`.

## Estilo documental (piloto desde el 13-nov)

Es el estilo por defecto desde el 14-nov (push o workflow_dispatch). Cada escena alterna fotos y piezas; un cambio de plano cada 1,5-2 s.

Fórmula del guion: **gancho** con el dato que nadie cuenta (cifra concreta de una marca que la gente usa) → **desarrollo** como thriller (quién decidió, qué se jugó, qué salió mal) → **cierre** de bolsillo (cómo le toca a quien lo ve) + pregunta. 45-60 s.

Piezas (`motion`) además de `dato`, `contraste` (barras), `titulo` e `iconos`:
- `mapa`: `{"tipo":"mapa","puntos":[{"lugar":"medellin","etiqueta":"Medellín · Éxito"}],"ruta":true}`. Lugares válidos en `src/lugares.ts` (agregar ahí los que falten).
- `recorte`: `{"tipo":"recorte","medio":"Portafolio","fecha":"25 feb 2026","titular":"…","resaltar":"…"}`. **Solo titulares reales, copiados de la fuente**, con medio y fecha. Nunca inventados.

`orden` (por escena): secuencia de `f` (foto) y `p` (pieza), ej. `"pfpp"`. `rotulo`: lugar y fecha a máquina en la esquina.

`portada` (por guion): `{"texto":"¿De quién es el [[Éxito]]?","dato":"Ni colombiano ni francés","foto":"1.1"}`. Se sube a Drive como `<id>-portada.jpg`. Regenerar solo la portada: workflow con `solo_portada=1`.

Balance de pilares (meta 50/30/20): al 12-nov íbamos 60 % negocios, 18 % personas, 22 % tecnología → priorizar **personas detrás de marcas de consumo** (mínimo 1 de cada 3 videos).

### Estilo documental v2 (desde el 14-nov, inspirado en @didier.sotto)

Campos nuevos (todos opcionales, el validador y el esquema los conocen):
- **`contador`** (solo gancho): `{"valor":"2.850","etiqueta":"tiendas en Colombia"}`. Barra arriba con el logo y la cifra contando. Una cifra que deje la pregunta abierta.
- **`titulo`** del gancho admite `[[palabra]]`: va en caja amarilla en su propia línea (ej. `"GTA nació de [[un despido]]"`). Mientras está el título, el gancho muestra solo fotos (las piezas van después). No repitas el título en una pieza `titulo` del gancho.
- **`segun`** (escena): chip de fuente al arrancar la escena (`"según Forbes"`). **Y dilo en la voz**: "Según Forbes, …". Una o dos veces por video, en los datos más fuertes.
- **`fecha`** (escena): punto en la línea de tiempo que avanza por el video (`"1987"`, `"OCT. 2016"`). Úsala cuando la historia salta en el tiempo; mínimo 2 fechas por video o ninguna.
- **`cita`** (pieza): `{"tipo":"cita","texto":"…","autor":"David Jones, a The Courier"}`. **Solo citas reales copiadas de la fuente** (traducidas fielmente si están en inglés), con quién y dónde. La narración la lee completa.
- **`persona`** (en una imagen): `{"nombre":"Strauss Zelnick","cargo":"CEO de Take-Two"}`. Rótulo con nombre y cargo cuando la foto es de esa persona.

Antes de elegir tema: revisar el perfil de Didier Sotto (TikTok/Instagram) para no repetir sus historias recientes, o contarlas desde otro ángulo.

Fotos: antes de subir, conviene probar las búsquedas contra Commons (misma API que `pipeline/imagenes.ts`) y cambiar las que devuelvan algo raro. Nunca capturas ni arte de videojuegos, películas o series.

