# Promotion Smart Contract Standard (PSCS-1)

### Especificación para Promociones Tokenizadas

**Versión:** 1.0  
**Autor:** BizneAI / DameCodigo  
**Estado:** Draft  

---

## 1. Introducción

El **Promotion Smart Contract Standard (PSCS-1)** define un modelo estructurado para representar promociones comerciales como contratos programables y auditables.

El objetivo del estándar es transformar promociones tradicionales (descuentos, cupones, cashback, 2x1) en **unidades económicas determinísticas**, medibles en USD y representadas mediante tokens estables (LUXAE).

Este modelo permite:

- Promociones verificables
- Emisión económica programable
- Contabilidad automática
- Liquidación transparente con influencers o afiliados
- Trazabilidad completa en blockchain

Cada promoción se representa como un **contrato digital que define sus reglas, valor económico y condiciones de redención**.

---

## 2. Principios del estándar

El modelo PSCS-1 se basa en cinco principios fundamentales.

| # | Principio | Descripción |
|---|-----------|-------------|
| 1 | **Determinismo económico** | Toda promoción debe poder calcularse matemáticamente. |
| 2 | **Unidad económica estable** | El valor promocional se expresa en **USD**. **1 TOKEN (LUXAE) = 1 USD**. |
| 3 | **Emisión bajo redención** | Los tokens **no se crean al publicar la promoción**, sino únicamente cuando ocurre una redención válida. |
| 4 | **Límite de pasivo promocional** | Cada promoción define un límite máximo de emisión económica. |
| 5 | **Trazabilidad completa** | Cada redención genera un registro auditable. |

### 2.6 Normalización a USD cuando la promoción está en español (MXN)

En la creación de promociones, cuando los precios están en **español / pesos (MXN)**:

1. **Se calcula el precio en dólares**: se aplica el tipo de cambio MXN→USD (dinámico o `FX_MXN_USD` en `.env`).
2. **Se normaliza en USD**: todos los cálculos de valor por cupón, emisión máxima y tokens se realizan en **dólares americanos (USD)**.
3. **Unidad del stablecoin**: el stablecoin (LUXAE) está referenciado a USD; por tanto las unidades en pesos se transforman a USD y los tokens se expresan siempre en esa moneda.

Así, una promoción con precios en MXN se convierte a USD y el valor por cupón (`valuePerCouponUsd`), la emisión máxima (`maxEmissionUsd`) y los LUXAE creados quedan en USD. La API puede devolver `normalizedCurrency: "USD"` para indicar que los valores numéricos ya están en la unidad de medida del contrato.

---

## 3. Estructura del contrato de promoción

Cada promoción debe contener los siguientes campos obligatorios.

### 3.1 Identificación

```json
{
  "promotion_id": "string",
  "contract_version": "PSCS-1",
  "created_at": "timestamp",
  "issuer": "string",
  "jurisdiction": "string"
}
```

**Ejemplo:**

```json
{
  "promotion_id": "PROMO-INV-TRAIL-2026-04",
  "contract_version": "PSCS-1",
  "created_at": "2026-03-04T00:00:00Z",
  "issuer": "Innovasport",
  "jurisdiction": "MX"
}
```

### 3.2 Definición del producto

La promoción debe identificar claramente el producto o servicio.

```json
{
  "product": {
    "name": "string",
    "category": "string",
    "sku": "string",
    "attributes": {}
  }
}
```

**Ejemplo:**

```json
{
  "product": {
    "name": "On Cloudsurfer Trail 2",
    "category": "Sports",
    "sku": "ON-TRAIL-2",
    "attributes": {
      "sizes": [25.5, 26.5, 28, 28.5, 29]
    }
  }
}
```

### 3.3 Definición del precio

Se debe declarar el precio original y la moneda base.

```json
{
  "pricing": {
    "original_price": "number",
    "currency": "string"
  }
}
```

**Ejemplo:**

```json
{
  "pricing": {
    "original_price": 4899,
    "currency": "MXN"
  }
}
```

### 3.4 Tipo de promoción

El contrato debe especificar el tipo de promoción.

**Tipos soportados:**

| Tipo | Descripción |
|------|-------------|
| `percentage_discount` | Descuento por porcentaje |
| `fixed_discount` | Descuento fijo en moneda |
| `cashback` | Cashback (fijo o porcentaje) |
| `buy_one_get_one` | 2x1 / BOGO |
| `rebate` | Reembolso |
| `conditional_bonus` | Bono condicional |

**Ejemplo:**

```json
{
  "promotion_type": "percentage_discount"
}
```

### 3.5 Parámetros de cálculo

Cada tipo de promoción define sus parámetros.

**Descuento porcentual:**

```json
{
  "discount_percentage": 40
}
```

**Descuento fijo:**

```json
{
  "discount_fixed": 100,
  "discount_currency": "USD"
}
```

**Cashback:**

```json
{
  "cashback_type": "percentage",
  "cashback_value": 10
}
```

### 3.6 Inventario promocional

Define cuántas promociones pueden redimirse.

```json
{
  "inventory": {
    "total_coupons": "number",
    "redeemed": "number"
  }
}
```

**Ejemplo:**

```json
{
  "inventory": {
    "total_coupons": 100,
    "redeemed": 0
  }
}
```

### 3.7 Vigencia

Define el periodo válido de la promoción.

