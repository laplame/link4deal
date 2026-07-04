import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import PageSeo from '../../components/seo/PageSeo';
import { LANDING_FLOWS, landingCtaProps, trackLandingCta } from './landingLinks';
import './landing-c.css';

const VANITY_METRICS = [
    { label: 'Impresiones', value: '2.4M', tag: 'estimado' },
    { label: 'Engagement', value: '6.2%', tag: 'no verificable' },
    { label: 'Muestras entregadas', value: '10,000', tag: 'sin seguimiento' },
    { label: 'Ventas atribuidas', value: '?', tag: 'desconocido' },
];

const VERIFIED_METRICS = [
    { label: 'Ventas verificadas', value: '1,840', tag: 'co-firmado' },
    { label: 'Ingreso atribuido', value: '$736K', tag: 'auditable' },
    { label: 'Costo por venta', value: '$27', tag: 'real' },
    { label: 'Atribución por creador', value: 'Sí', tag: 'co-firmado' },
];

const INSIGHT_CARDS = [
    {
        before: 'Ventas',
        after: ', no alcance',
        body: 'Cada peso de inversión se mide en ventas reales atribuidas, no en impresiones ni en "lift estimado".',
    },
    {
        before: 'Verificado ',
        after: 'en caja',
        body: 'Cada canje se co-firma en el punto de venta. Cero autoreporte, cero números inflados.',
    },
    {
        before: 'KPIs',
        after: ' que importan',
        body: 'ROAS real, costo por venta verificada, y ventas desglosadas por creador, zona y SKU.',
    },
    {
        before: 'Datos ',
        after: 'auditables',
        body: 'Reportes que sobreviven la junta con el CFO — y renuevan el presupuesto del año que entra.',
    },
];

const STEPS = [
    {
        n: '01',
        title: 'Traes a tus marcas',
        body: 'Conectas a tus clientes y diseñas la campaña desde un panel, sin hojas de cálculo.',
    },
    {
        n: '02',
        title: 'Activas creadores con códigos',
        body: 'Por zona, nicho y audiencia. Cada código es rastreable hasta la venta.',
    },
    {
        n: '03',
        title: 'Entregas ventas probadas',
        body: 'Cada canje se co-firma en caja. Le entregas a tu marca un reporte de ventas verificadas, por creador y campaña.',
    },
];

const PANEL_ROWS = [
    {
        tag: 'multi-marca',
        title: 'Todas tus cuentas en un lugar',
        body: 'Campañas, saldos y resultados de cada cliente, en el mismo panel.',
    },
    {
        tag: 'reporte',
        title: 'Desglose que la marca entiende',
        body: 'Ventas verificadas por marca, creador, zona y SKU. Listo para presentar.',
    },
    {
        tag: 'en vivo',
        title: 'Resultados en tiempo real',
        body: 'Tú y tu cliente ven los canjes co-firmarse al instante. Nadie infla, nadie niega.',
    },
];

