import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { trackClarityPageView } from '../../utils/microsoftClarity';
import { trackVirtualPageView } from '../../utils/googleTagManager';
import { recordAttributedPageView } from '../../utils/influencerTrafficAttribution';

/**
 * Registra page views SPA (GTM) y visitas atribuidas al influencer de entrada.
 */
export default function InfluencerAttributionTracker() {
    const { pathname, search, hash } = useLocation();
    const lastKey = useRef('');

    useEffect(() => {
        const key = `${pathname}${search}${hash}`;
        if (lastKey.current === key) return;
        lastKey.current = key;

        trackVirtualPageView(pathname, search, hash);
        trackClarityPageView(pathname, search, hash);
        void recordAttributedPageView(pathname, search, hash);
    }, [pathname, search, hash]);

    return null;
}
