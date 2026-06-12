# language: es
Feature: Panel de Administración
  Como administrador del sistema
  Quiero poder gestionar usuarios, promociones y configuraciones
  Para mantener el sistema funcionando correctamente

  Background:
    Dado que estoy autenticado como administrador
    Y tengo permisos de administración

  Scenario: Acceder al panel de administración
    Dado que estoy autenticado como admin
    Cuando navego a "/admin"
    Entonces debería ver el panel de administración
    Y debería ver secciones organizadas por categorías:
      | Categoría                    | Descripción                    |
      | Gestión de Usuarios          | Usuarios, roles, permisos     |
      | Gestión de Promociones       | Promociones y campañas         |
      | Gestión de Influencers       | Perfiles de influencers        |
      | Gestión de Marcas            | Perfiles de marcas            |
      | Gestión de Agencias          | Perfiles de agencias          |
      | Verificaciones KYC           | Procesos de verificación      |
      | Sistema de Pagos             | Transacciones y pagos         |
      | Analytics y Reportes         | Métricas del sistema          |
      | Configuración del Sistema    | Ajustes generales              |

  Scenario: Gestionar usuarios en el panel de admin
    Dado que estoy en "/admin"
    Y estoy en la sección "Gestión de Usuarios"
    Cuando veo la lista de usuarios
    Entonces debería poder:
      | Acción             | Descripción                    |
      | Ver detalles       | Ver información completa        |
      | Editar usuario     | Modificar información          |
      | Cambiar rol        | Asignar diferentes roles        |
      | Activar/Desactivar| Habilitar o deshabilitar cuenta |
      | Ver historial      | Ver actividad del usuario       |
      | Eliminar usuario   | Eliminar cuenta (con confirmación)|

  Scenario: Aprobar o rechazar verificación KYC
    Dado que estoy en "/admin"
    Y estoy en la sección "Verificaciones KYC"
    Cuando veo las solicitudes pendientes
    Entonces debería ver información de cada solicitud:
      | Información        | Descripción                    |
      | Usuario            | Nombre y email                  |
      | Fecha de envío     | Cuándo se envió                 |
      | Documentos         | INE, comprobante, etc.          |
      | Estado             | Pendiente, Aprobado, Rechazado  |
    Cuando reviso los documentos
    Y hago clic en "Aprobar"
    Entonces el usuario debería ser notificado
    Y su estado KYC debería cambiar a "Aprobado"
    Cuando hago clic en "Rechazar"
    Y proporciono razones del rechazo
    Entonces el usuario debería ser notificado
    Y su estado KYC debería cambiar a "Rechazado"

  Scenario: Gestionar promociones desde el panel de admin
    Dado que estoy en "/admin"
    Y estoy en la sección "Gestión de Promociones"
    Cuando veo la lista de promociones
    Entonces debería poder:
      | Acción             | Descripción                    |
      | Ver detalles       | Ver información completa       |
      | Editar promoción   | Modificar información          |
      | Aprobar/Rechazar   | Moderar promociones            |
      | Pausar/Activar     | Controlar visibilidad           |
      | Eliminar           | Eliminar promoción              |
      | Ver estadísticas   | Ver métricas de la promoción    |

  Scenario: Ver analytics del sistema
    Dado que estoy en "/admin"
    Y estoy en la sección "Analytics y Reportes"
    Entonces debería ver métricas generales:
      | Métrica              | Descripción                    |
      | Usuarios totales     | Total de usuarios registrados |
      | Usuarios activos    | Usuarios activos este mes     |
      | Promociones activas  | Promociones en curso          |
      | Transacciones        | Total de transacciones        |
      | Ingresos             | Ingresos totales del sistema  |
      | Leads generados      | Leads generados              |
    Y debería ver gráficos con:
      | Tipo de gráfico      | Descripción                    |
      | Crecimiento usuarios | Evolución de usuarios          |
      | Promociones por categoría| Distribución            |
      | Ingresos por mes     | Ingresos mensuales             |
      | Actividad por tipo usuario| Distribución por rol    |

  Scenario: Gestionar roles y permisos
    Dado que estoy en "/admin"
    Y estoy en la sección "Gestión de Usuarios" > "Roles y Permisos"
    Cuando veo la lista de roles
    Entonces debería poder:
      | Acción             | Descripción                    |
      | Crear nuevo rol    | Definir nuevo rol              |
      | Editar rol         | Modificar permisos             |
      | Asignar permisos   | Configurar capacidades         |
      | Ver usuarios con rol| Lista de usuarios por rol     |
      | Eliminar rol       | Eliminar rol (con validación)   |

  Scenario: Moderar contenido
    Dado que estoy en "/admin"
    Y estoy en la sección "Moderación de Contenido"
    Cuando veo reportes de contenido
    Entonces debería poder:
      | Acción             | Descripción                    |
      | Ver reporte        | Detalles del reporte            |
      | Aprobar contenido  | Marcar como aprobado           |
      | Rechazar contenido | Eliminar o ocultar contenido   |
      | Advertir usuario   | Enviar advertencia              |
      | Bloquear usuario   | Bloquear temporal o permanente  |

  Scenario: Gestionar pagos y transacciones
    Dado que estoy en "/admin"
    Y estoy en la sección "Sistema de Pagos"
    Cuando veo las transacciones
    Entonces debería ver:
      | Información        | Descripción                    |
      | Usuario            | Quién realizó la transacción    |
      | Tipo               | Pago, comisión, reembolso      |
      | Monto              | Cantidad de la transacción      |
      | Estado             | Completado, pendiente, fallido |
      | Fecha              | Cuándo ocurrió                 |
    Y debería poder:
      | Acción             | Descripción                    |
      | Ver detalles       | Información completa           |
      | Procesar pago      | Marcar como procesado           |
      | Reembolsar         | Procesar reembolso              |
      | Exportar reporte   | Descargar reporte de pagos      |

  Scenario: Configurar sistema
    Dado que estoy en "/admin"
    Y estoy en la sección "Configuración del Sistema"
    Entonces debería poder configurar:
      | Configuración      | Descripción                    |
      | Parámetros generales| Configuración básica         |
      | Integraciones      | APIs y servicios externos       |
      | Notificaciones     | Configuración de notificaciones |
      | Comisiones         | Tasas y porcentajes            |
      | Límites            | Límites del sistema            |
      | Mantenimiento      | Modo mantenimiento             |

