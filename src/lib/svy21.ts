import proj4 from "proj4";

// SVY21 / Singapore TM
proj4.defs(
    "EPSG:3414",
    "+proj=tmerc +lat_0=1.36666666666667 +lon_0=103.833333333333 +k=1 +x_0=28001.642 +y_0=38744.572 +ellps=WGS84 +units=m +no_defs"
);

export function svy21ToWGS84(
    x: number,
    y: number
) {

    const [lng, lat] =
        proj4(
            "EPSG:3414",
            "EPSG:4326",
            [x, y]
        );

    return {
        latitude: lat,
        longitude: lng
    };

}