```json
{
  "validity": {
    "start_date": "timestamp",
    "end_date": "timestamp"
  }
}
```

**Ejemplo:**

```json
{
  "validity": {
    "start_date": "2026-03-04",
    "end_date": "2026-04-03"
  }
}
```

### 3.8 Oráculo de tipo de cambio

Cuando el precio base no está en USD se requiere un oráculo de conversión.

```json
{
  "fx_oracle": {
    "source": "string",
    "base_currency": "string",
    "target_currency": "string"
  }
}
```

**Ejemplo:**

```json
{
  "fx_oracle": {
    "source": "Chainlink",
    "base_currency": "MXN",
    "target_currency": "USD"
  }
}
```

**Implementación:** El servidor obtiene el tipo de cambio MXN→USD **de forma dinámica** desde una API externa (`server/services/fxRate.js`). Se cachea 10 minutos. Si la API falla, se usa la variable de entorno `FX_MXN_USD` o un valor por defecto (~0.058). Los precios en MXN se multiplican por este factor para obtener valor por cupón y emisión máxima en USD (LUXAE).

---

## 4. Fórmulas de cálculo

### 4.1 Descuento porcentual

```
Vp = P × (D / 100)
```

Donde:

- **P** = precio original
- **D** = porcentaje de descuento
- **Vp** = valor promocional (en moneda base)

### 4.2 Descuento fijo

```
Vp = F
```

Donde:

- **F** = descuento fijo (en la moneda definida)

### 4.3 Promoción 2x1 (BOGO)

```
Vp = P × floor(Q / 2)
```

Donde:

- **P** = precio del producto
- **Q** = cantidad comprada
- **Vp** = valor promocional

### 4.4 Cashback

- **Porcentaje:** `Vp = P × (C / 100)`
- **Fijo:** `Vp = C` (en USD)

---

## 5. Emisión económica máxima

El contrato calcula el pasivo promocional máximo:

```
MaxEmission = ValuePerCoupon × TotalCoupons
```

**Ejemplo:**

- Valor unitario: 98 USD  
- Cupones: 100  
- **Emisión máxima = 9,800 USD**

---

## 6. Conversión a token (LUXAE)

El valor promocional se convierte a token estable. LUXAE es 1:1 con USD.

```
TokensEmitidos = ValorPromocionalUSD
```

**Ejemplo:**

- 98 USD → **98 LUXAE**

---

## 7. Flujo de redención

Proceso estándar de redención:

1. Usuario realiza compra
2. Sistema valida promoción
3. Sistema calcula valor promocional
4. Sistema consulta tipo de cambio (si aplica)
5. Se emiten tokens LUXAE equivalentes
6. Tokens se asignan al influencer
7. Se registra el pasivo promocional
8. Se emite evento `CouponRedeemed` / `TokensMinted`

---

## 8. Estados del contrato

El contrato puede tener los siguientes estados:

| Estado | Descripción |
|--------|-------------|
| `draft` | Borrador, no activo |
| `active` | Activo y redimible |
| `paused` | Pausado temporalmente |
| `completed` | Cupones agotados o cerrado por la marca |
| `expired` | Fuera de vigencia |

---

## 9. Registro de eventos

Cada contrato debe emitir eventos auditables.

| Evento | Descripción |
|--------|-------------|
| `PromotionCreated` | Contrato creado |
| `PromotionActivated` | Contrato activado |
| `CouponRedeemed` | Cupón redimido |
| `TokensMinted` | Tokens emitidos para la redención |
| `PromotionClosed` | Contrato cerrado |

**Ejemplo de evento:**

```json
{
  "event": "CouponRedeemed",
  "promotion_id": "PROMO-INV-TRAIL-2026-04",
  "value_usd": 98,
  "tokens_minted": 98,
  "timestamp": 1712100000
}
```

---

## 10. Liquidación

Los tokens acumulados por influencers pueden liquidarse en fiat.

**Proceso:**

1. Influencer acumula tokens LUXAE
2. Marca/autoridad autoriza liquidación
3. Sistema genera orden de pago
4. Tokens se marcan como liquidados
5. Se registra evento de liquidación

---

## 11. Ventajas del estándar

PSCS-1 permite:

- Promociones auditables
- Marketing basado en resultados
- Liquidación automática con influencers
- Eliminación de fraude en afiliados
- Contabilidad automática de incentivos
- Pasivo promocional acotado y predecible

---

## 12. Caso de ejemplo completo

| Campo | Valor |
|-------|--------|
| **Producto** | On Cloudsurfer Trail 2 |
| **Precio original** | 4,899 MXN |
| **Descuento** | 40% |
| **Valor promocional** | 1,960 MXN ≈ 98 USD |
| **Cupones disponibles** | 100 |
| **Pasivo promocional máximo** | 9,800 USD |
| **LUXAE máximos** | 9,800 (1 LUXAE = 1 USD) |

---

## 13. Conclusión

El estándar PSCS-1 convierte promociones comerciales en **contratos económicos programables**.

Esto transforma el marketing de:

- **Gasto incierto** → **Emisión económica determinística**

---

## 14. Referencia de implementación

- **Modelo de datos:** `server/models/Promotion.js` (mapeo a campos PSCS-1)
- **Página de contrato:** `src/pages/PromotionSmartContractPage.tsx`
- **Cálculo de valor USD:** `server/utils/promotionValueUsd.js`
