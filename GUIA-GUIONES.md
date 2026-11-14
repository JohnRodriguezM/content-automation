# Guía para escribir los guiones diarios

La sigue la sesión programada que corre cada noche a las 11 pm (Bogotá) y escribe los 4 guiones del día siguiente. También sirve para escribir uno a mano.

Antes de escribir, lee [`personalidad.md`](personalidad.md) completo (línea editorial, voz, reglas de veracidad, visual) y `temas/historial.json`.

## Los 4 guiones del día

| # | Pilar | Narrador |
|---|---|---|
| a | negocios | sebas |
| b | negocios | john |
| c | biografias | sebas |
| d | tecnologia | john |

- Fecha del `id`: **el día siguiente** a la corrida (se publican ese día). Formato `AAAA-MM-DD-slug`, slug en minúsculas con guiones, sin tildes.
- Los 4 temas tienen que ser distintos entre sí y no estar en `temas/historial.json` (ni el mismo tema con otro título, ni la misma empresa o persona en los últimos 30 días).
- Público latinoamericano: al menos 1 de los 4 con una empresa o protagonista de Latinoamérica.

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
- **130 a 170 palabras** de narración (≈45-55 s con la voz acelerada x1.12). `npm run validar` lo revisa.
- **Narración dinámica:** frases cortas (idealmente ≤12 palabras), un dato concreto por escena (cifra, fecha, nombre), nada de relleno. Cada frase debe aportar información nueva para que la gente siga pendiente.
- **Gancho:** la primera frase tiene máximo 10 palabras, con un número o un contraste concreto, y deja una pregunta abierta. Nada de arrancar con contexto ("Una empresa peruana acaba de..."). Ej.: "Vendió 45% más. Y la bolsa lo castigó."
- **Título del gancho:** sale arriba de la foto en el arranque, debajo del logo: 2-5 palabras, idealmente con el número ("De $140 a $9", "1.000 tiendas por $53M"). Obligatorio.
- **Cierre (corto, ≈3 s, máx. 15 palabras): UNA sola llamada, nunca dos.** O una **pregunta con bando** que se contesta en una palabra y divide opiniones ("¿Tú le habrías vendido a Gilinski o a los Calleja?", "¿Equipo Adidas o equipo Puma?"), o un **envío dirigido** a una persona concreta ("Mándaselo a quien todavía cree que Totto es italiana"). Los envíos por DM son la señal que más alcance da. Prohibido "Te leo en los comentarios" (relleno) y "comenta SÍ si…" (cebo de interacción, lo castigan). Nada de "síguenos" en la voz: el `caption` termina con la pregunta y la línea "Síguenos: cada día contamos una decisión que cambió una empresa." Sin @ ni tarjeta final por ahora.
- **No uses frases fijas.** Prohibido "La lección es esta". Varía cómo llegas a la lección: una pregunta ("¿Qué falló?"), un contraste ("No fue el producto. Fue el precio."), una regla corta ("Volumen sin margen es frágil."). Varía también el arranque de cada bloque entre videos.

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

- `caption`: ≤1.800 caracteres. Empieza con el gancho reformulado, 2-4 líneas con la idea, termina con la pregunta del cierre. El pipeline agrega solo el crédito de fotos y los hashtags.
- `hashtags`: 5-8, mezcla de amplios (#negocios #emprendimiento) y específicos del tema.
- `destacar`: 1-3 palabras por escena que salen en serif dorada en los subtítulos (números, la palabra clave).

## Antes de subir

1. `npm run validar -- guiones/<id>.json` para cada uno: cero errores.
2. Releer cada afirmación contra su fuente y quitar la que no se pueda defender.
3. Agregar los 4 a `temas/historial.json` (`id`, `tema`, `pilar`, `narrador`, `protagonistas`).
4. Un solo commit con los 4 guiones + historial, push a `main`. El push dispara el render y la subida a Drive.

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
