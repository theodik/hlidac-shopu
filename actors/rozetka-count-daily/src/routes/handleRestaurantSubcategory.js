import Apify from 'apify';
import { LABELS } from '../consts.js';

const {
    utils: { log },
} = Apify;
const { PRODUCT_LIST } = LABELS;

export const handleRestaurantSubcategory = async ({
    $,
    request: { loadedUrl },
    crawler: { requestQueue },
}) => {
    log.debug('Entered Category page.');

    await Apify.utils.enqueueLinks({
        $,
        requestQueue,
        baseUrl: loadedUrl,
        selector: 'li.portal-grid__cell a',
        transformRequestFunction: (req) => {
            req.userData = {
                label: PRODUCT_LIST,
                longCategory: true,
            };
            return req;
        },
    });
};
