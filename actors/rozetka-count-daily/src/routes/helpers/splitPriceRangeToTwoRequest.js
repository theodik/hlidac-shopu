import { BAD_HARDWARE_PAGE_URL, GOOD_HARDWARE_PAGE_URL } from '../../consts.js';

export async function splitPriceRangeToTwoRequest(
    url,
    minPrice,
    maxPrice,
    requestQueue,
    userData,
) {
    let baseUrl = url;
    let urlA;
    let urlB;

    if (baseUrl === BAD_HARDWARE_PAGE_URL) {
        baseUrl = GOOD_HARDWARE_PAGE_URL;
    }

    if (!baseUrl.includes('price=')) {
        urlA = `${baseUrl}price=${minPrice}-${Math.floor((minPrice + maxPrice) / 2)}`;
        urlB = `${baseUrl}price=${Math.floor((minPrice + maxPrice) / 2) + 1}-${maxPrice}`;
    } else {
        urlA = baseUrl.replace(/(.*)price=(.*)/,
            `$1price=${minPrice}-${Math.floor((minPrice + maxPrice) / 2)}`);
        urlB = baseUrl.replace(/(.*)price=(.*)/,
            `$1price=${Math.floor((minPrice + maxPrice) / 2) + 1}-${maxPrice}`);
    }

    await requestQueue.addRequest({
        url: urlA,
        userData,
    });
    await requestQueue.addRequest({
        url: urlB,
        userData,
    });
}
