import React, { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiUrl } from '../utils/apiUrl';
import {
    ArrowLeft,
    ChevronDown,
    HelpCircle,
    Sparkles,
    Globe,
    Copy,
    Check,
    ExternalLink,
    LinkIcon,
    FileText,
    UserPlus,
    Ticket,
    FileDown,
    Loader2,
    Handshake,
    Printer,
    Download,
} from 'lucide-react';
import { fetchInfluencerByPublicSlug } from '../utils/fetchInfluencerByPublicSlug';
import { resolveCanonicalPublicSlug } from '../utils/influencerPublicSlug';
import {
    generateInfluencerProfilePdf,
    type InfluencerPdfInput,
} from '../utils/generateInfluencerProfilePdf';

type Lang = 'es' | 'en' | 'fr' | 'pt' | 'de';

type Block =
    | { type: 'p'; text: string }
    | { type: 'ul'; items: string[] }
    | { type: 'code'; text: string }
    | { type: 'pdf_cta' }
    | { type: 'image'; src: string; alt: string; promo?: boolean; downloadName?: string };

interface FaqItem {
    q: string;
    blocks: Block[];
}

interface FaqContent {
    pageTitle: string;
    subtitle: string;
    backLabel: string;
    backToProfileLabel: string;
    ctaTitle: string;
    ctaButton: string;
    myLinksTitle: string;
    profileLinkLabel: string;
    storeLinkLabel: string;
    copy: string;
    copied: string;
    myStoreButton: string;
    activeCouponsTitle: string;
    acceptNote: string;
    registerHere: string;
    readTerms: string;
    paymentPolicyTitle: string;
    paymentPolicyText: string;
    pdfDealsCalloutTitle: string;
    pdfDealsCalloutText: string;
    pdfDownloadButton: string;
    pdfOpenProfileButton: string;
    pdfGenericHint: string;
    promoDownloadButton: string;
    promoPrintButton: string;
    items: FaqItem[];
}

const LANGUAGES: { code: Lang; label: string }[] = [
    { code: 'es', label: 'Español' },
    { code: 'en', label: 'English' },
    { code: 'fr', label: 'Français' },
    { code: 'pt', label: 'Português' },
    { code: 'de', label: 'Deutsch' },
];

const PROFILE_URL = 'https://damecodigo.com/influencer/TUUSUARIO';
const STORE_URL = 'https://damecodigo.com/influencer/TUUSUARIO/tienda';
const MARKET_URL = 'https://damecodigo.com/marketplace';
/** Infografía ejemplo: comisión por venta verificada (FAQ pregunta 13 — ¿Cuánto puedo ganar?). */
const FAQ_MONETIZE_PRODUCT_IMAGE = '/images/faq/monetiza-producto-ejemplo.png';
/** Material promocional Deal Hunters (FAQ pregunta 6). */
const FAQ_DEAL_HUNTERS_PROMO_IMAGE = '/images/faq/deal-hunters-promo.png';

