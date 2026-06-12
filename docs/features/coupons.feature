# language: es
Feature: Sistema de Cupones
  Como influencer o marca
  Quiero poder crear y gestionar cupones de descuento
  Para rastrear ventas y generar comisiones

  Background:
    Dado que estoy autenticado como influencer o marca

  Scenario: Crear un nuevo cupón como influencer
    Dado que estoy autenticado como influencer
    Y navego a "/create-coupon"
    Cuando completo el formulario de creación de cupón con:
      | Campo              | Valor                    |
      | Código             | DESCUENTO20              |
      | Tipo de descuento | Porcentaje               |
      | Valor              | 20                       |
      | Fecha de inicio    | 2024-03-01               |
      | Fecha de expiración| 2024-03-31               |
      | Uso máximo         | 100                      |
      | Producto asociado  | Producto específico      |
    Y hago clic en "Crear Cupón"
    Entonces el cupón debería ser creado
    Y debería ser visible en mi dashboard
    Y debería poder compartirlo con mis seguidores

  Scenario: Ver detalles de un cupón
    Dado que tengo un cupón creado
    Cuando navego a "/coupon/:couponId"
    Entonces debería ver información detallada del cupón:
      | Información        | Descripción                    |
      | Código             | Código del cupón              |
      | Descuento          | Porcentaje o monto            |
      | Validez            | Fechas de inicio y fin        |
      | Usos restantes     | Cantidad de usos disponibles  |
      | Producto           | Producto asociado             |
      | Estadísticas  | Ventas generadas               |
      | Comisión           | Comisión ganada               |

  Scenario: Usar un cupón válido
    Dado que hay un cupón activo con código "DESCUENTO20"
    Y estoy en el proceso de checkout
    Cuando ingreso el código "DESCUENTO20"
    Y hago clic en "Aplicar Cupón"
    Entonces el descuento del 20% debería ser aplicado
    Y el total debería actualizarse
    Y el cupón debería ser marcado como usado
    Y el contador de usos debería decrementarse

  Scenario: Intentar usar cupón expirado
    Dado que hay un cupón que expiró el día anterior
    Y estoy en el proceso de checkout
    Cuando ingreso el código del cupón expirado
    Y hago clic en "Aplicar Cupón"
    Entonces debería ver un mensaje de error "Cupón expirado"
    Y el descuento no debería ser aplicado

  Scenario: Intentar usar cupón con usos agotados
    Dado que hay un cupón que alcanzó su límite de usos
    Y estoy en el proceso de checkout
    Cuando ingreso el código del cupón
    Y hago clic en "Aplicar Cupón"
    Entonces debería ver un mensaje de error "Cupón agotado"
    Y el descuento no debería ser aplicado

  Scenario: Rastrear uso de cupón
    Dado que soy un influencer con un cupón activo
    Cuando un usuario usa mi cupón en una compra
    Entonces debería recibir una notificación
    Y el uso debería ser registrado en mi dashboard
    Y las estadísticas del cupón deberían actualizarse:
      | Métrica           | Actualización                |
      | Usos totales      | Incrementado en 1            |
      | Ventas generadas  | Incrementado por el monto    |
      | Comisión ganada   | Calculada según el acuerdo   |

  Scenario: Ver estadísticas de cupones en dashboard
    Dado que soy un influencer
    Y tengo múltiples cupones creados
    Cuando accedo a mi dashboard
    Entonces debería ver un resumen de mis cupones:
      | Métrica              | Descripción                    |
      | Total de cupones     | Cantidad total creados         |
      | Cupones activos      | Cupones actualmente activos    |
      | Ventas totales       | Suma de todas las ventas       |
      | Comisión total       | Suma de todas las comisiones    |
      | Conversión promedio  | Porcentaje de conversión        |

  Scenario: Redimir cupón desde página pública
    Dado que hay un cupón con código público
    Y un usuario navega a "/coupon/:couponId"
    Cuando el usuario hace clic en "Usar Este Cupón"
    Entonces debería ser redirigido al producto asociado
    Y el cupón debería ser aplicado automáticamente
    Y el usuario debería ver el descuento en el checkout

  Scenario: Compartir cupón en redes sociales
    Dado que tengo un cupón creado
    Cuando accedo a la página del cupón
    Y hago clic en "Compartir"
    Entonces debería ver opciones para compartir en:
      | Plataforma    | Descripción                    |
      | Instagram     | Link para compartir            |
      | TikTok        | Link para compartir            |
      | Facebook      | Link para compartir            |
      | Twitter       | Link para compartir            |
      | Copiar link   | Link directo al cupón          |
    Cuando selecciono una plataforma
    Entonces debería poder compartir el cupón
    Y el link debería incluir mi código de referencia

  Scenario: Generar comisión por uso de cupón
    Dado que soy un influencer con un cupón activo
    Y tengo un acuerdo de comisión del 10%
    Cuando un usuario usa mi cupón y realiza una compra de $1000
    Entonces debería ganar una comisión de $100
    Y la comisión debería ser registrada en mi historial de pagos
    Y el monto debería estar disponible para retiro según los términos

