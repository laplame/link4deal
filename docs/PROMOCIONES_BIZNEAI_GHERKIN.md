# Promociones y Gherkin BizneAI / DameCodigo

Este documento enlaza las **features Gherkin** (BDD) del sistema de promociones tokenizadas con las **rutas de creación** en DameCodigo y los **campos del modelo**.

---

## Rutas de creación

| Ruta | Descripción |
|------|-------------|
| [Quick Promoción](https://www.damecodigo.com/quick-promotion) | Formulario rápido: título, precios en USD, vigencia, máximo de cupones. |
| [Crear Promoción](https://www.damecodigo.com/create-promotion) | Asistente paso a paso: información básica, precios, inventario, tiempo, audiencia, medios, términos. |

En ambas rutas se muestra el panel **"Cómo crear promociones válidas y tokenizables (BizneAI / DameCodigo)"** con la guía alineada al Gherkin.

---

## Mapeo Gherkin → Campos

### Definición legal (campos obligatorios / recomendados)

| Gherkin | Campo en formulario | Modelo / API |
|--------|----------------------|--------------|
| Precio base del producto (USD) | Precio original, Moneda (USD) | `originalPrice`, `currency` |
| Producto o servicio aplicable | Título, Descripción, Producto/Marca, Categoría | `title`, `description`, `productName`, `brand`, `category` |
| Características comerciales | Descripción, Categoría, Especificaciones | `description`, `specifications`, `tags` |
| Cantidad máxima de promociones disponibles | Máximo de cupones redimibles / Cantidad total disponible | `totalQuantity` |
| Vigencia (fecha inicio y fin) | Fecha de inicio, Fecha de fin | `validFrom`, `validUntil` |

### Tipos de promoción y conversión a unidad calculable (contrato)

En todos los casos la promoción se convierte en **X tokens = X USD**. Eso permite que la promo deje de ser un "descuento difuso" y pase a ser **un pasivo financiero medible** (unidad calculable del contrato final).

| Tipo | Ejemplo | Cálculo | Valor en USD (tokens) |
|------|---------|---------|------------------------|
| **Descuento %** | Producto $20 USD, promo 25% | 20 × 0,25 | **$5 USD** (5 tokens) |
| **2x1** | Producto $30 USD por unidad, 2x1 | Una unidad gratis = 30 ÷ 2 | **$15 USD** (15 tokens) |
| **Cashback %** | Compra $50 USD, cashback 10% | 50 × 0,10 | **$5 USD** (5 tokens) |
| **Cashback fijo** | Cashback fijo $10 USD | Valor fijo | **$10 USD** (10 tokens) |

Campos en el modelo y API:

- **`offerType`**: `percentage` | `bogo` | `cashback_fixed` | `cashback_percentage`
- **`cashbackValue`**: valor fijo en USD (cashback_fixed) o porcentaje 0–100 (cashback_percentage)
- **`promotionalValueUsd`**: valor promocional en USD calculado; es la unidad calculable del contrato (X tokens = X USD).

La función **`getPromotionalValueUsd()`** en `server/utils/promotionValueUsd.js` realiza el cálculo según el tipo. El backend rellena `promotionalValueUsd` al crear o actualizar la promoción.

### Conversión a unidad económica (USD / tokens) – resumen

| Gherkin | Cómo se refleja |
|--------|------------------|
| Descuento porcentual → valor en USD | `offerType: percentage`; precio original y % (o precio con oferta); `promotionalValueUsd` = originalPrice × (discountPercentage/100). |
| 2x1 → valor en USD | `offerType: bogo`; precio unitario; `promotionalValueUsd` = originalPrice / 2. |
| Cashback % o fijo → tokens | `offerType: cashback_percentage` o `cashback_fixed`; `cashbackValue`; `promotionalValueUsd` calculado. |

### Control de inventario y vigencia

| Gherkin | Implementación |
|--------|----------------|
| Redención dentro del límite | Campo `totalQuantity`; el backend (verify/redeem) puede comprobar `conversions < totalQuantity`. |
| Redención fuera del límite | Rechazar y marcar como agotada cuando `conversions >= totalQuantity`. |
| Redención dentro del periodo válido | `validFrom` ≤ ahora ≤ `validUntil` en verify/redeem. |
| Redención fuera de vigencia | Rechazar si la fecha actual está fuera de `[validFrom, validUntil]`. |

---

## Componente de guía en la UI

El componente **`PromotionLegalInfo`** (`src/components/PromotionLegalInfo.tsx`) resume en la interfaz:

1. **Definición legal**: precio base, producto, características, cantidad máxima, vigencia.
2. **Valor en USD (tokenización)**: uso de USD para representar el valor en tokens.
3. **Vigencia**: redenciones solo válidas entre fecha inicio y fin.
4. **Límite de redenciones**: máximo de cupones disponibles y agotamiento.

Se usa en:

- `/quick-promotion` (QuickPromotionPage)
- `/create-promotion` (CreatePromotionWizard)

---

## Pasivo financiero medible

La promoción deja de ser un **descuento difuso** y pasa a ser un **pasivo financiero medible** porque:

1. Cada tipo (porcentaje, 2x1, cashback) se traduce en un **monto exacto en USD**.
2. **X tokens = X USD**: el valor promocional es la unidad calculable del contrato final.
3. El sistema registra **`promotionalValueUsd`** por promoción y puede asociarlo al ledger y a la liquidación al influencer.

Así el contrato tiene una unidad clara (USD/tokens) para conciliación y pago.

---

## Modelo Promotion (backend)

Campos añadidos o usados para el Gherkin:

- **`totalQuantity`** (Number, opcional): límite de promociones redimibles. Si está definido, al llegar a ese número la promoción se considera agotada.
- **`validFrom`** / **`validUntil`**: vigencia de la promoción.
- **`currency`**: solo USD. Cálculos y valor económico en tokens en dólares.
- **`offerType`** (String): `percentage` | `bogo` | `cashback_fixed` | `cashback_percentage` (tipo de oferta para conversión a USD).
- **`cashbackValue`** (Number, opcional): valor fijo en USD (cashback_fixed) o porcentaje 0–100 (cashback_percentage).
- **`promotionalValueUsd`** (Number, opcional): valor promocional en USD calculado; unidad calculable del contrato (X tokens = X USD).

Util **`server/utils/promotionValueUsd.js`**: `getPromotionalValueUsd(opts)` calcula el valor en USD según `offerType` y los precios/porcentajes. El controller asigna `promotionalValueUsd` al crear y al actualizar la promoción.

La lógica de **rechazar redenciones fuera de vigencia o por encima del límite** se implementa en los endpoints de verify/redeem del discount-qr (y en reglas de negocio de promociones) usando estos campos.
