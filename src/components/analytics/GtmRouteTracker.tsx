import { useEffect } from 'react';
import { captureEntryAttribution } from '../../utils/googleTagManager';

/** Captura landing/UTM al iniciar la sesión (page views en InfluencerAttributionTracker). */
export default function GtmRouteTracker() {
    useEffect(() => {
        captureEntryAttribution();
    }, []);

    return null;
}
