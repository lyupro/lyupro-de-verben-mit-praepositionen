// public/javascripts/utils/namedRoutes.js
async function fetchNamedRoute(name, params) {
    const response = await fetch(`/api/named-routes?name=${name}&params=${JSON.stringify(params)}`);
    const data = await response.json();

    if (response.ok) {
        return data.url;
    } else {
        throw new Error(data.error);
    }
}

export { fetchNamedRoute };