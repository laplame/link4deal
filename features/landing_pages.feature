# language: es
Feature: Landing Pages
  Como visitante o usuario
  Quiero poder acceder a diferentes landing pages
  Para entender los diferentes servicios y propuestas de valor

  Background:
    Dado que estoy navegando por el sitio web

  Scenario: Ver landing page principal
    Dado que estoy en la página principal "/"
    Entonces debería ver la landing page principal con:
      | Sección              | Descripción                    |
      | Hero section         | Título principal y CTAs        |
      | Ofertas destacadas   | Productos en oferta            |
      | Categorías           | Categorías principales          |
      | Mapa de ofertas      | Ofertas geolocalizadas         |
      | Noticias             | Sección de noticias            |
      | Footer                | Información y enlaces          |
    Y debería poder navegar a diferentes secciones
    Y debería ver un header con navegación

  Scenario: Ver landing page para negocios
    Dado que estoy navegando por el sitio
    Cuando accedo a "/landing"
    Entonces debería ver la landing page para negocios con:
      | Sección              | Descripción                    |
      | Propuesta de valor   | Beneficios para negocios       |
      | Cómo funciona        | Proceso paso a paso            |
      | Casos de éxito       | Testimonios de negocios        |
      | Precios              | Planes y precios               |
      | CTA de registro      | Botón para registrarse          |
    Y el contenido debería estar orientado a marcas y negocios

  Scenario: Ver landing page de comisionista digital
    Dado que estoy navegando por el sitio
    Cuando accedo a "/comisionista-digital"
    Entonces debería ver la landing page de comisionista digital con:
      | Sección              | Descripción                    |
      | Hero con propuesta   | Gana desde $50 USD por campaña |
      | Estadísticas        | Números impresionantes         |
      | Beneficios           | Ventajas del programa          |
      | Qué es un Lead       | Explicación de leads           |
      | Qué es un Deal       | Explicación de deals           |
      | Tipos de comisiones  | Formas de ganar                |
      | Plataformas          | Redes sociales soportadas      |
      | Proceso paso a paso | Cómo empezar                   |
      | Casos de éxito       | Testimonios de comisionistas   |
      | CTA final            | Registrarse gratis              |
    Y el contenido debería estar orientado a influencers y creadores

  Scenario: Navegar desde landing page principal a otras secciones
    Dado que estoy en la página principal "/"
    Cuando hago clic en enlaces del header o footer
    Entonces debería poder navegar a:
      | Destino              | Descripción                    |
      | /marketplace         | Marketplace de promociones    |
      | /influencers         | Marketplace de influencers     |
      | /categories          | Categorías                    |
      | /about               | Acerca de nosotros            |
      | /signin               | Iniciar sesión                |
      | /signup               | Registrarse                    |

  Scenario: Ver ofertas destacadas en landing principal
    Dado que estoy en la página principal "/"
    Cuando veo la sección "Ofertas Destacadas"
    Entonces debería ver productos en oferta con:
      | Información        | Descripción                    |
      | Imagen             | Foto del producto              |
      | Nombre             | Nombre del producto            |
      | Precio original    | Precio sin descuento           |
      | Precio promocional | Precio con descuento           |
      | Descuento          | Porcentaje de descuento        |
      | Badge "Hot"        | Si es oferta caliente          |
      | Ubicación          | Dónde está disponible          |
    Y debería poder hacer clic para ver más detalles

  Scenario: Ver mapa de ofertas en landing principal
    Dado que estoy en la página principal "/"
    Cuando veo la sección "Mapa de Ofertas"
    Entonces debería ver un mapa interactivo
    Y debería ver marcadores de ofertas disponibles
    Cuando hago clic en un marcador
    Entonces debería ver información de la oferta
    Y debería poder navegar a los detalles de la oferta

  Scenario: Interactuar con sección de noticias
    Dado que estoy en la página principal "/"
    Cuando veo la sección "Noticias"
    Entonces debería ver noticias o actualizaciones recientes
    Y debería poder:
      | Acción             | Descripción                    |
      | Ver más noticias   | Cargar más contenido           |
      | Filtrar por categoría| Filtrar noticias             |
      | Ver detalles       | Leer noticia completa           |

  Scenario: Registrarse desde landing page
    Dado que estoy en cualquier landing page
    Cuando hago clic en "Registrarse" o "Comenzar Gratis"
    Entonces debería ser redirigido a "/signup"
    Y el formulario de registro debería estar disponible
    Y después de registrarme, debería ser redirigido según el contexto de la landing page

  Scenario: Ver información de contacto y soporte
    Dado que estoy en cualquier landing page
    Cuando veo el footer
    Entonces debería ver información de contacto:
      | Información        | Descripción                    |
      | Email              | Email de contacto              |
      | Teléfono           | Número de teléfono             |
      | Redes sociales     | Enlaces a redes sociales       |
      | Enlaces útiles     | Política de privacidad, Términos|
    Y debería poder hacer clic en estos enlaces