function prefersReducedMotion() {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function upsertOgTitle(content: string) {
    let el = document.head.querySelector('meta[property="og:title"]') as HTMLMetaElement | null;
    if (!el) {
        el = document.createElement('meta');
        el.setAttribute('property', 'og:title');
        document.head.appendChild(el);
    }
    el.setAttribute('content', content);
}

function DameCodigoLogo({ showAgencyTag }: { showAgencyTag?: boolean }) {
    return (
        <Link to={LANDING_FLOWS.home} className="logo">
            <span className="dot">⚡</span>
            <span>
                Dame<b>Codigo</b>
            </span>
            {showAgencyTag && <span className="tag">Agencias</span>}
        </Link>
    );
}

export default function LandingC() {
    const [showVerified, setShowVerified] = useState(true);
    const revealRefs = useRef<(HTMLElement | null)[]>([]);

    useEffect(() => {
        upsertOgTitle('Deja de venderle alcance a tus marcas. Véndeles ventas que puedes probar.');
    }, []);

    useEffect(() => {
        const reduce = prefersReducedMotion();
        const els = revealRefs.current.filter(Boolean) as HTMLElement[];
        if (reduce || !('IntersectionObserver' in window)) {
            els.forEach((el) => el.classList.add('in'));
            return;
        }
        const io = new IntersectionObserver(
            (entries) => {
                entries.forEach((e) => {
                    if (e.isIntersecting) {
                        e.target.classList.add('in');
                        io.unobserve(e.target);
                    }
                });
            },
            { threshold: 0.12 },
        );
        els.forEach((el) => io.observe(el));
        return () => io.disconnect();
    }, []);

    const setRevealRef = (index: number) => (el: HTMLElement | null) => {
        revealRefs.current[index] = el;
    };

    const cta = (source: string) => landingCtaProps('c', source);

    return (
        <div className="landing-c">
            <PageSeo
                title="DameCodigo para Agencias — Atribución real de ventas, verificada"
                description="Dale a tus marcas lo que ninguna activación BTL logró: atribución real de ventas, verificada en el punto de venta. Sin métricas infladas, sin engagement que nadie audita."
                ogType="website"
            />

            <main>
                <div className="wrap hero">
                    <div className="eyebrow">
                        <span className="pulse" />
                        Para agencias · atribución verificada
                    </div>
                    <h1>
                        Deja de venderle alcance a tus marcas.{' '}
                        <span className="hl">Véndeles ventas que puedes probar.</span>
                    </h1>
                    <p className="sub">
                        DameCodigo le da a tu agencia lo que ninguna activación BTL logró: atribución real
                        de ventas, verificada en el punto de venta. Sin métricas infladas, sin "engagement"
                        que nadie audita. Los KPIs que el CMO de tu cliente sí firma.
                    </p>

                    <div className="sim">
                        <div className="sim-top">
                            <span className="sim-title">El reporte que entregas a tu marca</span>
                            <span className="sim-ej">ejemplo</span>
                        </div>

                        <div className="seg" role="tablist" aria-label="Tipo de reporte">
                            <button
                                type="button"
                                role="tab"
                                aria-selected={!showVerified}
                                className={!showVerified ? 'on' : undefined}
                                onClick={() => setShowVerified(false)}
                            >
                                Lo de siempre
                            </button>
                            <button
                                type="button"
                                role="tab"
                                aria-selected={showVerified}
                                className={showVerified ? 'on' : undefined}
                                onClick={() => setShowVerified(true)}
                            >
                                Con DameCodigo
                            </button>
                        </div>

                        <div className="mgrid" hidden={showVerified}>
                            {VANITY_METRICS.map((m) => (
                                <div key={m.label} className="metric vanity">
                                    <div className="mk">{m.label}</div>
                                    <div className="mv num">{m.value}</div>
                                    <div className="mt">{m.tag}</div>
                                </div>
                            ))}
                        </div>

                        <div className="mgrid" hidden={!showVerified}>
                            {VERIFIED_METRICS.map((m) => (
                                <div key={m.label} className="metric verified">
                                    <div className="mk">{m.label}</div>
                                    <div className="mv num">{m.value}</div>
                                    <div className="mt">{m.tag}</div>
                                </div>
                            ))}
                        </div>

                        <div className="flip-foot vanity" hidden={showVerified}>
                            ⚠ Nada de esto prueba una sola venta.
                        </div>
                        <div className="flip-foot verified" hidden={!showVerified}>
                            ✓ 100% auditable, co-firmado en caja.
                        </div>

                        <Link className="sim-cta" {...cta('simulator')}>
                            Quiero esto para mis marcas
                        </Link>
                        <p className="sim-note">
                            <b>Ejemplo ilustrativo.</b> Las cifras dependen de cada campaña, marca y mercado.
                            Tipo de cambio aprox. $18 MXN/USD.
                        </p>
                    </div>
                </div>

                <section className="wrap reveal" ref={setRevealRef(0)}>
                    <div className="kicker">El problema</div>
                    <h2>
                        Tus marcas ya no creen en <span className="hl">el alcance</span>.
                    </h2>
                    <p className="lead">
                        Impresiones, engagement, muestras "entregadas": el CMO los presenta y el CFO los
                        cuestiona. Nadie puede probar una sola venta de vuelta. La activación se ve bien en
                        el deck y desaparece en el estado de resultados.
                    </p>
                </section>

                <section className="wrap reveal" ref={setRevealRef(1)}>
                    <div className="kicker">Lo que sí le importa a tus marcas</div>
                    <h2>Atribución real, no activación de relleno.</h2>
                    <div className="who">
                        {INSIGHT_CARDS.map((card) => (
                            <div key={card.before + card.after} className="card">
                                <h3>
                                    <em>{card.before}</em>
                                    {card.after}
                                </h3>
                                <p>{card.body}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="wrap reveal" ref={setRevealRef(2)}>
                    <div className="kicker">Cómo funciona</div>
                    <h2>Tu agencia, ahora con atribución verificada.</h2>
                    <div className="steps">
                        {STEPS.map((step) => (
                            <div key={step.n} className="step">
                                <div className="n num">{step.n}</div>
                                <div>
                                    <h3>{step.title}</h3>
                                    <p>{step.body}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="wrap reveal" ref={setRevealRef(3)}>
                    <div className="kicker">Un panel, todas tus marcas</div>
                    <h2>Gestiona y reporta por cliente.</h2>
                    <div className="earn">
                        {PANEL_ROWS.map((row) => (
                            <div key={row.tag} className="erow">
                                <span className="tag">{row.tag}</span>
                                <div className="et">
                                    <b>{row.title}</b>
                                    <span>{row.body}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="wrap reveal" ref={setRevealRef(4)}>
                    <div className="kicker">Para tu agencia</div>
                    <h2>
                        Un servicio premium que <span className="hl">retiene cuentas</span>.
                    </h2>
                    <p className="lead">
                        Dejas de competir por alcance y empiezas a cobrar por resultados que puedes probar.
                        Las marcas no sueltan a la agencia que les demuestra ROI real — y tú te diferencias de
                        todas las que siguen vendiendo impresiones.
                    </p>
                </section>

                <section className="wrap final reveal" ref={setRevealRef(5)}>
                    <h2>
                        Ofrécele a tus marcas lo que nadie más puede: <span className="hl">la verdad</span>.
                    </h2>
                    <p className="lead">
                        Solicita acceso al programa de agencias y agenda una demo con tus primeras campañas.
                    </p>
                    <Link className="bigcta" {...cta('final')}>
                        Registrar mi agencia
                    </Link>
                </section>
            </main>

            <footer>
                <div className="wrap">
                    <div className="feco">
                        <DameCodigoLogo />
                        <span className="eco">
                            parte del ecosistema <b>BizneAI</b> · <b>Link4Deal</b>
                        </span>
                    </div>
                    <p className="biz-link left">
                        ¿Eres negocio?{' '}
                        <Link
                            to={LANDING_FLOWS.b.path}
                            onClick={() =>
                                trackLandingCta('c', 'cross_business', LANDING_FLOWS.b.path)
                            }
                        >
                            Crea tu campaña →
                        </Link>{' '}
                        · ¿Eres creador?{' '}
                        <Link
                            to={LANDING_FLOWS.a.path}
                            onClick={() =>
                                trackLandingCta('c', 'cross_creator', LANDING_FLOWS.a.path)
                            }
                        >
                            Únete a DameCodigo →
                        </Link>
                    </p>
                    <p className="fine">
                        Las cifras mostradas son ejemplos ilustrativos y no constituyen una promesa ni
                        garantía de resultados. La atribución, el ROAS y el costo por venta dependen de cada
                        campaña, marca, creador y mercado. La verificación de canjes se realiza en el punto
                        de venta participante. Tipo de cambio mostrado como aproximación. ©{' '}
                        {new Date().getFullYear()} DameCodigo.
                    </p>
                </div>
            </footer>
        </div>
    );
}
