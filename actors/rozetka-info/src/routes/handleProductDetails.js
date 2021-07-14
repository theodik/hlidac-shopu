import Apify from 'apify';
import { tableRowsOrListItemsIntoArray, getDatasetItemTemplate } from '../tools.js';
import { CSS_SELECTORS } from '../consts.js';

export const handleProductDetails = async ({
    $,
    request: { userData: { image }, loadedUrl },
}) => {
    const identifier = loadedUrl.match(/\/p(\d+)\//)?.[1];

    const productJSONLD = JSON.parse(
        $('script[data-seo="Product"]').html(),
    );
    const breadcrumbsJSONLD = JSON.parse(
        $('script[data-seo="BreadcrumbList"]').html(),
    );

    const datasetItem = getDatasetItemTemplate();
    datasetItem.identifier = identifier;
    datasetItem.url = productJSONLD.url;
    datasetItem.breadcrumbs = breadcrumbsJSONLD;
    datasetItem.mainEntity = { ...productJSONLD };
    datasetItem.mainEntity.offers.itemCondition = productJSONLD.itemCondition;
    datasetItem.mainEntity.brand = typeof productJSONLD.brand === 'object'
        ? productJSONLD.brand.name : undefined;
    datasetItem.mainEntity.category = breadcrumbsJSONLD.ItemListElement?.[0].item.name;

    const additionalProperty = (await tableRowsOrListItemsIntoArray({
        $,
        fieldsetSelector: CSS_SELECTORS.DETAIL_FIELDSETS,
        fieldsetLegendSelector: CSS_SELECTORS.DETAIL_FIELDSET_LEGEND,
    })).map((item) => ({
        '@type': 'PropertyValue',
        name: item.title,
        value: item.data,
    }));

    datasetItem.mainEntity.additionalProperty = additionalProperty;
    datasetItem.mainContentOfPage[0].cssSelector = 'app-rz-product > .central-wrapper';

    datasetItem.mainContentOfPage[0].encoding = $('app-rz-product > .central-wrapper')
        .html();

    datasetItem.mainEntity.image = image;

    await Apify.pushData(datasetItem);
};
