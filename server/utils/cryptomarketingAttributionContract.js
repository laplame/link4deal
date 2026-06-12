const DEFAULT_ATTRIBUTION_PROVIDER = process.env.ATTRIBUTION_CONTRACT_PROVIDER_NAME || 'DameCodigo';
const BIZNEAI_URL = process.env.BIZNEAI_WEBSITE_URL || 'https://www.bizneai.com/';

function formatAttributionContractSignDate(isoDate) {
    const trimmed = (isoDate || '').trim();
    if (!trimmed) return '__________________________';
    const d = new Date(`${trimmed}T12:00:00`);
    if (Number.isNaN(d.getTime())) return trimmed;
    return new Intl.DateTimeFormat('es-MX', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }).format(d);
}

function formatAgreedRedemptionPercent(percent) {
    if (percent == null || !Number.isFinite(Number(percent))) {
        return 'los porcentajes pactados entre las partes en la oferta promocional';
    }
    const n = Math.round(Number(percent) * 100) / 100;
    return `el ${n}% pactado entre las partes`;
}

function normalizeIsoDate(value) {
    if (value == null || String(value).trim() === '') return '';
    const s = String(value).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 10);
}

function pickPromotionContextFromBody(body, payload) {
    const validFrom = normalizeIsoDate(
        payload.promotionValidFrom ?? body.validFrom ?? body.startDate
    );
    const validUntil = normalizeIsoDate(
        payload.promotionValidUntil ?? body.validUntil ?? body.endDate
    );
    let totalQuantity = payload.promotionTotalQuantity ?? body.totalQuantity;
    if (totalQuantity !== undefined && totalQuantity !== null && String(totalQuantity).trim() !== '') {
        const n = typeof totalQuantity === 'number' ? totalQuantity : parseInt(String(totalQuantity), 10);
        totalQuantity = Number.isFinite(n) && n > 0 ? n : null;
    } else {
        totalQuantity = null;
    }

    let agreedRedemptionPercent = payload.agreedRedemptionPercent ?? body.agreedRedemptionPercent;
    if (agreedRedemptionPercent == null || agreedRedemptionPercent === '') {
        const disc = body.discountPercentage;
        if (disc !== undefined && disc !== null && String(disc).trim() !== '') {
            const n = parseFloat(String(disc));
            if (Number.isFinite(n)) agreedRedemptionPercent = n;
        }
    }
    if (agreedRedemptionPercent != null && agreedRedemptionPercent !== '') {
        const n = typeof agreedRedemptionPercent === 'number'
            ? agreedRedemptionPercent
            : parseFloat(String(agreedRedemptionPercent));
        agreedRedemptionPercent = Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : null;
    } else {
        agreedRedemptionPercent = null;
    }

    return { validFrom, validUntil, totalQuantity, agreedRedemptionPercent };
}

