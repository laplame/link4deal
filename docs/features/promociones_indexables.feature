# language: es
# Archivo: features/promociones_indexables.feature
# Objetivo: que cada promoción y cada comercio tengan URL pública indexable
# con datos estructurados, para capturar búsquedas locales de alta intención
# (ej. "descuento tacos Roma Norte").

Característica: Promociones y comercios con páginas públicas indexables
  Como responsable de crecimiento
  Quiero que cada promoción activa tenga su propia URL con datos estructurados
  Para capturar tráfico orgánico de búsquedas locales y convertirlo en canjes

  Antecedentes:
    Dado que existen promociones activas publicadas por comercios

  Escenario: Cada promoción activa tiene una URL pública única y legible
    Dado que existe la promoción "20% de descuento" del comercio "Tacos El Güero" en la zona "Roma Norte"
    Entonces existe la URL "/promo/20-descuento-tacos-el-guero-roma-norte"
    Y la URL responde 200 al acceso directo sin ejecutar JavaScript
    Y el HTML contiene el nombre del comercio, el descuento, la zona y la vigencia

  Escenario: Las promociones expiradas no devuelven contenido indexable activo
    Dado que una promoción ha expirado
    Cuando solicito su URL pública
    Entonces la página indica que la promoción ya no está vigente
    Y sugiere promociones activas del mismo comercio o zona
    Y la página responde con código 200 y meta robots "noindex" o redirige 301 a la página del comercio

  Escenario: Cada promoción incluye datos estructurados schema.org
    Cuando solicito la URL pública de una promoción activa
    Entonces el HTML incluye un bloque JSON-LD válido de tipo "Offer"
    Y el JSON-LD declara nombre, descripción, descuento o precio, vigencia ("validThrough") y comercio ("offeredBy")
    Y el comercio se describe con tipo "LocalBusiness" incluyendo nombre, dirección y geolocalización
    Y el JSON-LD pasa la validación del Rich Results Test de Google

  Escenario: Cada comercio tiene página pública con sus promociones vigentes
    Dado que el comercio "Tacos El Güero" tiene 3 promociones activas
    Entonces existe la URL pública "/comercio/tacos-el-guero"
    Y la página lista sus 3 promociones activas con enlace a cada una
    Y el HTML incluye JSON-LD de tipo "LocalBusiness"

  Esquema del escenario: Páginas de agregación por zona y categoría
    Entonces existe la URL pública "<url>"
    Y la página lista promociones activas que coinciden con "<criterio>"
    Y el <title> contiene "<keyword>"
    Y la página responde 200 sin ejecutar JavaScript

    Ejemplos:
      | url                                  | criterio                    | keyword                      |
      | /promociones/roma-norte              | zona = Roma Norte           | promociones en Roma Norte    |
      | /promociones/restaurantes-cdmx       | categoría = restaurantes    | descuentos restaurantes CDMX |
      | /promociones/belleza-cdmx            | categoría = belleza         | descuentos belleza CDMX      |

  Escenario: El sitemap se regenera al publicar o expirar promociones
    Dado que se publica una nueva promoción
    Entonces su URL aparece en "sitemap.xml" en la siguiente regeneración
    Dado que una promoción expira
    Entonces su URL se elimina del sitemap en la siguiente regeneración

  Escenario: La página de promoción tiene llamado a la acción funcional
    Cuando visito la URL pública de una promoción activa
    Entonces veo un botón para obtener el código o cupón QR
    Y veo el enlace o botón de contacto del comercio por WhatsApp
    Y la acción principal es utilizable desde dispositivo móvil
