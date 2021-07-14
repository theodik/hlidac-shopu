import Apify from 'apify';
import { MAIN_DOMAIN, LABELS } from '../consts.js';

const {
    utils: { log },
} = Apify;
const { CATEGORY } = LABELS;

export const handleMainPage = async ({
    $,
    request: { loadedUrl },
    crawler: { requestQueue },
}) => {
    log.info('Entered main page.');

    await Apify.utils.enqueueLinks({
        $,
        requestQueue,
        baseUrl: loadedUrl,
        selector: '.menu-wrapper_state_static .menu-categories__link',
        pseudoUrls: [`[.*]${MAIN_DOMAIN}[(?:\\w|-)*]/c[.*]`, `https://bt.${MAIN_DOMAIN}[.*]`],
        transformRequestFunction: (req) => {
            req.userData = {
                label: CATEGORY,
            };
            return req;
        },
    });
};
