# language: es
Feature: Sistema de Categorías
  Como usuario de la plataforma
  Quiero poder explorar promociones y productos por categorías
  Para encontrar contenido relevante más fácilmente

  Background:
    Dado que estoy navegando por la plataforma

  Scenario: Ver página de categorías
    Dado que estoy en cualquier página de la plataforma
    Cuando navego a "/categories"
    Entonces debería ver una página con todas las categorías disponibles
    Y cada categoría debería mostrar:
      | Elemento        | Descripción                    |
      | Nombre           | Nombre de la categoría         |
      | Imagen           | Imagen representativa          |
      | Descripción      | Descripción breve              |
      | Contador         | Número de promociones          |
      | Badge            | Indicador visual               |

  Scenario: Explorar categoría específica
    Dado que estoy en "/categories"
    Cuando hago clic en una categoría (ej: "Moda")
    Entonces debería ser redirigido a "/category/moda"
    Y debería ver todas las promociones de esa categoría
    Y debería ver el nombre de la categoría como título
    Y debería ver un contador de promociones disponibles

  Scenario: Ver promociones filtradas por categoría
    Dado que estoy en "/category/moda"
    Entonces debería ver una lista de promociones de moda
    Y cada promoción debería mostrar información relevante
    Y debería poder aplicar filtros adicionales:
      | Filtro            | Descripción                    |
      | Precio            | Rango de precios               |
      | Marca             | Filtrar por marca              |
      | Ubicación        | Filtrar por ubicación          |
      | Tipo de descuento| Porcentaje o monto fijo        |

  Scenario: Buscar dentro de una categoría
    Dado que estoy en "/category/moda"
    Cuando ingreso un término de búsqueda en el campo de búsqueda
    Y hago clic en "Buscar"
    Entonces debería ver solo promociones de moda que coincidan con la búsqueda
    Y los resultados deberían estar filtrados por categoría y término de búsqueda

  Scenario: Navegar entre categorías relacionadas
    Dado que estoy en "/category/moda"
    Cuando veo la sección "Categorías Relacionadas"
    Entonces debería ver enlaces a categorías relacionadas como:
      | Categoría relacionada | Descripción                    |
      | Accesorios            | Complementos de moda            |
      | Calzado               | Zapatos y zapatillas           |
      | Belleza               | Productos de belleza           |
    Cuando hago clic en una categoría relacionada
    Entonces debería ser redirigido a esa categoría
    Y debería ver promociones de la nueva categoría

  Scenario: Ver categorías populares
    Dado que estoy en "/categories"
    Cuando veo la sección "Categorías Populares"
    Entonces debería ver las categorías más visitadas o con más promociones
    Y deberían estar ordenadas por popularidad
    Y cada categoría debería mostrar un indicador de popularidad

  Scenario: Filtrar promociones por múltiples categorías
    Dado que estoy en "/marketplace"
    Cuando selecciono múltiples categorías en los filtros
    Entonces debería ver promociones que pertenezcan a cualquiera de las categorías seleccionadas
    Y el contador de resultados debería actualizarse
    Y debería poder deseleccionar categorías para refinar los resultados

  Scenario: Ver categorías en navegación principal
    Dado que estoy en cualquier página de la plataforma
    Cuando veo el menú de navegación principal
    Entonces debería ver un enlace o menú desplegable de "Categorías"
    Cuando hago clic en "Categorías"
    Entonces debería ver una lista de categorías principales
    Cuando selecciono una categoría
    Entonces debería ser redirigido a "/category/[categoria]"
    Y debería ver las promociones de esa categoría