function buildCryptomarketingAttributionContract(vars) {
    const client = (vars.clientName || '').trim() || '__________________________';
    const provider = (vars.providerName || '').trim() || '__________________________';
    const signDateFormatted = formatAttributionContractSignDate(vars.signDate);
    const validFromFormatted = formatAttributionContractSignDate(vars.promotionValidFrom);
    const validUntilFormatted = formatAttributionContractSignDate(vars.promotionValidUntil);
    const totalQty =
        typeof vars.promotionTotalQuantity === 'number' && Number.isFinite(vars.promotionTotalQuantity) && vars.promotionTotalQuantity > 0
            ? String(Math.round(vars.promotionTotalQuantity))
            : '______';
    const redemptionPctText = formatAgreedRedemptionPercent(vars.agreedRedemptionPercent);

    const vigenciaClause =
        vars.contractMonths && vars.contractMonths > 0 && !vars.promotionValidFrom
            ? `El presente contrato tendrá una vigencia de ${vars.contractMonths} meses a partir de su firma.`
            : `El presente contrato tendrá vigencia **exclusivamente** durante el periodo de la promoción asociada, del **${validFromFormatted}** al **${validUntilFormatted}**.

La vigencia queda además limitada al volumen promocional pactado: **${totalQty}** unidades o piezas disponibles para venta y redención bajo esta campaña. El contrato se entenderá automáticamente terminado al vencimiento del plazo promocional, al agotar dicho inventario o al cierre de la campaña, lo que ocurra primero.`;

    return `# CONTRATO DE PRESTACIÓN DE SERVICIOS DE MARKETING DIGITAL CON MODELO DE ATRIBUCIÓN PROPIETARIO

**QUE CELEBRAN POR UNA PARTE** ${client} ("EL CLIENTE") Y POR LA OTRA ${provider} ("EL PRESTADOR"), AL TENOR DE LAS SIGUIENTES DECLARACIONES Y CLÁUSULAS:

---

## DECLARACIONES

### I. Declara EL PRESTADOR:

1. Que es una persona física o moral legalmente constituida conforme a las leyes mexicanas.
2. Que cuenta con la capacidad técnica, operativa y legal para prestar servicios de marketing digital.
3. Que es titular o licenciatario de una tecnología propietaria y/o patentada denominada **"Cryptomarketing"**, incluyendo su sistema de atribución.
4. Que pone a disposición el sistema **BizneAI** para lectura de tokens, verificación de compras y redención de promociones.

### II. Declara EL CLIENTE:

1. Que es una persona física o moral con capacidad legal para contratar.
2. Que desea contratar los servicios de EL PRESTADOR.
3. Que reconoce la naturaleza tecnológica y propietaria del sistema de atribución.
4. Que acepta el uso obligatorio de BizneAI para verificar compras y redenciones conforme a los porcentajes pactados.

---

## CLÁUSULAS

### CERO BIS. MARCO REGULATORIO FINTECH E INTENCIÓN DE CUMPLIMIENTO

Las partes reconocen que el modelo tecnológico y operativo de EL PRESTADOR podrá encuadrar, total o parcialmente, dentro de las disposiciones aplicables a Instituciones de Fondos de Pago Electrónico (IFPE) conforme a la legislación mexicana vigente.

En este sentido, EL PRESTADOR manifiesta su intención de gestionar, en su caso, las autorizaciones necesarias ante las autoridades competentes, incluyendo el Banco de México y demás entidades regulatorias aplicables.

EL CLIENTE reconoce y acepta que:

* El sistema de EL PRESTADOR no constituye, al momento de la firma del presente contrato, una Institución de Fondos de Pago Electrónico autorizada, salvo manifestación expresa en contrario.
* Cualquier funcionalidad relacionada con saldos, equivalencias monetarias, tokens, recompensas o mecanismos similares tendrá carácter operativo, tecnológico o comercial, y no implicará captación de recursos del público en los términos de la legislación financiera.
* En caso de que EL PRESTADOR obtenga autorización como IFPE, las partes podrán celebrar convenios modificatorios para adecuar la operación a dicho marco regulatorio.

Asimismo, en caso de que EL PRESTADOR implemente mecanismos equivalentes a fondos de pago electrónico:

* Dichos valores estarán referenciados a moneda nacional o extranjera conforme a parámetros definidos por el Banco de México.
* Se procurará mantener una equivalencia económica (paridad) con el activo subyacente.
* Se establecerán mecanismos de redención o compensación conforme a la normativa aplicable en su momento.

---

### PRIMERA. OBJETO

EL PRESTADOR se obliga a prestar servicios de marketing digital, incluyendo campañas, generación de leads, conversiones y estrategias comerciales basadas en un modelo de atribución propietario, vinculado a la promoción vigente del **${validFromFormatted}** al **${validUntilFormatted}** por un máximo de **${totalQty}** piezas.

---

### SEGUNDA. MODELO DE ATRIBUCIÓN

Las partes acuerdan que el sistema denominado **"Cryptomarketing"** será el único mecanismo válido para medir resultados.

Este sistema podrá utilizar tecnologías como blockchain, identificadores digitales, registros criptográficos, smart contracts, logs y otros mecanismos tecnológicos.

Los resultados generados por este sistema serán considerados **definitivos, vinculantes e inapelables**, salvo error técnico comprobable.

---

### SEGUNDA BIS. SISTEMA BIZNEAI, LECTURA DE TOKENS Y REDENCIÓN

EL PRESTADOR, a través de **DameCodigo**, pone a disposición de EL CLIENTE su sistema propietario de lectura de tokens **BizneAI** (${BIZNEAI_URL}), integrado al ecosistema Cryptomarketing.

EL CLIENTE reconoce y acepta que el uso de **BizneAI es obligatorio** para:

* Verificar la compra efectuada por el consumidor final en los términos de la promoción.
* Validar la emisión, circulación y lectura de tokens asociados a la campaña.
* Ejecutar la **redención** de promociones conforme a **${redemptionPctText}**.

Sin la verificación mediante BizneAI, no procederá la atribución, liquidación ni redención en los porcentajes acordados. EL CLIENTE no podrá impugnar la falta de redención cuando no se haya utilizado el sistema de verificación obligatorio.

---

### TERCERA. ACEPTACIÓN DE DATOS

EL CLIENTE acepta que los datos generados por la plataforma de EL PRESTADOR y por BizneAI constituyen evidencia suficiente para efectos de facturación, verificación de compra y redención, incluyendo registros digitales, hashes, logs y reportes automatizados.

---

### CUARTA. CONTRAPRESTACIÓN

EL CLIENTE pagará a EL PRESTADOR conforme a los resultados obtenidos bajo el modelo de atribución y los porcentajes pactados en la promoción.

Las tarifas podrán estar denominadas en dólares estadounidenses (USD), sin embargo, el pago se realizará en pesos mexicanos (MXN).

---

### QUINTA. TIPO DE CAMBIO

Para efectos de pago, se utilizará el tipo de cambio FIX publicado por el Banco de México en la fecha de facturación.

---

### SEXTA. FACTURACIÓN

EL PRESTADOR emitirá el CFDI correspondiente en pesos mexicanos conforme a la legislación fiscal vigente.

---

### SÉPTIMA. PROPIEDAD INTELECTUAL

EL PRESTADOR es titular exclusivo de todos los derechos de propiedad intelectual relacionados con la tecnología **"Cryptomarketing"** y **BizneAI**, incluyendo pero no limitado a:

* Algoritmos
* Modelos de atribución
* Smart contracts
* Software
* Bases de datos
* Arquitectura tecnológica

En caso de existir una patente o solicitud de patente, EL CLIENTE reconoce que dicha tecnología está protegida por las leyes de propiedad industrial.

EL CLIENTE se obliga a:

* No copiar, reproducir o modificar la tecnología
* No intentar ingeniería inversa
* No usar el sistema fuera del alcance del contrato

---

### OCTAVA. LICENCIA DE USO

EL PRESTADOR otorga a EL CLIENTE una licencia limitada, no exclusiva, no transferible y revocable para el uso del sistema durante la vigencia del contrato y el periodo de la promoción.

---

### NOVENA. CONFIDENCIALIDAD

Ambas partes se obligan a mantener confidencial toda la información técnica, comercial y operativa.

---

### DÉCIMA. NO IMPUGNACIÓN

EL CLIENTE renuncia a impugnar los resultados del sistema de atribución y de BizneAI, salvo en casos de dolo, fraude o falla técnica grave comprobable.

---

### DÉCIMA PRIMERA. RESPONSABILIDAD

EL PRESTADOR no garantiza resultados comerciales específicos, sino únicamente la correcta ejecución del sistema de atribución y los mecanismos de verificación mediante BizneAI.

---

### DÉCIMA SEGUNDA. VIGENCIA Y ALCANCE

${vigenciaClause}

---

### DÉCIMA TERCERA. TERMINACIÓN

Cualquiera de las partes podrá dar por terminado el contrato con previo aviso de 30 días, sin perjuicio de la terminación automática por vencimiento de la promoción o agotamiento del inventario promocional.

---

### DÉCIMA CUARTA. JURISDICCIÓN

Para la interpretación del presente contrato, las partes se someten a las leyes y tribunales de México.

---

## FIRMAS

EL CLIENTE: ${client}

EL PRESTADOR: ${provider}

Fecha: ${signDateFormatted}
`;
}

