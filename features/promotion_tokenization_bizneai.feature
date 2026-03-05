# language: es
# Arquitectura BizneAI + DameCodigo: definición legal, conversión a USD (tokens) y control promocional.

Feature: Tipos de Promoción y Unidad Calculable (Contrato)
  Como sistema de contrato financiero
  Quiero que cada tipo de promoción se convierta en un monto exacto en USD
  Para que la promo deje de ser un "descuento difuso" y pase a ser un pasivo financiero medible

  Regla de conversión:
    En todos los casos: X tokens = X USD.
    El valor promocional en USD es la unidad calculable del contrato final.

  Scenario Outline: Descuento porcentual → valor en USD (tokens)
    Dado un producto con precio base <precio_base> USD
    Y una promoción de descuento de <porcentaje>%
    Cuando el sistema calcula el valor promocional
    Entonces el valor promocional en USD es <valor_usd>
    Y equivale a <valor_usd> tokens estables
    Y el contrato registra <valor_usd> USD como pasivo financiero medible

    Examples:
      | precio_base | porcentaje | valor_usd |
      | 20          | 25         | 5         |
      | 100         | 20         | 20        |

  Scenario Outline: Promoción 2x1 → valor en USD (tokens)
    Dado un producto con precio unitario <precio_unitario> USD
    Y una promoción 2x1 (paga 2, lleva 2; una unidad de descuento)
    Cuando el usuario compra 2 unidades
    Entonces el valor promocional en USD es <valor_usd>
    Y equivale a <valor_usd> tokens estables
    Y el contrato registra <valor_usd> USD como pasivo financiero medible

    Examples:
      | precio_unitario | valor_usd |
      | 30              | 15        |
      | 50              | 25        |

  Scenario Outline: Cashback porcentual sobre compra → valor en USD (tokens)
    Dado una compra por <monto_compra> USD
    Y una promoción de cashback de <porcentaje>%
    Cuando el usuario redime la promoción
    Entonces el valor promocional en USD es <valor_usd>
    Y equivale a <valor_usd> tokens estables
    Y el contrato registra <valor_usd> USD como pasivo financiero medible

    Examples:
      | monto_compra | porcentaje | valor_usd |
      | 50           | 10         | 5         |
      | 80           | 10         | 8         |

  Scenario: Resumen – de descuento difuso a pasivo financiero medible
    Dado que existen los tres tipos de promoción (porcentaje, 2x1, cashback)
    Cuando cada promoción se convierte a USD según su tipo
    Entonces cada una tiene un valor exacto en tokens (1 token = 1 USD)
    Y ese valor es la unidad calculable del contrato final
    Y la promoción pasa a ser un pasivo financiero medible
    Y no queda como "descuento difuso"

Feature: Definición Legal y Financiera de Promociones Tokenizadas
  Como sistema BizneAI
  Quiero exigir campos legales mínimos
  Para que toda promoción sea válida, auditable y financieramente determinística

  Scenario: Crear promoción con campos obligatorios
    Dado que el negocio desea crear una promoción
    Cuando captura el precio base del producto en USD
    Y define el producto o servicio aplicable
    Y especifica las características comerciales del producto
    Y establece la cantidad máxima de promociones disponibles
    Y define la vigencia con fecha de inicio y fin
    Entonces el sistema valida que todos los campos estén completos
    Y registra la promoción con un identificador único
    Y marca la promoción como "Legalmente Definida"

