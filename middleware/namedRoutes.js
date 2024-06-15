// middleware/namedRoutes.js
const namedRoutes = require('../config/namedRoutes');

function getNamedRoute(name, params = {}) {
    let url = namedRoutes[name];
    console.log('getNamedRoute() | url 1: ', url);
    console.log('getNamedRoute() | params: ', params);

    if (!url) {
        throw new Error(`Именованный маршрут '${name}' не найден.`);
    }

    for (const key in params) {
        if (params[key]) {
            url = url.replace(`:${key}`, params[key]);
        }
    }
    console.log('getNamedRoute() | url 2: ', url);

    url = url.replace(/(:?\w+\?)/g, (match) => {
        const param = url[match];
        return param !== undefined ? param : '';
    });
    console.log('getNamedRoute() | url 3: ', url);

    return url;
}

module.exports = {
    getNamedRoute,
};