/**
 * @param {Record<string, unknown>} body
 * @returns {object | null}
 */
function parseAttributionContractFromBody(body) {
    if (!body || typeof body !== 'object') return null;

    let payload = null;
    const raw = body.attributionContract;
    if (raw !== undefined && raw !== null && String(raw).trim() !== '') {
        try {
            payload = typeof raw === 'string' ? JSON.parse(raw) : raw;
        } catch {
            return { error: 'attributionContract inválido (JSON)' };
        }
    } else {
        const type = body.attributionContractType;
        if (!type || String(type).trim() === '' || String(type).trim() === 'none') {
            return null;
        }
        payload = {
            type: String(type).trim(),
            clientName: body.attributionContractClientName,
            providerName: body.attributionContractProviderName,
            signDate: body.attributionContractSignDate,
            promotionValidFrom: body.attributionContractValidFrom,
            promotionValidUntil: body.attributionContractValidUntil,
            promotionTotalQuantity: body.attributionContractTotalQuantity,
            agreedRedemptionPercent: body.attributionContractRedemptionPercent
        };
    }

    if (!payload || typeof payload !== 'object') return null;

    const type = String(payload.type || 'none').trim();
    if (type === 'none' || !type) return null;
    if (type !== 'cryptomarketing') {
        return { error: 'Tipo de contrato de atribución no soportado' };
    }

    const clientName = payload.clientName != null ? String(payload.clientName).trim() : '';
    const providerName =
        payload.providerName != null && String(payload.providerName).trim()
            ? String(payload.providerName).trim()
            : DEFAULT_ATTRIBUTION_PROVIDER;

    if (!clientName) {
        return { error: 'El nombre de EL CLIENTE es obligatorio para el contrato Cryptomarketing' };
    }

    const promoCtx = pickPromotionContextFromBody(body, payload);
    const legacyMonths = payload.contractMonths;

    if (!promoCtx.validFrom || !promoCtx.validUntil) {
        if (!(legacyMonths && Number(legacyMonths) > 0)) {
            return { error: 'Define el periodo de vigencia de la promoción (validFrom / validUntil) para el contrato' };
        }
    }

    if (!promoCtx.totalQuantity && !(legacyMonths && Number(legacyMonths) > 0)) {
        return { error: 'Define la cantidad de piezas de la promoción (totalQuantity) para el contrato' };
    }

    if (promoCtx.validFrom && promoCtx.validUntil && promoCtx.validFrom > promoCtx.validUntil) {
        return { error: 'La fecha de inicio de la promoción debe ser anterior a la de fin' };
    }

    const signDate =
        payload.signDate != null && String(payload.signDate).trim()
            ? String(payload.signDate).trim().slice(0, 10)
            : promoCtx.validFrom || new Date().toISOString().slice(0, 10);

    const contractMonths =
        legacyMonths != null && String(legacyMonths).trim() !== ''
            ? parseInt(String(legacyMonths), 10)
            : undefined;

    const renderedText = buildCryptomarketingAttributionContract({
        clientName,
        providerName,
        signDate,
        promotionValidFrom: promoCtx.validFrom,
        promotionValidUntil: promoCtx.validUntil,
        promotionTotalQuantity: promoCtx.totalQuantity || 0,
        agreedRedemptionPercent: promoCtx.agreedRedemptionPercent,
        contractMonths: Number.isFinite(contractMonths) ? contractMonths : undefined
    });

    return {
        type: 'cryptomarketing',
        clientName,
        providerName,
        signDate,
        promotionValidFrom: promoCtx.validFrom,
        promotionValidUntil: promoCtx.validUntil,
        promotionTotalQuantity: promoCtx.totalQuantity,
        agreedRedemptionPercent: promoCtx.agreedRedemptionPercent,
        contractMonths: Number.isFinite(contractMonths) ? contractMonths : undefined,
        renderedText
    };
}

module.exports = {
    DEFAULT_ATTRIBUTION_PROVIDER,
    buildCryptomarketingAttributionContract,
    parseAttributionContractFromBody
};
