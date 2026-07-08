import axios from "axios";

const client = axios.create({

    baseURL:
        "https://datamall2.mytransport.sg/ltaodataservice/v3",

    headers: {

        AccountKey:
            process.env.LTA_DATA_MALL_ACCOUNT_KEY,

        Accept:
            "application/json"

    }

});

export interface NextBus {

    OriginCode: string;

    DestinationCode: string;

    EstimatedArrival: string;

    Monitored: number;

    Latitude: string;

    Longitude: string;

    VisitNumber: string;

    Load: string;

    Feature: string;

    Type: string;

}

export interface BusService {

    ServiceNo: string;

    Operator: string;

    NextBus: NextBus;

    NextBus2: NextBus;

    NextBus3: NextBus;
}

interface BusArrivalResult {

    busStopCode: string;

    services: {

        serviceNo: string;

        operator: string;

        nextBus: NextBus & {
            minutes: number | null;
        };

        nextBus2: NextBus & {
            minutes: number | null;
        };

        nextBus3: NextBus & {
            minutes: number | null;
        };

    }[];

}

export interface BusArrivalResponse {

    BusStopCode: string;

    Services: BusService[];

}

export async function getBusArrival(

    busStopCode: string

): Promise<BusArrivalResult> {

    const response =
        await client.get<BusArrivalResponse>(
            "/BusArrival",
            {
                params: {
                    BusStopCode: busStopCode
                }
            }
        );

    // return response.data;

    return {

        busStopCode:
            response.data.BusStopCode,

        services:
            response.data.Services.map(
                service => ({

                    serviceNo:
                        service.ServiceNo,

                    operator:
                        service.Operator,

                    nextBus: {

                        ...service.NextBus,

                        minutes:
                            getArrivalMinutes(
                                service.NextBus.EstimatedArrival
                            )

                    },

                    nextBus2: {

                        ...service.NextBus2,

                        minutes:
                            getArrivalMinutes(
                                service.NextBus2.EstimatedArrival
                            )

                    },

                    nextBus3: {

                        ...service.NextBus3,

                        minutes:
                            getArrivalMinutes(
                                service.NextBus3.EstimatedArrival
                            )

                    }

                })
            )

    };

}

function getArrivalMinutes(
    estimatedArrival: string
): number | null {

    if (!estimatedArrival) {
        return null;
    }

    const diff =
        new Date(estimatedArrival).getTime() -
        Date.now();

    return Math.max(
        0,
        Math.ceil(diff / 60000)
    );

}