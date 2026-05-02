import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Navigation, Zap, Clock, Eye, Flame, Target } from 'lucide-react';
import { formatPrice } from '../utils/formatters';
import { getPromotionImageUrl } from '../utils/promotionImage';
import { loadGoogleMapsApi } from '../utils/googleMapsLoader';

type Hotness = 'fire' | 'hot' | 'warm';

interface MapOfferPoint {
    key: string;
    promotionId: string;
    title: string;
    lat: number;
    lng: number;
    image: string;
    price: number;
    originalPrice: number;
    currency: string;
    discount: number;
    storeLabel: string;
    timeLeftLabel?: string;
    hotness: Hotness;
}

function discountToHotness(discount: number): Hotness {
    if (discount >= 35) return 'fire';
    if (discount >= 20) return 'hot';
    return 'warm';
}

function buildMapPointsFromPromo(promo: Record<string, unknown>): MapOfferPoint[] {
    const promotionId = String(promo.id || promo._id || '');
    if (!promotionId) return [];

    const title = String(promo.title || promo.productName || 'Promoción');
    const rawImages = promo.images as Parameters<typeof getPromotionImageUrl>[0];
    const image = getPromotionImageUrl(rawImages);
    const currentPrice = Number(promo.currentPrice) || 0;
    const originalPrice = Number(promo.originalPrice) || 0;
    const currency = String(promo.currency || 'USD');
    const discount =
        Number(promo.discountPercentage) ||
        (originalPrice > 0 ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : 0);
    const timeLeftLabel = typeof promo.timeLeftLabel === 'string' ? promo.timeLeftLabel : undefined;
    const hotness = discountToHotness(discount);

    const out: MapOfferPoint[] = [];

    const chain = promo.chainLocations as
        | Array<{
              branchName?: string;
              address?: string;
              coordinates?: { latitude?: number; longitude?: number };
          }>
        | undefined;

    if (Array.isArray(chain) && chain.length > 0) {
        chain.forEach((b, i) => {
            const lat = b.coordinates?.latitude;
            const lng = b.coordinates?.longitude;
            if (
                typeof lat !== 'number' ||
                typeof lng !== 'number' ||
                !Number.isFinite(lat) ||
                !Number.isFinite(lng)
            ) {
                return;
            }
            out.push({
                key: `${promotionId}-b${i}`,
                promotionId,
                title,
                lat,
                lng,
                image,
                price: currentPrice,
                originalPrice,
                currency,
                discount,
                storeLabel: b.branchName || b.address || `Sucursal ${i + 1}`,
                timeLeftLabel,
                hotness,
            });
        });
        return out;
    }

    const nearest = promo.nearestChainLocation as
        | {
              branchName?: string;
              address?: string;
              coordinates?: { latitude?: number; longitude?: number };
          }
        | undefined;
    if (
        nearest?.coordinates &&
        typeof nearest.coordinates.latitude === 'number' &&
        typeof nearest.coordinates.longitude === 'number'
    ) {
        out.push({
            key: `${promotionId}-nearest`,
            promotionId,
            title,
            lat: nearest.coordinates.latitude,
            lng: nearest.coordinates.longitude,
            image,
            price: currentPrice,
            originalPrice,
            currency,
            discount,
            storeLabel: nearest.branchName || nearest.address || 'Sucursal cercana',
            timeLeftLabel,
            hotness,
        });
        return out;
    }

    const sl = promo.storeLocation as
        | { coordinates?: { latitude?: number; longitude?: number }; address?: string; city?: string }
        | undefined;
    if (
        sl?.coordinates &&
        typeof sl.coordinates.latitude === 'number' &&
        typeof sl.coordinates.longitude === 'number'
    ) {
        out.push({
            key: promotionId,
            promotionId,
            title,
            lat: sl.coordinates.latitude,
            lng: sl.coordinates.longitude,
            image,
            price: currentPrice,
            originalPrice,
            currency,
            discount,
            storeLabel: String(promo.storeName || sl.city || sl.address || 'Tienda'),
            timeLeftLabel,
            hotness,
        });
        return out;
    }

    let plat: number | string | undefined = promo.storeLatitude as number | string | undefined;
    let plng: number | string | undefined = promo.storeLongitude as number | string | undefined;
    const la = typeof plat === 'string' ? parseFloat(plat) : plat;
    const lo = typeof plng === 'string' ? parseFloat(plng) : plng;
    if (typeof la === 'number' && typeof lo === 'number' && Number.isFinite(la) && Number.isFinite(lo)) {
        out.push({
            key: promotionId,
            promotionId,
            title,
            lat: la,
            lng: lo,
            image,
            price: currentPrice,
            originalPrice,
            currency,
            discount,
            storeLabel: String(promo.storeName || promo.storeCity || 'Ubicación'),
            timeLeftLabel,
            hotness,
        });
    }

    return out;
}

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/** Agrupa puntos por promoción (lista / tarjeta única por oferta). */
function firstPointPerPromotion(points: MapOfferPoint[]): MapOfferPoint[] {
    const seen = new Set<string>();
    const list: MapOfferPoint[] = [];
    for (const p of points) {
        if (seen.has(p.promotionId)) continue;
        seen.add(p.promotionId);
        list.push(p);
    }
    return list;
}

