"use client";

import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';

import { calculateBusPulse } from '@/lib/pulse/bus';
import { calculateMRTPulse } from '@/lib/pulse/mrt';
import { calculateTaxiPulse } from '@/lib/pulse/taxi';
import { calculateParkingPulse } from '@/lib/pulse/parking';
import { calculateTrafficPulse } from '@/lib/pulse/traffic';

import { calculateAggregatePulse } from '@/lib/pulse/aggregate';

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
          iconSize: [20, 20],
          iconAnchor: [10, 20],
          popupAnchor: [0, -20]
      });

      const handleMapClick = async (
    event: import("leaflet").LeafletMouseEvent
) => {

    const { lat, lng } = event.latlng;

    clickMarker?.remove();

    clickMarker = leaflet
        .marker([lat, lng], {
            icon: pulseIcon
        })
        .addTo(map)
        .bindPopup(`
            <div class="pulse-popup">
                <div class="pulse-score">0</div>
            </div>
        `)
        .openPopup();

    try {

        //
        // Fetch nearby bus stops + MRT stations simultaneously
        //

        const [nearbyStopsResponse, nearbyStationsResponse, nearbyTaxiResponse, nearbyParkingResponse, nearbyTrafficResponse] =
            await Promise.all([

                fetch(
                    `/api/bus-stops/nearby?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}&radius=250`
                ),

                fetch(
                    `/api/mrt/nearby?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}&radius=500`
                ),

                fetch(
                    `/api/taxis/nearby?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}&radius=2000`
                ),

                fetch(
                    `/api/carparks/nearby?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}&radius=500`
                ),

                fetch(
                    `/api/traffic/nearby?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}&radius=3000`
                )

            ]);

        if (!nearbyStopsResponse.ok) {
            throw new Error("Failed to fetch nearby bus stops");
        }

        if (!nearbyStationsResponse.ok) {
            throw new Error("Failed to fetch nearby MRT stations");
        }

        const nearbyStops = await nearbyStopsResponse.json();

        const nearbyStations = await nearbyStationsResponse.json();

        const nearbyTaxis = await nearbyTaxiResponse.json();

        const nearbyParking = await nearbyParkingResponse.json();

        const nearbyTraffic = await nearbyTrafficResponse.json();

        // console.log(nearbyParking);

        //
        // Fetch arrivals + MRT crowd in parallel
        //

        const [busArrivals, mrtCrowdRaw, mrtForecastRaw] =
            await Promise.all([

                Promise.all(

                    nearbyStops.map(async (stop: any) => {

                        const response = await fetch(
                            `/api/bus-arrival?busStopCode=${encodeURIComponent(
                                stop.bus_stop_code
                            )}`
                        );

                        if (!response.ok) {
                            throw new Error(
                                `Failed bus arrival ${stop.bus_stop_code}`
                            );
                        }

                        return response.json();

                    })

                ),

                Promise.all(

    nearbyStations
        .flatMap((station: any) => {

            const ids = station.id
                .split("/")
                .map((id: string) => id.trim());

            return ids.map((id: string) => ({

                ...station,

                id

            }));

        })

        .map(async (station: any) => {

            const response = await fetch(
                `/api/mrt-crowd?stationId=${encodeURIComponent(
                    station.id
                )}`
            );

            // Ignore stations with no crowd data
            if (!response.ok) {
                return null;
            }

            const crowd = await response.json();

            if (!crowd) {
                return null;
            }

            return {

                station,

                crowd

            };

        })

),


                Promise.all(

    nearbyStations.map(async (station: any) => {

        const stationIds = station.id
            .split("/")
            .map((id: string) => id.trim());

        const forecasts = (
            await Promise.all(

                stationIds.map(async (id: string) => {

                    const response = await fetch(
                        `/api/mrt-forecast?stationId=${encodeURIComponent(id)}`
                    );

                    if (!response.ok)
                        return null;

                    return {
                        station: {
                            ...station,
                            id
                        },
                        forecast: await response.json()
                    };

                })

            )
        ).filter(Boolean);

        return forecasts;

    })

).then(results => results.flat())

/*
                Promise.resolve({
    count: nearbyTaxis.count,
    radius: nearbyTaxis.radius,
    areaSqKm: nearbyTaxis.areaSqKm,
    density: nearbyTaxis.density,
    results: nearbyTaxis.results
})*/

                /*
                Promise.all(

                    nearbyStations.map(async (station: any) => {

                        const response = await fetch(
                            `/api/mrt-crowd?stationId=${encodeURIComponent(
                                station.id
                            )}`
                        );

                        // console.log(`MRT crowd for ${station.id}:`, response);
                       

                            // Ignore stations with no crowd data
                            if (!response.ok) {
                                // console.warn(`No MRT crowd data for ${station.id}`);
                                return null;
                            }

                        return {

                            station,

                            crowd: await response.json()

                        };

                    })

                )
                */
            ]);

            /*
        const mrtCrowd = mrtCrowdRaw.filter(
            (item): item is { station: any; crowd: any } => item !== null
        );*/

        const parking = nearbyParking;

        const taxis = nearbyTaxis;

        const traffic = nearbyTraffic

        const mrtCrowd = mrtCrowdRaw.filter(
    (item): item is { station: any; crowd: any } =>
        item !== null
);

const mrtForecast = mrtForecastRaw.filter(
    (item): item is { station: any; forecast: any } =>
        item !== null
);

        // console.log(mrtCrowd);

        //if (!mrtCrowd.length) {
          
        //}

        //
        // Calculate pulses
        //

        const busPulse =
            calculateBusPulse(
                nearbyStops,
                busArrivals
            );

      

        const mrtPulse =
            calculateMRTPulse(
               nearbyStations,
             mrtCrowd,
                 mrtForecast
        );


        const taxiPulse = 
            calculateTaxiPulse(
                taxis
            );


        const parkingPulse =
            calculateParkingPulse(
                parking.results
            );


        const trafficPulse =
            calculateTrafficPulse(
                traffic.results
            );

        //
        // Debug payload
        //

        //console.log("Nearby stations:", nearbyStations);
        //console.log("MRT crowd:", mrtCrowd);
        //console.log("MRT crowd length:", mrtCrowd.length);

        const aggPulse = calculateAggregatePulse(busPulse, mrtPulse, taxiPulse, parkingPulse, trafficPulse);

        console.log({

            clickedPoint: {

                lat,
                lng

            },

            radius: 500,

            busPulse,

            nearbyStops,

            busArrivals,

            nearbyStations,

            mrtPulse,

            taxiPulse,

            parkingPulse,

            trafficPulse

        });

        //
        // Update popup
        //

        clickMarker?.setPopupContent(`
            <div class="pulse-popup">
                <div class="pulse-score">
                    ${aggPulse}
                </div>
            </div>
        `);

        clickMarker?.openPopup();

    }
    catch (error) {

        console.error(error);

        clickMarker?.setPopupContent(`
            <div class="pulse-popup">
                Failed to load pulse
            </div>
        `);

    }

};
/*
      const handleMapClick = async (event: import('leaflet').LeafletMouseEvent) => {
        const { lat, lng } = event.latlng;

        clickMarker?.remove();
        clickMarker = leaflet
          .marker([lat, lng], {
            icon: pulseIcon,
          })
          .addTo(map)
        
          .bindPopup(`
            <div class="pulse-popup">
              <div class="pulse-score">0</div>
          </div>
        `)
        
          .openPopup();

        try {
          

        // ==========================
// BUS
// ==========================

const nearbyStopsResponse = await fetch(
    `/api/bus-stops/nearby?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}&radius=500`
);

if (!nearbyStopsResponse.ok) {
    throw new Error(
        `Nearby stops request failed (${nearbyStopsResponse.status})`
    );
}

const nearbyStops = await nearbyStopsResponse.json();

const busArrivals = await Promise.all(

    nearbyStops.map(async (stop: any) => {

        const response = await fetch(

            `/api/bus-arrival?busStopCode=${encodeURIComponent(
                stop.bus_stop_code
            )}`

        );

        if (!response.ok) {
            throw new Error(
                `Bus arrival failed for ${stop.bus_stop_code}`
            );
        }

        return response.json();

    })

);

const busPulse = calculateBusPulse(
    nearbyStops,
    busArrivals
);

// ==========================
// MRT
// ==========================

const nearbyStationsResponse = await fetch(

    `/api/mrt/nearby?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}&radius=500`

);

if (!nearbyStationsResponse.ok) {
    throw new Error(
        `Nearby MRT request failed (${nearbyStationsResponse.status})`
    );
}

const nearbyStations = await nearbyStationsResponse.json();

const mrtCrowd = await Promise.all(

    nearbyStations.map(async (station: any) => {

        const response = await fetch(

            `/api/mrt-crowd?stationId=${encodeURIComponent(
                station.id
            )}`

        );

        if (!response.ok) {
            throw new Error(
                `Crowd lookup failed for ${station.id}`
            );
        }

        return {

            station,

            crowd: await response.json()

        };

    })

);

// ==========================
// PAYLOAD
// ==========================

const payload = {

    clickedPoint: {

        lat,

        lng

    },

    radius: 500,

    busPulse,

    nearbyStops,

    busArrivals,

    nearbyStations,

    mrtCrowd

};

console.log(JSON.stringify(payload, null, 2));

// For now display the bus pulse.
// Later replace this with Urban Pulse.

clickMarker?.setPopupContent(`
    <div class="pulse-popup">
        <div class="pulse-score">
            ${busPulse}
        </div>
    </div>
`);

clickMarker?.openPopup();

        clickMarker.openPopup();

        } catch (error) {
          console.error(error);
        }
      };*/

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