// middleware/namedRoutes.js
const namedRoutes = require('../config/namedRoutes');

function getNamedRoute(name, params = {}) {
    let url = namedRoutes[name];

    if (!url) {
        throw new Error(`Именованный маршрут '${name}' не найден.`);
    }

    for (const key in params) {
        if (params[key]) {
            url = url.replace(`:${key}`, params[key]);
        }
    }

    return url;
}

module.exports = {
    getNamedRoute,
};