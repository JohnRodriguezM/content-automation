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

Un buen tema tiene: una **decisión concreta** de una persona o empresa real, una **consecuencia** medible y una **lección** que alguien que emprende o trabaja pueda aplicar. Busca historias poco contadas o un ángulo nuevo de una conocida. Evita temas que solo existan como rumor o que no tengan al menos dos fuentes serias.

## Investigación y fuentes

- Cada cifra, fecha o hecho sobre una empresa o persona real va en `fuentes` con la URL de donde salió (medio reconocido, reporte anual, libro, entrevista, documento oficial). Mínimo 2 fuentes, salvo en tecnología conceptual.
- Lee la fuente (no solo el snippet del buscador) antes de usar un dato.
- Si un dato no se puede verificar: quítalo o generalízalo. Si las fuentes no coinciden, usa la cifra más conservadora o dilo.
- Nada de citas textuales sin fuente primaria. Nada de atribuir pensamientos privados como hechos.

## Estructura y longitud

- Escenas en orden: gancho → contexto → decisión → consecuencia → aprendizaje → cierre (puede haber 2 escenas del mismo bloque seguidas).
- **120 a 190 palabras** de narración en total (≈45-70 s). `npm run validar` lo revisa.
- Gancho: la primera frase tiene que funcionar sola.
- **Cierre (fijo):** una pregunta sobre la decisión del video, seguida de: "Te leo en los comentarios. Y si te gustan estas historias, síguenos: cada día contamos una decisión que cambió una empresa." El `caption` termina con la misma pregunta y la línea "Síguenos: cada día contamos una decisión que cambió una empresa." Sin @ ni tarjeta final por ahora.

## Etiquetas de voz (expresividad)

La voz usa Eleven v4 (con alta similitud a la voz clonada), que interpreta etiquetas entre corchetes dentro de `narracion`. No salen en los subtítulos ni cuentan como palabras.
- En inglés, minúsculas: `[curious]`, `[thoughtful]`, `[serious]`, `[excited]`, `[sighs]`, `[laughs softly]`, `[pause]`, `[whispers]`.
- 3 a 6 por guion. Donde cambia la emoción: curiosidad en el gancho, un suspiro antes del giro, emoción en el resultado, tono serio en la lección.
- Nunca en el cierre fijo. Nunca dos seguidas. La risa solo cuando el hecho es de verdad irónico o gracioso.

## Imágenes (`imagenes`, 1-3 por escena)

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
