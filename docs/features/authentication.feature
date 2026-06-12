# language: es
Feature: Autenticación de Usuarios
  Como usuario del sistema
  Quiero poder registrarme e iniciar sesión
  Para acceder a las funcionalidades de la plataforma

  Background:
    Dado que estoy en la página principal de Link4Deal

  Scenario: Registro de nuevo usuario
    Dado que estoy en la página de registro "/signup"
    Cuando ingreso mi información:
      | Campo           | Valor                    |
      | Email           | usuario@ejemplo.com      |
      | Contraseña      | password123              |
      | Nombre          | Juan                     |
      | Apellido        | Pérez                    |
      | Tipo de usuario | influencer               |
    Y hago clic en "Registrarme"
    Entonces debería ser redirigido a "/user-type-selector"
    Y debería ver un mensaje de confirmación
    Y mi cuenta debería estar creada en el sistema

  Scenario: Inicio de sesión exitoso
    Dado que tengo una cuenta registrada con email "usuario@ejemplo.com"
    Y estoy en la página de inicio de sesión "/signin"
    Cuando ingreso mis credenciales:
      | Campo      | Valor               |
      | Email      | usuario@ejemplo.com |
      | Contraseña | password123         |
    Y hago clic en "Iniciar Sesión"
    Entonces debería ser autenticado exitosamente
    Y debería ser redirigido a la página principal "/"
    Y debería ver mi nombre en el header

  Scenario: Inicio de sesión con credenciales incorrectas
    Dado que estoy en la página de inicio de sesión "/signin"
    Cuando ingreso credenciales incorrectas:
      | Campo      | Valor               |
      | Email      | usuario@ejemplo.com |
      | Contraseña | passwordincorrecto  |
    Y hago clic en "Iniciar Sesión"
    Entonces debería ver un mensaje de error "Credenciales inválidas"
    Y no debería ser autenticado
    Y debería permanecer en la página de inicio de sesión

  Scenario: Bloqueo de cuenta por múltiples intentos fallidos
    Dado que tengo una cuenta registrada con email "usuario@ejemplo.com"
    Y he intentado iniciar sesión incorrectamente 4 veces
    Cuando intento iniciar sesión una quinta vez con credenciales incorrectas
    Entonces mi cuenta debería ser bloqueada temporalmente
    Y debería ver un mensaje indicando que la cuenta está bloqueada
    Y no podré intentar iniciar sesión por un período de tiempo

  Scenario: Cierre de sesión
    Dado que estoy autenticado como usuario
    Y estoy en cualquier página de la aplicación
    Cuando hago clic en el botón "Cerrar Sesión"
    Entonces debería ser desautenticado
    Y debería ser redirigido a la página principal "/"
    Y no debería poder acceder a páginas protegidas

