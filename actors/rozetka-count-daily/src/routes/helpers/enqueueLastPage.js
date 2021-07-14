import Apify from 'apify';

const {
    utils: { log },
} = Apify;

export const enqueueLastPage = async (
    $,
    url,
    requestQueue,
    userData,
) => {
    const lastPageLink = $('li.pagination__item:last-child a').attr('href');

    log.debug(`current product list page ${url} has last page ${lastPageLink}`);

    await requestQueue.addRequest({
        url: lastPageLink,
        userData,
    });
};
