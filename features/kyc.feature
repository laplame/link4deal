# language: es
Feature: Verificación KYC
  Como usuario que necesita verificar mi identidad
  Quiero poder completar el proceso KYC
  Para acceder a funcionalidades que requieren verificación

  Background:
    Dado que estoy autenticado como usuario
    Y necesito completar el proceso KYC

  Scenario: Acceder al formulario KYC
    Dado que estoy en mi dashboard
    Y veo una notificación para completar KYC
    Cuando hago clic en "Completar Verificación KYC"
    O navego a "/kyc-form"
    Entonces debería ver el formulario KYC
    Y debería ver instrucciones claras sobre qué documentos necesito

  Scenario: Completar información personal en KYC
    Dado que estoy en "/kyc-form"
    Cuando completo la sección de información personal con:
      | Campo           | Valor                    |
      | Nombre completo | Juan Pérez García        |
      | Fecha de nacimiento | 1990-05-15          |
      | Nacionalidad   | Mexicana                 |
      | CURP           | PEFJ900515HDFRRN01       |
      | RFC             | PEFJ900515ABC             |
    Entonces la información debería ser guardada
    Y debería poder avanzar a la siguiente sección

  Scenario: Subir documentos de identificación
    Dado que he completado la información personal
    Y estoy en la sección de documentos
    Cuando subo una foto de mi INE/IFE por el frente
    Y subo una foto de mi INE/IFE por el reverso
    Y subo un comprobante de domicilio reciente
    Entonces los documentos deberían ser subidos exitosamente
    Y debería ver previews de los documentos subidos
    Y el sistema debería validar que las imágenes sean legibles

  Scenario: Validación de documentos con OCR
    Dado que he subido documentos de identificación
    Cuando el sistema procesa los documentos con OCR
    Entonces debería extraer información automáticamente:
      | Campo extraído    | Fuente                |
      | Nombre            | INE/IFE               |
      | CURP              | INE/IFE               |
      | Fecha de nacimiento| INE/IFE              |
      | Dirección         | Comprobante domicilio |
    Y el formulario debería ser prellenado con los datos extraídos
    Cuando reviso y confirmo que los datos son correctos
    Y hago clic en "Continuar"
    Entonces debería avanzar a la siguiente sección

  Scenario: Completar información bancaria
    Dado que he completado la verificación de identidad
    Y estoy en la sección de información bancaria
    Cuando completo el formulario con:
      | Campo              | Valor                    |
      | Banco             | BBVA                     |
      | Tipo de cuenta    | Cuenta de cheques        |
      | Número de cuenta   | 0123456789               |
      | CLABE             | 012345678901234567       |
      | Nombre del titular| Juan Pérez García        |
    Entonces la información debería ser guardada de forma segura
    Y debería poder avanzar a la revisión final

  Scenario: Revisar y enviar formulario KYC
    Dado que he completado todas las secciones del KYC
    Y estoy en la página de revisión
    Cuando reviso toda la información ingresada
    Y confirmo que todo es correcto
    Y acepto los términos y condiciones
    Y hago clic en "Enviar para Verificación"
    Entonces el formulario debería ser enviado
    Y debería ver un mensaje de confirmación
    Y mi estado KYC debería cambiar a "En Revisión"
    Y debería ser redirigido a "/kyc-success"

  Scenario: Ver página de éxito después de enviar KYC
    Dado que he enviado exitosamente mi formulario KYC
    Y he sido redirigido a "/kyc-success"
    Entonces debería ver:
      | Elemento              | Descripción                    |
      | Mensaje de éxito      | "KYC enviado exitosamente"    |
      | Estado actual         | "En Revisión"                 |
      | Tiempo estimado       | "1-3 días hábiles"            |
      | Próximos pasos        | Instrucciones sobre qué esperar|
      | Contacto de soporte   | Información de contacto       |

  Scenario: Verificar estado de KYC
    Dado que he enviado mi formulario KYC
    Cuando accedo a mi dashboard o perfil
    Entonces debería ver el estado de mi verificación KYC:
      | Estado        | Descripción                    |
      | Pendiente     | No iniciado                    |
      | En Revisión   | Enviado, esperando aprobación |
      | Aprobado      | Verificado exitosamente        |
      | Rechazado     | Requiere correcciones          |

  Scenario: Recibir notificación de KYC aprobado
    Dado que mi KYC está en estado "En Revisión"
    Cuando el administrador aprueba mi verificación
    Entonces debería recibir una notificación
    Y mi estado debería cambiar a "Aprobado"
    Y debería poder acceder a funcionalidades que requieren verificación
    Y debería ver un badge de "Verificado" en mi perfil

  Scenario: Recibir notificación de KYC rechazado
    Dado que mi KYC está en estado "En Revisión"
    Cuando el administrador rechaza mi verificación
    Entonces debería recibir una notificación con razones
    Y mi estado debería cambiar a "Rechazado"
    Y debería ver los motivos del rechazo
    Y debería poder corregir y reenviar el formulario

  Scenario: Corregir y reenviar KYC rechazado
    Dado que mi KYC fue rechazado
    Y veo los motivos del rechazo
    Cuando navego a "/kyc-form"
    Entonces el formulario debería estar prellenado con mi información anterior
    Y debería ver indicadores de qué necesita corrección
    Cuando corrijo los problemas identificados
    Y vuelvo a subir documentos si es necesario
    Y hago clic en "Reenviar para Verificación"
    Entonces el formulario debería ser enviado nuevamente
    Y el estado debería cambiar a "En Revisión"

