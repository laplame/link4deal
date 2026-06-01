import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
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
} from 'lucide-react';

type Lang = 'es' | 'en' | 'fr' | 'pt' | 'de';

type Block =
    | { type: 'p'; text: string }
    | { type: 'ul'; items: string[] }
    | { type: 'code'; text: string };

interface FaqItem {
    q: string;
    blocks: Block[];
}

interface FaqContent {
    pageTitle: string;
    subtitle: string;
    backLabel: string;
    ctaTitle: string;
    ctaButton: string;
    myLinksTitle: string;
    profileLinkLabel: string;
    storeLinkLabel: string;
    copy: string;
    copied: string;
    myStoreButton: string;
    acceptNote: string;
    registerHere: string;
    readTerms: string;
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

const FAQ: Record<Lang, FaqContent> = {
    es: {
        pageTitle: 'Preguntas frecuentes',
        subtitle: 'Programa de Influencers · DameCódigo',
        backLabel: 'Volver al inicio',
        ctaTitle: '¿Listo para empezar?',
        ctaButton: 'Crear mi cuenta de influencer',
        myLinksTitle: 'Tus enlaces personalizados',
        profileLinkLabel: 'Tu perfil de influencer',
        storeLinkLabel: 'Tu tienda de promociones',
        copy: 'Copiar',
        copied: 'Copiado',
        myStoreButton: 'Ir a mi tienda',
        acceptNote: 'Al registrarte aceptas nuestros Términos y Condiciones.',
        registerHere: 'Regístrate aquí',
        readTerms: 'Leer Términos y Condiciones',
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
                q: '¿Cómo gano dinero?',
                blocks: [
                    { type: 'p', text: 'Obtienes una comisión por cada venta generada desde tus enlaces o promociones.' },
                    { type: 'p', text: 'Las comisiones dependen de cada campaña y pueden variar según:' },
                    { type: 'ul', items: ['Marca', 'Producto', 'Categoría', 'Objetivos de la campaña'] },
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
        ],
    },
    en: {
        pageTitle: 'Frequently Asked Questions',
        subtitle: 'DameCódigo Influencer Program',
        backLabel: 'Back to home',
        ctaTitle: 'Ready to start?',
        ctaButton: 'Create my influencer account',
        myLinksTitle: 'Your personalized links',
        profileLinkLabel: 'Your influencer profile',
        storeLinkLabel: 'Your promotions store',
        copy: 'Copy',
        copied: 'Copied',
        myStoreButton: 'Go to my store',
        acceptNote: 'By registering you accept our Terms and Conditions.',
        registerHere: 'Register here',
        readTerms: 'Read Terms and Conditions',
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
                q: 'How do I earn money?',
                blocks: [
                    { type: 'p', text: 'You earn a commission for every sale generated from your links or promotions.' },
                    { type: 'p', text: 'Commissions depend on each campaign and may vary based on:' },
                    { type: 'ul', items: ['Brand', 'Product', 'Category', 'Campaign goals'] },
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
        ],
    },
    fr: {
        pageTitle: 'Questions fréquentes',
        subtitle: "Programme d'influenceurs · DameCódigo",
        backLabel: "Retour à l'accueil",
        ctaTitle: 'Prêt à commencer ?',
        ctaButton: 'Créer mon compte influenceur',
        myLinksTitle: 'Vos liens personnalisés',
        profileLinkLabel: "Votre profil d'influenceur",
        storeLinkLabel: 'Votre boutique de promotions',
        copy: 'Copier',
        copied: 'Copié',
        myStoreButton: 'Aller à ma boutique',
        acceptNote: 'En vous inscrivant, vous acceptez nos Conditions Générales.',
        registerHere: 'Inscrivez-vous ici',
        readTerms: 'Lire les Conditions Générales',
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
                q: "Comment puis-je gagner de l'argent ?",
                blocks: [
                    { type: 'p', text: 'Vous touchez une commission pour chaque vente générée depuis vos liens ou promotions.' },
                    { type: 'p', text: 'Les commissions dépendent de chaque campagne et peuvent varier selon :' },
                    { type: 'ul', items: ['La marque', 'Le produit', 'La catégorie', 'Les objectifs de la campagne'] },
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
        ],
    },
    pt: {
        pageTitle: 'Perguntas frequentes',
        subtitle: 'Programa de Influenciadores · DameCódigo',
        backLabel: 'Voltar ao início',
        ctaTitle: 'Pronto para começar?',
        ctaButton: 'Criar minha conta de influenciador',
        myLinksTitle: 'Seus links personalizados',
        profileLinkLabel: 'Seu perfil de influenciador',
        storeLinkLabel: 'Sua loja de promoções',
        copy: 'Copiar',
        copied: 'Copiado',
        myStoreButton: 'Ir para minha loja',
        acceptNote: 'Ao se cadastrar, você aceita nossos Termos e Condições.',
        registerHere: 'Cadastre-se aqui',
        readTerms: 'Ler Termos e Condições',
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
                q: 'Como ganho dinheiro?',
                blocks: [
                    { type: 'p', text: 'Você recebe uma comissão por cada venda gerada a partir dos seus links ou promoções.' },
                    { type: 'p', text: 'As comissões dependem de cada campanha e podem variar de acordo com:' },
                    { type: 'ul', items: ['Marca', 'Produto', 'Categoria', 'Objetivos da campanha'] },
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
        ],
    },
    de: {
        pageTitle: 'Häufige Fragen',
        subtitle: 'DameCódigo Influencer-Programm',
        backLabel: 'Zurück zur Startseite',
        ctaTitle: 'Bereit loszulegen?',
        ctaButton: 'Mein Influencer-Konto erstellen',
        myLinksTitle: 'Deine personalisierten Links',
        profileLinkLabel: 'Dein Influencer-Profil',
        storeLinkLabel: 'Dein Promotions-Shop',
        copy: 'Kopieren',
        copied: 'Kopiert',
        myStoreButton: 'Zu meinem Shop',
        acceptNote: 'Mit der Registrierung akzeptierst du unsere AGB.',
        registerHere: 'Hier registrieren',
        readTerms: 'AGB lesen',
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
                q: 'Wie verdiene ich Geld?',
                blocks: [
                    { type: 'p', text: 'Du erhältst eine Provision für jeden Verkauf, der über deine Links oder Promotionen generiert wird.' },
                    { type: 'p', text: 'Die Provisionen hängen von jeder Kampagne ab und können variieren je nach:' },
                    { type: 'ul', items: ['Marke', 'Produkt', 'Kategorie', 'Kampagnenzielen'] },
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
        ],
    },
};

const PUBLIC_BASE = 'https://damecodigo.com';

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

function FaqAnswer({
    blocks,
    username,
    copyLabel,
    copiedLabel,
}: {
    blocks: Block[];
    username: string;
    copyLabel: string;
    copiedLabel: string;
}) {
    return (
        <div className="space-y-3 text-gray-300">
            {blocks.map((block, i) => {
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
    const [lang, setLang] = useState<Lang>('es');
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const username = (params.influencerSlug || searchParams.get('u') || '').trim();
    const profileUrl = username ? `${PUBLIC_BASE}/influencer/${encodeURIComponent(username)}` : '';
    const storeUrl = username ? `${PUBLIC_BASE}/influencer/${encodeURIComponent(username)}/tienda` : '';

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
                            .map((b) => (b.type === 'ul' ? b.items.join(' ') : b.text))
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
                        <Link to="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-fuchsia-200 transition-colors text-sm">
                            <ArrowLeft className="h-5 w-5" />
                            <span className="hidden sm:inline">{content.backLabel}</span>
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
                {username && (
                    <div className="mb-8 rounded-2xl border border-fuchsia-500/30 bg-fuchsia-950/20 p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <LinkIcon className="h-5 w-5 text-fuchsia-300" />
                            <h2 className="text-base font-semibold text-white">
                                {content.myLinksTitle} · @{username}
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
                                            username={username}
                                            copyLabel={content.copy}
                                            copiedLabel={content.copied}
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
                    <h2 className="text-lg font-semibold text-white mb-3">{content.ctaTitle}</h2>
                    <Link
                        to={username ? `/influencer/${encodeURIComponent(username)}/tienda` : '/influencer/auth'}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-700 text-white font-medium hover:from-fuchsia-500 hover:to-purple-600 transition-all shadow-lg shadow-fuchsia-900/30"
                    >
                        {username ? content.myStoreButton : content.ctaButton}
                    </Link>
                </div>
            </div>
        </div>
    );
}
