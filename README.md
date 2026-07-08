# UrbanPulse

UrbanPulse is a Next.js starter for a Singapore-based pedestrian traffic analyser.

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

Required environment variables:

- `DATABASE_URL`
- `LTA_DATA_MALL_ACCOUNT_KEY`
- `ONEMAP_API_EMAIL`
- `ONEMAP_API_PASSWORD`
- `ONEMAP_BASE_URL`
- `DATA_GOV_API_KEY`
- `DATA_GOV_BASE_URL`
- `URA_ACCESS_KEY`

## API endpoints

``` GET /api/bus-stops/nearby ```

``` GET /api/mrt/nearby ```

``` GET /api/carparks/nearby ```

``` GET /api/taxis/nearby ```

``` GET /api/traffic/nearby ```

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

### Nearby carparks


```http://localhost:3000/api/carparks/nearby?lat=1.2826495473755732&lng=103.83903721454651&radius=500```

Response:

```
{
  "count": 8,
  "radius": 500,
  "results": [
    {
      "id": "P0048",
      "area": "",
      "development": "PEARL BANK OFF STREET",
      "latitude": 1.28334835978347,
      "longitude": 103.840537849091,
      "distance": 184,
      "availableLots": 18,
      "totalLots": 31,
      "source": "URA",
      "lots": {
        "car": {
          "available": 18,
          "capacity": 19
        },
        "motorcycle": {
          "available": 0,
          "capacity": 12
        },
        "heavyVehicle": {
          "available": 0,
          "capacity": 0
        }
      },
      "lta": [
        {
          "CarParkID": "P0048",
          "Area": "",
          "Development": "PEARL BANK OFF STREET",
          "Location": "1.2833483597834672 103.84053784909122",
          "AvailableLots": 0,
          "LotType": "Y",
          "Agency": "URA"
        },
        {
          "CarParkID": "P0048",
          "Area": "",
          "Development": "PEARL BANK OFF STREET",
          "Location": "1.2833483597834672 103.84053784909122",
          "AvailableLots": 18,
          "LotType": "C",
          "Agency": "URA"
        }
      ],
      "ura": [
        {
          "ppCode": "P0048",
          "weekdayMin": "510 mins",
          "weekdayRate": "$0.65",
          "parkingSystem": "C",
          "ppName": "PEARL BANK OFF STREET ",
          "vehCat": "Motorcycle",
          "satdayMin": "510 mins",
          "satdayRate": "$0.65",
          "sunPHMin": "510 mins",
          "sunPHRate": "$0.65",
          "geometries": [
            {
              "coordinates": "28803.4452,29531.6622"
            }
          ],
          "startTime": "10.30 PM",
          "parkCapacity": 12,
          "endTime": "07.00 AM",
          "carparkNo": "P0048",
          "lotsAvailable": "18",
          "lotType": "C"
        },
        {
          "ppCode": "P0048",
          "weekdayMin": "510 mins",
          "weekdayRate": "$0.65",
          "parkingSystem": "C",
          "ppName": "PEARL BANK OFF STREET ",
          "vehCat": "Motorcycle",
          "satdayMin": "510 mins",
          "satdayRate": "$0.65",
          "sunPHMin": "510 mins",
          "sunPHRate": "$0.65",
          "geometries": [
            {
              "coordinates": "28803.4452,29531.6622"
            }
          ],
          "startTime": "10.30 PM",
          "parkCapacity": 12,
          "endTime": "07.00 AM",
          "carparkNo": "P0048",
          "lotsAvailable": "0",
          "lotType": "M"
        }
      ],
      "capacity": {
        "PP_CODE": "P0048",
        "NO_CAR": 19,
        "NO_MCYCLE": 12,
        "NO_H_VEHIC": 0
      },
      "agency": "URA"
    },
```

### Nearby taxis (for hire)

```http://localhost:3000/api/taxis/nearby?lat=1.2826495473755732&lng=103.83903721454651&radius=2000```

Response:

```
{
  "count": 8,
  "radius": 2000,
  "areaSqKm": 12.5663706143592,
  "density": 0.636619772367581,
  "results": [
    {
      "latitude": 1.38413106666667,
      "longitude": 103.743279716667,
      "distance": 545.41180646595
    },
    {
      "latitude": 1.3961449,
      "longitude": 103.744042866667,
      "distance": 794.179432253852
    },
    {
      "latitude": 1.39548895,
      "longitude": 103.74795455,
      "distance": 880.832425546025
    },
    {
      "latitude": 1.3965804,
      "longitude": 103.747377933333,
      "distance": 950.474548076638
    },
    {
      "latitude": 1.38018531666667,
      "longitude": 103.740581083333,
      "distance": 1031.41466541328
    },
    {
      "latitude": 1.38017981666667,
      "longitude": 103.740575416667,
      "distance": 1032.18688530779
    },
    {
      "latitude": 1.39841428333333,
      "longitude": 103.747894383333,
      "distance": 1158.33092316938
    },
    {
      "latitude": 1.38458063333333,
      "longitude": 103.758354816667,
      "distance": 1738.9633244051
    }
  ]
}
```

### Nearby traffic

```http://localhost:3000/api/traffic/nearby?lat=1.2897552003625212&lng=103.85719952065011&radius=1000```

Response:

```
{
  "count": 138,
  "radius": 2000,
  "lastUpdatedTime": "2026-07-07 13:30:00",
  "results": [
    {
      "linkId": "120",
      "roadName": "RIVER VALLEY ROAD",
      "roadCategory": "2",
      "speedBand": 4,
      "minimumSpeed": 30,
      "maximumSpeed": 39,
      "start": {
        "latitude": 1.294262,
        "longitude": 103.842124
      },
      "end": {
        "latitude": 1.294197,
        "longitude": 103.842174
      },
      "distance": 1741.82896739184
    },
    {
      "linkId": "121",
      "roadName": "RIVER VALLEY ROAD",
      "roadCategory": "2",
      "speedBand": 4,
      "minimumSpeed": 30,
      "maximumSpeed": 39,
      "start": {
        "latitude": 1.29429,
        "longitude": 103.842103
      },
      "end": {
        "latitude": 1.294262,
        "longitude": 103.842124
      },
      "distance": 1749.21678609764
    },
    {
      "linkId": "65",
      "roadName": "RIVER VALLEY ROAD",
      "roadCategory": "2",
      "speedBand": 5,
      "minimumSpeed": 40,
      "maximumSpeed": 49,
      "start": {
        "latitude": 1.294189,
        "longitude": 103.84208
      },
      "end": {
        "latitude": 1.294478,
        "longitude": 103.841886
      },
      "distance": 1751.60165451041
    },
    {
      "linkId": "122",
      "roadName": "RIVER VALLEY ROAD",
      "roadCategory": "2",
      "speedBand": 4,
      "minimumSpeed": 30,
      "maximumSpeed": 39,
      "start": {
        "latitude": 1.294454,
        "longitude": 103.841977
      },
      "end": {
        "latitude": 1.29429,
        "longitude": 103.842103
      },
      "distance": 1752.34692512342
    },
```
