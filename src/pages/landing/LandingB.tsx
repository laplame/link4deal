import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import PageSeo from '../../components/seo/PageSeo';
import { LANDING_FLOWS, landingCtaProps, trackLandingCta } from './landingLinks';
import './landing-b.css';

const FX = 18;
const DELIVER = 0.02;
const REDEEM = 0.05;
const COMM = 1.0;
const PER_DELIVER = DELIVER * FX;
const PER_SALE_EXTRA = (REDEEM + COMM) * FX;
const PAID_PER_SALE = Math.round(COMM * FX);

const CREADORES = [
    '@marifit',
    '@cocinaconjose',
    '@lalo.gamer',
    '@bellezacdmx',
    '@antojitosmty',
    '@gymconana',
    '@reseñaslocales',
];

const STEPS = [
    {
        n: '01',
        title: 'Creas tu campaña',
        body: 'Defines tu cupón y tu saldo en el tablero. En minutos, sin contrato.',
    },
    {
        n: '02',
        title: 'Activas creadores en tu zona',
        body: 'Eliges por zona, nicho y tipo de audiencia. Ellos publican tu código a su comunidad.',
    },
    {
        n: '03',
        title: 'Pagas solo por venta real',
        body: 'Cada canje se co-firma en tu caja. Pagas por venta verificada, no por alcance ni por likes.',
    },
];

const DASHBOARD_ROWS = [
    {
        tag: 'en vivo',
        title: 'Lo ves al instante',
        body: 'Cupones entregados, canjeados y tu saldo restante, en tu celular.',
    },
    {
        tag: 'flexible',
        title: 'Pagas conforme crece',
        body: 'Cargas saldo, pausas o recargas cuando quieras. Cero gasto fijo.',
    },
    {
        tag: 'eficiente',
        title: 'Solo resultados reales',
        body: 'Tu saldo se gasta casi todo en ventas verificadas; lo que no se canjea casi no cuesta.',
    },
];

const WHO_CARDS = [
    {
        role: 'Comercio',
        title: ' local',
        body: 'Restaurantes, tiendas, cafeterías: llena tu local con clientes que sí llegan.',
    },
    {
        role: 'Servicios',
        title: '',
        body: 'Estéticas, gimnasios, talleres: cada cita que llega por un cupón queda registrada.',
    },
    {
        role: 'Cadena',
        title: ' o franquicia',
        body: 'Mide por sucursal y por creador, todo desde el mismo tablero.',
    },
];

function fmt(n: number) {
    return Math.round(n).toLocaleString('es-MX');
}

function computeTargets(budgetVal: number, convVal: number) {
    const costPerDelivered = PER_DELIVER + (convVal / 100) * PER_SALE_EXTRA;
    const delivered = budgetVal / costPerDelivered;
    const sales = delivered * (convVal / 100);
    const cps = sales > 0 ? budgetVal / sales : 0;
    return { del: delivered, sales, cps };
}

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

