# Paquete web para GitHub · Saberes del Territorio

## Contenido
- `index.html`: página de muestra con la ficha del taller micológico y botones INSCRIBIRME / VER TALLER *debajo de los datos*, y sin estos botones en los talleres ya celebrados.
- `micologia.html`: página de detalle, con la **imagen de las manos con setas en la columna derecha** donde la señalaste.
- `assets/micologia-manos-setas.png`: nueva imagen para esa columna.
- `styles.css` y `site.js`: estilos y prevención de enlaces no configurados.

## Importante antes de publicar
Este paquete es una implementación HTML autónoma, **no un parche directo del repositorio actual**, porque el repositorio de Saberes no está accesible en la cuenta de GitHub conectada. No sustituir el `index.html` real sin integrarlo: se perderían las otras secciones existentes.

1. Copiar `assets/micologia-manos-setas.png` a la carpeta de imágenes de la web y actualizar el `src` de la imagen de la ficha de micología.
2. En la ficha de micología, colocar ambos botones al final del texto, dentro de `<div class="actions">`.
3. En las fichas ya celebradas, quitar los dos botones; conservar su contenido y cualquier acceso existente al archivo audiovisual si se desea.
4. Sustituir `INSCRIPCION_URL_PENDIENTE` por la URL real del formulario de inscripción antes de publicar.
5. Adaptar los nombres de archivos/rutas al proyecto real. No se han inventado enlaces de inscripción.

La imagen se ha generado tomando la estética de la referencia y reproduciendo la composición de manos con setas; no es una modificación pixel a pixel del recurso original.
