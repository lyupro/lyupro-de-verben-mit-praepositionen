// public/javascripts/utils/namedRoutes.js
window.fetchNamedRoute = async function(name, params = {}) {
//async function fetchNamedRoute(name, params = {}) {
    //console.log('public/javascripts/utils/namedRoutes.js | fetchNamedRoute() | name: ', name);
    //console.log('public/javascripts/utils/namedRoutes.js | fetchNamedRoute() | params: ', params);
    const url = new URL('/api/named-routes', window.location.origin);
    url.searchParams.append('name', name);
    if (Object.keys(params).length > 0) {
        url.searchParams.append('params', JSON.stringify(params));
    }

    const response = await fetch(url);
    //console.log('public/javascripts/utils/namedRoutes.js | fetchNamedRoute() | response: ', response);
    const data = await response.json();
    //console.log('public/javascripts/utils/namedRoutes.js | fetchNamedRoute() | data: ', data);

    if (response.ok) {
        return data.url;
    } else {
        throw new Error(data.error);
    }
};

//export { fetchNamedRoute };