interface TickerLine {
    id: number;
    creador: string;
    paid: number;
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

export default function LandingB() {
    const [budget, setBudget] = useState(1000);
    const [conv, setConv] = useState(3);
    const [displayDel, setDisplayDel] = useState('—');
    const [displaySales, setDisplaySales] = useState('—');
    const [displayCps, setDisplayCps] = useState('—');
    const [tickerLines, setTickerLines] = useState<TickerLine[]>([]);
    const curRef = useRef({ del: 0, sales: 0, cps: 0 });
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
        const t = computeTargets(budget, conv);
        const cur = curRef.current;
        animateValue(cur.del, t.del, setDisplayDel);
        animateValue(cur.sales, t.sales, setDisplaySales);
        animateValue(cur.cps, t.cps, setDisplayCps);
        curRef.current = t;
    }, [budget, conv, animateValue]);

    useEffect(() => {
        renderSimulator();
    }, [renderSimulator]);

    const addTickerLine = useCallback(() => {
        const creador = CREADORES[Math.floor(Math.random() * CREADORES.length)];
        tickerIdRef.current += 1;
        setTickerLines((prev) => {
            const next = [{ id: tickerIdRef.current, creador, paid: PAID_PER_SALE }, ...prev];
            return next.slice(0, 4);
        });
    }, []);

    useEffect(() => {
        upsertOgTitle('Tus campañas con creadores. Un tablero. Pagas solo lo que vende.');
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

    const setRevealRef = (index: number) => (el: HTMLElement | null) => {
        revealRefs.current[index] = el;
    };

    const cta = (source: string) => landingCtaProps('b', source);

    return (
        <div className="landing-b">
            <PageSeo
                title="DameCodigo — Campañas con creadores en un solo tablero"
                description="Activa creadores reales en tu zona, lanza tus cupones y mira cada venta verificarse en tu caja, en vivo. Pagas solo cuando alguien compra."
                ogType="website"
            />

            <main>
                <div className="wrap hero">
                    <div className="eyebrow">
                        <span className="pulse" />
                        Marketing con creadores, medido en caja
                    </div>
                    <h1>
                        Tus campañas con creadores. Un tablero.{' '}
                        <span className="hl">Pagas solo lo que vende.</span>
                    </h1>
                    <p className="sub">
                        Activa creadores reales en tu zona, lanza tus cupones y mira cada venta
                        verificarse en tu caja — en vivo. Sin imprenta, sin contratos fijos, sin pagar
                        por likes.
                    </p>

                    <div className="sim" id="sim">
                        <div className="sim-top">
                            <span className="sim-title">Tablero de campaña</span>
                            <span className="sim-live">
                                <span className="pulse" />
                                en vivo
                            </span>
                        </div>

                        <div className="ctrl">
                            <label htmlFor="budget">
                                Saldo de tu campaña{' '}
                                <span className="v num">
                                    $<span>{fmt(budget)}</span> MXN
                                </span>
                            </label>
                            <input
                                type="range"
                                id="budget"
                                min={500}
                                max={50000}
                                step={500}
                                value={budget}
                                onChange={(e) => setBudget(Number(e.target.value))}
                                aria-label="Saldo de tu campaña en pesos"
                            />
                        </div>

                        <div className="ctrl">
                            <label htmlFor="conv">
                                De cada 100 que reciben, ¿cuántas compran?{' '}
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
                                aria-label="De cada 100 que reciben, cuántas compran"
                            />
                        </div>

                        <div className="readout">
                            <div className="stat">
                                <div className="k">Cupones entregados</div>
                                <div className="val num">{displayDel}</div>
                            </div>
                            <div className="stat">
                                <div className="k">Costo por venta real</div>
                                <div className="val num">
                                    $<span>{displayCps}</span>
                                </div>
                            </div>
                            <div className="stat big">
                                <div className="k">Ventas verificadas (est.)</div>
                                <div className="val num">{displaySales}</div>
                                <div className="verif">
                                    ✓ solo pagas las ventas que se co-firman en tu caja
                                </div>
                            </div>
                        </div>

                        <Link className="sim-cta" {...cta('simulator')}>
                            Crea tu primera campaña
                        </Link>
                        <p className="sim-note">
                            <b>Estimación ilustrativa.</b> Cargas saldo y pausas o recargas cuando quieras;
                            el saldo se gasta casi todo en ventas reales. Tipo de cambio aprox. $18 MXN/USD.
                        </p>
                    </div>
                </div>

                <section className="wrap reveal" ref={setRevealRef(0)}>
                    <div className="kicker">El problema</div>
                    <h2>
                        La publicidad se paga por adelantado. Y nunca sabes si{' '}
                        <span className="hl">funcionó</span>.
                    </h2>
                    <p className="lead">
                        Volantes, espectaculares, anuncios: pagas primero y rezas. Tiras dinero a gente que
                        no es tu cliente y no puedes medir una sola venta de vuelta.
                    </p>
                </section>

                <section className="wrap reveal" ref={setRevealRef(1)}>
                    <div className="kicker">Papel vs digital</div>
                    <h2>Un millón de volantes, dos historias.</h2>
                    <div className="vs">
                        <div className="vscard paper">
                            <div className="h">1,000,000 en papel</div>
                            <p>
                                Semanas de reparto. $400,000–800,000 MXN por adelantado. La mayoría termina
                                en la basura. ¿Cuántos compraron? Nunca lo sabrás.
                            </p>
                        </div>
                        <div className="vscard digital">
                            <div className="h">1,000,000 digitales</div>
                            <p>
                                Repartidos por creadores en una hora. Cero imprenta, cero desperdicio. Pagas
                                solo las ventas que se canjean en tu caja.
                            </p>
                        </div>
                    </div>
                    <p className="sim-note" style={{ marginTop: 14 }}>
                        Cifras de mercado ilustrativas, a validar con cotizaciones reales.
                    </p>
                </section>

                <section className="wrap reveal" ref={setRevealRef(2)}>
                    <div className="kicker">Cómo funciona</div>
                    <h2>De idea a venta verificada, en tres pasos.</h2>
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
                    <div className="kicker">Un solo tablero</div>
                    <h2>Todo bajo control, en tiempo real.</h2>
                    <div className="earn">
                        {DASHBOARD_ROWS.map((row) => (
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
                    <div className="kicker">Súper segmentación</div>
                    <h2>Le hablas a tu cliente, no a la esquina.</h2>
                    <p className="lead">
                        Eliges la zona, el nicho y el tipo de creador. Tu cupón llega a quien sí compra —
                        y de la mano de alguien en quien tu cliente ya confía.
                    </p>
                </section>

                <section className="wrap reveal" ref={setRevealRef(5)}>
                    <div className="kicker">Sin trucos</div>
                    <h2>Cada venta se co-firma en tu caja.</h2>
                    <div className="live">
                        <div className="ph">
                            Tú lo ves. El creador lo ve. <span className="hl">Al mismo tiempo.</span>
                        </div>
                        <p className="pp">
                            Nadie puede inflar un canje — y tú nunca pagas de más. Cada línea es una venta
                            real en tu negocio.
                        </p>
                        <div className="ticker" aria-hidden="true">
                            {tickerLines.map((line) => (
                                <div key={line.id} className="tline">
                                    <span className="l">
                                        <span className="chk">✓</span> VENTA VERIFICADA · vía {line.creador}
                                    </span>
                                    <span className="r">pagaste ${line.paid}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="wrap reveal" ref={setRevealRef(6)}>
                    <div className="kicker">¿Para quién es?</div>
                    <h2>Para cualquier negocio local que quiera vender más.</h2>
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
                        ¿Eres creador y quieres ganar con tu influencia?{' '}
                        <Link
                            to={LANDING_FLOWS.a.path}
                            onClick={() =>
                                trackLandingCta('b', 'cross_creator', LANDING_FLOWS.a.path)
                            }
                        >
                            Únete a DameCodigo →
                        </Link>
                        <br />
                        ¿Eres agencia?{' '}
                        <Link
                            to={LANDING_FLOWS.c.path}
                            onClick={() =>
                                trackLandingCta('b', 'cross_agency', LANDING_FLOWS.c.path)
                            }
                        >
                            Atribución verificada →
                        </Link>
                    </p>
                </section>

                <section className="wrap final reveal" ref={setRevealRef(7)}>
                    <h2>
                        Tu primera venta verificada está a <span className="hl">un clic</span>.
                    </h2>
                    <p className="lead">
                        Crea tu campaña y mira los canjes caer en vivo, en tu propio tablero.
                    </p>
                    <Link className="bigcta" {...cta('final')}>
                        Crear mi campaña
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
                        Las cifras del tablero son estimaciones ilustrativas y no constituyen una promesa ni
                        garantía de resultados. El alcance y las ventas dependen de los creadores disponibles
                        en tu zona y de cada campaña. Tipo de cambio mostrado como aproximación; el costo
                        real se liquida conforme al saldo y las condiciones de cada campaña. ©{' '}
                        {new Date().getFullYear()} DameCodigo.
                    </p>
                </div>
            </footer>
        </div>
    );
}
