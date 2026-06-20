export const TERMS_VERSION = '2026-06';
export const TERMS_ACCEPTED_VERSION_KEY = 'terms_accepted_version';
export const TERMS_ACCEPTED_AT_KEY = 'terms_accepted_at';
export const LAST_UPDATED = 'Junio 2026';
export const SUPPORT_EMAIL = 'soporte@damecodigo.com';

export type TermsBlock =
    | { type: 'p'; text: string }
    | { type: 'ul'; items: string[] }
    | { type: 'def'; term: string; text: string };

export interface TermsSection {
    n: number;
    title: string;
    blocks: TermsBlock[];
}

export const TERMS_SECTIONS: TermsSection[] = [
    {
        n: 1,
        title: 'Aceptación de los términos',
        blocks: [
            { type: 'p', text: 'Al registrarse, acceder o utilizar cualquiera de los servicios, aplicaciones, plataformas, sitios web o herramientas operadas por DameCodigo, Link4Deal, BizneAI o cualquiera de sus afiliadas (en adelante "La Plataforma"), el usuario acepta expresamente los presentes Términos y Condiciones.' },
            { type: 'p', text: 'Si el usuario no está de acuerdo con estos términos, deberá abstenerse de utilizar los servicios.' },
        ],
    },
    {
        n: 2,
        title: 'Definiciones',
        blocks: [
            { type: 'p', text: 'Para efectos de estos términos:' },
            { type: 'def', term: 'Usuario:', text: 'Persona física o moral que utiliza la aplicación para obtener promociones, descuentos, cashback o recompensas.' },
            { type: 'def', term: 'Influencer / Deal Hunter:', text: 'Usuario autorizado para promocionar negocios, productos o servicios utilizando herramientas de atribución proporcionadas por la plataforma.' },
            { type: 'def', term: 'Comercio Afiliado:', text: 'Negocio registrado que participa dentro del ecosistema mediante promociones, campañas o programas de atribución.' },
            { type: 'def', term: 'Cryptomarketing:', text: 'Modelo de marketing basado en resultados verificables, atribución digital, recompensas y mecanismos de incentivos digitales.' },
            { type: 'def', term: 'Deal:', text: 'Oferta, promoción, descuento, cashback o beneficio publicado por un comercio afiliado.' },
            { type: 'def', term: 'Atribución:', text: 'Proceso mediante el cual la plataforma identifica, registra y valida la influencia de una recomendación, promoción o campaña en una venta o conversión.' },
            { type: 'def', term: 'Tokens:', text: 'Activos digitales de utilidad emitidos o distribuidos dentro del ecosistema con el propósito de validar, registrar y verificar transacciones, ventas, recompensas, atribuciones y actividades realizadas dentro de la Plataforma. Los tokens no constituyen moneda de curso legal ni instrumentos financieros y su uso está limitado al ecosistema de la Plataforma conforme a estos términos.' },
        ],
    },
    {
        n: 3,
        title: 'Objeto de la plataforma',
        blocks: [
            { type: 'p', text: 'La Plataforma proporciona infraestructura tecnológica para:' },
            { type: 'ul', items: ['Publicación de promociones.', 'Distribución de descuentos.', 'Programas de cashback.', 'Sistemas de atribución comercial.', 'Programas de referidos.', 'Gestión de campañas de influencers.', 'Analítica comercial.', 'Herramientas de fidelización.', 'Soluciones de comercio digital y físico.'] },
            { type: 'p', text: 'La Plataforma no garantiza ventas, ingresos ni resultados específicos.' },
            { type: 'p', text: 'Asimismo, la Plataforma se reserva el derecho de rechazar, suspender o eliminar promociones, campañas, productos o servicios que infrinjan la legislación aplicable o que, a criterio razonable de la Plataforma, representen riesgos para la salud, la seguridad de los consumidores o generen controversias médicas, sanitarias o regulatorias.' },
        ],
    },
    {
        n: 4,
        title: 'Elegibilidad',
        blocks: [
            { type: 'p', text: 'Para utilizar los servicios el usuario deberá:' },
            { type: 'ul', items: ['Ser mayor de edad conforme a la legislación aplicable.', 'Proporcionar información veraz y actualizada.', 'Mantener la seguridad de sus credenciales de acceso.', 'Cumplir las leyes de su jurisdicción.'] },
            { type: 'p', text: 'La Plataforma podrá solicitar verificaciones de identidad cuando lo considere necesario.' },
        ],
    },
    {
        n: 5,
        title: 'Programa de descuentos y deals',
        blocks: [
            { type: 'p', text: 'Los descuentos y promociones:' },
            { type: 'ul', items: ['Son emitidos por comercios afiliados.', 'Pueden estar sujetos a disponibilidad.', 'Pueden modificarse o cancelarse sin previo aviso.', 'Están sujetos a términos específicos definidos por cada comercio.'] },
            { type: 'p', text: 'La Plataforma actúa únicamente como intermediario tecnológico.' },
            { type: 'p', text: 'No será responsable por:' },
            { type: 'ul', items: ['Calidad de productos.', 'Garantías comerciales.', 'Entregas.', 'Existencias.', 'Servicio postventa.'] },
            { type: 'p', text: 'Los comercios afiliados se comprometen a no publicar, promocionar, comercializar o distribuir productos, servicios o tratamientos que estén prohibidos por la legislación local, estatal, nacional o internacional aplicable, ni aquellos que puedan representar riesgos significativos para la salud pública, la integridad física de las personas o que sean objeto de controversias médicas, científicas o sanitarias relevantes.' },
            { type: 'p', text: 'La Plataforma podrá retirar cualquier promoción o comercio que incumpla esta disposición sin previo aviso.' },
        ],
    },
    {
        n: 6,
        title: 'Cashback y recompensas',
        blocks: [
            { type: 'p', text: 'Los usuarios podrán recibir beneficios derivados de:' },
            { type: 'ul', items: ['Compras verificadas.', 'Participación en campañas.', 'Programas promocionales.', 'Actividades de fidelización.'] },
            { type: 'p', text: 'La acreditación de recompensas podrá estar sujeta a:' },
            { type: 'ul', items: ['Validación de la compra.', 'Confirmación del comercio.', 'Periodos de revisión antifraude.', 'Cumplimiento de requisitos específicos.'] },
            { type: 'p', text: 'La Plataforma podrá cancelar recompensas obtenidas mediante actividades fraudulentas o abusivas.' },
            { type: 'p', text: 'No se otorgan cashback, comisiones ni recompensas por impactos, impresiones, alcance, visualizaciones ni por la producción de videos o fotografías. Los beneficios aplican únicamente a resultados comerciales verificables (por ejemplo, compras o conversiones atribuidas), salvo acuerdo expreso por escrito en una campaña concreta.' },
        ],
    },
    {
        n: 7,
        title: 'Tokens y activos digitales',
        blocks: [
            { type: 'p', text: 'Los tokens distribuidos dentro del ecosistema:' },
            { type: 'ul', items: ['No representan acciones.', 'No representan participación accionaria.', 'No otorgan derechos corporativos.', 'No constituyen valores financieros.', 'No garantizan rendimientos.', 'No representan deuda de la empresa.', 'No constituyen moneda de curso legal.', 'No otorgan derechos de propiedad sobre la Plataforma.'] },
            { type: 'p', text: 'Los tokens tienen funciones de utilidad dentro del ecosistema y son utilizados para:' },
            { type: 'ul', items: ['Validar que una venta, transacción o conversión fue generada y atribuida correctamente.', 'Registrar actividades comerciales verificables.', 'Gestionar recompensas, cashback e incentivos.', 'Facilitar procesos de atribución y validación dentro de la Plataforma.', 'Permitir la interacción entre usuarios, influencers y comercios afiliados.'] },
            { type: 'p', text: 'Los tokens únicamente podrán ser utilizados, intercambiados o redimidos dentro de la Plataforma conforme a las reglas operativas vigentes.' },
            { type: 'p', text: 'Cuando un comercio afiliado ofrezca promociones, recompensas o beneficios asociados a una moneda, activo digital, crédito comercial o cualquier otro mecanismo de compensación, los tokens podrán ser utilizados como mecanismo de validación y posteriormente intercambiados conforme a las condiciones establecidas por dicho comercio y por la Plataforma.' },
            { type: 'p', text: 'La salida de tokens del ecosistema o su conversión hacia mecanismos externos únicamente podrá realizarse cuando corresponda y esté habilitada por la Plataforma, previa validación de identidad mediante procedimientos de Conozca a su Cliente (KYC), verificación de cumplimiento normativo, controles antifraude y cualquier otro requisito que la Plataforma considere necesario para usuarios, influencers o comercios afiliados.' },
            { type: 'p', text: 'La Plataforma podrá limitar, suspender, rechazar o cancelar cualquier transferencia, intercambio, redención o conversión de tokens cuando existan indicios de fraude, incumplimiento normativo, actividades ilícitas o riesgos regulatorios.' },
            { type: 'p', text: 'La disponibilidad, emisión, distribución, intercambio o redención de tokens podrá modificarse en cualquier momento.' },
        ],
    },
    {
        n: 8,
        title: 'Programa de influencers y deal hunters',
        blocks: [
            { type: 'p', text: 'Los Influencers o Deal Hunters podrán:' },
            { type: 'ul', items: ['Compartir promociones.', 'Generar enlaces de atribución.', 'Solicitar campañas.', 'Participar en programas de monetización.'] },
            { type: 'p', text: 'La participación no genera relación laboral, asociación, franquicia o representación legal entre las partes.' },
            { type: 'p', text: 'Las comisiones estarán sujetas a:' },
            { type: 'ul', items: ['Ventas válidas.', 'Atribución verificable.', 'Cumplimiento de políticas antifraude.', 'Confirmación de pago por parte del comercio.'] },
            { type: 'p', text: 'Salvo acuerdo expreso por escrito entre las partes en una campaña concreta, la Plataforma no paga, no remunera ni compensa —en dinero, tokens, cashback, comisiones u otros beneficios del ecosistema— por:' },
            { type: 'ul', items: ['Impactos o impresiones publicitarias.', 'Alcance, visualizaciones, reproducciones o métricas de engagement.', 'Producción, edición, entrega o publicación de videos.', 'Producción, edición, entrega o publicación de fotografías u otro contenido creativo.'] },
            { type: 'p', text: 'Cualquier compensación a Influencers o Deal Hunters se limita exclusivamente a conversiones, ventas u otros resultados comerciales verificables conforme a las reglas de atribución vigentes.' },
            { type: 'p', text: 'Los Influencers y Deal Hunters tienen prohibido promocionar, recomendar o difundir productos o servicios prohibidos por la legislación aplicable, así como productos relacionados con tratamientos médicos no autorizados, sustancias restringidas, productos potencialmente peligrosos para la salud o cualquier oferta que pueda generar riesgos sanitarios para los consumidores.' },
            { type: 'p', text: 'La Plataforma podrá suspender o cancelar cuentas involucradas en:' },
            { type: 'ul', items: ['Tráfico artificial.', 'Bots.', 'Autocompras.', 'Manipulación de métricas.', 'Información engañosa.', 'Actividades fraudulentas.', 'Actividades ilícitas o delictivas.', 'Investigaciones relacionadas con lavado de dinero, financiamiento ilícito, fraude, robo de identidad o cualquier conducta contraria a la ley.', 'Promoción o comercialización de productos prohibidos o que representen riesgos para la salud o seguridad de los consumidores.'] },
        ],
    },
    {
        n: 9,
        title: 'Sistema de atribución',
        blocks: [
            { type: 'p', text: 'La Plataforma utiliza mecanismos tecnológicos para determinar la influencia o participación de usuarios e influencers en una transacción.' },
            { type: 'p', text: 'La decisión final respecto a la atribución será determinada por los sistemas internos de validación.' },
            { type: 'p', text: 'La Plataforma podrá:' },
            { type: 'ul', items: ['Ajustar atribuciones.', 'Corregir errores.', 'Rechazar conversiones sospechosas.', 'Auditar campañas.'] },
            { type: 'p', text: 'Las decisiones relacionadas con fraude o abuso serán definitivas.' },
            { type: 'p', text: 'Los registros de atribución podrán estar respaldados mediante mecanismos digitales, incluyendo tokens de utilidad emitidos por la Plataforma para validar la existencia y trazabilidad de una venta o conversión.' },
        ],
    },
    {
        n: 10,
        title: 'BizneAI y analítica comercial',
        blocks: [
            { type: 'p', text: 'Los comercios afiliados autorizan a la Plataforma a procesar información operativa con fines de:' },
            { type: 'ul', items: ['Analítica.', 'Reportes.', 'Optimización comercial.', 'Inteligencia artificial.', 'Modelos predictivos.', 'Métricas de atribución.'] },
            { type: 'p', text: 'La información será tratada conforme a las políticas de privacidad aplicables.' },
            { type: 'p', text: 'La Plataforma podrá generar estadísticas agregadas y anonimizadas para mejorar sus servicios.' },
        ],
    },
    {
        n: 11,
        title: 'Propiedad intelectual',
        blocks: [
            { type: 'p', text: 'Todo el software, algoritmos, diseños, marcas, logotipos, documentación, contenido y tecnologías utilizadas por la Plataforma son propiedad exclusiva de sus titulares.' },
            { type: 'p', text: 'Queda prohibido:' },
            { type: 'ul', items: ['Copiar.', 'Modificar.', 'Descompilar.', 'Distribuir.', 'Comercializar.', 'Reutilizar componentes sin autorización expresa.'] },
        ],
    },
    {
        n: 12,
        title: 'Uso prohibido',
        blocks: [
            { type: 'p', text: 'Está estrictamente prohibido:' },
            { type: 'ul', items: ['Crear cuentas falsas.', 'Utilizar bots.', 'Manipular sistemas de atribución.', 'Generar tráfico artificial.', 'Suplantar identidades.', 'Realizar actividades ilícitas o delictivas.', 'Vulnerar sistemas de seguridad.', 'Distribuir malware.', 'Intentar alterar el funcionamiento de la plataforma.', 'Utilizar la plataforma para actividades relacionadas con fraude, lavado de dinero, financiamiento ilícito, estafas, robo de identidad o cualquier conducta prohibida por la legislación aplicable.', 'Publicar, promocionar, vender o distribuir productos, servicios o tratamientos prohibidos por la legislación aplicable.', 'Publicar, promocionar o comercializar productos que representen riesgos para la salud pública, la seguridad de los consumidores o que sean objeto de controversias médicas o sanitarias significativas.', 'Intentar transferir, intercambiar o convertir tokens fuera de los mecanismos autorizados por la Plataforma.'] },
            { type: 'p', text: 'Las cuentas infractoras podrán ser suspendidas o eliminadas inmediatamente, sin previo aviso y sin responsabilidad para la Plataforma.' },
        ],
    },
    {
        n: 13,
        title: 'Limitación de responsabilidad',
        blocks: [
            { type: 'p', text: 'La Plataforma se proporciona "tal cual" y "según disponibilidad".' },
            { type: 'p', text: 'No garantiza:' },
            { type: 'ul', items: ['Disponibilidad ininterrumpida.', 'Ausencia de errores.', 'Resultados económicos.', 'Incremento de ventas.', 'Beneficios específicos.'] },
            { type: 'p', text: 'La responsabilidad máxima de la Plataforma, cuando sea aplicable, estará limitada al monto efectivamente pagado por el usuario durante los últimos doce meses.' },
            { type: 'p', text: 'La responsabilidad por la legalidad, seguridad, autorizaciones regulatorias, registros sanitarios, permisos de comercialización y cumplimiento normativo de los productos o servicios ofrecidos corresponde exclusivamente al comercio afiliado o proveedor correspondiente.' },
        ],
    },
    {
        n: 14,
        title: 'Suspensión y terminación',
        blocks: [
            { type: 'p', text: 'La Plataforma podrá suspender o cancelar cuentas cuando:' },
            { type: 'ul', items: ['Existan indicios de fraude.', 'Se incumplan estos términos.', 'Existan riesgos regulatorios.', 'Sea requerido por ley.', 'Existan sospechas razonables o evidencia de actividades ilícitas o delictivas.', 'El usuario sea investigado o vinculado con conductas relacionadas con fraude, lavado de dinero, financiamiento ilícito, robo de identidad, delitos informáticos o cualquier otra actividad contraria a la ley.', 'Promueva, comercialice o distribuya productos o servicios prohibidos por la legislación aplicable o que representen riesgos para la salud o seguridad de los consumidores.'] },
            { type: 'p', text: 'La Plataforma podrá cancelar de forma inmediata el acceso a sus servicios, beneficios, recompensas, programas de afiliación o monetización cuando considere que existe un riesgo legal, reputacional o de seguridad derivado de actividades delictivas, regulatorias o relacionadas con productos potencialmente peligrosos para la salud.' },
            { type: 'p', text: 'La terminación podrá realizarse sin previo aviso.' },
        ],
    },
    {
        n: 15,
        title: 'Modificaciones',
        blocks: [
            { type: 'p', text: 'La Plataforma podrá modificar estos términos en cualquier momento.' },
            { type: 'p', text: 'Las actualizaciones serán publicadas mediante los canales oficiales correspondientes.' },
            { type: 'p', text: 'El uso continuado de los servicios constituye aceptación de las modificaciones.' },
        ],
    },
    {
        n: 16,
        title: 'Cumplimiento normativo',
        blocks: [
            { type: 'p', text: 'Los usuarios son responsables de cumplir las leyes fiscales, comerciales, financieras, sanitarias y regulatorias aplicables en su jurisdicción.' },
            { type: 'p', text: 'La Plataforma no proporciona asesoría legal, fiscal, financiera ni médica.' },
            { type: 'p', text: 'Los usuarios, influencers y comercios afiliados aceptan cumplir con los procedimientos de identificación, verificación y cumplimiento normativo que la Plataforma pueda requerir para habilitar determinadas funcionalidades relacionadas con tokens, recompensas, intercambios o conversiones.' },
        ],
    },
    {
        n: 17,
        title: 'Privacidad',
        blocks: [
            { type: 'p', text: 'El tratamiento de datos personales se realizará conforme a la Política de Privacidad vigente.' },
            { type: 'p', text: 'Al utilizar la Plataforma, el usuario autoriza el procesamiento de información necesaria para la operación de los servicios.' },
            { type: 'p', text: 'Asimismo, cuando sea necesario para procesos KYC, prevención de fraude, cumplimiento regulatorio o validación de operaciones, el usuario autoriza la recopilación y verificación de información adicional conforme a la legislación aplicable.' },
        ],
    },
    {
        n: 18,
        title: 'Ley aplicable',
        blocks: [
            { type: 'p', text: 'Estos términos se regirán por las leyes aplicables de la jurisdicción donde opere legalmente la entidad responsable de la Plataforma.' },
            { type: 'p', text: 'Las partes procurarán resolver cualquier controversia mediante negociación directa antes de acudir a procedimientos judiciales.' },
        ],
    },
];
