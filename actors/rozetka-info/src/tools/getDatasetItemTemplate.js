export function getDatasetItemTemplate() {
    return {
        '@context': 'http://schema.org',
        '@type': 'ItemPage',
        mainEntity: {
            '@context': 'http://schema.org',
            '@type': 'Product',
            aggregateRating: {
                '@type': 'AggregateRating',
            },
        },
        mainContentOfPage: [
            {
                '@type': 'WebPageElement',
                encodingFormat: 'text/html',
            },
        ],
    };
}
