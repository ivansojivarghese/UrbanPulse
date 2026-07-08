"use client";

import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';

import { calculateBusPulse } from '@/lib/pulse/bus';

export default function OneMapMap() {
  const mapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    let activeMap: import('leaflet').Map | null = null;
    let removeClickHandler: (() => void) | null = null;
    let clickMarker: import('leaflet').Marker | null = null;

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

      const pulseIcon = leaflet.icon({
          iconUrl: "/icons/marker.svg",
          iconSize: [40, 40],
          iconAnchor: [20, 40],
          popupAnchor: [0, -40]
      });

      const handleMapClick = async (event: import('leaflet').LeafletMouseEvent) => {
        const { lat, lng } = event.latlng;

        clickMarker?.remove();
        clickMarker = leaflet
          .marker([lat, lng], {
            icon: pulseIcon,
          })
          .addTo(map)
          // .bindPopup(`Clicked location<br />${lat.toFixed(6)}, ${lng.toFixed(6)}`)
          /*
          .bindPopup(`
            <div style="text-align:center;">
                <div style="font-size:14px;font-weight:bold;">
                    🚌 Bus Pulse
                </div>

                <div style="
                    font-size:42px;
                    font-weight:bold;
                    margin:8px 0;
                ">
                    ${data.pulse}
                </div>

                <div>
                    ${getPulseLabel(data.pulse)}
                </div>
            </div>
        `)*/
        
          .bindPopup(`
            <div class="pulse-popup">
              <div class="pulse-score">0</div>
          </div>
        `)
        /*
          .bindPopup(
          `
          <div class="pulse-popup">
              <div class="pulse-title">🚌 Bus Pulse</div>
              <div class="pulse-score">${pulse}</div>
              <div class="pulse-label">${getPulseLabel(pulse)}</div>
          </div>
          `,
          {
            className: "urbanpulse-popup"
          })*/
          .openPopup();

        try {
          const nearbyStopsResponse = await fetch(
            `/api/bus-stops/nearby?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}&radius=500`
          );

          if (!nearbyStopsResponse.ok) {
            throw new Error(`Nearby stops request failed with status ${nearbyStopsResponse.status}`);
          }

          const nearbyStops = (await nearbyStopsResponse.json()) as {
            bus_stop_code: string;
            road_name: string;
            description: string;
            latitude: number;
            longitude: number;
            distance: number;
          }[];

          const busArrivals = await Promise.all(
            nearbyStops.map(async (stop) => {
              const arrivalResponse = await fetch(
                `/api/bus-arrival?busStopCode=${encodeURIComponent(stop.bus_stop_code)}`
              );

              if (!arrivalResponse.ok) {
                throw new Error(
                  `Bus arrival request failed for ${stop.bus_stop_code} with status ${arrivalResponse.status}`
                );
              }

              return arrivalResponse.json();
            })
          );

          const pulse = calculateBusPulse(
              nearbyStops,
              busArrivals
          );

          const payload = {
            clickedPoint: {
              lat,
              lng
            },
            pulse,
            radius: 250,
            nearbyStops,
            busArrivals
          };

          console.log(JSON.stringify(payload, null, 2));

          clickMarker.setPopupContent(`
            <div class="pulse-popup">
              <div class="pulse-score">${pulse}</div>
          </div>
        `);

        clickMarker.openPopup();

        } catch (error) {
          console.error(error);
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
      clickMarker?.remove();
      activeMap?.remove();
    };
  }, []);

  return <div ref={mapRef} className="onemap-map-canvas" />;
}

function getPulseLabel(score: number): string {

    if (score <= 20)
        return "🟢 Very Quiet";

    if (score <= 40)
        return "🟢 Quiet";

    if (score <= 60)
        return "🟡 Moderate";

    if (score <= 80)
        return "🟠 Busy";

    return "🔴 Very Busy";

}