import Apify from 'apify';
import { LABELS } from '../consts.js';

const {
    utils: { log },
} = Apify;
const { PRODUCT_LIST } = LABELS;

export const handleClothesCategory = async ({
    $,
    request: { loadedUrl },
    crawler: { requestQueue },
}) => {
    log.debug('Entered Category page.');

    await Apify.utils.enqueueLinks({
        $,
        requestQueue,
        baseUrl: loadedUrl,
        selector: 'rz-widget-tabs:nth-child(2) .portal-cats__list a',
        transformRequestFunction: (req) => {
            req.userData = {
                label: PRODUCT_LIST,
            };
            return req;
        },
    });
};
