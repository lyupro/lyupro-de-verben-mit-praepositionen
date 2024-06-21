// middleware/namedRoutes.js
import namedRoutes from '../config/namedRoutes.js';

export function getNamedRoute(name, params = {}) {
    let url = namedRoutes[name];
    //console.log('getNamedRoute() | url 1: ', url);
    //console.log('getNamedRoute() | params: ', params);

    if (!url) {
        throw new Error(`Именованный маршрут '${name}' не найден.`);
    }

    for (const key in params) {
        if (params[key]) {
            url = url.replace(`:${key}`, params[key]);
        }
    }
    //console.log('getNamedRoute() | url 2: ', url);

    return url;
}