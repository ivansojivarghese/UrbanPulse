# UrbanPulse

UrbanPulse is a Next.js starter for a Singapore pedestrian traffic analyser.

## What this starter includes

- A polished dashboard landing page for live mobility intelligence.
- A TypeScript + Next.js app shell with clean aliases and metadata.
- A visual place-holder map panel and region watchlist for Singapore coverage.
- A project structure ready for LTA Datamall, OneMap, and map provider adapters.

## Suggested next steps

1. Add API adapters for LTA Datamall, OneMap, and your selected map provider.
2. Model geographic regions, nearby bus stops, and service coverage in a data layer.
3. Add a live scoring job that estimates pedestrian pressure from transport and traffic signals.
4. Replace the visual placeholder map with a real map SDK.

## Run locally

```bash
npm install
npm run dev
```

## Bus stop startup sync

Before starting the app, you can download the full LTA DataMall BusStops dataset into PostgreSQL/PostGIS with:

```bash
npm run db:sync-bus-stops
```

Required environment variables:

- `DATABASE_URL`
- `LTA_DATA_MALL_ACCOUNT_KEY`

The sync script creates the `bus_stops` table, enables `postgis` if available, and creates a GiST index on the geometry column.

## API endpoints

``` GET /api/bus-stops/nearby ```

``` GET /api/mrt/nearby ```

### Nearby bus stops

``` http://localhost:3000/api/bus-stops/nearby?lat=1.3521&lng=103.8198&radius=500 ```

Response:

```
[
  {
    "bus_stop_code": "03011",
    "description": "Opp Fullerton Sq",
    "road_name": "Fullerton Rd",
    "distance": 85.2
  },
  {
    "bus_stop_code": "03012",
    "description": "Fullerton Sq",
    "road_name": "Fullerton Rd",
    "distance": 104.7
  }
]

```

### Nearby MRT stations

``` http://localhost:3000/api/mrt/nearby?lat=1.3521&lng=103.8198&radius=1000 ```

Response:

```

[
    {
        "id": "NE17",
        "name": "PUNGGOL MRT STATION",
        "lat": 1.40428756587,
        "lon": 103.901946796,
        "road": "PUNGGOL CENTRAL"
    },
    {
        "id": "PTC",
        "name": "PUNGGOL LRT STATION",
        "lat": 1.40541051607,
        "lon": 103.902522218,
        "road": "PUNGGOL CENTRAL"
    },
    {
        "id": "PW7",
        "name": "SOO TECK LRT STATION",
        "lat": 1.40527842114,
        "lon": 103.897294735,
        "road": "PUNGGOL WAY"
    },
]

```
