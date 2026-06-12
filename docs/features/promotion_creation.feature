# language: es
Feature: Creación de Promociones
  Como marca o agencia
  Quiero poder crear promociones para que influencers las promocionen
  Para generar leads y ventas a través de contenido de influencers

  Background:
    Dado que estoy autenticado como marca o agencia
    Y tengo permisos para crear promociones

  Scenario: Acceder al wizard de creación de promoción
    Dado que estoy en cualquier página de la aplicación
    Cuando navego a "/create-promotion"
    Entonces debería ver el wizard de creación de promoción
    Y debería estar en el paso 1 de 4

  Scenario: Completar paso 1 - Información básica
    Dado que estoy en "/create-promotion"
    Y estoy en el paso 1 "Información Básica"
    Cuando completo el formulario con:
      | Campo           | Valor                    |
      | Título          | Lanzamiento Colección     |
      | Descripción     | Nueva colección primavera |
      | Categoría       | Moda                      |
      | Marca           | Zara                     |
      | Producto        | Vestido Floral            |
    Y hago clic en "Siguiente"
    Entonces debería avanzar al paso 2
    Y los datos deberían ser guardados temporalmente

  Scenario: Completar paso 2 - Detalles del producto
    Dado que he completado el paso 1
    Y estoy en el paso 2 "Detalles del Producto"
    Cuando completo el formulario con:
      | Campo              | Valor      |
      | Precio original    | 2999       |
      | Precio promocional | 1999       |
      | Descuento          | 33%        |
      | Moneda             | MXN        |
      | Stock             | 100        |
    Y subo una imagen del producto
    Y hago clic en "Siguiente"
    Entonces debería avanzar al paso 3
    Y la imagen debería ser procesada y guardada

  Scenario: Completar paso 3 - Configuración de campaña
    Dado que he completado el paso 2
    Y estoy en el paso 3 "Configuración de Campaña"
    Cuando completo el formulario con:
      | Campo                | Valor                    |
      | Tipo de subasta      | Holandesa                |
      | Presupuesto          | 50000                    |
      | Comisión por lead    | 50                       |
      | Fecha de inicio      | 2024-03-01               |
      | Fecha de finalización| 2024-03-31               |
      | Requisitos           | Mínimo 10K seguidores    |
    Y selecciono ubicaciones objetivo
    Y hago clic en "Siguiente"
    Entonces debería avanzar al paso 4
    Y la configuración debería ser guardada

  Scenario: Completar paso 4 - Revisión y publicación
    Dado que he completado el paso 3
    Y estoy en el paso 4 "Revisión y Publicación"
    Cuando reviso toda la información ingresada
    Y confirmo que todo está correcto
    Y hago clic en "Publicar Promoción"
    Entonces la promoción debería ser creada en el sistema
    Y debería ser visible en "/marketplace"
    Y debería ver un mensaje de confirmación
    Y debería ser redirigido a "/promotion-details/:id"

  Scenario: Crear promoción con OCR
    Dado que estoy en el paso 2 "Detalles del Producto"
    Cuando selecciono la opción "Usar OCR para extraer información"
    Y tomo una foto o subo una imagen de un folleto/promoción
    Entonces el sistema debería procesar la imagen con OCR
    Y debería extraer automáticamente:
      | Campo extraído    | Ejemplo        |
      | Nombre producto   | Vestido Floral |
      | Precio original   | 2999           |
      | Precio promocional| 1999           |
      | Descuento         | 33%            |
      | Marca             | Zara           |
    Y el formulario debería ser prellenado con los datos extraídos
    Cuando reviso y ajusto los datos si es necesario
    Y hago clic en "Siguiente"
    Entonces debería avanzar al siguiente paso con los datos del OCR

  Scenario: Guardar promoción como borrador
    Dado que estoy en cualquier paso del wizard
    Cuando hago clic en "Guardar Borrador"
    Entonces la promoción debería ser guardada como borrador
    Y debería ver un mensaje de confirmación
    Y podré continuar editándola más tarde
    Y la promoción no debería ser visible en el marketplace

  Scenario: Editar promoción borrador
    Dado que tengo una promoción guardada como borrador
    Cuando accedo a mi dashboard
    Y hago clic en "Continuar Edición" de la promoción
    Entonces debería volver al wizard en el último paso completado
    Y todos los datos deberían estar prellenados
    Y podré continuar desde donde me quedé

  Scenario: Validación de campos requeridos
    Dado que estoy en el paso 1 del wizard
    Cuando intento avanzar sin completar campos requeridos
    Entonces debería ver mensajes de error para cada campo faltante
    Y no debería poder avanzar al siguiente paso
    Y los campos requeridos deberían estar marcados visualmente

  Scenario: Cancelar creación de promoción
    Dado que estoy en cualquier paso del wizard
    Cuando hago clic en "Cancelar"
    Entonces debería ver un modal de confirmación
    Cuando confirmo la cancelación
    Entonces debería ser redirigido a mi dashboard
    Y los datos no guardados deberían ser descartados

