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

```GET /api/carparks/nearby ```

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