const FAQ: Record<Lang, FaqContent> = {
    es: {
        pageTitle: 'Preguntas frecuentes',
        subtitle: 'Programa de Influencers · DameCódigo',
        backLabel: 'Volver al inicio',
        backToProfileLabel: 'Volver al perfil',
        ctaTitle: '¿Listo para empezar?',
        ctaButton: 'Crear mi cuenta de influencer',
        myLinksTitle: 'Tus enlaces personalizados',
        profileLinkLabel: 'Tu perfil de influencer',
        storeLinkLabel: 'Tu tienda de promociones',
        copy: 'Copiar',
        copied: 'Copiado',
        myStoreButton: 'Ver mis cupones activos',
        activeCouponsTitle: '¿Quieres ver tus cupones activos?',
        acceptNote: 'Al registrarte aceptas nuestros Términos y Condiciones.',
        registerHere: 'Regístrate aquí',
        readTerms: 'Leer Términos y Condiciones',
        paymentPolicyTitle: 'Modelo de remuneración',
        paymentPolicyText:
            'No se otorgan presupuestos para campañas ni se paga por clicks, visualizaciones o producción de contenido. Las comisiones aplican por ventas verificadas. Si hay muestras o samples, la marca u oferente lo indicará en la ficha de la promoción.',
        pdfDealsCalloutTitle: 'Ficha PDF y Deals verificables',
        pdfDealsCalloutText:
            'Puedes usar tu ficha PDF para presentarte a comercios y marcas y proponer Deals. DameCódigo es un sistema de atribución verificable de ventas — no de contenido ni de métricas infladas.',
        pdfDownloadButton: 'Descargar ficha PDF',
        pdfOpenProfileButton: 'Ir a mi perfil',
        pdfGenericHint:
            'Descarga tu ficha desde tu perfil público (botón «Descargar ficha PDF» en la barra superior). Ejemplo de URL:',
        promoDownloadButton: 'Descargar material',
        promoPrintButton: 'Imprimir',
        items: [
            {
                q: '¿Cómo me registro?',
                blocks: [
                    { type: 'p', text: '¡Gracias por tu interés! 😊' },
                    { type: 'p', text: 'Para registrarte necesitamos tu correo electrónico de Gmail para enviarte:' },
                    { type: 'ul', items: ['Invitación a la plataforma', 'Acceso a la app', 'Términos y condiciones del programa'] },
                    { type: 'p', text: 'Una vez registrado, recibirás acceso a tu panel de influencer.' },
                ],
            },
            {
                q: '¿Qué es DameCódigo?',
                blocks: [
                    { type: 'p', text: 'DameCódigo es una plataforma que conecta marcas e influencers para generar ventas mediante recomendaciones, promociones y códigos personalizados.' },
                    { type: 'p', text: 'Como influencer podrás:' },
                    { type: 'ul', items: ['Aplicar a campañas de marcas.', 'Compartir promociones con tu audiencia.', 'Generar comisiones por ventas realizadas.', 'Administrar tus campañas desde un solo lugar.'] },
                ],
            },
            {
                q: '¿Cómo funciona mi perfil de influencer?',
                blocks: [
                    { type: 'p', text: 'Te asignaremos un perfil personalizado.' },
                    { type: 'p', text: 'Ejemplo:' },
                    { type: 'code', text: PROFILE_URL },
                    { type: 'p', text: 'Este será tu perfil de trabajo dentro de la plataforma.' },
                    { type: 'p', text: 'Desde ahí podrás:' },
                    { type: 'ul', items: ['Gestionar tu información.', 'Consultar campañas activas.', 'Ver métricas y resultados.', 'Dar seguimiento a tus comisiones.'] },
                ],
            },
            {
                q: '¿Qué es mi tienda o perfil de promociones?',
                blocks: [
                    { type: 'p', text: 'También tendrás una página pública de promociones.' },
                    { type: 'p', text: 'Ejemplo:' },
                    { type: 'code', text: STORE_URL },
                    { type: 'p', text: 'Este enlace puedes colocarlo en:' },
                    { type: 'ul', items: ['Instagram Bio', 'TikTok Bio', 'YouTube', 'Facebook', 'X (Twitter)', 'WhatsApp', 'Linktree'] },
                    { type: 'p', text: 'Tus seguidores podrán acceder directamente a las promociones y productos que estés recomendando.' },
                ],
            },
            {
                q: '¿Puedo usar mi ficha PDF para generar Deals con comercios y marcas?',
                blocks: [
                    {
                        type: 'p',
                        text: 'Sí. Tu ficha PDF es una carta verificable con QR, códigos cortos e ID técnico de tu perfil. Puedes compartirla con comercios, retailers y marcas para proponer Deals dentro del ecosistema DameCódigo.',
                    },
                    {
                        type: 'p',
                        text: 'Importante: no es un sistema de pago por contenido, visualizaciones, clicks ni métricas fáciles de inflar. Es cryptomarketing por atribución verificable de ventas: las comisiones se generan cuando hay ventas o canjes reales registrados a tu influencerId.',
                    },
                    {
                        type: 'ul',
                        items: [
                            'Presenta tu PDF en reuniones, WhatsApp o email con dueños de tienda y marcas.',
                            'Negocia comisiones por venta verificada, no por alcance ni producción de video.',
                            'Usa tus enlaces y códigos en la plataforma para que cada venta quede atribuida.',
                        ],
                    },
                    { type: 'pdf_cta' },
                ],
            },
            {
                q: '¿Puedo ser mi propio Deal Hunter o el Deal Hunter de otros creadores?',
                blocks: [
                    {
                        type: 'p',
                        text: 'Sí. En DameCódigo, influencer y Deal Hunter forman parte del mismo programa de atribución verificable de ventas (consulta nuestros Términos y Condiciones).',
                    },
                    {
                        type: 'p',
                        text: 'Como tu propio Deal Hunter puedes buscar y cerrar Deals con comercios y marcas para tu perfil, usando tu ficha PDF, códigos y enlaces. Las comisiones aplican solo por ventas o canjes verificables — no por contenido, clicks ni visualizaciones.',
                    },
                    {
                        type: 'p',
                        text: 'También puedes convertirte en el Deal Hunter de otros creadores de contenido: ayudarles a conseguir campañas y acuerdos con marcas, actuando como comisionista digital en colaboración con ellos.',
                    },
                    {
                        type: 'ul',
                        items: [
                            'Puedes compartir comisiones con otro influencer si lo acuerdan por escrito antes de activar la campaña.',
                            'Cada venta debe quedar atribuida al perfil correcto dentro de la plataforma.',
                            'El reparto solo aplica sobre comisiones por conversiones verificables, nunca sobre métricas infladas.',
                            'Si la campaña lo contempla, la marca u oferente puede reflejar el acuerdo en la ficha de aplicación.',
                        ],
                    },
                    {
                        type: 'p',
                        text: 'Para estructurar un reparto de comisiones con otro creador, coordina el deal antes de promocionar y escribe a admin@damecodigo.com si necesitas apoyo con la atribución. Más información: damecodigo.com/comisionista-digital',
                    },
                    {
                        type: 'p',
                        text: 'Material promocional oficial de la red Deal Hunters — descárgalo o imprímelo para compartir en redes, WhatsApp o eventos:',
                    },
                    {
                        type: 'image',
                        src: FAQ_DEAL_HUNTERS_PROMO_IMAGE,
                        alt: 'Únete a nuestra red de Deal Hunters — Link4Deal DameCódigo BizneAI: conecta marcas, genera deals y gana más',
                        promo: true,
                        downloadName: 'damecodigo-deal-hunters-promo.png',
                    },
                ],
            },
            {
                q: '¿Cómo gano dinero?',
                blocks: [
                    { type: 'p', text: 'Obtienes una comisión por cada venta generada desde tus enlaces o promociones.' },
                    { type: 'p', text: 'Las comisiones dependen de cada campaña y pueden variar según:' },
                    { type: 'ul', items: ['Marca', 'Producto', 'Categoría', 'Objetivos de la campaña'] },
                ],
            },
            {
                q: '¿Se pagan presupuestos, clicks, visualizaciones o producción de contenido?',
                blocks: [
                    {
                        type: 'p',
                        text: 'No. DameCódigo remunera resultados comerciales verificables (comisiones por ventas atribuidas), no exposición ni entregables creativos por sí solos.',
                    },
                    {
                        type: 'ul',
                        items: [
                            'No se otorgan presupuestos fijos para campañas.',
                            'No se paga por clicks, visualizaciones, impresiones ni alcance.',
                            'No se paga por producir, editar o publicar videos, fotos u otro contenido.',
                        ],
                    },
                    {
                        type: 'p',
                        text: 'Si una campaña incluye muestras o samples para apoyar tu contenido, la marca u oferente lo indicará en la ficha de la promoción (card de aplicación) antes de que apliques.',
                    },
                ],
            },
            {
                q: '¿Dónde veo las campañas disponibles?',
                blocks: [
                    { type: 'p', text: 'Puedes consultar todas las campañas activas en:' },
                    { type: 'code', text: MARKET_URL },
                    { type: 'p', text: 'Ahí encontrarás oportunidades disponibles para aplicar.' },
                ],
            },
            {
                q: '¿Qué significa "Aplicar" a una promoción?',
                blocks: [
                    { type: 'p', text: 'Aplicar significa que solicitas participar en una campaña.' },
                    { type: 'p', text: 'La marca revisará tu perfil y decidirá si aprueba tu participación.' },
                ],
            },
            {
                q: '¿Qué pasa cuando me aprueban una promoción?',
                blocks: [
                    { type: 'p', text: 'Una vez aprobado:' },
                    { type: 'ul', items: ['✅ La campaña aparecerá en tu panel.', '✅ Se generarán tus enlaces de promoción.', '✅ Podrás comenzar a crear contenido.', '✅ Empezarás a generar comisiones por ventas válidas.'] },
                ],
            },
            {
                q: '¿Tengo que crear contenido?',
                blocks: [
                    { type: 'p', text: 'Sí.' },
                    { type: 'p', text: 'Cada campaña puede solicitar diferentes entregables:' },
                    { type: 'ul', items: ['Historias de Instagram', 'Reels', 'TikToks', 'Videos de YouTube', 'Publicaciones', 'Reviews', 'Contenido UGC'] },
                    { type: 'p', text: 'Los requisitos aparecen dentro de cada campaña.' },
                ],
            },
            {
                q: '¿Cuánto puedo ganar?',
                blocks: [
                    { type: 'p', text: 'Tus ingresos dependerán de:' },
                    { type: 'ul', items: ['Tamaño de tu audiencia.', 'Nivel de engagement.', 'Número de campañas activas.', 'Volumen de ventas generadas.'] },
                    { type: 'p', text: 'No existe un límite de ganancias.' },
                    {
                        type: 'p',
                        text: 'Las comisiones son por ventas verificadas atribuidas a tu perfil, no por views ni métricas infladas. Ejemplo ilustrativo al monetizar un producto con DameCódigo / Link4Deal:',
                    },
                    {
                        type: 'image',
                        src: FAQ_MONETIZE_PRODUCT_IMAGE,
                        alt: 'Infografía: monetiza un producto con DameCódigo — comisión 10% por venta verificada, reparto influencer 80% y plataforma 20%, tokens acumulables y proyección de ganancias',
                    },
                ],
            },
            {
                q: '¿Necesito muchos seguidores?',
                blocks: [
                    { type: 'p', text: 'No necesariamente.' },
                    { type: 'p', text: 'También trabajamos con:' },
                    { type: 'ul', items: ['Microinfluencers', 'Nano influencers', 'Creadores UGC', 'Comunidades de nicho'] },
                    { type: 'p', text: 'Lo más importante es la calidad de tu audiencia.' },
                ],
            },
            {
                q: '¿Cuándo recibo mis comisiones?',
                blocks: [
                    { type: 'p', text: 'Las comisiones se pagan una vez que las ventas son validadas por la marca y cumplen los requisitos establecidos en la campaña.' },
                ],
            },
            {
                q: '¿Tiene algún costo registrarme?',
                blocks: [
                    { type: 'p', text: 'No.' },
                    { type: 'p', text: 'El registro como influencer es completamente gratuito.' },
                ],
            },
            {
                q: '¿Qué redes sociales puedo conectar?',
                blocks: [
                    { type: 'p', text: 'Puedes promocionar campañas desde:' },
                    { type: 'ul', items: ['Instagram', 'TikTok', 'YouTube', 'Facebook', 'X (Twitter)', 'Blogs', 'Sitios web', 'Comunidades digitales'] },
                ],
            },
            {
                q: '¿Puedo eliminar mi perfil si aún no estoy verificado?',
                blocks: [
                    {
                        type: 'p',
                        text: 'Sí. Si aún no completaste la verificación de identidad y deseas que eliminemos tu perfil, escríbenos a admin@damecodigo.com con el enlace de tu perfil.',
                    },
                    {
                        type: 'p',
                        text: 'Ten en cuenta que tu perfil puede estar generando comisiones por campañas o canjes de cupones, aunque no hayas verificado tu cuenta. Antes de solicitar la baja, te recomendamos revisar si tienes saldo disponible, completar tu verificación KYC para reclamar lo que te corresponda y confirmar que el perfil que deseas eliminar es realmente tuyo.',
                    },
                ],
            },
        ],
    },
    en: {
        pageTitle: 'Frequently Asked Questions',
        subtitle: 'DameCódigo Influencer Program',
        backLabel: 'Back to home',
        backToProfileLabel: 'Back to profile',
        ctaTitle: 'Ready to start?',
        ctaButton: 'Create my influencer account',
        myLinksTitle: 'Your personalized links',
        profileLinkLabel: 'Your influencer profile',
        storeLinkLabel: 'Your promotions store',
        copy: 'Copy',
        copied: 'Copied',
        myStoreButton: 'View my active coupons',
        activeCouponsTitle: 'Want to see your active coupons?',
        acceptNote: 'By registering you accept our Terms and Conditions.',
        registerHere: 'Register here',
        readTerms: 'Read Terms and Conditions',
        paymentPolicyTitle: 'Compensation model',
        paymentPolicyText:
            'No campaign budgets are provided, and clicks, views or content production are not paid. Commissions apply to verified sales. If samples are included, the brand or offerer will specify this on the promotion card.',
        pdfDealsCalloutTitle: 'Profile PDF and verifiable Deals',
        pdfDealsCalloutText:
            'Use your profile PDF to pitch merchants and brands for Deals. DameCódigo is a verifiable sales attribution system — not content reach or inflated metrics.',
        pdfDownloadButton: 'Download profile PDF',
        pdfOpenProfileButton: 'Go to my profile',
        pdfGenericHint:
            'Download your sheet from your public profile (top bar button «Download profile PDF»). Example URL:',
        promoDownloadButton: 'Download material',
        promoPrintButton: 'Print',
        items: [
            {
                q: 'How do I register?',
                blocks: [
                    { type: 'p', text: 'Thanks for your interest! 😊' },
                    { type: 'p', text: 'To register we need your Gmail email address so we can send you:' },
                    { type: 'ul', items: ['Invitation to the platform', 'Access to the app', 'Program terms and conditions'] },
                    { type: 'p', text: 'Once registered, you will get access to your influencer dashboard.' },
                ],
            },
            {
                q: 'What is DameCódigo?',
                blocks: [
                    { type: 'p', text: 'DameCódigo is a platform that connects brands and influencers to generate sales through recommendations, promotions and personalized codes.' },
                    { type: 'p', text: 'As an influencer you can:' },
                    { type: 'ul', items: ['Apply to brand campaigns.', 'Share promotions with your audience.', 'Earn commissions on completed sales.', 'Manage all your campaigns in one place.'] },
                ],
            },
            {
                q: 'How does my influencer profile work?',
                blocks: [
                    { type: 'p', text: 'We will assign you a personalized profile.' },
                    { type: 'p', text: 'Example:' },
                    { type: 'code', text: PROFILE_URL },
                    { type: 'p', text: 'This will be your work profile inside the platform.' },
                    { type: 'p', text: 'From there you can:' },
                    { type: 'ul', items: ['Manage your information.', 'Check active campaigns.', 'See metrics and results.', 'Track your commissions.'] },
                ],
            },
            {
                q: 'What is my store or promotions profile?',
                blocks: [
                    { type: 'p', text: 'You will also have a public promotions page.' },
                    { type: 'p', text: 'Example:' },
                    { type: 'code', text: STORE_URL },
                    { type: 'p', text: 'You can place this link in:' },
                    { type: 'ul', items: ['Instagram Bio', 'TikTok Bio', 'YouTube', 'Facebook', 'X (Twitter)', 'WhatsApp', 'Linktree'] },
                    { type: 'p', text: 'Your followers can directly access the promotions and products you recommend.' },
                ],
            },
            {
                q: 'Can I use my profile PDF to generate Deals with merchants and brands?',
                blocks: [
                    {
                        type: 'p',
                        text: 'Yes. Your profile PDF is a verifiable one-pager with QR, short codes and your technical profile ID. Share it with merchants, retailers and brands to propose Deals within the DameCódigo ecosystem.',
                    },
                    {
                        type: 'p',
                        text: 'Important: this is not pay-for-content, views, clicks or easy-to-inflate metrics. It is cryptomarketing with verifiable sales attribution: commissions are earned when real sales or redemptions are recorded to your influencerId.',
                    },
                    {
                        type: 'ul',
                        items: [
                            'Present your PDF in meetings, WhatsApp or email with store owners and brands.',
                            'Negotiate commissions on verified sales, not reach or video production.',
                            'Use your platform links and codes so every sale stays attributed.',
                        ],
                    },
                    { type: 'pdf_cta' },
                ],
            },
            {
                q: 'Can I be my own Deal Hunter or the Deal Hunter for other creators?',
                blocks: [
                    {
                        type: 'p',
                        text: 'Yes. On DameCódigo, influencer and Deal Hunter are part of the same verifiable sales attribution program (see our Terms and Conditions).',
                    },
                    {
                        type: 'p',
                        text: 'As your own Deal Hunter you can find and close Deals with merchants and brands for your profile, using your PDF sheet, codes and links. Commissions apply only to verified sales or redemptions — not content, clicks or views.',
                    },
                    {
                        type: 'p',
                        text: 'You can also become the Deal Hunter for other content creators: help them land campaigns and brand agreements, acting as a digital commissioner in collaboration with them.',
                    },
                    {
                        type: 'ul',
                        items: [
                            'You may share commissions with another influencer if you agree in writing before activating the campaign.',
                            'Each sale must be attributed to the correct profile on the platform.',
                            'Revenue sharing applies only to commissions on verified conversions, never on inflated metrics.',
                            'If the campaign allows it, the brand or offerer may reflect the agreement on the application card.',
                        ],
                    },
                    {
                        type: 'p',
                        text: 'To structure commission sharing with another creator, agree on the deal before promoting and email admin@damecodigo.com if you need help with attribution. Learn more: damecodigo.com/comisionista-digital',
                    },
                    {
                        type: 'p',
                        text: 'Official Deal Hunters network promotional material — download or print to share on social media, WhatsApp or events:',
                    },
                    {
                        type: 'image',
                        src: FAQ_DEAL_HUNTERS_PROMO_IMAGE,
                        alt: 'Join our Deal Hunters network — Link4Deal DameCódigo BizneAI: connect brands, generate deals, earn more',
                        promo: true,
                        downloadName: 'damecodigo-deal-hunters-promo.png',
                    },
                ],
            },
            {
                q: 'How do I earn money?',
                blocks: [
                    { type: 'p', text: 'You earn a commission for every sale generated from your links or promotions.' },
                    { type: 'p', text: 'Commissions depend on each campaign and may vary based on:' },
                    { type: 'ul', items: ['Brand', 'Product', 'Category', 'Campaign goals'] },
                ],
            },
            {
                q: 'Are campaign budgets, clicks, views or content production paid?',
                blocks: [
                    {
                        type: 'p',
                        text: 'No. DameCódigo pays for verifiable commercial results (commissions on attributed sales), not for exposure or creative deliverables on their own.',
                    },
                    {
                        type: 'ul',
                        items: [
                            'No fixed campaign budgets are provided.',
                            'Clicks, views, impressions and reach are not paid.',
                            'Producing, editing or publishing videos, photos or other content is not paid.',
                        ],
                    },
                    {
                        type: 'p',
                        text: 'If a campaign includes product samples to support your content, the brand or offerer will specify this on the promotion card before you apply.',
                    },
                ],
            },
            {
                q: 'Where can I see the available campaigns?',
                blocks: [
                    { type: 'p', text: 'You can check all active campaigns at:' },
                    { type: 'code', text: MARKET_URL },
                    { type: 'p', text: 'There you will find opportunities available to apply for.' },
                ],
            },
            {
                q: 'What does it mean to "Apply" to a promotion?',
                blocks: [
                    { type: 'p', text: 'Applying means you request to take part in a campaign.' },
                    { type: 'p', text: 'The brand will review your profile and decide whether to approve your participation.' },
                ],
            },
            {
                q: 'What happens when a promotion is approved for me?',
                blocks: [
                    { type: 'p', text: 'Once approved:' },
                    { type: 'ul', items: ['✅ The campaign will appear in your dashboard.', '✅ Your promotion links will be generated.', '✅ You can start creating content.', '✅ You will start earning commissions on valid sales.'] },
                ],
            },
            {
                q: 'Do I have to create content?',
                blocks: [
                    { type: 'p', text: 'Yes.' },
                    { type: 'p', text: 'Each campaign may request different deliverables:' },
                    { type: 'ul', items: ['Instagram Stories', 'Reels', 'TikToks', 'YouTube videos', 'Posts', 'Reviews', 'UGC content'] },
                    { type: 'p', text: 'The requirements appear inside each campaign.' },
                ],
            },
            {
                q: 'How much can I earn?',
                blocks: [
                    { type: 'p', text: 'Your earnings will depend on:' },
                    { type: 'ul', items: ['The size of your audience.', 'Your engagement level.', 'The number of active campaigns.', 'The volume of sales generated.'] },
                    { type: 'p', text: 'There is no earnings limit.' },
                    {
                        type: 'p',
                        text: 'Commissions come from verified sales attributed to your profile, not views or inflated metrics. Illustrative example when monetizing a product with DameCódigo / Link4Deal:',
                    },
                    {
                        type: 'image',
                        src: FAQ_MONETIZE_PRODUCT_IMAGE,
                        alt: 'Infographic: monetize a product with DameCódigo — 10% commission on verified sales, 80% influencer / 20% platform split, accumulable tokens and earnings projection',
                    },
                ],
            },
            {
                q: 'Do I need a lot of followers?',
                blocks: [
                    { type: 'p', text: 'Not necessarily.' },
                    { type: 'p', text: 'We also work with:' },
                    { type: 'ul', items: ['Micro-influencers', 'Nano-influencers', 'UGC creators', 'Niche communities'] },
                    { type: 'p', text: 'What matters most is the quality of your audience.' },
                ],
            },
            {
                q: 'When do I receive my commissions?',
                blocks: [
                    { type: 'p', text: 'Commissions are paid once sales are validated by the brand and meet the requirements set in the campaign.' },
                ],
            },
            {
                q: 'Is there any cost to register?',
                blocks: [
                    { type: 'p', text: 'No.' },
                    { type: 'p', text: 'Registering as an influencer is completely free.' },
                ],
            },
            {
                q: 'Which social networks can I connect?',
                blocks: [
                    { type: 'p', text: 'You can promote campaigns from:' },
                    { type: 'ul', items: ['Instagram', 'TikTok', 'YouTube', 'Facebook', 'X (Twitter)', 'Blogs', 'Websites', 'Digital communities'] },
                ],
            },
            {
                q: 'Can I delete my profile if I am not verified yet?',
                blocks: [
                    {
                        type: 'p',
                        text: 'Yes. If you have not completed identity verification and want us to delete your profile, email admin@damecodigo.com with your profile link.',
                    },
                    {
                        type: 'p',
                        text: 'Your profile may still be generating commissions from campaigns or coupon redemptions even if you are not verified. Before requesting deletion, we recommend checking for available balance, completing KYC to claim what you are owed, and confirming the profile you want removed is really yours.',
                    },
                ],
            },
        ],
    },
    fr: {
        pageTitle: 'Questions fréquentes',
        subtitle: "Programme d'influenceurs · DameCódigo",
        backLabel: "Retour à l'accueil",
        backToProfileLabel: 'Retour au profil',
        ctaTitle: 'Prêt à commencer ?',
        ctaButton: 'Créer mon compte influenceur',
        myLinksTitle: 'Vos liens personnalisés',
        profileLinkLabel: "Votre profil d'influenceur",
        storeLinkLabel: 'Votre boutique de promotions',
        copy: 'Copier',
        copied: 'Copié',
        myStoreButton: 'Voir mes coupons actifs',
        activeCouponsTitle: 'Voir vos coupons actifs ?',
        acceptNote: 'En vous inscrivant, vous acceptez nos Conditions Générales.',
        registerHere: 'Inscrivez-vous ici',
        readTerms: 'Lire les Conditions Générales',
        paymentPolicyTitle: 'Modèle de rémunération',
        paymentPolicyText:
            'Aucun budget de campagne n’est accordé et les clics, vues ou production de contenu ne sont pas payés. Les commissions s’appliquent aux ventes vérifiées. En cas d’échantillons (samples), la marque ou l’offrant l’indiquera sur la fiche de la promotion.',
        pdfDealsCalloutTitle: 'Fiche PDF et Deals vérifiables',
        pdfDealsCalloutText:
            'Utilisez votre fiche PDF pour proposer des Deals aux commerces et marques. DameCódigo est un système d’attribution de ventes vérifiable — pas de contenu ni de métriques gonflées.',
        pdfDownloadButton: 'Télécharger la fiche PDF',
        pdfOpenProfileButton: 'Aller à mon profil',
        pdfGenericHint:
            'Téléchargez votre fiche depuis votre profil public (bouton « Télécharger fiche PDF » en haut). Exemple d’URL :',
        promoDownloadButton: 'Télécharger le visuel',
        promoPrintButton: 'Imprimer',
        items: [
            {
                q: "Comment puis-je m'inscrire ?",
                blocks: [
                    { type: 'p', text: 'Merci de votre intérêt ! 😊' },
                    { type: 'p', text: 'Pour vous inscrire, nous avons besoin de votre adresse Gmail afin de vous envoyer :' },
                    { type: 'ul', items: ['Une invitation à la plateforme', "L'accès à l'application", 'Les conditions générales du programme'] },
                    { type: 'p', text: 'Une fois inscrit, vous recevrez l’accès à votre tableau de bord d’influenceur.' },
                ],
            },
            {
                q: "Qu'est-ce que DameCódigo ?",
                blocks: [
                    { type: 'p', text: 'DameCódigo est une plateforme qui met en relation marques et influenceurs pour générer des ventes grâce à des recommandations, des promotions et des codes personnalisés.' },
                    { type: 'p', text: 'En tant qu’influenceur, vous pourrez :' },
                    { type: 'ul', items: ['Postuler aux campagnes des marques.', 'Partager des promotions avec votre audience.', 'Générer des commissions sur les ventes réalisées.', 'Gérer vos campagnes depuis un seul endroit.'] },
                ],
            },
            {
                q: "Comment fonctionne mon profil d'influenceur ?",
                blocks: [
                    { type: 'p', text: 'Nous vous attribuerons un profil personnalisé.' },
                    { type: 'p', text: 'Exemple :' },
                    { type: 'code', text: PROFILE_URL },
                    { type: 'p', text: 'Ce sera votre profil de travail au sein de la plateforme.' },
                    { type: 'p', text: 'Depuis cet espace, vous pourrez :' },
                    { type: 'ul', items: ['Gérer vos informations.', 'Consulter les campagnes actives.', 'Voir les métriques et les résultats.', 'Suivre vos commissions.'] },
                ],
            },
            {
                q: 'Qu’est-ce que ma boutique ou profil de promotions ?',
                blocks: [
                    { type: 'p', text: 'Vous disposerez aussi d’une page publique de promotions.' },
                    { type: 'p', text: 'Exemple :' },
                    { type: 'code', text: STORE_URL },
                    { type: 'p', text: 'Vous pouvez placer ce lien dans :' },
                    { type: 'ul', items: ['Bio Instagram', 'Bio TikTok', 'YouTube', 'Facebook', 'X (Twitter)', 'WhatsApp', 'Linktree'] },
                    { type: 'p', text: 'Vos abonnés pourront accéder directement aux promotions et produits que vous recommandez.' },
                ],
            },
            {
                q: 'Puis-je utiliser ma fiche PDF pour générer des Deals avec commerces et marques ?',
                blocks: [
                    {
                        type: 'p',
                        text: 'Oui. Votre fiche PDF est une carte vérifiable avec QR, codes courts et ID technique de profil. Partagez-la avec commerces, retailers et marques pour proposer des Deals dans l’écosystème DameCódigo.',
                    },
                    {
                        type: 'p',
                        text: 'Important : ce n’est pas un paiement pour contenu, vues, clics ou métriques faciles à gonfler. C’est du cryptomarketing par attribution de ventes vérifiables : les commissions naissent des ventes ou validations réelles enregistrées sur votre influencerId.',
                    },
                    {
                        type: 'ul',
                        items: [
                            'Présentez votre PDF en rendez-vous, WhatsApp ou email avec commerçants et marques.',
                            'Négociez des commissions sur ventes vérifiées, pas sur la portée ni la production vidéo.',
                            'Utilisez vos liens et codes sur la plateforme pour que chaque vente reste attribuée.',
                        ],
                    },
                    { type: 'pdf_cta' },
                ],
            },
            {
                q: 'Puis-je être mon propre Deal Hunter ou celui d’autres créateurs ?',
                blocks: [
                    {
                        type: 'p',
                        text: 'Oui. Sur DameCódigo, influenceur et Deal Hunter font partie du même programme d’attribution de ventes vérifiables (voir nos Conditions Générales).',
                    },
                    {
                        type: 'p',
                        text: 'En tant que votre propre Deal Hunter, vous pouvez rechercher et conclure des Deals avec commerces et marques pour votre profil, via votre fiche PDF, codes et liens. Les commissions ne s’appliquent qu’aux ventes ou validations vérifiables — pas au contenu, clics ou vues.',
                    },
                    {
                        type: 'p',
                        text: 'Vous pouvez aussi devenir le Deal Hunter d’autres créateurs de contenu : les aider à obtenir des campagnes et accords avec des marques, en agissant comme comisionista digital en collaboration.',
                    },
                    {
                        type: 'ul',
                        items: [
                            'Vous pouvez partager les commissions avec un autre influenceur si vous vous mettez d’accord par écrit avant d’activer la campagne.',
                            'Chaque vente doit être attribuée au bon profil sur la plateforme.',
                            'Le partage ne s’applique qu’aux commissions sur conversions vérifiables, jamais sur des métriques gonflées.',
                            'Si la campagne le prévoit, la marque ou l’offrant peut refléter l’accord sur la fiche de candidature.',
                        ],
                    },
                    {
                        type: 'p',
                        text: 'Pour structurer un partage de commissions avec un autre créateur, convenez du deal avant de promouvoir et écrivez à admin@damecodigo.com si vous avez besoin d’aide sur l’attribution. En savoir plus : damecodigo.com/comisionista-digital',
                    },
                    {
                        type: 'p',
                        text: 'Visuel promotionnel officiel du réseau Deal Hunters — téléchargez ou imprimez pour partager sur les réseaux, WhatsApp ou en événement :',
                    },
                    {
                        type: 'image',
                        src: FAQ_DEAL_HUNTERS_PROMO_IMAGE,
                        alt: 'Rejoignez notre réseau de Deal Hunters — Link4Deal DameCódigo BizneAI',
                        promo: true,
                        downloadName: 'damecodigo-deal-hunters-promo.png',
                    },
                ],
            },
            {
                q: "Comment puis-je gagner de l'argent ?",
                blocks: [
                    { type: 'p', text: 'Vous touchez une commission pour chaque vente générée depuis vos liens ou promotions.' },
                    { type: 'p', text: 'Les commissions dépendent de chaque campagne et peuvent varier selon :' },
                    { type: 'ul', items: ['La marque', 'Le produit', 'La catégorie', 'Les objectifs de la campagne'] },
                ],
            },
            {
                q: 'Paie-t-on des budgets, des clics, des vues ou la production de contenu ?',
                blocks: [
                    {
                        type: 'p',
                        text: 'Non. DameCódigo rémunère des résultats commerciaux vérifiables (commissions sur ventes attribuées), pas l’exposition ni les livrables créatifs en eux-mêmes.',
                    },
                    {
                        type: 'ul',
                        items: [
                            'Aucun budget fixe n’est accordé pour les campagnes.',
                            'Les clics, vues, impressions et la portée ne sont pas payés.',
                            'La production, l’édition ou la publication de vidéos, photos ou autre contenu n’est pas payée.',
                        ],
                    },
                    {
                        type: 'p',
                        text: 'Si une campagne inclut des échantillons (samples) pour votre contenu, la marque ou l’offrant l’indiquera sur la fiche de la promotion avant votre candidature.',
                    },
                ],
            },
            {
                q: 'Où puis-je voir les campagnes disponibles ?',
                blocks: [
                    { type: 'p', text: 'Vous pouvez consulter toutes les campagnes actives sur :' },
                    { type: 'code', text: MARKET_URL },
                    { type: 'p', text: 'Vous y trouverez les opportunités disponibles pour postuler.' },
                ],
            },
            {
                q: 'Que signifie « Postuler » à une promotion ?',
                blocks: [
                    { type: 'p', text: 'Postuler signifie que vous demandez à participer à une campagne.' },
                    { type: 'p', text: 'La marque examinera votre profil et décidera d’approuver ou non votre participation.' },
                ],
            },
            {
                q: 'Que se passe-t-il lorsqu’une promotion est approuvée ?',
                blocks: [
                    { type: 'p', text: 'Une fois approuvé :' },
                    { type: 'ul', items: ['✅ La campagne apparaîtra dans votre tableau de bord.', '✅ Vos liens de promotion seront générés.', '✅ Vous pourrez commencer à créer du contenu.', '✅ Vous commencerez à générer des commissions sur les ventes valides.'] },
                ],
            },
            {
                q: 'Dois-je créer du contenu ?',
                blocks: [
                    { type: 'p', text: 'Oui.' },
                    { type: 'p', text: 'Chaque campagne peut demander différents livrables :' },
                    { type: 'ul', items: ['Stories Instagram', 'Reels', 'TikToks', 'Vidéos YouTube', 'Publications', 'Avis (reviews)', 'Contenu UGC'] },
                    { type: 'p', text: 'Les exigences apparaissent dans chaque campagne.' },
                ],
            },
            {
                q: 'Combien puis-je gagner ?',
                blocks: [
                    { type: 'p', text: 'Vos revenus dépendront de :' },
                    { type: 'ul', items: ['La taille de votre audience.', 'Votre niveau d’engagement.', 'Le nombre de campagnes actives.', 'Le volume de ventes généré.'] },
                    { type: 'p', text: 'Il n’y a aucune limite de gains.' },
                    {
                        type: 'p',
                        text: 'Les commissions viennent des ventes vérifiées attribuées à votre profil, pas des vues ni de métriques gonflées. Exemple illustratif en monétisant un produit avec DameCódigo / Link4Deal :',
                    },
                    {
                        type: 'image',
                        src: FAQ_MONETIZE_PRODUCT_IMAGE,
                        alt: 'Infographie : monétiser un produit avec DameCódigo — commission 10 % sur vente vérifiée, partage 80 % influenceur / 20 % plateforme, tokens et projection de gains',
                    },
                ],
            },
            {
                q: 'Ai-je besoin de beaucoup d’abonnés ?',
                blocks: [
                    { type: 'p', text: 'Pas nécessairement.' },
                    { type: 'p', text: 'Nous travaillons également avec :' },
                    { type: 'ul', items: ['Micro-influenceurs', 'Nano-influenceurs', 'Créateurs UGC', 'Communautés de niche'] },
                    { type: 'p', text: 'Le plus important est la qualité de votre audience.' },
                ],
            },
            {
                q: 'Quand vais-je recevoir mes commissions ?',
                blocks: [
                    { type: 'p', text: 'Les commissions sont payées une fois que les ventes sont validées par la marque et respectent les conditions définies dans la campagne.' },
                ],
            },
            {
                q: "L'inscription a-t-elle un coût ?",
                blocks: [
                    { type: 'p', text: 'Non.' },
                    { type: 'p', text: 'L’inscription en tant qu’influenceur est entièrement gratuite.' },
                ],
            },
            {
                q: 'Quels réseaux sociaux puis-je connecter ?',
                blocks: [
                    { type: 'p', text: 'Vous pouvez promouvoir des campagnes depuis :' },
                    { type: 'ul', items: ['Instagram', 'TikTok', 'YouTube', 'Facebook', 'X (Twitter)', 'Blogs', 'Sites web', 'Communautés numériques'] },
                ],
            },
            {
                q: 'Puis-je supprimer mon profil si je ne suis pas encore vérifié ?',
                blocks: [
                    {
                        type: 'p',
                        text: 'Oui. Si vous n’avez pas terminé la vérification d’identité et souhaitez que nous supprimions votre profil, écrivez à admin@damecodigo.com avec le lien de votre profil.',
                    },
                    {
                        type: 'p',
                        text: 'Votre profil peut générer des commissions via des campagnes ou des coupons même sans vérification. Avant de demander la suppression, vérifiez votre solde disponible, complétez votre KYC pour réclamer ce qui vous revient et confirmez que le profil à supprimer est bien le vôtre.',
                    },
                ],
            },
        ],
    },
    pt: {
        pageTitle: 'Perguntas frequentes',
        subtitle: 'Programa de Influenciadores · DameCódigo',
        backLabel: 'Voltar ao início',
        backToProfileLabel: 'Voltar ao perfil',
        ctaTitle: 'Pronto para começar?',
        ctaButton: 'Criar minha conta de influenciador',
        myLinksTitle: 'Seus links personalizados',
        profileLinkLabel: 'Seu perfil de influenciador',
        storeLinkLabel: 'Sua loja de promoções',
        copy: 'Copiar',
        copied: 'Copiado',
        myStoreButton: 'Ver meus cupons ativos',
        activeCouponsTitle: 'Quer ver seus cupons ativos?',
        acceptNote: 'Ao se cadastrar, você aceita nossos Termos e Condições.',
        registerHere: 'Cadastre-se aqui',
        readTerms: 'Ler Termos e Condições',
        paymentPolicyTitle: 'Modelo de remuneração',
        paymentPolicyText:
            'Não há orçamentos de campanha nem pagamento por cliques, visualizações ou produção de conteúdo. As comissões aplicam-se a vendas verificadas. Se houver amostras (samples), a marca ou ofertante informará no card da promoção.',
        pdfDealsCalloutTitle: 'Ficha PDF e Deals verificáveis',
        pdfDealsCalloutText:
            'Use sua ficha PDF para apresentar comércios e marcas e propor Deals. DameCódigo é um sistema de atribuição verificável de vendas — não de conteúdo nem métricas infladas.',
        pdfDownloadButton: 'Baixar ficha PDF',
        pdfOpenProfileButton: 'Ir ao meu perfil',
        pdfGenericHint:
            'Baixe sua ficha no perfil público (botão «Baixar ficha PDF» no topo). Exemplo de URL:',
        promoDownloadButton: 'Baixar material',
        promoPrintButton: 'Imprimir',
        items: [
            {
                q: 'Como faço o cadastro?',
                blocks: [
                    { type: 'p', text: 'Obrigado pelo seu interesse! 😊' },
                    { type: 'p', text: 'Para se cadastrar precisamos do seu e-mail do Gmail para lhe enviar:' },
                    { type: 'ul', items: ['Convite para a plataforma', 'Acesso ao app', 'Termos e condições do programa'] },
                    { type: 'p', text: 'Após o cadastro, você receberá acesso ao seu painel de influenciador.' },
                ],
            },
            {
                q: 'O que é o DameCódigo?',
                blocks: [
                    { type: 'p', text: 'O DameCódigo é uma plataforma que conecta marcas e influenciadores para gerar vendas por meio de recomendações, promoções e códigos personalizados.' },
                    { type: 'p', text: 'Como influenciador você poderá:' },
                    { type: 'ul', items: ['Candidatar-se a campanhas de marcas.', 'Compartilhar promoções com a sua audiência.', 'Gerar comissões por vendas realizadas.', 'Administrar suas campanhas em um só lugar.'] },
                ],
            },
            {
                q: 'Como funciona o meu perfil de influenciador?',
                blocks: [
                    { type: 'p', text: 'Atribuiremos a você um perfil personalizado.' },
                    { type: 'p', text: 'Exemplo:' },
                    { type: 'code', text: PROFILE_URL },
                    { type: 'p', text: 'Este será o seu perfil de trabalho dentro da plataforma.' },
                    { type: 'p', text: 'A partir dele você poderá:' },
                    { type: 'ul', items: ['Gerenciar suas informações.', 'Consultar campanhas ativas.', 'Ver métricas e resultados.', 'Acompanhar suas comissões.'] },
                ],
            },
            {
                q: 'O que é a minha loja ou perfil de promoções?',
                blocks: [
                    { type: 'p', text: 'Você também terá uma página pública de promoções.' },
                    { type: 'p', text: 'Exemplo:' },
                    { type: 'code', text: STORE_URL },
                    { type: 'p', text: 'Você pode colocar este link em:' },
                    { type: 'ul', items: ['Bio do Instagram', 'Bio do TikTok', 'YouTube', 'Facebook', 'X (Twitter)', 'WhatsApp', 'Linktree'] },
                    { type: 'p', text: 'Seus seguidores poderão acessar diretamente as promoções e produtos que você recomenda.' },
                ],
            },
            {
                q: 'Posso usar minha ficha PDF para gerar Deals com comércios e marcas?',
                blocks: [
                    {
                        type: 'p',
                        text: 'Sim. Sua ficha PDF é uma carta verificável com QR, códigos curtos e ID técnico do perfil. Compartilhe com comércios, varejistas e marcas para propor Deals no ecossistema DameCódigo.',
                    },
                    {
                        type: 'p',
                        text: 'Importante: não é pagamento por conteúdo, visualizações, cliques ou métricas fáceis de inflar. É cryptomarketing por atribuição verificável de vendas: comissões surgem de vendas ou resgates reais registrados no seu influencerId.',
                    },
                    {
                        type: 'ul',
                        items: [
                            'Apresente seu PDF em reuniões, WhatsApp ou e-mail com lojistas e marcas.',
                            'Negocie comissões por venda verificada, não por alcance ou produção de vídeo.',
                            'Use seus links e códigos na plataforma para que cada venda fique atribuída.',
                        ],
                    },
                    { type: 'pdf_cta' },
                ],
            },
            {
                q: 'Posso ser meu próprio Deal Hunter ou o Deal Hunter de outros criadores?',
                blocks: [
                    {
                        type: 'p',
                        text: 'Sim. No DameCódigo, influencer e Deal Hunter fazem parte do mesmo programa de atribuição verificável de vendas (consulte nossos Termos e Condições).',
                    },
                    {
                        type: 'p',
                        text: 'Como seu próprio Deal Hunter, você pode buscar e fechar Deals com comércios e marcas para seu perfil, usando sua ficha PDF, códigos e links. Comissões aplicam-se apenas a vendas ou resgates verificáveis — não a conteúdo, cliques ou visualizações.',
                    },
                    {
                        type: 'p',
                        text: 'Você também pode ser o Deal Hunter de outros criadores de conteúdo: ajudá-los a conseguir campanhas e acordos com marcas, atuando como comisionista digital em colaboração.',
                    },
                    {
                        type: 'ul',
                        items: [
                            'Você pode compartilhar comissões com outro influencer se acordarem por escrito antes de ativar a campanha.',
                            'Cada venda deve ficar atribuída ao perfil correto na plataforma.',
                            'O repasse só se aplica a comissões por conversões verificáveis, nunca a métricas infladas.',
                            'Se a campanha permitir, a marca ou ofertante pode refletir o acordo no card de candidatura.',
                        ],
                    },
                    {
                        type: 'p',
                        text: 'Para estruturar repasse de comissões com outro criador, alinhem o deal antes de promover e escrevam para admin@damecodigo.com se precisarem de apoio com a atribuição. Saiba mais: damecodigo.com/comisionista-digital',
                    },
                    {
                        type: 'p',
                        text: 'Material promocional oficial da rede Deal Hunters — baixe ou imprima para compartilhar nas redes, WhatsApp ou eventos:',
                    },
                    {
                        type: 'image',
                        src: FAQ_DEAL_HUNTERS_PROMO_IMAGE,
                        alt: 'Junte-se à nossa rede de Deal Hunters — Link4Deal DameCódigo BizneAI',
                        promo: true,
                        downloadName: 'damecodigo-deal-hunters-promo.png',
                    },
                ],
            },
            {
                q: 'Como ganho dinheiro?',
                blocks: [
                    { type: 'p', text: 'Você recebe uma comissão por cada venda gerada a partir dos seus links ou promoções.' },
                    { type: 'p', text: 'As comissões dependem de cada campanha e podem variar de acordo com:' },
                    { type: 'ul', items: ['Marca', 'Produto', 'Categoria', 'Objetivos da campanha'] },
                ],
            },
            {
                q: 'Há pagamento de orçamento, cliques, visualizações ou produção de conteúdo?',
                blocks: [
                    {
                        type: 'p',
                        text: 'Não. O DameCódigo remunera resultados comerciais verificáveis (comissões por vendas atribuídas), não exposição nem entregáveis criativos isolados.',
                    },
                    {
                        type: 'ul',
                        items: [
                            'Não são concedidos orçamentos fixos para campanhas.',
                            'Não há pagamento por cliques, visualizações, impressões ou alcance.',
                            'Não há pagamento por produzir, editar ou publicar vídeos, fotos ou outro conteúdo.',
                        ],
                    },
                    {
                        type: 'p',
                        text: 'Se uma campanha incluir amostras (samples) para apoiar seu conteúdo, a marca ou ofertante informará isso no card da promoção antes de você se candidatar.',
                    },
                ],
            },
            {
                q: 'Onde vejo as campanhas disponíveis?',
                blocks: [
                    { type: 'p', text: 'Você pode consultar todas as campanhas ativas em:' },
                    { type: 'code', text: MARKET_URL },
                    { type: 'p', text: 'Lá você encontrará as oportunidades disponíveis para se candidatar.' },
                ],
            },
            {
                q: 'O que significa "Candidatar-se" a uma promoção?',
                blocks: [
                    { type: 'p', text: 'Candidatar-se significa que você solicita participar de uma campanha.' },
                    { type: 'p', text: 'A marca analisará o seu perfil e decidirá se aprova a sua participação.' },
                ],
            },
            {
                q: 'O que acontece quando uma promoção é aprovada para mim?',
                blocks: [
                    { type: 'p', text: 'Uma vez aprovado:' },
                    { type: 'ul', items: ['✅ A campanha aparecerá no seu painel.', '✅ Seus links de promoção serão gerados.', '✅ Você poderá começar a criar conteúdo.', '✅ Você começará a gerar comissões por vendas válidas.'] },
                ],
            },
            {
                q: 'Preciso criar conteúdo?',
                blocks: [
                    { type: 'p', text: 'Sim.' },
                    { type: 'p', text: 'Cada campanha pode solicitar diferentes entregáveis:' },
                    { type: 'ul', items: ['Stories do Instagram', 'Reels', 'TikToks', 'Vídeos do YouTube', 'Publicações', 'Reviews', 'Conteúdo UGC'] },
                    { type: 'p', text: 'Os requisitos aparecem dentro de cada campanha.' },
                ],
            },
            {
                q: 'Quanto posso ganhar?',
                blocks: [
                    { type: 'p', text: 'Seus ganhos dependerão de:' },
                    { type: 'ul', items: ['Tamanho da sua audiência.', 'Nível de engajamento.', 'Número de campanhas ativas.', 'Volume de vendas geradas.'] },
                    { type: 'p', text: 'Não existe limite de ganhos.' },
                    {
                        type: 'p',
                        text: 'As comissões vêm de vendas verificadas atribuídas ao seu perfil, não de visualizações ou métricas infladas. Exemplo ilustrativo ao monetizar um produto com DameCódigo / Link4Deal:',
                    },
                    {
                        type: 'image',
                        src: FAQ_MONETIZE_PRODUCT_IMAGE,
                        alt: 'Infográfico: monetize um produto com DameCódigo — comissão 10% por venda verificada, reparto 80% influencer / 20% plataforma, tokens acumuláveis e projeção de ganhos',
                    },
                ],
            },
            {
                q: 'Preciso de muitos seguidores?',
                blocks: [
                    { type: 'p', text: 'Não necessariamente.' },
                    { type: 'p', text: 'Também trabalhamos com:' },
                    { type: 'ul', items: ['Microinfluenciadores', 'Nano influenciadores', 'Criadores de UGC', 'Comunidades de nicho'] },
                    { type: 'p', text: 'O mais importante é a qualidade da sua audiência.' },
                ],
            },
            {
                q: 'Quando recebo as minhas comissões?',
                blocks: [
                    { type: 'p', text: 'As comissões são pagas assim que as vendas são validadas pela marca e cumprem os requisitos estabelecidos na campanha.' },
                ],
            },
            {
                q: 'O cadastro tem algum custo?',
                blocks: [
                    { type: 'p', text: 'Não.' },
                    { type: 'p', text: 'O cadastro como influenciador é totalmente gratuito.' },
                ],
            },
            {
                q: 'Quais redes sociais posso conectar?',
                blocks: [
                    { type: 'p', text: 'Você pode promover campanhas a partir de:' },
                    { type: 'ul', items: ['Instagram', 'TikTok', 'YouTube', 'Facebook', 'X (Twitter)', 'Blogs', 'Sites', 'Comunidades digitais'] },
                ],
            },
            {
                q: 'Posso excluir meu perfil se ainda não estiver verificado?',
                blocks: [
                    {
                        type: 'p',
                        text: 'Sim. Se você ainda não concluiu a verificação de identidade e deseja que excluamos seu perfil, escreva para admin@damecodigo.com com o link do seu perfil.',
                    },
                    {
                        type: 'p',
                        text: 'Seu perfil pode estar gerando comissões por campanhas ou cupons mesmo sem verificação. Antes de solicitar a exclusão, recomendamos verificar saldo disponível, completar o KYC para resgatar o que for seu e confirmar que o perfil a excluir é realmente seu.',
                    },
                ],
            },
        ],
    },
    de: {
        pageTitle: 'Häufige Fragen',
        subtitle: 'DameCódigo Influencer-Programm',
        backLabel: 'Zurück zur Startseite',
        backToProfileLabel: 'Zurück zum Profil',
        ctaTitle: 'Bereit loszulegen?',
        ctaButton: 'Mein Influencer-Konto erstellen',
        myLinksTitle: 'Deine personalisierten Links',
        profileLinkLabel: 'Dein Influencer-Profil',
        storeLinkLabel: 'Dein Promotions-Shop',
        copy: 'Kopieren',
        copied: 'Kopiert',
        myStoreButton: 'Meine aktiven Coupons anzeigen',
        activeCouponsTitle: 'Ihre aktiven Coupons ansehen?',
        acceptNote: 'Mit der Registrierung akzeptierst du unsere AGB.',
        registerHere: 'Hier registrieren',
        readTerms: 'AGB lesen',
        paymentPolicyTitle: 'Vergütungsmodell',
        paymentPolicyText:
            'Es gibt keine Kampagnenbudgets und keine Bezahlung für Klicks, Aufrufe oder Content-Produktion. Provisionen gelten für verifizierte Verkäufe. Produktmuster (Samples) werden – falls vorhanden – auf der Promotionskarte angegeben.',
        pdfDealsCalloutTitle: 'Profil-PDF und verifizierbare Deals',
        pdfDealsCalloutText:
            'Nutze dein Profil-PDF, um Händler und Marken Deals vorzuschlagen. DameCódigo ist ein System nachweisbarer Verkaufszuordnung — nicht Content-Reichweite oder aufgeblähte Metriken.',
        pdfDownloadButton: 'Profil-PDF herunterladen',
        pdfOpenProfileButton: 'Zu meinem Profil',
        pdfGenericHint:
            'Lade dein PDF über dein öffentliches Profil herunter (Schaltfläche «Profil-PDF» oben). Beispiel-URL:',
        promoDownloadButton: 'Material herunterladen',
        promoPrintButton: 'Drucken',
        items: [
            {
                q: 'Wie registriere ich mich?',
                blocks: [
                    { type: 'p', text: 'Danke für dein Interesse! 😊' },
                    { type: 'p', text: 'Für die Registrierung benötigen wir deine Gmail-Adresse, um dir Folgendes zu senden:' },
                    { type: 'ul', items: ['Einladung zur Plattform', 'Zugang zur App', 'Teilnahmebedingungen des Programms'] },
                    { type: 'p', text: 'Nach der Registrierung erhältst du Zugang zu deinem Influencer-Dashboard.' },
                ],
            },
            {
                q: 'Was ist DameCódigo?',
                blocks: [
                    { type: 'p', text: 'DameCódigo ist eine Plattform, die Marken und Influencer verbindet, um über Empfehlungen, Promotionen und personalisierte Codes Verkäufe zu generieren.' },
                    { type: 'p', text: 'Als Influencer kannst du:' },
                    { type: 'ul', items: ['Dich für Markenkampagnen bewerben.', 'Promotionen mit deinem Publikum teilen.', 'Provisionen für getätigte Verkäufe verdienen.', 'Alle deine Kampagnen an einem Ort verwalten.'] },
                ],
            },
            {
                q: 'Wie funktioniert mein Influencer-Profil?',
                blocks: [
                    { type: 'p', text: 'Wir weisen dir ein personalisiertes Profil zu.' },
                    { type: 'p', text: 'Beispiel:' },
                    { type: 'code', text: PROFILE_URL },
                    { type: 'p', text: 'Dies ist dein Arbeitsprofil innerhalb der Plattform.' },
                    { type: 'p', text: 'Von dort aus kannst du:' },
                    { type: 'ul', items: ['Deine Informationen verwalten.', 'Aktive Kampagnen einsehen.', 'Kennzahlen und Ergebnisse sehen.', 'Deine Provisionen verfolgen.'] },
                ],
            },
            {
                q: 'Was ist mein Shop- bzw. Promotions-Profil?',
                blocks: [
                    { type: 'p', text: 'Du erhältst außerdem eine öffentliche Promotions-Seite.' },
                    { type: 'p', text: 'Beispiel:' },
                    { type: 'code', text: STORE_URL },
                    { type: 'p', text: 'Diesen Link kannst du platzieren in:' },
                    { type: 'ul', items: ['Instagram-Bio', 'TikTok-Bio', 'YouTube', 'Facebook', 'X (Twitter)', 'WhatsApp', 'Linktree'] },
                    { type: 'p', text: 'Deine Follower können direkt auf die Promotionen und Produkte zugreifen, die du empfiehlst.' },
                ],
            },
            {
                q: 'Kann ich mein Profil-PDF nutzen, um Deals mit Händlern und Marken zu generieren?',
                blocks: [
                    {
                        type: 'p',
                        text: 'Ja. Dein Profil-PDF ist ein verifizierbares One-Pager mit QR, Kurzcodes und technischer Profil-ID. Teile es mit Händlern, Retailern und Marken, um Deals im DameCódigo-Ökosystem vorzuschlagen.',
                    },
                    {
                        type: 'p',
                        text: 'Wichtig: Es gibt keine Bezahlung für Content, Aufrufe, Klicks oder leicht aufblähbare Metriken. Es ist Cryptomarketing mit nachweisbarer Verkaufszuordnung: Provisionen entstehen aus echten Verkäufen oder Einlösungen auf deiner influencerId.',
                    },
                    {
                        type: 'ul',
                        items: [
                            'Präsentiere dein PDF in Meetings, WhatsApp oder E-Mail mit Shop-Betreibern und Marken.',
                            'Verhandle Provisionen auf verifizierte Verkäufe, nicht Reichweite oder Videoproduktion.',
                            'Nutze deine Links und Codes auf der Plattform, damit jeder Verkauf zugeordnet bleibt.',
                        ],
                    },
                    { type: 'pdf_cta' },
                ],
            },
            {
                q: 'Kann ich mein eigener Deal Hunter sein oder der Deal Hunter anderer Creators?',
                blocks: [
                    {
                        type: 'p',
                        text: 'Ja. Bei DameCódigo gehören Influencer und Deal Hunter zum gleichen Programm nachweisbarer Verkaufszuordnung (siehe unsere AGB).',
                    },
                    {
                        type: 'p',
                        text: 'Als eigener Deal Hunter kannst du Deals mit Händlern und Marken für dein Profil suchen und abschließen — mit Profil-PDF, Codes und Links. Provisionen gelten nur für verifizierte Verkäufe oder Einlösungen, nicht für Content, Klicks oder Aufrufe.',
                    },
                    {
                        type: 'p',
                        text: 'Du kannst auch Deal Hunter für andere Content-Creator werden: ihnen helfen, Kampagnen und Markenvereinbarungen zu bekommen, als digitaler Vermittler in Zusammenarbeit mit ihnen.',
                    },
                    {
                        type: 'ul',
                        items: [
                            'Du kannst Provisionen mit einem anderen Influencer teilen, wenn ihr das schriftlich vor Kampagnenstart vereinbart.',
                            'Jeder Verkauf muss dem richtigen Profil auf der Plattform zugeordnet werden.',
                            'Aufteilung gilt nur für Provisionen auf verifizierte Conversions, nie auf aufgeblähte Metriken.',
                            'Wenn die Kampagne es vorsieht, kann die Marke die Vereinbarung auf der Bewerbungskarte abbilden.',
                        ],
                    },
                    {
                        type: 'p',
                        text: 'Um Provisionsaufteilung mit einem anderen Creator zu strukturieren, vereinbart den Deal vor der Promotion und schreibt an admin@damecodigo.com bei Fragen zur Zuordnung. Mehr Infos: damecodigo.com/comisionista-digital',
                    },
                    {
                        type: 'p',
                        text: 'Offizielles Werbematerial des Deal-Hunter-Netzwerks — herunterladen oder drucken für Social Media, WhatsApp oder Events:',
                    },
                    {
                        type: 'image',
                        src: FAQ_DEAL_HUNTERS_PROMO_IMAGE,
                        alt: 'Werde Teil unseres Deal-Hunter-Netzwerks — Link4Deal DameCódigo BizneAI',
                        promo: true,
                        downloadName: 'damecodigo-deal-hunters-promo.png',
                    },
                ],
            },
            {
                q: 'Wie verdiene ich Geld?',
                blocks: [
                    { type: 'p', text: 'Du erhältst eine Provision für jeden Verkauf, der über deine Links oder Promotionen generiert wird.' },
                    { type: 'p', text: 'Die Provisionen hängen von jeder Kampagne ab und können variieren je nach:' },
                    { type: 'ul', items: ['Marke', 'Produkt', 'Kategorie', 'Kampagnenzielen'] },
                ],
            },
            {
                q: 'Werden Budgets, Klicks, Aufrufe oder Content-Produktion bezahlt?',
                blocks: [
                    {
                        type: 'p',
                        text: 'Nein. DameCódigo vergütet nachweisbare Geschäftsergebnisse (Provisionen auf zugeordnete Verkäufe), nicht Reichweite oder kreative Deliverables allein.',
                    },
                    {
                        type: 'ul',
                        items: [
                            'Es werden keine festen Kampagnenbudgets gewährt.',
                            'Klicks, Aufrufe, Impressionen und Reichweite werden nicht bezahlt.',
                            'Produktion, Bearbeitung oder Veröffentlichung von Videos, Fotos oder anderem Content wird nicht bezahlt.',
                        ],
                    },
                    {
                        type: 'p',
                        text: 'Enthält eine Kampagne Produktmuster (Samples) für deinen Content, gibt die Marke oder der Anbieter dies auf der Promotionskarte an, bevor du dich bewirbst.',
                    },
                ],
            },
            {
                q: 'Wo sehe ich die verfügbaren Kampagnen?',
                blocks: [
                    { type: 'p', text: 'Du kannst alle aktiven Kampagnen einsehen unter:' },
                    { type: 'code', text: MARKET_URL },
                    { type: 'p', text: 'Dort findest du verfügbare Möglichkeiten, um dich zu bewerben.' },
                ],
            },
            {
                q: 'Was bedeutet es, sich für eine Promotion zu „bewerben"?',
                blocks: [
                    { type: 'p', text: 'Bewerben bedeutet, dass du die Teilnahme an einer Kampagne anfragst.' },
                    { type: 'p', text: 'Die Marke prüft dein Profil und entscheidet, ob deine Teilnahme genehmigt wird.' },
                ],
            },
            {
                q: 'Was passiert, wenn eine Promotion für mich genehmigt wird?',
                blocks: [
                    { type: 'p', text: 'Sobald genehmigt:' },
                    { type: 'ul', items: ['✅ Die Kampagne erscheint in deinem Dashboard.', '✅ Deine Promotions-Links werden generiert.', '✅ Du kannst mit der Content-Erstellung beginnen.', '✅ Du beginnst, Provisionen für gültige Verkäufe zu verdienen.'] },
                ],
            },
            {
                q: 'Muss ich Content erstellen?',
                blocks: [
                    { type: 'p', text: 'Ja.' },
                    { type: 'p', text: 'Jede Kampagne kann unterschiedliche Leistungen verlangen:' },
                    { type: 'ul', items: ['Instagram-Stories', 'Reels', 'TikToks', 'YouTube-Videos', 'Beiträge', 'Reviews', 'UGC-Content'] },
                    { type: 'p', text: 'Die Anforderungen werden innerhalb jeder Kampagne angezeigt.' },
                ],
            },
            {
                q: 'Wie viel kann ich verdienen?',
                blocks: [
                    { type: 'p', text: 'Deine Einnahmen hängen ab von:' },
                    { type: 'ul', items: ['Der Größe deines Publikums.', 'Deinem Engagement-Level.', 'Der Anzahl aktiver Kampagnen.', 'Dem Volumen der generierten Verkäufe.'] },
                    { type: 'p', text: 'Es gibt keine Verdienstgrenze.' },
                    {
                        type: 'p',
                        text: 'Provisionen kommen aus verifizierten Verkäufen auf deinem Profil, nicht aus Aufrufen oder aufgeblähten Metriken. Illustratives Beispiel bei Produkt-Monetarisierung mit DameCódigo / Link4Deal:',
                    },
                    {
                        type: 'image',
                        src: FAQ_MONETIZE_PRODUCT_IMAGE,
                        alt: 'Infografik: Produkt mit DameCódigo monetarisieren — 10 % Provision pro verifiziertem Verkauf, 80 % Influencer / 20 % Plattform, Tokens und Ertragsprognose',
                    },
                ],
            },
            {
                q: 'Brauche ich viele Follower?',
                blocks: [
                    { type: 'p', text: 'Nicht unbedingt.' },
                    { type: 'p', text: 'Wir arbeiten auch mit:' },
                    { type: 'ul', items: ['Micro-Influencern', 'Nano-Influencern', 'UGC-Creators', 'Nischen-Communities'] },
                    { type: 'p', text: 'Am wichtigsten ist die Qualität deines Publikums.' },
                ],
            },
            {
                q: 'Wann erhalte ich meine Provisionen?',
                blocks: [
                    { type: 'p', text: 'Die Provisionen werden ausgezahlt, sobald die Verkäufe von der Marke validiert wurden und die in der Kampagne festgelegten Anforderungen erfüllen.' },
                ],
            },
            {
                q: 'Ist die Registrierung kostenpflichtig?',
                blocks: [
                    { type: 'p', text: 'Nein.' },
                    { type: 'p', text: 'Die Registrierung als Influencer ist völlig kostenlos.' },
                ],
            },
            {
                q: 'Welche sozialen Netzwerke kann ich verbinden?',
                blocks: [
                    { type: 'p', text: 'Du kannst Kampagnen bewerben über:' },
                    { type: 'ul', items: ['Instagram', 'TikTok', 'YouTube', 'Facebook', 'X (Twitter)', 'Blogs', 'Websites', 'Digitale Communities'] },
                ],
            },
            {
                q: 'Kann ich mein Profil löschen, wenn ich noch nicht verifiziert bin?',
                blocks: [
                    {
                        type: 'p',
                        text: 'Ja. Wenn du die Identitätsprüfung noch nicht abgeschlossen hast und dein Profil löschen möchtest, schreibe an admin@damecodigo.com mit dem Link zu deinem Profil.',
                    },
                    {
                        type: 'p',
                        text: 'Dein Profil kann auch ohne Verifizierung Provisionen durch Kampagnen oder Coupon-Einlösungen generieren. Bevor du die Löschung anfragst, prüfe verfügbares Guthaben, schließe KYC ab, um dir zustehende Beträge zu beanspruchen, und bestätige, dass das Profil wirklich dir gehört.',
                    },
                ],
            },
        ],
    },
};

