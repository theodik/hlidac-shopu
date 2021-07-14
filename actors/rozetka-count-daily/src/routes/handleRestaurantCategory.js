import Apify from 'apify';
import { LABELS } from '../consts.js';

const {
    utils: { log },
} = Apify;
const { RESTAURANT_SUBCATEGORY } = LABELS;

export const handleRestaurantCategory = async ({
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
                label: RESTAURANT_SUBCATEGORY,
                longCategory: true,
            };
            return req;
        },
    });
};
