# language: es
Feature: Sistema de Referidos
  Como usuario de la plataforma
  Quiero poder referir a otros usuarios y ganar comisiones
  Para aumentar mis ingresos y ayudar a crecer la comunidad

  Background:
    Dado que estoy autenticado como usuario
    Y tengo un código de referido único

  Scenario: Acceder a la página del sistema de referidos
    Dado que estoy autenticado
    Cuando navego a "/referral-system"
    Entonces debería ver la página del sistema de referidos
    Y debería ver mi código de referido único
    Y debería ver estadísticas de mis referidos

  Scenario: Ver mi código de referido
    Dado que estoy en "/referral-system"
    Entonces debería ver:
      | Elemento              | Descripción                    |
      | Código único           | Mi código de referido          |
      | Link de referido       | Link para compartir           |
      | QR Code                | Código QR para compartir        |
      | Botón copiar           | Copiar código o link           |

  Scenario: Ver estadísticas de referidos
    Dado que estoy en "/referral-system"
    Entonces debería ver estadísticas como:
      | Métrica              | Descripción                    |
      | Referidos totales    | Cantidad de personas referidas  |
      | Referidos activos    | Referidos que completaron setup |
      | Comisiones ganadas   | Total de comisiones             |
      | Comisiones pendientes| Comisiones por procesar         |
      | Ranking              | Mi posición en el ranking       |

  Scenario: Compartir código de referido
    Dado que estoy en "/referral-system"
    Cuando hago clic en "Compartir"
    Entonces debería ver opciones para compartir en:
      | Plataforma    | Descripción                    |
      | WhatsApp      | Compartir por WhatsApp         |
      | Email         | Enviar por email               |
      | Redes sociales| Instagram, Facebook, Twitter   |
      | Copiar link   | Copiar link directo            |
    Cuando selecciono una opción
    Entonces el link debería incluir mi código de referido
    Y cuando alguien use ese link, debería ser registrado como mi referido

  Scenario: Registrar nuevo usuario como referido
    Dado que un usuario nuevo hace clic en mi link de referido
    Cuando el usuario se registra en la plataforma
    Entonces el usuario debería ser registrado como mi referido
    Y debería recibir una notificación de nuevo referido
    Y el contador de referidos debería incrementarse
    Y el nuevo usuario debería recibir un bono de bienvenida

  Scenario: Ganar comisión por referido activo
    Dado que tengo un referido registrado
    Cuando mi referido completa su perfil (setup)
    Entonces debería ganar una comisión por referido activo
    Y la comisión debería ser registrada en mi historial
    Y debería recibir una notificación
    Y el monto debería estar disponible para retiro

  Scenario: Ganar comisión por actividad del referido
    Dado que tengo un referido activo
    Cuando mi referido:
      | Acción del referido    | Comisión ganada              |
      | Completa primera promoción| Comisión por primera actividad|
      | Genera primera venta   | Comisión por primera venta   |
      | Alcanza cierto nivel   | Comisión por milestone       |
    Entonces debería ganar la comisión correspondiente
    Y debería ser notificado
    Y la comisión debería aparecer en mi dashboard

  Scenario: Ver historial de referidos
    Dado que estoy en "/referral-system"
    Cuando veo la sección "Historial de Referidos"
    Entonces debería ver una lista con:
      | Información        | Descripción                    |
      | Nombre del referido| Nombre del usuario referido    |
      | Fecha de registro  | Cuándo se registró            |
      | Estado             | Activo, Inactivo, Completado  |
      | Comisiones ganadas | Total de comisiones            |
      | Última actividad   | Última acción del referido     |

  Scenario: Ver historial de comisiones por referidos
    Dado que estoy en "/referral-system"
    Cuando veo la sección "Comisiones"
    Entonces debería ver una lista de comisiones con:
      | Información        | Descripción                    |
      | Referido           | De quién proviene              |
      | Tipo de comisión   | Registro, actividad, venta    |
      | Monto              | Cantidad de la comisión        |
      | Estado             | Pendiente, Pagada             |
      | Fecha              | Cuándo se ganó                 |

  Scenario: Retirar comisiones de referidos
    Dado que tengo comisiones acumuladas por referidos
    Y estoy en "/referral-system"
    Cuando veo el total de comisiones disponibles
    Y hago clic en "Retirar Comisiones"
    Entonces debería poder seleccionar el monto a retirar
    Y debería poder seleccionar método de pago
    Cuando confirmo el retiro
    Entonces la solicitud de retiro debería ser procesada
    Y debería recibir confirmación
    Y el monto debería ser transferido según los términos

  Scenario: Ver ranking de referidos
    Dado que estoy en "/referral-system"
    Cuando veo la sección "Ranking"
    Entonces debería ver un ranking de usuarios con más referidos
    Y debería ver mi posición en el ranking
    Y debería ver:
      | Información        | Descripción                    |
      | Posición            | Mi posición actual          |
      | Top referidores     | Usuarios con más referidos  |
      | Premios             | Premios por posición        |