const PUBLIC_BASE = 'https://damecodigo.com';

function mapApiToPdfInput(d: Record<string, unknown>): InfluencerPdfInput {
    const followers = (d.followers || {}) as Record<string, unknown>;
    const sm = (d.socialMedia || {}) as Record<string, unknown>;
    const cs = (d.couponStats || {}) as Record<string, unknown>;
    return {
        id: String(d.id || ''),
        name: String(d.name || ''),
        username: typeof d.username === 'string' ? d.username : undefined,
        publicSlug: typeof d.publicSlug === 'string' ? d.publicSlug : undefined,
        avatar: typeof d.avatar === 'string' ? d.avatar : undefined,
        status: String(d.status || 'pending'),
        location: typeof d.location === 'string' ? d.location : undefined,
        bio: typeof d.bio === 'string' ? d.bio : undefined,
        joinDate: typeof d.joinDate === 'string' ? d.joinDate : undefined,
        totalFollowers: Number(d.totalFollowers) || 0,
        engagement: Number(d.engagement) || 0,
        followers: {
            instagram: Number(followers.instagram) || 0,
            tiktok: Number(followers.tiktok) || 0,
            youtube: Number(followers.youtube) || 0,
            twitter: Number(followers.twitter) || 0,
        },
        socialMedia: {
            instagram: typeof sm.instagram === 'string' ? sm.instagram : undefined,
            tiktok: typeof sm.tiktok === 'string' ? sm.tiktok : undefined,
            youtube: typeof sm.youtube === 'string' ? sm.youtube : undefined,
            twitter: typeof sm.twitter === 'string' ? sm.twitter : undefined,
        },
        categories: Array.isArray(d.categories) ? d.categories.map(String) : [],
        profileShortCode: typeof d.profileShortCode === 'string' ? d.profileShortCode : undefined,
        couponStats: {
            totalCoupons: Number(cs.totalCoupons) || 0,
            activeCoupons: Number(cs.activeCoupons) || 0,
            totalSales: Number(cs.totalSales) || 0,
            totalCommission: Number(cs.totalCommission) || 0,
            averageConversion: Number(cs.averageConversion) || 0,
        },
        totalEarnings: Number(d.totalEarnings) || 0,
        completedPromotions: Number(d.completedPromotions) || 0,
        activePromotions: Number(d.activePromotions) || 0,
        rating: Number(d.rating) || 0,
    };
}

