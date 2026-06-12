# language: es
# Archivo: features/seo_paginas_publicas.feature
# Contexto técnico: app Vite con renderizado del lado del cliente.
# Objetivo: que /influencer y /marketplace sean indexables por Google
# mediante prerendering/SSR, meta tags únicos y plomería SEO básica.

Característica: Indexabilidad de páginas públicas en buscadores
  Como responsable de crecimiento de DameCodigo
  Quiero que las páginas públicas entreguen HTML renderizado desde el servidor
  Para que Google pueda indexarlas y generar adquisición orgánica de influencers y comercios

  Antecedentes:
    Dado que el sitio "damecodigo.com" está desplegado en producción
    Y que el cliente de prueba NO ejecuta JavaScript

  Escenario: La página de influencers entrega contenido sin JavaScript
    Cuando solicito "https://www.damecodigo.com/influencer" vía HTTP GET
    Entonces la respuesta tiene código de estado 200
    Y el HTML contiene el texto visible "influencer"
    Y el HTML contiene al menos 1 tarjeta de influencer renderizada
    Y el contenido principal NO depende de la ejecución de JavaScript

  Escenario: La página del marketplace entrega contenido sin JavaScript
    Cuando solicito "https://www.damecodigo.com/marketplace" vía HTTP GET
    Entonces la respuesta tiene código de estado 200
    Y el HTML contiene al menos 1 promoción renderizada con nombre de comercio y descuento

  Esquema del escenario: Cada página pública tiene meta tags únicos y descriptivos
    Cuando solicito "<url>" vía HTTP GET
    Entonces el <title> del HTML es "<titulo_esperado>"
    Y la meta description contiene "<keyword_principal>"
    Y la meta description es distinta a la del homepage
    Y existe una etiqueta canonical apuntando a "<url>"
    Y existen etiquetas Open Graph "og:title", "og:description" y "og:image" propias de la página

    Ejemplos:
      | url                                          | titulo_esperado                                                      | keyword_principal      |
      | https://www.damecodigo.com/influencer        | Gana dinero como influencer en México — comisiones por venta         | influencer             |
      | https://www.damecodigo.com/marketplace       | Promociones y descuentos cerca de ti — DameCodigo                    | promociones            |

  Escenario: Las URLs públicas usan paths reales y no rutas con hash
    Cuando navego por las páginas públicas del sitio
    Entonces ninguna URL pública contiene el carácter "#" como mecanismo de ruteo
    Y cada página pública responde 200 al acceso directo por su URL

  Escenario: El sitemap incluye todas las páginas públicas y se mantiene actualizado
    Cuando solicito "https://www.damecodigo.com/sitemap.xml"
    Entonces la respuesta tiene código de estado 200
    Y el sitemap incluye la URL "/influencer"
    Y el sitemap incluye la URL "/marketplace"
    Y el sitemap incluye una URL por cada promoción activa
    Y el sitemap excluye promociones expiradas o despublicadas

  Escenario: robots.txt permite el rastreo de páginas públicas
    Cuando solicito "https://www.damecodigo.com/robots.txt"
    Entonces la respuesta tiene código de estado 200
    Y las rutas "/influencer" y "/marketplace" NO están bloqueadas para "User-agent: *"
    Y el robots.txt declara la ubicación del sitemap

  Escenario: Las previews en redes sociales muestran información correcta
    Cuando un servicio externo (WhatsApp, Facebook, X) solicita "https://www.damecodigo.com/influencer" sin ejecutar JavaScript
    Entonces obtiene og:title, og:description y og:image específicos de la página de influencers
    Y la imagen og:image responde 200 y tiene dimensiones mínimas de 1200x630 píxeles
