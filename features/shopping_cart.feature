# language: es
Feature: Carrito de Compras
  Como usuario
  Quiero poder agregar productos al carrito y gestionar mis compras
  Para realizar compras de manera conveniente

  Background:
    Dado que estoy autenticado como usuario
    Y estoy navegando por la plataforma

  Scenario: Agregar producto al carrito desde la página principal
    Dado que estoy en la página principal "/"
    Y veo un producto disponible
    Cuando hago clic en "Agregar al Carrito" de un producto
    Entonces el producto debería ser agregado al carrito
    Y el contador del carrito en el header debería incrementarse
    Y debería ver un mensaje de confirmación

  Scenario: Agregar producto al carrito desde detalles de promoción
    Dado que estoy viendo los detalles de una promoción en "/promotion-details/:id"
    Cuando hago clic en "Agregar al Carrito"
    Entonces el producto debería ser agregado al carrito
    Y el contador del carrito debería actualizarse
    Y debería ver un mensaje de confirmación

  Scenario: Ver contenido del carrito
    Dado que tengo productos en mi carrito
    Cuando hago clic en el icono del carrito en el header
    O navego a "/cart"
    Entonces debería ver la página del carrito
    Y debería ver todos los productos agregados con:
      | Información        | Descripción                    |
      | Imagen del producto| Foto del producto              |
      | Nombre             | Nombre del producto            |
      | Precio unitario    | Precio individual              |
      | Cantidad           | Cantidad seleccionada          |
      | Precio total       | Precio por cantidad            |
      | Botón eliminar     | Opción para quitar producto    |

  Scenario: Actualizar cantidad de producto en el carrito
    Dado que estoy en "/cart"
    Y tengo un producto con cantidad 1
    Cuando cambio la cantidad a 3
    Entonces el precio total del producto debería actualizarse
    Y el total del carrito debería recalcularse
    Y los cambios deberían guardarse automáticamente

  Scenario: Eliminar producto del carrito
    Dado que estoy en "/cart"
    Y tengo productos en el carrito
    Cuando hago clic en "Eliminar" de un producto
    Entonces el producto debería ser removido del carrito
    Y el contador del carrito debería decrementarse
    Y el total del carrito debería actualizarse
    Y debería ver un mensaje de confirmación

  Scenario: Ver resumen del carrito
    Dado que estoy en "/cart"
    Y tengo productos en el carrito
    Entonces debería ver un resumen con:
      | Elemento           | Descripción                    |
      | Subtotal           | Suma de todos los productos    |
      | Descuentos         | Descuentos aplicados           |
      | Envío              | Costo de envío (si aplica)    |
      | Total              | Monto total a pagar            |
    Y debería ver un botón "Proceder al Checkout"

  Scenario: Aplicar cupón de descuento
    Dado que estoy en "/cart"
    Y tengo productos en el carrito
    Cuando ingreso un código de cupón válido
    Y hago clic en "Aplicar Cupón"
    Entonces el descuento debería ser aplicado
    Y el total del carrito debería actualizarse
    Y debería ver el descuento reflejado en el resumen

  Scenario: Aplicar cupón inválido
    Dado que estoy en "/cart"
    Cuando ingreso un código de cupón inválido o expirado
    Y hago clic en "Aplicar Cupón"
    Entonces debería ver un mensaje de error
    Y el cupón no debería ser aplicado
    Y el total del carrito no debería cambiar

  Scenario: Vaciar carrito completo
    Dado que estoy en "/cart"
    Y tengo múltiples productos en el carrito
    Cuando hago clic en "Vaciar Carrito"
    Y confirmo la acción
    Entonces todos los productos deberían ser removidos
    Y el carrito debería estar vacío
    Y el contador del carrito debería mostrar 0
    Y debería ver un mensaje indicando que el carrito está vacío

  Scenario: Persistencia del carrito entre sesiones
    Dado que tengo productos en mi carrito
    Cuando cierro sesión
    Y vuelvo a iniciar sesión
    Entonces los productos deberían seguir en mi carrito
    Y el contador debería mostrar la cantidad correcta

  Scenario: Navegar al checkout desde el carrito
    Dado que estoy en "/cart"
    Y tengo productos en el carrito
    Cuando hago clic en "Proceder al Checkout"
    Entonces debería ser redirigido a "/checkout"
    Y todos los productos del carrito deberían estar disponibles en el checkout