function FaqPdfDownloadCallout({
    slug,
    profilePath,
    profileUrl,
    genericExampleUrl,
    labels,
    compact,
}: {
    slug: string;
    profilePath: string;
    profileUrl: string;
    genericExampleUrl: string;
    labels: Pick<FaqContent, 'pdfDownloadButton' | 'pdfOpenProfileButton' | 'pdfGenericHint' | 'copy' | 'copied'>;
    compact?: boolean;
}) {
    const [pdfLoading, setPdfLoading] = useState(false);

    const handleDownloadPdf = async () => {
        if (!slug) return;
        setPdfLoading(true);
        try {
            const result = await fetchInfluencerByPublicSlug(slug);
            if (!result.ok) throw new Error(result.message);
            await generateInfluencerProfilePdf(mapApiToPdfInput(result.data));
        } catch (e) {
            window.alert(e instanceof Error ? e.message : 'No se pudo generar el PDF');
        } finally {
            setPdfLoading(false);
        }
    };

    if (!slug) {
        return (
            <div className={`rounded-xl border border-white/10 bg-gray-950/40 ${compact ? 'p-3' : 'p-4'}`}>
                <p className="text-sm text-gray-300 leading-relaxed">{labels.pdfGenericHint}</p>
                <code className="mt-2 block text-xs font-mono text-fuchsia-200 break-all">{genericExampleUrl}</code>
            </div>
        );
    }

    return (
        <div
            className={`rounded-xl border border-fuchsia-500/25 bg-fuchsia-950/20 ${
                compact ? 'p-3' : 'p-4'
            } space-y-3`}
        >
            <CopyableUrl url={profileUrl} copyLabel={labels.copy} copiedLabel={labels.copied} />
            <div className="flex flex-col sm:flex-row gap-2">
                <button
                    type="button"
                    onClick={() => void handleDownloadPdf()}
                    disabled={pdfLoading}
                    className="inline-flex flex-1 items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-700 text-white text-sm font-medium hover:from-fuchsia-500 hover:to-purple-600 transition-all disabled:opacity-60"
                >
                    {pdfLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden />
                    ) : (
                        <FileDown className="h-4 w-4 shrink-0" aria-hidden />
                    )}
                    {pdfLoading ? 'Generando…' : labels.pdfDownloadButton}
                </button>
                <Link
                    to={profilePath}
                    className="inline-flex flex-1 items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white text-sm font-medium hover:bg-white/20 transition-all"
                >
                    {labels.pdfOpenProfileButton}
                </Link>
            </div>
        </div>
    );
}

