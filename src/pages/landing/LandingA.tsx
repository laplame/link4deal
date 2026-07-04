import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import PageSeo from '../../components/seo/PageSeo';
import { LANDING_FLOWS, landingCtaProps, trackLandingCta } from './landingLinks';
import './landing-a.css';

const FX = 18;
const DELIVER_USD = 0.02;
const REDEEM_USD = 0.05;
const COMM_USD = 1.0;
const CLAIM = 0.2;

const NEGOCIOS = ['GNC', 'Kola Loka', 'Victoria', 'Scribe', 'Pacífico', 'Farmacia Local', 'Tacos El Güero'];

const STEPS = [
    { n: '01', title: 'Te unes gratis', body: 'Sin costo, sin exclusividad. Conectas tu canal y listo.' },
    {
        n: '02',
        title: 'Publicas tu código',
        body: 'Eliges negocios reales y compartes su cupón con tu comunidad.',
    },
    {
        n: '03',
        title: 'Se canjea en caja y cobras',
        body: 'Cuando alguien lo usa, la venta se co-firma en la caja del negocio. Cobras por venta real, no por promesas.',
    },
];

const EARNINGS = [
    {
        tag: 'entrega',
        title: 'Cuando entregas el cupón',
        body: 'Una tarifa por cada cupón que llega a tu comunidad.',
    },
    { tag: 'canje', title: 'Cuando se canjea', body: 'Otra tarifa en cuanto el cupón se usa en caja.' },
    {
        tag: 'comisión',
        title: 'Por cada venta verificada',
        body: 'La comisión que el negocio pone por venta — el grueso de tus ingresos.',
    },
];

const WHO_CARDS = [
    {
        role: 'Creador',
        title: ' o influencer',
        body: 'Convierte tu audiencia en ingresos comprobables, no en likes.',
    },
    {
        role: 'Dueño',
        title: ' que valida su canal',
        body: '¿Tu Instagram vende o solo da likes? Averígualo con tu propio negocio.',
    },
    {
        role: 'Agencia',
        title: ' de marketing',
        body: 'Prueba el ROI real de tus campañas en la tienda física de tus clientes.',
    },
];

function fmt(n: number) {
    return Math.round(n).toLocaleString('es-MX');
}

function computeTargets(reachVal: number, convVal: number) {
    const delivered = reachVal * CLAIM;
    const sales = reachVal * (convVal / 100);
    const earn = delivered * DELIVER_USD * FX + sales * REDEEM_USD * FX + sales * COMM_USD * FX;
    return { del: delivered, sales, earn };
}

