# language: es
Feature: Dashboards de Usuarios
  Como usuario con diferentes roles
  Quiero poder acceder a mi dashboard personalizado
  Para gestionar mis actividades y ver mis métricas

  Background:
    Dado que estoy autenticado en el sistema

  Scenario: Acceder al dashboard de Influencer
    Dado que estoy autenticado como influencer
    Cuando navego a "/admin/influencers"
    Entonces debería ver mi dashboard de influencer con:
      | Sección           | Contenido                          |
      | Métricas principales| Seguidores, engagement, ganancias|
      | Promociones activas| Lista de promociones en curso     |
      | Aplicaciones      | Estado de mis aplicaciones         |
      | Cupones           | Cupones creados y estadísticas      |
      | Pagos             | Historial y próximos pagos          |
      | Analytics         | Gráficos de rendimiento            |

  Scenario: Ver métricas principales en dashboard de Influencer
    Dado que estoy en mi dashboard de influencer
    Entonces debería ver cards con métricas clave:
      | Métrica              | Descripción                    |
      | Total de seguidores  | Suma de todas las plataformas  |
      | Engagement rate      | Porcentaje promedio            |
      | Ganancias del mes    | Ingresos del mes actual        |
      | Ganancias totales    | Ingresos acumulados            |
      | Promociones activas  | Cantidad de promociones        |
      | Cupones activos      | Cupones actualmente activos    |

  Scenario: Ver promociones aplicadas en dashboard de Influencer
    Dado que estoy en mi dashboard de influencer
    Y he aplicado a varias promociones
    Cuando veo la sección "Mis Aplicaciones"
    Entonces debería ver una lista con:
      | Información        | Descripción                    |
      | Nombre de promoción| Título de la campaña          |
      | Marca              | Nombre de la marca             |
      | Estado             | Pendiente, Aceptada, Rechazada |
      | Fecha de aplicación| Cuándo apliqué                 |
      | Comisión ofrecida  | Monto de comisión              |
    Y debería poder filtrar por estado
    Y debería poder ver detalles de cada aplicación

  Scenario: Acceder al dashboard de Brand
    Dado que estoy autenticado como marca
    Cuando navego a "/admin/brands"
    Entonces debería ver mi dashboard de marca con:
      | Sección           | Contenido                          |
      | Métricas principales| Leads, ventas, ROI               |
      | Promociones creadas| Lista de mis promociones          |
      | Aplicaciones recibidas| Aplicaciones de influencers   |
      | Influencers contratados| Influencers activos          |
      | Analytics         | Métricas de campañas               |

  Scenario: Ver métricas principales en dashboard de Brand
    Dado que estoy en mi dashboard de marca
    Entonces debería ver cards con métricas clave:
      | Métrica              | Descripción                    |
      | Leads generados      | Total de leads del mes         |
      | Ventas totales       | Ventas generadas               |
      | ROI                  | Retorno de inversión           |
      | Promociones activas  | Campañas en curso              |
      | Influencers activos  | Influencers trabajando         |
      | Presupuesto usado    | Presupuesto gastado            |

  Scenario: Gestionar aplicaciones en dashboard de Brand
    Dado que estoy en mi dashboard de marca
    Y tengo promociones con aplicaciones recibidas
    Cuando veo la sección "Aplicaciones Recibidas"
    Entonces debería ver una lista de aplicaciones con:
      | Información        | Descripción                    |
      | Influencer         | Nombre y perfil                 |
      | Promoción          | Título de la campaña            |
      | Propuesta          | Resumen de la propuesta         |
      | Precio ofrecido    | Monto de la propuesta           |
      | Fecha              | Cuándo se recibió               |
    Y debería poder:
      | Acción             | Descripción                    |
      | Aprobar            | Aceptar la aplicación           |
      | Rechazar           | Rechazar la aplicación         |
      | Ver detalles       | Ver propuesta completa          |
      | Contactar          | Iniciar conversación            |

  Scenario: Acceder al dashboard de Agency
    Dado que estoy autenticado como agencia
    Cuando navego a "/admin/agencies"
    Entonces debería ver mi dashboard de agencia con:
      | Sección           | Contenido                          |
      | Métricas principales| Clientes, campañas, ROI         |
      | Clientes          | Lista de clientes gestionados     |
      | Campañas activas  | Campañas en curso                 |
      | Influencers       | Influencers en mi red             |
      | Reportes          | Reportes y analytics              |

  Scenario: Ver métricas principales en dashboard de Agency
    Dado que estoy en mi dashboard de agencia
    Entonces debería ver cards con métricas clave:
      | Métrica              | Descripción                    |
      | Clientes activos     | Número de clientes             |
      | Campañas activas     | Campañas en curso              |
      | ROI promedio         | Retorno promedio               |
      | Influencers en red   | Total de influencers           |
      | Ingresos del mes     | Ingresos mensuales              |
      | Comisiones ganadas   | Comisiones acumuladas          |

  Scenario: Ver analytics y reportes
    Dado que estoy en cualquier dashboard (Influencer, Brand, Agency)
    Cuando accedo a la sección "Analytics"
    Entonces debería ver gráficos y reportes con:
      | Tipo de gráfico      | Descripción                    |
      | Rendimiento mensual  | Gráfico de líneas             |
      | Distribución por categoría| Gráfico de pastel        |
      | Comparativa de campañas| Gráfico de barras            |
      | Tendencias          | Análisis de tendencias          |
    Y debería poder:
      | Acción             | Descripción                    |
      | Filtrar por fecha  | Seleccionar rango de fechas    |
      | Exportar datos     | Descargar reporte              |
      | Ver detalles       | Profundizar en métricas         |

  Scenario: Navegar entre secciones del dashboard
    Dado que estoy en mi dashboard
    Cuando hago clic en diferentes secciones del menú lateral
    Entonces debería poder navegar entre:
      | Sección            | Descripción                    |
      | Inicio             | Vista general                  |
      | Promociones        | Gestión de promociones          |
      | Aplicaciones       | Aplicaciones y propuestas       |
      | Cupones            | Gestión de cupones              |
      | Pagos              | Historial de pagos               |
      | Analytics          | Reportes y métricas        |
      | Configuración      | Ajustes del perfil             |