function CopyableUrl({
    url,
    copyLabel,
    copiedLabel,
}: {
    url: string;
    copyLabel: string;
    copiedLabel: string;
}) {
    const [done, setDone] = useState(false);
    const onCopy = async () => {
        try {
            await navigator.clipboard.writeText(url);
            setDone(true);
            setTimeout(() => setDone(false), 1600);
        } catch {
            /* ignore */
        }
    };
    return (
        <div className="flex items-center gap-2 bg-gray-950/60 border border-white/10 rounded-lg px-3 py-2">
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center gap-1 text-xs sm:text-sm font-mono text-fuchsia-200 break-all hover:underline"
            >
                {url}
                <ExternalLink className="h-3 w-3 shrink-0 opacity-70" />
            </a>
            <button
                type="button"
                onClick={onCopy}
                className="shrink-0 inline-flex items-center gap-1 text-xs text-gray-300 hover:text-white"
            >
                {done ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {done ? copiedLabel : copyLabel}
            </button>
        </div>
    );
}

function FaqPromoImage({
    src,
    alt,
    downloadName,
    downloadLabel,
    printLabel,
}: {
    src: string;
    alt: string;
    downloadName: string;
    downloadLabel: string;
    printLabel: string;
}) {
    const handleDownload = async () => {
        try {
            const response = await fetch(src);
            const blob = await response.blob();
            const objectUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = objectUrl;
            link.download = downloadName;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(objectUrl);
        } catch {
            const link = document.createElement('a');
            link.href = src;
            link.download = downloadName;
            link.click();
        }
    };

    const handlePrint = () => {
        const absoluteSrc = src.startsWith('http') ? src : `${window.location.origin}${src}`;
        const printWindow = window.open('', '_blank', 'noopener,noreferrer');
        if (!printWindow) return;

        printWindow.document.write(`<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>${alt.replace(/"/g, '&quot;')}</title>
<style>
  @page { margin: 0; }
  html, body { margin: 0; padding: 0; width: 100%; height: 100%; }
  body { display: flex; align-items: center; justify-content: center; background: #fff; }
  img { display: block; max-width: 100%; max-height: 100vh; width: auto; height: auto; }
</style>
</head>
<body>
<img src="${absoluteSrc}" alt="${alt.replace(/"/g, '&quot;')}" />
<script>
  window.onload = function () {
    window.focus();
    window.print();
    window.onafterprint = function () { window.close(); };
  };
</script>
</body>
</html>`);
        printWindow.document.close();
    };

    return (
        <figure className="rounded-xl overflow-hidden border border-white/10 bg-black/20">
            <img
                src={src}
                alt={alt}
                className="w-full h-auto object-contain"
                loading="lazy"
                decoding="async"
            />
            <figcaption className="flex flex-wrap gap-2 p-3 bg-gray-950/50 border-t border-white/10">
                <button
                    type="button"
                    onClick={() => void handleDownload()}
                    className="inline-flex items-center gap-2 rounded-lg border border-fuchsia-500/40 bg-fuchsia-950/40 px-3 py-2 text-sm font-medium text-fuchsia-100 hover:bg-fuchsia-900/50 transition-colors"
                >
                    <Download className="h-4 w-4 shrink-0" aria-hidden />
                    {downloadLabel}
                </button>
                <button
                    type="button"
                    onClick={handlePrint}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium text-gray-200 hover:bg-white/10 transition-colors"
                >
                    <Printer className="h-4 w-4 shrink-0" aria-hidden />
                    {printLabel}
                </button>
            </figcaption>
        </figure>
    );
}

function FaqAnswer({
    blocks,
    username,
    copyLabel,
    copiedLabel,
    profilePath,
    profileUrl,
    pdfLabels,
    promoLabels,
}: {
    blocks: Block[];
    username: string;
    copyLabel: string;
    copiedLabel: string;
    profilePath: string;
    profileUrl: string;
    pdfLabels: Pick<FaqContent, 'pdfDownloadButton' | 'pdfOpenProfileButton' | 'pdfGenericHint' | 'copy' | 'copied'>;
    promoLabels: Pick<FaqContent, 'promoDownloadButton' | 'promoPrintButton'>;
}) {
    const genericExampleUrl = username
        ? PROFILE_URL.replace('TUUSUARIO', username)
        : PROFILE_URL;

    return (
        <div className="space-y-3 text-gray-300">
            {blocks.map((block, i) => {
                if (block.type === 'pdf_cta') {
                    return (
                        <FaqPdfDownloadCallout
                            key={i}
                            slug={username}
                            profilePath={profilePath}
                            profileUrl={profileUrl}
                            genericExampleUrl={genericExampleUrl}
                            labels={pdfLabels}
                            compact
                        />
                    );
                }
                if (block.type === 'p') {
                    return (
                        <p key={i} className="text-sm leading-relaxed">
                            {block.text}
                        </p>
                    );
                }
                if (block.type === 'code') {
                    const text = username ? block.text.replace('TUUSUARIO', username) : block.text;
                    const isUrl = /^https?:\/\//.test(text);
                    if (isUrl) {
                        return <CopyableUrl key={i} url={text} copyLabel={copyLabel} copiedLabel={copiedLabel} />;
                    }
                    return (
                        <code
                            key={i}
                            className="block text-xs sm:text-sm font-mono text-fuchsia-200 bg-gray-950/60 border border-white/10 rounded-lg px-3 py-2 break-all"
                        >
                            {text}
                        </code>
                    );
                }
                if (block.type === 'image') {
                    if (block.promo) {
                        return (
                            <FaqPromoImage
                                key={i}
                                src={block.src}
                                alt={block.alt}
                                downloadName={block.downloadName || 'damecodigo-promo.png'}
                                downloadLabel={promoLabels.promoDownloadButton}
                                printLabel={promoLabels.promoPrintButton}
                            />
                        );
                    }
                    return (
                        <figure key={i} className="rounded-xl overflow-hidden border border-white/10 bg-black/20">
                            <img
                                src={block.src}
                                alt={block.alt}
                                className="w-full h-auto object-contain"
                                loading="lazy"
                                decoding="async"
                            />
                        </figure>
                    );
                }
                return (
                    <ul key={i} className="space-y-1.5 pl-1">
                        {block.items.map((it, j) => (
                            <li key={j} className="flex items-start gap-2 text-sm leading-relaxed">
                                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-fuchsia-400/70 shrink-0" />
                                <span>{it}</span>
                            </li>
                        ))}
                    </ul>
                );
            })}
        </div>
    );
}

export default function FaqPage() {
    const params = useParams<{ influencerSlug?: string }>();
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const { isAuthenticated, hasRole } = useAuth();
    const [lang, setLang] = useState<Lang>('es');
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const isGenericFaqRoute = location.pathname === '/faq';
    const rawSlug = (params.influencerSlug || searchParams.get('u') || '').trim();
    const [resolvedSlug, setResolvedSlug] = useState(rawSlug);
    const [authSlug, setAuthSlug] = useState('');

    useEffect(() => {
        if (!isGenericFaqRoute || rawSlug || !isAuthenticated || !hasRole('influencer')) {
            setAuthSlug('');
            return;
        }
        const token = localStorage.getItem('auth_token');
        if (!token) return;

        let cancelled = false;
        (async () => {
            try {
                const res = await fetch(apiUrl('/api/influencers/me'), {
                    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
                });
                const body = await res.json().catch(() => ({}));
                if (cancelled || !res.ok || !body?.data) return;
                const d = body.data as Record<string, unknown>;
                const canonical = resolveCanonicalPublicSlug({
                    id: String(d.id || ''),
                    name: typeof d.name === 'string' ? d.name : '',
                    username: typeof d.username === 'string' ? d.username : '',
                    publicSlug: typeof d.publicSlug === 'string' ? d.publicSlug : '',
                    socialMedia: d.socialMedia as
                        | { instagram?: string; tiktok?: string; youtube?: string; twitter?: string }
                        | undefined,
                });
                if (canonical) setAuthSlug(canonical);
            } catch {
                /* ignore */
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [isGenericFaqRoute, rawSlug, isAuthenticated, hasRole]);

    useEffect(() => {
        const slugToResolve = rawSlug || authSlug;
        if (!slugToResolve) {
            setResolvedSlug('');
            return;
        }
        let cancelled = false;
        setResolvedSlug(slugToResolve);
        (async () => {
            const result = await fetchInfluencerByPublicSlug(slugToResolve);
            if (cancelled || !result.ok) return;
            const d = result.data;
            const canonical = resolveCanonicalPublicSlug({
                id: String(d.id || ''),
                name: typeof d.name === 'string' ? d.name : '',
                username: typeof d.username === 'string' ? d.username : '',
                publicSlug: typeof d.publicSlug === 'string' ? d.publicSlug : '',
                socialMedia: d.socialMedia as
                    | { instagram?: string; tiktok?: string; youtube?: string; twitter?: string }
                    | undefined,
            });
            if (canonical) setResolvedSlug(canonical);
        })();
        return () => {
            cancelled = true;
        };
    }, [rawSlug, authSlug]);

    const slug = resolvedSlug || rawSlug || authSlug;
    const profilePath = slug ? `/influencer/${encodeURIComponent(slug)}` : '';
    const storePath = slug ? `${profilePath}/tienda` : '';
    const influencerFaqPath = slug ? `${profilePath}/faq` : '';
    const profileUrl = slug ? `${PUBLIC_BASE}${profilePath}` : '';
    const storeUrl = slug ? `${PUBLIC_BASE}${storePath}` : '';

    if (isGenericFaqRoute && influencerFaqPath) {
        return <Navigate to={influencerFaqPath} replace />;
    }

    const content = FAQ[lang];

    useEffect(() => {
        document.title = `${content.pageTitle} · DameCódigo`;
    }, [content.pageTitle]);

    const toggle = (i: number) => setOpenIndex((prev) => (prev === i ? null : i));

    const jsonLd = useMemo(
        () =>
            JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'FAQPage',
                inLanguage: lang,
                mainEntity: content.items.map((item) => ({
                    '@type': 'Question',
                    name: item.q,
                    acceptedAnswer: {
                        '@type': 'Answer',
                        text: item.blocks
                            .map((b) => {
                                if (b.type === 'ul') return b.items.join(' ');
                                if (b.type === 'pdf_cta' || b.type === 'image') return b.type === 'image' ? b.alt : '';
                                return b.text;
                            })
                            .filter(Boolean)
                            .join(' '),
                    },
                })),
            }),
        [content.items, lang],
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950 text-gray-100">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />

            <div className="border-b border-white/10 bg-gray-900/50 backdrop-blur-sm">
                <div className="max-w-3xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                        <Link
                            to={profilePath || '/'}
                            className="inline-flex items-center gap-2 text-gray-400 hover:text-fuchsia-200 transition-colors text-sm"
                        >
                            <ArrowLeft className="h-5 w-5" />
                            <span className="hidden sm:inline">
                                {profilePath ? content.backToProfileLabel : content.backLabel}
                            </span>
                        </Link>
                        <div className="flex items-center gap-1.5 text-gray-500">
                            <Globe className="h-4 w-4" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 py-8">
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-fuchsia-500/15 ring-1 ring-fuchsia-500/30 mb-4">
                        <HelpCircle className="h-6 w-6 text-fuchsia-300" />
                    </div>
                    <h1 className="text-3xl font-bold text-white">{content.pageTitle}</h1>
                    <p className="text-sm text-gray-400 mt-1">{content.subtitle}</p>
                </div>

                {/* Política de remuneración (homologada con términos y FAQ por influencer) */}
                <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-950/25 p-4">
                    <p className="text-sm font-semibold text-amber-100 mb-1.5">{content.paymentPolicyTitle}</p>
                    <p className="text-sm text-amber-100/90 leading-relaxed">{content.paymentPolicyText}</p>
                </div>

                {/* Ficha PDF + Deals verificables */}
                <div className="mb-6 rounded-2xl border border-sky-500/30 bg-sky-950/20 p-4">
                    <div className="flex items-start gap-3 mb-3">
                        <Handshake className="h-5 w-5 text-sky-300 shrink-0 mt-0.5" aria-hidden />
                        <div>
                            <p className="text-sm font-semibold text-sky-100">{content.pdfDealsCalloutTitle}</p>
                            <p className="text-sm text-sky-100/90 leading-relaxed mt-1">{content.pdfDealsCalloutText}</p>
                        </div>
                    </div>
                    <FaqPdfDownloadCallout
                        slug={slug}
                        profilePath={profilePath}
                        profileUrl={profileUrl}
                        genericExampleUrl={PROFILE_URL}
                        labels={{
                            pdfDownloadButton: content.pdfDownloadButton,
                            pdfOpenProfileButton: content.pdfOpenProfileButton,
                            pdfGenericHint: content.pdfGenericHint,
                            copy: content.copy,
                            copied: content.copied,
                        }}
                    />
                </div>

                {/* Banner inicial: registro + términos y condiciones */}
                <div className="mb-6 rounded-2xl border border-fuchsia-500/30 bg-gradient-to-r from-fuchsia-950/40 via-purple-950/30 to-gray-900/60 p-5">
                    <p className="text-sm text-gray-200 mb-3 text-center">{content.acceptNote}</p>
                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                        <a
                            href="https://www.damecodigo.com/influencer/auth"
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-700 text-white font-medium hover:from-fuchsia-500 hover:to-purple-600 transition-all shadow-lg shadow-fuchsia-900/30"
                        >
                            <UserPlus className="h-4 w-4" />
                            {content.registerHere}
                        </a>
                        <Link
                            to="/terminos"
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white font-medium hover:bg-white/20 transition-all"
                        >
                            <FileText className="h-4 w-4" />
                            {content.readTerms}
                        </Link>
                    </div>
                </div>

                {/* Selector de idioma */}
                <div className="flex flex-wrap justify-center gap-2 mb-8">
                    {LANGUAGES.map((l) => (
                        <button
                            key={l.code}
                            type="button"
                            onClick={() => { setLang(l.code); setOpenIndex(0); }}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                                lang === l.code
                                    ? 'bg-fuchsia-600 text-white border-fuchsia-400/40'
                                    : 'bg-gray-900/60 text-gray-300 border-white/10 hover:bg-gray-800/60'
                            }`}
                        >
                            {l.label}
                        </button>
                    ))}
                </div>

                {/* Enlaces personalizados del influencer */}
                {slug && (
                    <div className="mb-8 rounded-2xl border border-fuchsia-500/30 bg-fuchsia-950/20 p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <LinkIcon className="h-5 w-5 text-fuchsia-300" />
                            <h2 className="text-base font-semibold text-white">
                                {content.myLinksTitle} · @{slug}
                            </h2>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <p className="text-xs text-gray-400 mb-1.5">{content.profileLinkLabel}</p>
                                <CopyableUrl url={profileUrl} copyLabel={content.copy} copiedLabel={content.copied} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 mb-1.5">{content.storeLinkLabel}</p>
                                <CopyableUrl url={storeUrl} copyLabel={content.copy} copiedLabel={content.copied} />
                            </div>
                            {storePath ? (
                                <Link
                                    to={storePath}
                                    className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-700 text-white font-medium hover:from-fuchsia-500 hover:to-purple-600 transition-all shadow-lg shadow-fuchsia-900/30"
                                >
                                    <Ticket className="h-4 w-4 shrink-0" aria-hidden />
                                    {content.myStoreButton}
                                </Link>
                            ) : null}
                        </div>
                    </div>
                )}

                {/* Acordeón */}
                <div className="space-y-3">
                    {content.items.map((item, i) => {
                        const isOpen = openIndex === i;
                        return (
                            <div
                                key={i}
                                className="rounded-2xl border border-white/10 bg-gray-900/60 backdrop-blur-sm overflow-hidden"
                            >
                                <button
                                    type="button"
                                    onClick={() => toggle(i)}
                                    className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-white/5 transition-colors"
                                    aria-expanded={isOpen}
                                >
                                    <span className="flex items-start gap-3 min-w-0">
                                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-fuchsia-500/20 text-fuchsia-200 text-xs font-bold shrink-0 ring-1 ring-fuchsia-500/30">
                                            {i + 1}
                                        </span>
                                        <span className="font-medium text-white">{item.q}</span>
                                    </span>
                                    <ChevronDown
                                        className={`h-5 w-5 text-gray-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                                    />
                                </button>
                                {isOpen && (
                                    <div className="px-5 pb-5 pt-1 pl-14">
                                        <FaqAnswer
                                            blocks={item.blocks}
                                            username={slug}
                                            copyLabel={content.copy}
                                            copiedLabel={content.copied}
                                            profilePath={profilePath}
                                            profileUrl={profileUrl}
                                            pdfLabels={{
                                                pdfDownloadButton: content.pdfDownloadButton,
                                                pdfOpenProfileButton: content.pdfOpenProfileButton,
                                                pdfGenericHint: content.pdfGenericHint,
                                                copy: content.copy,
                                                copied: content.copied,
                                            }}
                                            promoLabels={{
                                                promoDownloadButton: content.promoDownloadButton,
                                                promoPrintButton: content.promoPrintButton,
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* CTA */}
                <div className="mt-10 rounded-2xl border border-fuchsia-500/30 bg-gradient-to-r from-fuchsia-950/40 via-purple-950/30 to-gray-900/60 p-6 text-center">
                    <Sparkles className="h-6 w-6 text-fuchsia-300 mx-auto mb-2" />
                    <h2 className="text-lg font-semibold text-white mb-3">
                        {storePath ? content.activeCouponsTitle : content.ctaTitle}
                    </h2>
                    <Link
                        to={storePath || '/influencer/auth'}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-700 text-white font-medium hover:from-fuchsia-500 hover:to-purple-600 transition-all shadow-lg shadow-fuchsia-900/30"
                    >
                        {storePath ? (
                            <>
                                <Ticket className="h-4 w-4 shrink-0" aria-hidden />
                                {content.myStoreButton}
                            </>
                        ) : (
                            content.ctaButton
                        )}
                    </Link>
                </div>
            </div>
        </div>
    );
}
