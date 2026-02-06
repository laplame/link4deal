# language: es
Feature: Onboarding de Usuarios
  Como nuevo usuario
  Quiero poder seleccionar mi tipo de perfil y completar mi configuración
  Para poder usar las funcionalidades específicas de mi rol

  Background:
    Dado que estoy autenticado como nuevo usuario
    Y no he completado mi perfil

  Scenario: Selección de tipo de usuario
    Dado que estoy en la página "/user-type-selector"
    Cuando selecciono el tipo de usuario "Influencer"
    Y hago clic en "Continuar"
    Entonces debería ser redirigido a "/influencer-setup"
    Y el sistema debería guardar mi selección de tipo de usuario

  Scenario: Configuración de perfil de Influencer
    Dado que he seleccionado el tipo "Influencer"
    Y estoy en la página "/influencer-setup"
    Cuando completo el formulario con:
      | Campo              | Valor                    |
      | Nombre de usuario  | @maria_influencer        |
      | Biografía          | Creadora de contenido    |
      | Categorías         | Moda, Belleza            |
      | Instagram          | @maria_insta             |
      | TikTok             | @maria_tiktok            |
      | YouTube            | @maria_youtube           |
    Y subo una foto de perfil
    Y hago clic en "Completar Perfil"
    Entonces mi perfil de influencer debería ser creado
    Y debería ser redirigido a "/admin/influencers" (dashboard)
    Y mi perfil debería estar visible en "/influencers"

  Scenario: Configuración de perfil de Brand
    Dado que he seleccionado el tipo "Brand"
    Y estoy en la página "/brand-setup"
    Cuando completo el formulario con:
      | Campo           | Valor              |
      | Nombre de marca | Zara México        |
      | Descripción     | Moda y estilo      |
      | Categoría       | Moda               |
      | Sitio web       | www.zara.com       |
      | Ubicación       | Ciudad de México   |
    Y subo el logo de la marca
    Y hago clic en "Completar Perfil"
    Entonces mi perfil de marca debería ser creado
    Y debería ser redirigido a "/admin/brands" (dashboard)
    Y mi marca debería estar visible en el sistema

  Scenario: Configuración de perfil de Agency
    Dado que he seleccionado el tipo "Agency"
    Y estoy en la página "/agency-setup"
    Cuando completo el formulario con:
      | Campo           | Valor                    |
      | Nombre          | Agencia Digital Pro      |
      | Descripción     | Agencia de marketing     |
      | Servicios       | Marketing, Publicidad    |
      | Sitio web       | www.agenciapro.com       |
      | Ubicación       | Monterrey                |
    Y subo el logo de la agencia
    Y hago clic en "Completar Perfil"
    Entonces mi perfil de agencia debería ser creado
    Y debería ser redirigido a "/admin/agencies" (dashboard)
    Y mi agencia debería estar visible en el sistema

  Scenario: Configuración con OCR para Influencer
    Dado que he seleccionado el tipo "Influencer"
    Y estoy en la página "/influencer-setup"
    Cuando selecciono la opción "Usar OCR para completar perfil"
    Y tomo una foto de mi tarjeta de presentación o documento
    Entonces el sistema debería procesar la imagen con OCR
    Y debería extraer automáticamente:
      | Campo extraído | Ejemplo                |
      | Nombre         | María García            |
      | Email          | maria@ejemplo.com      |
      | Redes sociales | @maria_insta           |
    Y el formulario debería ser prellenado con los datos extraídos
    Cuando reviso y confirmo los datos
    Y hago clic en "Guardar"
    Entonces mi perfil debería ser creado con los datos del OCR

