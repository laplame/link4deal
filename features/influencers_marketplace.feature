# language: es
Feature: Marketplace de Influencers
  Como marca o agencia
  Quiero poder explorar y evaluar influencers disponibles
  Para encontrar el talento adecuado para mis campañas

  Background:
    Dado que estoy autenticado como marca o agencia
    Y estoy en la página "/influencers"

  Scenario: Explorar influencers disponibles
    Dado que hay influencers registrados en el sistema
    Cuando accedo a "/influencers"
    Entonces debería ver una lista de influencers disponibles
    Y cada tarjeta de influencer debería mostrar:
      | Elemento              | Descripción                    |
      | Avatar                | Foto de perfil                 |
      | Nombre                | Nombre completo                |
      | Username              | @username                      |
      | Biografía             | Descripción breve              |
      | Categorías            | Tags de especialización        |
      | Ubicación             | Ciudad y país                  |
      | Total de seguidores   | Suma de todas las plataformas  |
      | Engagement rate       | Porcentaje de engagement       |
      | Rating                | Calificación de satisfacción   |
      | Ganancias totales     | Monto total ganado             |
    Y debería ver métricas del dashboard:
      | Métrica                    | Descripción           |
      | Total de influencers       | Total disponible      |
      | Seguidores totales         | En millones           |
      | Ganancias totales          | Generadas             |
      | Promociones activas        | En curso              |

  Scenario: Buscar influencers por texto
    Dado que estoy en "/influencers"
    Cuando ingreso "María" en el campo de búsqueda
    Y hago clic en "Buscar"
    Entonces debería ver solo influencers cuyo nombre contenga "María"
    Y los resultados deberían estar filtrados

  Scenario: Filtrar influencers por categoría
    Dado que estoy en "/influencers"
    Cuando selecciono el filtro "Categoría: Moda"
    Entonces debería ver solo influencers especializados en Moda
    Y el contador de resultados debería actualizarse

  Scenario: Filtrar influencers por ubicación
    Dado que estoy en "/influencers"
    Cuando selecciono el filtro "Ubicación: Ciudad de México"
    Entonces debería ver solo influencers ubicados en Ciudad de México
    Y los resultados deberían estar filtrados geográficamente

  Scenario: Filtrar influencers por rango de seguidores
    Dado que estoy en "/influencers"
    Cuando selecciono el filtro "Seguidores: 100K - 500K"
    Entonces debería ver solo influencers con seguidores en ese rango
    Y los resultados deberían estar filtrados correctamente

  Scenario: Filtrar influencers por engagement rate
    Dado que estoy en "/influencers"
    Cuando selecciono el filtro "Engagement: 4% - 6%"
    Entonces debería ver solo influencers con engagement en ese rango
    Y los resultados deberían estar filtrados por métrica

  Scenario: Ver perfil completo de influencer
    Dado que estoy en "/influencers"
    Cuando hago clic en "Ver Perfil Completo" de un influencer
    Entonces debería abrirse un modal con el perfil detallado
    Y debería ver 4 pestañas:
      | Pestaña    | Contenido                                    |
      | Overview   | Resumen, biografía, estadísticas principales |
      | Promociones| Historial de campañas y promociones          |
      | Pagos      | Historial de transacciones y pagos          |
      | Analytics  | Gráficos y métricas de rendimiento          |

  Scenario: Ver información detallada en pestaña Overview
    Dado que estoy viendo el perfil de un influencer
    Y estoy en la pestaña "Overview"
    Entonces debería ver:
      | Sección              | Información                          |
      | Biografía completa   | Descripción detallada                |
      | Ubicación            | Ciudad, país, fecha de registro      |
      | Categorías           | Tags de especialización              |
      | Estadísticas         | Seguidores, engagement, rating       |
      | Redes sociales       | Instagram, TikTok, YouTube, Twitter  |
      | Estadísticas cupones | Total, activos, ventas, comisión     |

  Scenario: Ver historial de promociones
    Dado que estoy viendo el perfil de un influencer
    Y estoy en la pestaña "Promociones"
    Entonces debería ver una lista de promociones con:
      | Campo          | Descripción                    |
      | Marca          | Nombre de la marca             |
      | Título         | Título de la campaña           |
      | Estado         | Completada, Activa, Pendiente  |
      | Ganancias      | Monto ganado                   |
      | Código cupón   | Código utilizado               |
      | Usos del cupón | Número de usos                 |
      | Ventas         | Ventas generadas                |

  Scenario: Ver historial de pagos
    Dado que estoy viendo el perfil de un influencer
    Y estoy en la pestaña "Pagos"
    Entonces debería ver una lista de transacciones con:
      | Campo        | Descripción                          |
      | Tipo         | Comisión, Bono, Referral            |
      | Estado       | Pagado, Pendiente, Procesando       |
      | Monto        | Cantidad de la transacción           |
      | Descripción  | Detalles de la transacción          |
      | Fecha        | Fecha de la transacción              |

  Scenario: Ver analytics del influencer
    Dado que estoy viendo el perfil de un influencer
    Y estoy en la pestaña "Analytics"
    Entonces debería ver gráficos y métricas:
      | Métrica              | Descripción                    |
      | Rendimiento mensual  | Gráfico de rendimiento         |
      | Métricas de cupones  | Estadísticas de cupones        |
      | Comparativa redes    | Comparación entre plataformas  |
      | Gráficos             | Visualizaciones de datos       |

  Scenario: Contactar influencer
    Dado que estoy viendo el perfil de un influencer
    Cuando hago clic en "Contactar Influencer"
    Entonces debería abrirse un formulario o modal de contacto
    Y debería poder enviar un mensaje al influencer
    Cuando envío el mensaje
    Entonces el influencer debería recibir una notificación
    Y debería ver un mensaje de confirmación

  Scenario: Guardar perfil de influencer
    Dado que estoy viendo el perfil de un influencer
    Cuando hago clic en "Guardar Perfil"
    Entonces el influencer debería ser agregado a mi lista de favoritos
    Y debería ver un indicador de que está guardado
    Y podré acceder a mis favoritos desde mi dashboard