Feature: Conversión de Promociones a Unidad Económica (Token USD)
  Como sistema de cálculo financiero
  Quiero transformar cualquier promoción en un monto exacto en USD
  Para representar su costo real como unidad económica estable

  Regla: La promoción se convierte en X tokens = X USD (unidad calculable del contrato final; pasivo financiero medible).

  Scenario: Producto 20 USD – Promo 25% → 5 USD (5 tokens)
    Dado un producto con precio base de 20 USD
    Y una promoción del 25%
    Cuando el usuario redime la promoción
    Entonces el sistema calcula 5 USD como valor promocional
    Y define 5 tokens estables como costo promocional
    Y el contrato registra 5 USD como pasivo financiero medible

  Scenario: 2x1 sobre 30 USD → 15 USD (15 tokens)
    Dado un producto con precio unitario de 30 USD
    Y una promoción 2x1
    Cuando el usuario compra 2 unidades
    Entonces el sistema calcula 15 USD como valor promocional (una unidad gratis)
    Y define 15 tokens estables como costo promocional
    Y el contrato registra 15 USD como pasivo financiero medible

  Scenario: Cashback 10% sobre 50 USD → 5 USD (5 tokens)
    Dado una compra por 50 USD
    Y una promoción de cashback del 10%
    Cuando el usuario redime la promoción
    Entonces el sistema calcula 5 USD como valor promocional
    Y asigna 5 tokens estables
    Y el contrato registra 5 USD como pasivo financiero medible

  Scenario: Calcular descuento porcentual (100 USD, 20%)
    Dado un producto con precio base de 100 USD
    Y una promoción del 20%
    Cuando el usuario redime la promoción
    Entonces el sistema calcula 20 USD como valor promocional
    Y define 20 tokens estables como costo promocional

  Scenario: Calcular promoción 2x1 (50 USD unitario)
    Dado un producto con precio unitario de 50 USD
    Y una promoción 2x1
    Cuando el usuario compra 2 unidades
    Entonces el sistema calcula 25 USD como valor promocional (una unidad gratis)
    Y define 25 tokens estables como costo promocional

  Scenario: Calcular cashback fijo (10 USD)
    Dado una compra por 80 USD
    Y una promoción de cashback fijo de 10 USD
    Cuando el usuario redime la promoción
    Entonces el sistema asigna 10 tokens estables
    Y el contrato registra 10 USD como pasivo financiero medible

Feature: Emisión Condicionada de Tokens
  Como sistema DameCodigo
  Quiero emitir tokens únicamente al momento de redimir
  Para evitar inflación promocional anticipada

  Scenario: Emisión bajo evento de compra confirmada
    Dado una promoción activa
    Y una compra confirmada y pagada
    Cuando el usuario redime la promoción
    Entonces el sistema crea la cantidad exacta de tokens equivalentes en USD
    Y registra la emisión en el ledger
    Y transfiere los tokens al influencer asignado

Feature: Control de Inventario Promocional
  Como sistema financiero
  Quiero controlar el número máximo de promociones redimibles
  Para respetar el límite legal y financiero definido

  Scenario: Redención dentro del límite permitido
    Dado una promoción con límite de 1000 redenciones
    Cuando la redención número 500 ocurre
    Entonces el sistema permite la redención
    Y actualiza el contador a 501

  Scenario: Redención fuera del límite permitido
    Dado una promoción con límite de 1000 redenciones
    Y ya existen 1000 redenciones registradas
    Cuando un usuario intenta redimir
    Entonces el sistema rechaza la redención
    Y marca la promoción como agotada

Feature: Validación de Vigencia
  Como sistema BizneAI
  Quiero permitir redenciones solo dentro de la vigencia definida
  Para cumplir con regulación comercial

  Scenario: Redención dentro del periodo válido
    Dado una promoción con fecha inicio 2026-03-01
    Y fecha fin 2026-03-31
    Cuando el usuario redime el 2026-03-15
    Entonces la redención es válida

  Scenario: Redención fuera de vigencia
    Dado una promoción con fecha fin 2026-03-31
    Cuando el usuario intenta redimir el 2026-04-02
    Entonces el sistema rechaza la redención

Feature: Registro Contable del Pasivo Promocional
  Como módulo contable de BizneAI
  Quiero registrar cada token emitido como pasivo en USD
  Para mantener conciliación financiera exacta

  Scenario: Registrar emisión como pasivo
    Dado una redención equivalente a 15 USD
    Cuando se emiten 15 tokens
    Entonces el sistema registra un pasivo promocional de 15 USD
    Y lo asocia a la campaña correspondiente

Feature: Liquidación en Fiat al Influencer
  Como sistema de liquidación
  Quiero permitir que la marca pague en fiat el valor acumulado
  Para cerrar el ciclo financiero

  Scenario: Liquidación mensual
    Dado un influencer con 500 tokens acumulados
    Cuando la marca autoriza liquidación
    Entonces el sistema genera una orden de pago por 500 USD
    Y marca los tokens como liquidados
