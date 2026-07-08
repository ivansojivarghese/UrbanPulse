"use client";

import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';

export default function OneMapMap() {
  const mapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    let activeMap: import('leaflet').Map | null = null;
    let removeClickHandler: (() => void) | null = null;

    void import('leaflet').then((leaflet) => {
      if (!mapRef.current) {
        return;
      }

      const sw = leaflet.latLng(1.144, 103.535);
      const ne = leaflet.latLng(1.494, 104.502);
      const bounds = leaflet.latLngBounds(sw, ne);

      const map = leaflet.map(mapRef.current, {
        center: leaflet.latLng(1.2868108, 103.8545349),
        zoom: 16,
        zoomControl: false,
        attributionControl: false
      });

      map.setMaxBounds(bounds);

      leaflet
        .tileLayer('https://www.onemap.gov.sg/maps/tiles/Grey/{z}/{x}/{y}.png', {
          detectRetina: true,
          maxZoom: 19,
          minZoom: 11,
          attribution:
            '<img src="https://www.onemap.gov.sg/web-assets/images/logo/om_logo.png" style="height:20px;width:20px;"/>&nbsp;<a href="https://www.onemap.gov.sg/" target="_blank" rel="noopener noreferrer">OneMap</a>&nbsp;&copy;&nbsp;contributors&nbsp;&#124;&nbsp;<a href="https://www.sla.gov.sg/" target="_blank" rel="noopener noreferrer">Singapore Land Authority</a>'
        })
        .addTo(map);

      const handleMapClick = async (event: import('leaflet').LeafletMouseEvent) => {
        const { lat, lng } = event.latlng;
        const coordinates = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

        try {
          if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(coordinates);
            return;
          }

          const fallbackInput = document.createElement('input');
          fallbackInput.value = coordinates;
          fallbackInput.setAttribute('readonly', 'true');
          fallbackInput.style.position = 'absolute';
          fallbackInput.style.left = '-9999px';
          document.body.appendChild(fallbackInput);
          fallbackInput.select();
          document.execCommand('copy');
          document.body.removeChild(fallbackInput);
        } catch {
          // Intentionally silent: clipboard copy is best-effort only.
        }
      };

      map.on('click', handleMapClick);
      removeClickHandler = () => {
        map.off('click', handleMapClick);
      };

      activeMap = map;
    });

    return () => {
      removeClickHandler?.();
      activeMap?.remove();
    };
  }, []);

  return <div ref={mapRef} className="onemap-map-canvas" />;
}