import Apify from 'apify';
import { STATS_KEY } from './consts.js';

const { utils: { log } } = Apify;

let isMigrating = false;
export function migrationFlagGetOrSet(value) {
    if (value === undefined) {
        return isMigrating;
    }
    isMigrating = value;
}

let statsValue = 0;
export async function getOrIncStatsValue(inc, url) {
    if (inc !== undefined) {
        statsValue += inc;

        if (isMigrating) {
            await Apify.setValue(STATS_KEY, { value: statsValue });
        }

        if (url !== undefined) {
            log.info(`Adding ${inc} products from page '${url}'`);
        }
    } else {
        return statsValue;
    }
}

export async function migrationConfig() {
    /**
     * At start we check whether the key-value store has a value
     * of the STATS_KEY key (in case previous actor run migrated here)
     * and save the value as a start value for the current run.
     */
    const statsObj = await Apify.getValue(STATS_KEY);
    if (typeof statsObj === 'object' && statsObj != null) {
        const stats = statsObj;

        log.info(`Product count start value from the store: ${stats.value}`);
        await getOrIncStatsValue(+stats.value);
    }

    // persist value on migration
    Apify.events.on('migrating', async () => {
        migrationFlagGetOrSet(true);
        const currentStatsValue = await getOrIncStatsValue();

        log.info(`Migration: saving the value '${currentStatsValue}' to the key-value store.`);
        await Apify.setValue(STATS_KEY, { value: currentStatsValue });
    });

    setInterval(async () => log.info(`Shop products count: ${await getOrIncStatsValue()}`), 60000);
}
