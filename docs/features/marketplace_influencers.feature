# language: es
# Archivo: features/marketplace_influencers.feature
# Basado en la UI actual de damecodigo.com/influencer:
# barra de estadísticas, tarjetas de influencer, estados, métricas QR y acciones.
# Incluye correcciones detectadas en revisión: mensaje de debug visible
# y métricas en cero mostradas públicamente.

Característica: Marketplace público de influencers
  Como comercio interesado en lanzar campañas
  Quiero explorar el directorio de influencers con información relevante y confiable
  Para elegir creadores afines a mi negocio y contactarlos

  Antecedentes:
    Dado que existen influencers registrados en la plataforma
    Y que accedo a "https://www.damecodigo.com/influencer" como visitante sin sesión

  # ─────────────────────────────────────────────
  # Barra de estadísticas globales
  # ─────────────────────────────────────────────

  Escenario: La barra de estadísticas muestra totales reales del sistema
    Entonces veo el total de influencers registrados
    Y veo la suma de seguidores totales en formato abreviado (ej. "7.6M")
    Y veo el total de promociones activas
    Y cada cifra coincide con los datos de la API en el momento de la carga

  Escenario: Las comisiones estimadas se muestran con formato monetario consistente
    Entonces el indicador de comisiones muestra moneda y monto (ej. "$2 MXN")
    Y se acompaña del número de canjes que lo sustentan

  # ─────────────────────────────────────────────
  # Tarjetas de influencer
  # ─────────────────────────────────────────────

  Escenario: Una tarjeta de influencer muestra la información esencial
    Entonces cada tarjeta muestra nombre público y handle
    Y muestra biografía corta
    Y muestra etiquetas de nicho (ej. "fashion", "food", "comedy")
    Y muestra ubicación
    Y muestra seguidores totales en formato abreviado
    Y muestra desglose de redes sociales con seguidores por red
    Y muestra un botón "Ver perfil público"
    Y muestra las acciones "Guardar", "Compartir" y "Contactar"

  Escenario: Las métricas en cero no se exhiben públicamente
    Dado que un influencer tiene 0 campañas activas, 0 canjes y $0 de comisión
    Cuando se renderiza su tarjeta en el directorio público
    Entonces las métricas con valor cero NO se muestran en la tarjeta
    Y en su lugar se prioriza nicho, alcance y ubicación
    # Razón de negocio: mostrar ceros públicamente comunica inactividad
    # y daña la percepción de tracción del marketplace.

  Escenario: Las métricas de desempeño aparecen solo cuando hay actividad
    Dado que un influencer tiene al menos 1 canje redimido
    Cuando se renderiza su tarjeta
    Entonces se muestran canjes redimidos, campañas activas y comisión estimada
    Y la tasa de conversión se calcula como canjes redimidos / cupones emitidos

  Escenario: El estado interno de aprobación no es visible para visitantes
    Dado que un influencer tiene estado interno "Pendiente"
    Cuando un visitante sin sesión ve el directorio
    Entonces el badge de estado "Pendiente" NO se muestra
    # El estado de moderación es información operativa interna,
    # no un atributo público del perfil.

  Escenario: Los influencers no aprobados no aparecen en el directorio público
    Dado que un influencer tiene estado "Pendiente" o "Rechazado"
    Cuando se consulta el directorio público
    Entonces su tarjeta NO aparece en los resultados
    Y solo se listan influencers con estado "Aprobado"

  # ─────────────────────────────────────────────
  # Mensajes de sistema
  # ─────────────────────────────────────────────

  Escenario: No se muestran mensajes técnicos o de debug en la interfaz
    Cuando la lista de influencers carga correctamente
    Entonces NO se muestra el texto "Influencers obtenidos correctamente"
    Y ningún mensaje de estado de la API es visible para el usuario final

  Escenario: Estado de carga y estado vacío
    Cuando la lista de influencers está cargando
    Entonces se muestra un indicador de carga (skeleton o spinner)
    Cuando no hay influencers que coincidan con los filtros
    Entonces se muestra un estado vacío con mensaje claro y acción sugerida

  # ─────────────────────────────────────────────
  # Descubrimiento: búsqueda y filtros
  # ─────────────────────────────────────────────

  Esquema del escenario: Filtrar influencers por nicho
    Cuando aplico el filtro de nicho "<nicho>"
    Entonces todas las tarjetas visibles incluyen la etiqueta "<nicho>"
    Y el contador de resultados se actualiza

    Ejemplos:
      | nicho         |
      | food          |
      | fashion       |
      | comedy        |
      | travel        |

  Escenario: Filtrar influencers por rango de seguidores
    Cuando aplico el filtro de seguidores "100K a 1M"
    Entonces todas las tarjetas visibles tienen seguidores dentro del rango

  Escenario: Buscar influencer por nombre o handle
    Cuando escribo "tacotios" en el buscador
    Entonces los resultados incluyen al influencer con handle "tacotios"

  # ─────────────────────────────────────────────
  # Acciones sobre la tarjeta
  # ─────────────────────────────────────────────

  Escenario: Ver perfil público desde la tarjeta
    Cuando hago clic en "Ver perfil público" de un influencer
    Entonces navego a una URL pública única del influencer (ej. "/influencer/tacotios")
    Y la página del perfil responde 200 al acceso directo

  Escenario: Contactar requiere sesión iniciada
    Dado que NO he iniciado sesión
    Cuando hago clic en "Contactar" en una tarjeta
    Entonces se me redirige al flujo de registro o inicio de sesión
    Y tras autenticarme regreso al contexto del influencer que quería contactar

  Escenario: Guardar influencer en favoritos
    Dado que he iniciado sesión como comercio
    Cuando hago clic en "Guardar" en una tarjeta
    Entonces el influencer se agrega a mi lista de guardados
    Y el ícono cambia a estado activo

  Escenario: Compartir perfil de influencer
    Cuando hago clic en "Compartir" en una tarjeta
    Entonces obtengo un enlace público directo al perfil del influencer
    Y el enlace incluye metadatos Open Graph del influencer al previsualizarse
