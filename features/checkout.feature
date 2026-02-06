# language: es
Feature: Proceso de Checkout
  Como usuario
  Quiero poder completar mi compra de manera segura
  Para recibir los productos que he seleccionado

  Background:
    Dado que estoy autenticado como usuario
    Y tengo productos en mi carrito
    Y estoy en "/checkout"

  Scenario: Ver resumen de compra en checkout
    Dado que he navegado desde "/cart" a "/checkout"
    Entonces debería ver un resumen de mi compra con:
      | Elemento        | Descripción                    |
      | Productos       | Lista de productos              |
      | Cantidades      | Cantidad de cada producto      |
      | Precios         | Precio unitario y total        |
      | Subtotal        | Suma antes de descuentos       |
      | Descuentos      | Cupones aplicados              |
      | Envío           | Costo de envío                 |
      | Total           | Monto final a pagar            |

  Scenario: Completar información de envío
    Dado que estoy en "/checkout"
    Cuando completo el formulario de envío con:
      | Campo           | Valor                    |
      | Nombre completo | Juan Pérez                |
      | Dirección       | Calle Principal 123      |
      | Ciudad          | Ciudad de México          |
      | Estado          | CDMX                     |
      | Código postal   | 01234                    |
      | Teléfono        | 5551234567               |
    Entonces la información debería ser guardada
    Y el costo de envío debería calcularse automáticamente
    Y el total debería actualizarse

  Scenario: Seleccionar método de envío
    Dado que he completado la información de envío
    Cuando veo las opciones de envío disponibles
    Entonces debería ver opciones como:
      | Método          | Tiempo      | Costo    |
      | Estándar        | 5-7 días    | $50      |
      | Express         | 2-3 días    | $150     |
      | Overnight       | 1 día       | $300     |
    Cuando selecciono un método de envío
    Entonces el costo de envío debería actualizarse
    Y el total debería recalcularse

  Scenario: Completar información de pago
    Dado que he completado la información de envío
    Cuando completo el formulario de pago con:
      | Campo              | Valor                    |
      | Número de tarjeta  | 4111111111111111         |
      | Nombre en tarjeta  | Juan Pérez               |
      | Fecha expiración   | 12/25                    |
      | CVV                | 123                      |
    Entonces la información debería ser validada
    Y debería ver un indicador de que la tarjeta es válida

  Scenario: Validación de tarjeta de crédito
    Dado que estoy en la sección de pago
    Cuando ingreso un número de tarjeta inválido
    Entonces debería ver un mensaje de error
    Y no debería poder proceder con el pago
    Cuando ingreso un CVV inválido
    Entonces debería ver un mensaje de error específico
    Y el formulario debería indicar el campo con error

  Scenario: Aplicar cupón en checkout
    Dado que estoy en "/checkout"
    Y no he aplicado ningún cupón
    Cuando ingreso un código de cupón válido
    Y hago clic en "Aplicar"
    Entonces el descuento debería ser aplicado
    Y el total debería actualizarse
    Y debería ver el descuento reflejado en el resumen

  Scenario: Confirmar y procesar pago
    Dado que he completado toda la información requerida:
      | Sección          | Estado     |
      | Información envío| Completada |
      | Método de envío  | Seleccionado|
      | Información pago| Completada |
    Cuando reviso el resumen final
    Y hago clic en "Confirmar y Pagar"
    Entonces el pago debería ser procesado
    Y debería ver un indicador de carga
    Cuando el pago es exitoso
    Entonces debería ser redirigido a "/checkout/success"
    Y debería recibir un email de confirmación
    Y el carrito debería ser vaciado

  Scenario: Pago fallido
    Dado que he completado toda la información
    Cuando hago clic en "Confirmar y Pagar"
    Y el pago falla (tarjeta rechazada, fondos insuficientes, etc.)
    Entonces debería ver un mensaje de error explicativo
    Y no debería ser redirigido
    Y debería poder intentar nuevamente
    Y mis productos deberían seguir en el carrito

  Scenario: Ver página de éxito después del pago
    Dado que he completado exitosamente un pago
    Y he sido redirigido a "/checkout/success"
    Entonces debería ver:
      | Elemento              | Descripción                    |
      | Mensaje de éxito       | "¡Gracias por tu compra!"      |
      | Número de orden        | ID de la transacción           |
      | Resumen de compra      | Productos comprados           |
      | Información de envío   | Dirección de entrega           |
      | Tiempo estimado        | Fecha estimada de entrega      |
      | Botón "Ver mis órdenes"| Link al historial              |
      | Botón "Seguir comprando"| Link a la página principal    |

  Scenario: Guardar información para futuras compras
    Dado que estoy en "/checkout"
    Cuando marco la casilla "Guardar información para futuras compras"
    Y completo el pago exitosamente
    Entonces mi información de envío debería ser guardada
    Y en futuras compras debería estar prellenada
    Y podré seleccionarla rápidamente

  Scenario: Cancelar checkout
    Dado que estoy en "/checkout"
    Cuando hago clic en "Cancelar" o "Volver al Carrito"
    Entonces debería ser redirigido a "/cart"
    Y todos los productos deberían seguir en el carrito
    Y la información ingresada no debería ser guardada