function prefersReducedMotion() {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

interface TickerLine {
    id: number;
    negocio: string;
    amt: string;
}

function DameCodigoLogo({ className }: { className?: string }) {
    return (
        <Link to={LANDING_FLOWS.home} className={`logo ${className ?? ''}`}>
            <span className="dot">⚡</span>
            <span>
                Dame<b>Codigo</b>
            </span>
        </Link>
    );
}

export default function LandingA() {
    const [reach, setReach] = useState(5000);
    const [conv, setConv] = useState(3);
    const [displayDel, setDisplayDel] = useState('—');
    const [displaySales, setDisplaySales] = useState('—');
    const [displayEarn, setDisplayEarn] = useState('—');
    const [tickerLines, setTickerLines] = useState<TickerLine[]>([]);
    const curRef = useRef({ del: 0, sales: 0, earn: 0 });
    const tickerIdRef = useRef(0);
    const revealRefs = useRef<(HTMLElement | null)[]>([]);

    const animateValue = useCallback((from: number, to: number, setter: (v: string) => void) => {
        if (prefersReducedMotion()) {
            setter(fmt(to));
            return;
        }
        const start = performance.now();
        const dur = 420;
        function frame(t: number) {
            const p = Math.min((t - start) / dur, 1);
            const e = 1 - Math.pow(1 - p, 3);
            setter(fmt(from + (to - from) * e));
            if (p < 1) requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
    }, []);

    const renderSimulator = useCallback(() => {
        const t = computeTargets(reach, conv);
        const cur = curRef.current;
        animateValue(cur.del, t.del, setDisplayDel);
        animateValue(cur.sales, t.sales, setDisplaySales);
        animateValue(cur.earn, t.earn, setDisplayEarn);
        curRef.current = t;
    }, [reach, conv, animateValue]);

    useEffect(() => {
        renderSimulator();
    }, [renderSimulator]);

    const addTickerLine = useCallback(() => {
        const negocio = NEGOCIOS[Math.floor(Math.random() * NEGOCIOS.length)];
        const amt = (Math.random() * 32 + 8).toFixed(2);
        tickerIdRef.current += 1;
        setTickerLines((prev) => {
            const next = [{ id: tickerIdRef.current, negocio, amt }, ...prev];
            return next.slice(0, 4);
        });
    }, []);

    useEffect(() => {
        const reduce = prefersReducedMotion();
        if (reduce) {
            addTickerLine();
            addTickerLine();
            addTickerLine();
            return;
        }
        addTickerLine();
        const id = window.setInterval(addTickerLine, 2600);
        return () => window.clearInterval(id);
    }, [addTickerLine]);

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

    useEffect(() => {
        upsertOgTitle('¿Cuánto puedes vender realmente con tu influencia digital?');
    }, []);

    const setRevealRef = (index: number) => (el: HTMLElement | null) => {
        revealRefs.current[index] = el;
    };

    const cta = (source: string) => landingCtaProps('a', source);

    return (
        <div className="landing-a">
            <PageSeo
                title="DameCodigo — ¿Cuánto puedes vender realmente con tu influencia?"
                description="Deja de medir tu valor en likes. Con DameCodigo cada venta que generas se verifica en la caja del negocio — y la cobras. Mira cuánto puedes vender."
                ogType="website"
            />

            <main>
                <div className="wrap hero">
                    <div className="eyebrow">
                        <span className="pulse" />
                        Tu influencia, contada
                    </div>
                    <h1>
                        ¿Cuánto puedes vender <span className="hl">realmente</span> con tu influencia
                        digital?
                    </h1>
                    <p className="sub">
                        Deja de medir tu valor en likes. Cada venta que generas se verifica en la caja del
                        negocio — y la cobras. Mira cuánto podrías vender.
                    </p>

                    <div className="sim" id="sim">
                        <div className="sim-top">
                            <span className="sim-title">Simulador de ventas</span>
                            <span className="sim-live">
                                <span className="pulse" />
                                en vivo
                            </span>
                        </div>

                        <div className="ctrl">
                            <label htmlFor="reach">
                                Personas a las que llega tu código{' '}
                                <span className="v num">{fmt(reach)}</span>
                            </label>
                            <input
                                type="range"
                                id="reach"
                                min={500}
                                max={200000}
                                step={500}
                                value={reach}
                                onChange={(e) => setReach(Number(e.target.value))}
                                aria-label="Personas a las que llega tu código"
                            />
                        </div>

                        <div className="ctrl">
                            <label htmlFor="conv">
                                De cada 100, ¿cuántas compran?{' '}
                                <span className="v num">{conv}</span>
                            </label>
                            <input
                                type="range"
                                id="conv"
                                min={1}
                                max={10}
                                step={1}
                                value={conv}
                                onChange={(e) => setConv(Number(e.target.value))}
                                aria-label="De cada 100, cuántas compran"
                            />
                        </div>

                        <div className="readout">
                            <div className="stat">
                                <div className="k">Cupones entregados</div>
                                <div className="val num">{displayDel}</div>
                            </div>
                            <div className="stat">
                                <div className="k">Ventas verificadas</div>
                                <div className="val num" style={{ color: 'var(--mint)' }}>
                                    {displaySales}
                                </div>
                            </div>
                            <div className="stat big">
                                <div className="k">Ganas por campaña (aprox.)</div>
                                <div className="val num">
                                    $<span>{displayEarn}</span> <small>MXN</small>
                                </div>
                                <div className="verif">✓ cada peso atado a una venta co-firmada en caja</div>
                            </div>
                        </div>

                        <Link className="sim-cta" {...cta('simulator')}>
                            Quiero ganar con mi influencia
                        </Link>
                        <p className="sim-note">
                            <b>Estimación ilustrativa</b>, no garantiza ingresos. Tus números reales dependen
                            de tu audiencia, los negocios y cada campaña. Tipo de cambio aprox. $18 MXN/USD.
                        </p>
                    </div>
                </div>

                <section className="wrap nerve reveal" ref={setRevealRef(0)}>
                    <div className="kicker">El problema</div>
                    <h2>
                        Los likes no pagan <span className="hl">la renta</span>.
                    </h2>
                    <p className="lead">
                        Tienes seguidores. ¿Pero compran? Hasta hoy nadie podía probarlo — ni las marcas, ni
                        tú. DameCodigo convierte tu influencia en ventas que se cuentan una por una, y te paga
                        por cada una.
                    </p>
                </section>

                <section className="wrap reveal" ref={setRevealRef(1)}>
                    <div className="kicker">Cómo funciona</div>
                    <h2>De seguidor a venta cobrada, en tres pasos.</h2>
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

                <section className="wrap reveal" ref={setRevealRef(2)}>
                    <div className="kicker">Cómo ganas</div>
                    <h2>Ganas en tres momentos. Todo en pesos, todo en tu app.</h2>
                    <div className="earn">
                        {EARNINGS.map((row) => (
                            <div key={row.tag} className="erow">
                                <span className="tag">{row.tag}</span>
                                <div className="et">
                                    <b>{row.title}</b>
                                    <span>{row.body}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <p className="sim-note" style={{ marginTop: 16 }}>
                        Empiezas a ganar desde la entrega, aunque el negocio aún no asigne comisión por venta.
                    </p>
                </section>

                <section className="wrap reveal" ref={setRevealRef(3)}>
                    <div className="kicker">En tiempo real</div>
                    <h2>La diferencia que nadie más te da.</h2>
                    <div className="live">
                        <div className="ph">
                            Tú lo ves. El negocio lo ve. <span className="hl">Al mismo tiempo.</span>
                        </div>
                        <p className="pp">
                            Cada canje se confirma en los dos lados a la vez. Nadie puede inflar tus números
                            — ni negarte una venta.
                        </p>
                        <div className="ticker" aria-hidden="true">
                            {tickerLines.map((line) => (
                                <div key={line.id} className="tline">
                                    <span className="l">
                                        <span className="chk">✓</span> CANJE CO-FIRMADO · {line.negocio}
                                    </span>
                                    <span className="r">+${line.amt}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="wrap reveal" ref={setRevealRef(4)}>
                    <div className="kicker">Tu reputación</div>
                    <h2>Tu valor deja de ser un número de seguidores.</h2>
                    <p className="lead">
                        Cada venta verificada construye tu historial: comprobable, tuyo, y te lo llevas a
                        donde vayas. Vale más que cualquier métrica de vanidad — porque está probado en caja.
                    </p>
                </section>

                <section className="wrap reveal" ref={setRevealRef(5)}>
                    <div className="kicker">¿Para quién es?</div>
                    <h2>Si tienes influencia, tienes ventas por cobrar.</h2>
                    <div className="who">
                        {WHO_CARDS.map((card) => (
                            <div key={card.role} className="card">
                                <h3>
                                    <em>{card.role}</em>
                                    {card.title}
                                </h3>
                                <p>{card.body}</p>
                            </div>
                        ))}
                    </div>
                    <p className="biz-link">
                        ¿Tienes un negocio y quieres clientes?{' '}
                        <Link
                            to={LANDING_FLOWS.b.path}
                            onClick={() =>
                                trackLandingCta('a', 'cross_business', LANDING_FLOWS.b.path)
                            }
                        >
                            Crea tu campaña con creadores →
                        </Link>
                        {' · '}
                        ¿Eres agencia?{' '}
                        <Link
                            to={LANDING_FLOWS.c.path}
                            onClick={() =>
                                trackLandingCta('a', 'cross_agency', LANDING_FLOWS.c.path)
                            }
                        >
                            Atribución verificada →
                        </Link>
                    </p>
                </section>

                <section className="wrap final reveal" ref={setRevealRef(6)}>
                    <h2>
                        Tu influencia ya vale. <span className="hl">Empieza a cobrarla.</span>
                    </h2>
                    <p className="lead">Únete gratis y mira tu primera venta verificada caer en vivo.</p>
                    <Link className="bigcta" {...cta('final')}>
                        Empezar gratis
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
                    <p className="fine">
                        Las cifras del simulador son estimaciones ilustrativas y no constituyen una promesa ni
                        garantía de ingresos. Los resultados dependen de tu audiencia, los negocios
                        participantes y cada campaña. Tipo de cambio mostrado como aproximación; el monto real
                        se liquida conforme a las condiciones de cada campaña. © {new Date().getFullYear()}{' '}
                        DameCodigo.
                    </p>
                </div>
            </footer>
        </div>
    );
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