const GOOGLE_MAPS_KEY = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '').trim();

const OffersMap: React.FC = () => {
    const [docs, setDocs] = useState<Record<string, unknown>[]>([]);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [isGettingLocation, setIsGettingLocation] = useState(false);
    const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
    const [selectedPoint, setSelectedPoint] = useState<MapOfferPoint | null>(null);
    const [mapInitError, setMapInitError] = useState<string | null>(null);

    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<google.maps.Map | null>(null);
    const markersRef = useRef<google.maps.Marker[]>([]);

    const fetchPromos = useCallback(async (coords: { lat: number; lng: number } | null) => {
        setLoading(true);
        setLoadError(null);
        try {
            const qs = new URLSearchParams({ limit: '80', page: '1' });
            if (coords) {
                qs.set('userLat', String(coords.lat));
                qs.set('userLng', String(coords.lng));
            }
            const res = await fetch(`/api/promotions/active?${qs}`);
            const text = await res.text();
            let data: { success?: boolean; data?: { docs?: unknown[] }; message?: string };
            try {
                data = text ? JSON.parse(text) : {};
            } catch {
                throw new Error('Respuesta no válida del servidor');
            }
            if (!res.ok) {
                throw new Error(data.message || `Error ${res.status}`);
            }
            const rawDocs = Array.isArray(data?.data?.docs) ? data.data.docs : [];
            setDocs(rawDocs as Record<string, unknown>[]);
        } catch (e) {
            setDocs([]);
            setLoadError(e instanceof Error ? e.message : 'No se pudieron cargar las promociones');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPromos(
            userLocation ? { lat: userLocation.latitude, lng: userLocation.longitude } : null
        );
    }, [fetchPromos, userLocation?.latitude, userLocation?.longitude]);

    const mapPoints = useMemo(() => {
        const all: MapOfferPoint[] = [];
        for (const d of docs) {
            all.push(...buildMapPointsFromPromo(d));
        }
        return all;
    }, [docs]);

    const pointsWithDistance = useMemo(() => {
        if (!userLocation) return mapPoints.map((p) => ({ ...p, distance: undefined as number | undefined }));
        return mapPoints
            .map((p) => ({
                ...p,
                distance: haversineMeters(userLocation.latitude, userLocation.longitude, p.lat, p.lng),
            }))
            .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
    }, [mapPoints, userLocation]);

    const listOffers = useMemo(() => firstPointPerPromotion(pointsWithDistance), [pointsWithDistance]);

    const getUserLocation = async () => {
        if (isGettingLocation) return;
        setIsGettingLocation(true);
        try {
            if (!navigator.geolocation) {
                setIsGettingLocation(false);
                return;
            }
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    });
                    setIsGettingLocation(false);
                },
                () => {
                    setIsGettingLocation(false);
                },
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 60_000 }
            );
        } catch {
            setIsGettingLocation(false);
        }
    };

    const getHotnessColor = (hotness: Hotness) => {
        switch (hotness) {
            case 'fire':
                return 'from-red-500 to-orange-500';
            case 'hot':
                return 'from-orange-500 to-yellow-500';
            case 'warm':
                return 'from-yellow-500 to-green-500';
        }
    };

    const getHotnessIcon = (hotness: Hotness) => {
        switch (hotness) {
            case 'fire':
                return <Flame className="h-4 w-4" />;
            case 'hot':
                return <Zap className="h-4 w-4" />;
            case 'warm':
                return <Target className="h-4 w-4" />;
        }
    };

    /** Mapa real de Google */
    useEffect(() => {
        if (viewMode !== 'map' || !GOOGLE_MAPS_KEY || mapPoints.length === 0 || loading) {
            return undefined;
        }

        const el = mapContainerRef.current;
        if (!el) {
            return undefined;
        }

        let cancelled = false;

        void (async () => {
            setMapInitError(null);
            try {
                await loadGoogleMapsApi(GOOGLE_MAPS_KEY);
            } catch (e) {
                if (!cancelled) {
                    setMapInitError(e instanceof Error ? e.message : 'Error al cargar Google Maps');
                }
                return;
            }
            if (cancelled || !mapContainerRef.current) return;

            markersRef.current.forEach((m) => m.setMap(null));
            markersRef.current = [];

            const map = new google.maps.Map(mapContainerRef.current, {
                mapTypeControl: true,
                streetViewControl: false,
                fullscreenControl: true,
            });
            mapRef.current = map;

            const bounds = new google.maps.LatLngBounds();
            const infoWindow = new google.maps.InfoWindow();

            for (const p of mapPoints) {
                const marker = new google.maps.Marker({
                    position: { lat: p.lat, lng: p.lng },
                    map,
                    title: p.title,
                });
                marker.addListener('click', () => {
                    setSelectedPoint(p);
                    infoWindow.setContent(
                        `<div style="max-width:240px;font-family:system-ui,sans-serif;padding:4px">
              <strong style="font-size:14px">${escapeHtml(p.title)}</strong><br/>
              <span style="font-size:13px;color:#444">${escapeHtml(p.storeLabel)}</span><br/>
              ${p.discount > 0 ? `<span style="color:#b91c1c;font-weight:700">-${p.discount}%</span> ` : ''}
              <a href="/promotion-details/${encodeURIComponent(p.promotionId)}" style="display:inline-block;margin-top:6px;color:#7c3aed;font-weight:600">Ver oferta</a>
            </div>`
                    );
                    infoWindow.open({ map, anchor: marker });
                });
                markersRef.current.push(marker);
                bounds.extend({ lat: p.lat, lng: p.lng });
            }

            if (userLocation) {
                bounds.extend({ lat: userLocation.latitude, lng: userLocation.longitude });
                new google.maps.Marker({
                    position: { lat: userLocation.latitude, lng: userLocation.longitude },
                    map,
                    title: 'Tu ubicación',
                    icon: {
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: 8,
                        fillColor: '#2563eb',
                        fillOpacity: 1,
                        strokeWeight: 2,
                        strokeColor: '#ffffff',
                    },
                });
            }

            map.fitBounds(bounds, 56);
            google.maps.event.addListenerOnce(map, 'bounds_changed', () => {
                if (mapPoints.length === 1 && map.getZoom() && map.getZoom()! > 14) {
                    map.setZoom(14);
                }
            });
        })();

        return () => {
            cancelled = true;
            markersRef.current.forEach((m) => m.setMap(null));
            markersRef.current = [];
            mapRef.current = null;
        };
    }, [viewMode, loading, mapPoints, userLocation?.latitude, userLocation?.longitude]);

    const boundsForFallback = useMemo(() => {
        if (mapPoints.length === 0) return null;
        let minLat = mapPoints[0].lat;
        let maxLat = mapPoints[0].lat;
        let minLng = mapPoints[0].lng;
        let maxLng = mapPoints[0].lng;
        for (const p of mapPoints) {
            minLat = Math.min(minLat, p.lat);
            maxLat = Math.max(maxLat, p.lat);
            minLng = Math.min(minLng, p.lng);
            maxLng = Math.max(maxLng, p.lng);
        }
        const pad = 0.02;
        return { minLat: minLat - pad, maxLat: maxLat + pad, minLng: minLng - pad, maxLng: maxLng + pad };
    }, [mapPoints]);

    const projectToPercent = (lat: number, lng: number) => {
        if (!boundsForFallback) return { left: '50%', top: '50%' };
        const { minLat, maxLat, minLng, maxLng } = boundsForFallback;
        const x = (lng - minLng) / (maxLng - minLng || 1);
        const y = (maxLat - lat) / (maxLat - minLat || 1);
        return {
            left: `${Math.max(4, Math.min(96, x * 100))}%`,
            top: `${Math.max(4, Math.min(96, y * 100))}%`,
        };
    };

    const renderMapView = () => {
        if (loading) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[420px] rounded-2xl bg-gray-100">
                    <p className="text-gray-600">Cargando ofertas para el mapa…</p>
                </div>
            );
        }

        if (mapPoints.length === 0) {
            return (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center text-gray-600">
                    No hay promociones activas con ubicación (GPS o sucursales) para mostrar en el mapa.
                    <p className="text-sm mt-2 text-gray-500">
                        Activa ubicación al crear la promoción o importa sucursales con coordenadas.
                    </p>
                </div>
            );
        }

        if (GOOGLE_MAPS_KEY && mapPoints.length > 0) {
            return (
                <div className="space-y-4">
                    <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-lg bg-white">
                        <div ref={mapContainerRef} className="w-full h-[480px] bg-gray-100" aria-label="Mapa de ofertas" />
                    </div>
                    {mapInitError && (
                        <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                            {mapInitError}
                        </p>
                    )}
                    {selectedPoint && (
                        <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-blue-500">
                            <div className="flex items-start gap-4">
                                <img
                                    src={selectedPoint.image}
                                    alt=""
                                    className="w-20 h-20 object-cover rounded-lg"
                                />
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-lg text-gray-900">{selectedPoint.title}</h4>
                                    <p className="text-sm text-gray-600 mt-1">{selectedPoint.storeLabel}</p>
                                    <div className="flex flex-wrap items-center gap-3 mt-2">
                                        <span className="text-xl font-bold text-green-600">
                                            {formatPrice(selectedPoint.price, selectedPoint.currency)}
                                        </span>
                                        {selectedPoint.discount > 0 && (
                                            <span className="bg-red-500 text-white px-2 py-0.5 rounded text-sm font-bold">
                                                -{selectedPoint.discount}%
                                            </span>
                                        )}
                                    </div>
                                    <Link
                                        to={`/promotion-details/${encodeURIComponent(selectedPoint.promotionId)}`}
                                        className="inline-flex mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                                    >
                                        Ver oferta
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        return (
            <div className="relative bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 min-h-[520px]">
                {!GOOGLE_MAPS_KEY && (
                    <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
                        Añade <code className="font-mono">google_maps</code> o{' '}
                        <code className="font-mono">VITE_GOOGLE_MAPS_API_KEY</code> en <code>.env</code> y reinicia{' '}
                        <code>npm run dev</code> para ver el mapa de Google. Vista previa con posiciones reales:
                    </p>
                )}
                <div className="relative w-full h-96 bg-gray-200 rounded-xl overflow-hidden mb-6">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-green-100">
                        <div
                            className="absolute inset-0 opacity-20"
                            style={{
                                backgroundImage:
                                    'linear-gradient(rgba(0,0,0,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,.1) 1px, transparent 1px)',
                                backgroundSize: '20px 20px',
                            }}
                        />
                        {pointsWithDistance.map((p) => {
                            const pos = projectToPercent(p.lat, p.lng);
                            return (
                                <button
                                    key={p.key}
                                    type="button"
                                    onClick={() => setSelectedPoint(p)}
                                    className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 hover:scale-110 ${
                                        selectedPoint?.key === p.key ? 'scale-125 z-20' : 'z-10'
                                    }`}
                                    style={{ left: pos.left, top: pos.top }}
                                >
                                    <div
                                        className={`relative bg-gradient-to-r ${getHotnessColor(p.hotness)} p-3 rounded-full shadow-lg`}
                                    >
                                        <MapPin className="h-6 w-6 text-white" />
                                        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                                            {p.discount}%
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                        {userLocation && boundsForFallback && (
                            <div
                                className="absolute transform -translate-x-1/2 -translate-y-1/2 z-30"
                                style={{
                                    left: projectToPercent(userLocation.latitude, userLocation.longitude).left,
                                    top: projectToPercent(userLocation.latitude, userLocation.longitude).top,
                                }}
                            >
                                <div className="relative">
                                    <div className="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg" />
                                    <div className="absolute inset-0 w-4 h-4 bg-blue-400 rounded-full animate-ping" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                {mapInitError && <p className="text-sm text-red-600 mb-4">{mapInitError}</p>}
                <div className="flex justify-center mb-6">
                    <button
                        type="button"
                        onClick={getUserLocation}
                        disabled={isGettingLocation}
                        className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isGettingLocation ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                Obteniendo ubicación...
                            </>
                        ) : (
                            <>
                                <Navigation className="h-4 w-4" />
                                {userLocation ? 'Actualizar mi ubicación' : 'Ofertas cerca de mí'}
                            </>
                        )}
                    </button>
                </div>
                {selectedPoint && (
                    <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-blue-500">
                        <div className="flex items-start gap-4">
                            <img
                                src={selectedPoint.image}
                                alt=""
                                className="w-20 h-20 object-cover rounded-lg"
                            />
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <h4 className="font-bold text-lg text-gray-900">{selectedPoint.title}</h4>
                                    <span
                                        className={`inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r ${getHotnessColor(selectedPoint.hotness)} text-white text-xs rounded-full`}
                                    >
                                        {getHotnessIcon(selectedPoint.hotness)}
                                        {selectedPoint.hotness.toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 mb-2">
                                    <span className="text-2xl font-bold text-green-600">
                                        {formatPrice(selectedPoint.price, selectedPoint.currency)}
                                    </span>
                                    {selectedPoint.originalPrice > 0 && (
                                        <span className="text-lg text-gray-400 line-through">
                                            {formatPrice(selectedPoint.originalPrice, selectedPoint.currency)}
                                        </span>
                                    )}
                                    <span className="bg-red-500 text-white px-2 py-1 rounded text-sm font-bold">
                                        -{selectedPoint.discount}%
                                    </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                                    <div className="flex items-center gap-1">
                                        <MapPin className="h-4 w-4" />
                                        {selectedPoint.storeLabel}
                                    </div>
                                    {selectedPoint.distance != null && (
                                        <div className="flex items-center gap-1">
                                            <Navigation className="h-4 w-4" />
                                            {(selectedPoint.distance / 1000).toFixed(1)} km
                                        </div>
                                    )}
                                    {selectedPoint.timeLeftLabel && (
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-4 w-4" />
                                            {selectedPoint.timeLeftLabel}
                                        </div>
                                    )}
                                </div>
                                <Link
                                    to={`/promotion-details/${encodeURIComponent(selectedPoint.promotionId)}`}
                                    className="inline-flex bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Ver oferta
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderListView = () =>
        loading ? (
            <div className="text-center py-12 text-gray-600">Cargando…</div>
        ) : listOffers.length === 0 ? (
            <p className="text-center text-gray-600 py-12">No hay ofertas con ubicación para listar.</p>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {listOffers.map((offer) => (
                    <div
                        key={offer.promotionId}
                        className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 group"
                    >
                        <div className="relative">
                            <img
                                src={offer.image}
                                alt=""
                                className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div
                                className={`absolute top-3 left-3 bg-gradient-to-r ${getHotnessColor(offer.hotness)} text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1`}
                            >
                                {getHotnessIcon(offer.hotness)}
                                {offer.hotness.toUpperCase()}
                            </div>
                            <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                                -{offer.discount}%
                            </div>
                            {offer.timeLeftLabel && (
                                <div className="absolute bottom-3 right-3 bg-black/70 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {offer.timeLeftLabel}
                                </div>
                            )}
                        </div>
                        <div className="p-4">
                            <h3 className="font-bold text-lg text-gray-900 mb-2">{offer.title}</h3>
                            <div className="flex items-center gap-3 mb-3">
                                <span className="text-2xl font-bold text-green-600">
                                    {formatPrice(offer.price, offer.currency)}
                                </span>
                                {offer.originalPrice > 0 && (
                                    <span className="text-lg text-gray-400 line-through">
                                        {formatPrice(offer.originalPrice, offer.currency)}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                                <MapPin className="h-4 w-4" />
                                <span>{offer.storeLabel}</span>
                                {offer.distance != null && (
                                    <>
                                        <span>•</span>
                                        <span>{(offer.distance / 1000).toFixed(1)} km</span>
                                    </>
                                )}
                            </div>
                            <Link
                                to={`/promotion-details/${encodeURIComponent(offer.promotionId)}`}
                                className="block text-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                            >
                                Ver oferta
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        );

    const statCount = listOffers.length;
    const maxDiscount = statCount ? Math.max(...listOffers.map((o) => o.discount)) : 0;

    return (
        <section className="py-20 bg-gradient-to-br from-gray-50 via-white to-blue-50 relative overflow-hidden">
            <div className="absolute inset-0 opacity-5">
                <div className="absolute top-20 left-10 w-72 h-72 bg-red-500 rounded-full blur-3xl" />
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-orange-500 rounded-full blur-3xl" />
            </div>

            <div className="max-w-7xl mx-auto px-4 relative z-10">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-red-500 to-orange-500 text-white px-4 py-2 rounded-full text-sm font-bold mb-4">
                        <Flame className="h-4 w-4" />
                        OFERTAS CON UBICACIÓN
                    </div>
                    <h2 className="text-4xl font-bold text-gray-900 mb-4">Ofertas cerca de ti</h2>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        Promociones activas con tienda o sucursal en mapa. Permite tu ubicación para ordenar por distancia y
                        ver la sucursal más cercana en cadenas.
                    </p>
                </div>

                {loadError && (
                    <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                        {loadError}
                    </div>
                )}

                <div className="flex justify-center mb-8">
                    <div className="bg-white rounded-lg p-1 shadow-md">
                        <button
                            type="button"
                            onClick={() => setViewMode('map')}
                            className={`px-6 py-2 rounded-md transition-colors ${
                                viewMode === 'map' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-blue-600'
                            }`}
                        >
                            <MapPin className="h-4 w-4 inline mr-2" />
                            Mapa
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('list')}
                            className={`px-6 py-2 rounded-md transition-colors ${
                                viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-blue-600'
                            }`}
                        >
                            <Eye className="h-4 w-4 inline mr-2" />
                            Lista
                        </button>
                    </div>
                </div>

                {viewMode === 'map' && GOOGLE_MAPS_KEY && mapPoints.length > 0 && (
                    <div className="flex justify-center mb-6">
                        <button
                            type="button"
                            onClick={getUserLocation}
                            disabled={isGettingLocation}
                            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                            {isGettingLocation ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                    Obteniendo ubicación...
                                </>
                            ) : (
                                <>
                                    <Navigation className="h-4 w-4" />
                                    {userLocation ? 'Actualizar mi ubicación' : 'Usar mi ubicación (distancia y mapa)'}
                                </>
                            )}
                        </button>
                    </div>
                )}

                {viewMode === 'map' ? renderMapView() : renderListView()}

                <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center bg-white rounded-xl p-6 shadow-md">
                        <div className="text-3xl font-bold text-red-500 mb-2">{statCount}</div>
                        <div className="text-gray-600">Ofertas geolocalizadas</div>
                    </div>
                    <div className="text-center bg-white rounded-xl p-6 shadow-md">
                        <div className="text-3xl font-bold text-orange-500 mb-2">{maxDiscount}%</div>
                        <div className="text-gray-600">Descuento máximo</div>
                    </div>
                    <div className="text-center bg-white rounded-xl p-6 shadow-md">
                        <div className="text-3xl font-bold text-green-500 mb-2">{mapPoints.length}</div>
                        <div className="text-gray-600">Marcadores (sucursales)</div>
                    </div>
                    <div className="text-center bg-white rounded-xl p-6 shadow-md">
                        <div className="text-3xl font-bold text-blue-500 mb-2">
                            {GOOGLE_MAPS_KEY ? 'Maps' : 'Preview'}
                        </div>
                        <div className="text-gray-600">{GOOGLE_MAPS_KEY ? 'Google activo' : 'Sin clave API'}</div>
                    </div>
                </div>
            </div>
        </section>
    );
};

function escapeHtml(s: string): string {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

export default OffersMap;
