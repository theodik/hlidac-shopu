export const ACTOR_TYPES = {
    DAILY: 'DAILY',
    COUNT: 'COUNT',
};

export const LABELS = {
    MAIN_PAGE: 'MAIN_PAGE',
    CATEGORY: 'CATEGORY',
    RESTAURANT_CATEGORY: 'RESTAURANT_CATEGORY',
    RESTAURANT_SUBCATEGORY: 'RESTAURANT_SUBCATEGORY',
    CLOTHES_CATEGORY: 'CLOTHES_CATEGORY',
    PRODUCT_LIST: 'PRODUCT_LIST',
};

export const MAX_PAGE_COUNT = 34;

export const CURRENCY = 'UAH';

export const MAIN_DOMAIN = 'rozetka.com.ua/';

export const BAD_HARDWARE_PAGE_URL = 'https://hard.rozetka.com.ua/';
export const GOOD_HARDWARE_PAGE_URL = 'https://hard.rozetka.com.ua/hard/c80026/';

export const RESTAURANTS_CAT_URL = 'https://rozetka.com.ua/restorani-i-produktovie-seti/c4660651/';
export const CLOTHES_CAT_URL = 'https://rozetka.com.ua/shoes_clothes/c1162030/';
export const GAMER_GIFTS_URL = 'https://rozetka.com.ua/podarki-dlya-geymerov/c4629541/';

export const PRODUCT_LIST_NEXT_PAGE_SELECTOR = '.pagination__direction_type_forward[href]';

export const CATEGORY_PSEUDO_URLS = [
    `[.*]${MAIN_DOMAIN}[.*(?:\\w|-)*]/c[.*]`,
];

export const START_REQUESTS = [
    { url: `https://${MAIN_DOMAIN}`,
        userData: { label: LABELS.MAIN_PAGE } },
    { url: 'https://rozetka.com.ua/podarki-i-tovary-dlya-prazdnikov/c80260/',
        userData: { label: LABELS.CATEGORY } },
    { url: GAMER_GIFTS_URL,
        userData: { label: LABELS.PRODUCT_LIST, longCategory: true } },
    { url: RESTAURANTS_CAT_URL,
        userData: { label: LABELS.RESTAURANT_CATEGORY, longCategory: true } },
    { url: CLOTHES_CAT_URL,
        userData: { label: LABELS.CLOTHES_CATEGORY } },
];

export const STATS_KEY = 'stats';
