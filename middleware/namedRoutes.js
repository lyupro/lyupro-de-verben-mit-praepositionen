// middleware/namedRoutes.js
const namedRoutes = {};

function addNamedRoute(req, res, next) {
    if (req.method === 'GET') {
        const name = req.namedRoute;
        const url = req.originalUrl;
        namedRoutes[name] = url;
    }
    next();
}

function getNamedRoute(name, params = {}) {
    let url = namedRoutes[name];

    if (!url) {
        throw new Error(`Именованный маршрут '${name}' не найден.`);
    }

    for (const key in params) {
        url = url.replace(`:${key}`, params[key]);
    }

    return url;
}

module.exports = {
    addNamedRoute,
    getNamedRoute,
};