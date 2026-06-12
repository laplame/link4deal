# language: es
Feature: Marketplace de Promociones
  Como influencer
  Quiero poder explorar y aplicar a promociones disponibles
  Para generar ingresos promocionando productos y servicios

  Background:
    Dado que estoy autenticado como influencer
    Y estoy en la página "/marketplace"

  Scenario: Explorar promociones disponibles
    Dado que hay promociones activas en el sistema
    Cuando accedo a "/marketplace"
    Entonces debería ver una lista de promociones disponibles
    Y cada promoción debería mostrar:
      | Elemento              | Descripción                    |
      | Imagen del producto   | Foto del producto              |
      | Nombre de la marca    | Zara, Samsung, Nike, etc.      |
      | Título de promoción   | Descripción de la campaña     |
      | Precio original       | Precio sin descuento           |
      | Precio con descuento  | Precio promocional             |
      | Comisión ofrecida     | Monto de comisión              |
      | Tiempo restante       | Cuenta regresiva               |
      | Estado                | Activa, Terminando, Cerrada   |
    Y debería ver métricas del dashboard:
      | Métrica                    | Descripción           |
      | Promociones activas         | Total de activas       |
      | Terminando pronto         | Promociones próximas   |
      | Total de aplicaciones     | Aplicaciones totales   |
      | Comisión promedio         | Promedio de comisiones |

  Scenario: Buscar promociones por texto
    Dado que estoy en "/marketplace"
    Cuando ingreso "Samsung" en el campo de búsqueda
    Y hago clic en "Buscar"
    Entonces debería ver solo promociones relacionadas con Samsung
    Y los resultados deberían estar filtrados por el término de búsqueda

  Scenario: Filtrar promociones por categoría
    Dado que estoy en "/marketplace"
    Cuando selecciono el filtro "Categoría: Moda"
    Entonces debería ver solo promociones de la categoría Moda
    Y el contador de resultados debería actualizarse

  Scenario: Filtrar promociones por ubicación
    Dado que estoy en "/marketplace"
    Cuando selecciono el filtro "Ubicación: Ciudad de México"
    Entonces debería ver solo promociones disponibles en Ciudad de México
    Y las promociones deberían mostrar la distancia desde mi ubicación

  Scenario: Ordenar promociones
    Dado que estoy en "/marketplace"
    Cuando selecciono "Ordenar por: Terminando pronto"
    Entonces las promociones deberían estar ordenadas por tiempo restante (ascendente)
    Cuando cambio a "Ordenar por: Mayor comisión"
    Entonces las promociones deberían estar ordenadas por comisión (descendente)

  Scenario: Ver detalles de una promoción
    Dado que estoy en "/marketplace"
    Cuando hago clic en una promoción específica
    Entonces debería ser redirigido a "/promotion-details/:id"
    Y debería ver información detallada:
      | Sección              | Contenido                          |
      | Descripción completa | Detalles de la campaña            |
      | Requisitos           | Requisitos para influencers       |
      | Entregables          | Qué se espera entregar            |
      | Cronograma           | Fechas importantes                 |
      | Métricas             | Engagement, alcance, etc.          |
      | Aplicaciones         | Número de aplicaciones recibidas  |

  Scenario: Aplicar a una promoción
    Dado que estoy viendo los detalles de una promoción activa
    Y la promoción está abierta para aplicaciones
    Cuando hago clic en "Aplicar Ahora"
    Entonces debería abrirse un modal de aplicación
    Y debería poder completar los 4 pasos:
      | Paso | Descripción                          |
      | 1    | Propuesta de contenido                |
      | 2    | Portfolio y precios                  |
      | 3    | Cronograma y entregables             |
      | 4    | Resumen y envío                      |
    Cuando completo todos los pasos
    Y hago clic en "Enviar Aplicación"
    Entonces mi aplicación debería ser enviada
    Y debería ver un mensaje de confirmación
    Y la marca debería recibir una notificación

  Scenario: Aplicar a promoción con subasta holandesa
    Dado que hay una promoción con subasta holandesa activa
    Y estoy en los detalles de la promoción
    Cuando veo la información de la subasta
    Entonces debería ver el precio actual que desciende automáticamente
    Y debería ver el tiempo restante
    Cuando el precio alcanza un nivel aceptable
    Y hago clic en "Aplicar Ahora"
    Entonces mi aplicación debería ser registrada al precio actual
    Y debería recibir confirmación de mi aplicación

  Scenario: Aplicar a promoción con subasta inglesa
    Dado que hay una promoción con subasta inglesa activa
    Y estoy en los detalles de la promoción
    Cuando veo la información de la subasta
    Entonces debería ver las pujas actuales
    Y debería poder ingresar mi puja
    Cuando ingreso una puja mayor a la actual
    Y hago clic en "Enviar Puja"
    Entonces mi puja debería ser registrada
    Y debería ver mi posición en el ranking de pujas

