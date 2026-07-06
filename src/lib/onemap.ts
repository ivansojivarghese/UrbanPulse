import axios from "axios";
import {
    getAccessTokenFromMemory,
    setAccessToken,
    clearAccessToken
} from "./tokenCache";

const BASE_URL = process.env.ONEMAP_BASE_URL!;

async function refreshToken(): Promise<string> {
    console.log("Refreshing OneMap token...");

    const response = await axios.post(
        `${BASE_URL}/api/auth/post/getToken`,
        {
            email: process.env.ONEMAP_API_EMAIL,
            password: process.env.ONEMAP_API_PASSWORD
        }
    );

    // console.log(response)

    const token = response.data.access_token;

    if (!token) {
        throw new Error("Unable to retrieve OneMap access token.");
    }

    setAccessToken(token);

    return token;
}

async function getValidToken(): Promise<string> {

    let token = getAccessTokenFromMemory();

    if (!token) {
        token = await refreshToken();
    }

    return token;
}

export async function getNearestMRT(
    latitude: number,
    longitude: number,
    radius: number
) {

    let token = await getValidToken();

    // console.log(token)

    const makeRequest = async (accessToken: string) => {

        return axios.get(
            `${BASE_URL}/api/public/nearbysvc/getNearestMrtStops`,
            {
                headers: {
                    Authorization: accessToken
                },
                params: {
                    latitude,
                    longitude,
                    radius_in_meters: radius
                }
            }
        );
    };

    try {

        const response = await makeRequest(token);

        return response.data;

    } catch (err: any) {

        if (err.response?.status !== 401) {
            throw err;
        }

        console.log("Token expired. Refreshing...");

        clearAccessToken();

        token = await refreshToken();

        const retry = await makeRequest(token);

        return retry.data;
    }
}