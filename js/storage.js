/* =========================================================
   BEYA — LOCAL STORAGE
   Local-first data storage
   ========================================================= */

const BEYA_STORAGE_KEY = "beyaData";

const DEFAULT_DATA = {
    setupComplete: false,

    settings: {
        appearance: "system",
        clock24Hour: true,
        showSeconds: true,
        showDate: true,
        showLocation: true,

        clockColor: "#111318",
        clockSize: "large",
        clockWeight: "300",

        wallpaper: "",
        glassIntensity: "medium",

        soundEnabled: true,
        vibrationEnabled: true
    },

    security: {
        enabled: false,
        passcode: null
    },

    alarms: [],

    timers: [],

    reminders: [],

    events: [],

    personalDates: [],

    worldClocks: [],

    handwriting: {
        enabled: false,

        digits: {
            "0": null,
            "1": null,
            "2": null,
            "3": null,
            "4": null,
            "5": null,
            "6": null,
            "7": null,
            "8": null,
            "9": null,
            ":": null
        }
    }
};


/* =========================================================
   INTERNAL HELPERS
   ========================================================= */

function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
}


function mergeDeep(target, source) {
    const result = deepClone(target);

    if (!source || typeof source !== "object") {
        return result;
    }

    Object.keys(source).forEach((key) => {

        const sourceValue = source[key];

        if (
            sourceValue &&
            typeof sourceValue === "object" &&
            !Array.isArray(sourceValue) &&
            result[key] &&
            typeof result[key] === "object" &&
            !Array.isArray(result[key])
        ) {
            result[key] = mergeDeep(
                result[key],
                sourceValue
            );
        } else {
            result[key] = sourceValue;
        }
    });

    return result;
}


/* =========================================================
   LOAD DATA
   ========================================================= */

export function loadBeyaData() {

    try {

        const storedData =
            localStorage.getItem(BEYA_STORAGE_KEY);

        if (!storedData) {
            return deepClone(DEFAULT_DATA);
        }

        const parsedData =
            JSON.parse(storedData);

        return mergeDeep(
            DEFAULT_DATA,
            parsedData
        );

    } catch (error) {

        console.error(
            "Beya: Failed to load local data.",
            error
        );

        return deepClone(DEFAULT_DATA);
    }
}


/* =========================================================
   SAVE DATA
   ========================================================= */

export function saveBeyaData(data) {

    try {

        localStorage.setItem(
            BEYA_STORAGE_KEY,
            JSON.stringify(data)
        );

        return true;

    } catch (error) {

        console.error(
            "Beya: Failed to save local data.",
            error
        );

        return false;
    }
}


/* =========================================================
   UPDATE DATA
   ========================================================= */

export function updateBeyaData(updates) {

    const currentData =
        loadBeyaData();

    const updatedData =
        mergeDeep(
            currentData,
            updates
        );

    saveBeyaData(updatedData);

    return updatedData;
}


/* =========================================================
   GET A VALUE
   ========================================================= */

export function getBeyaValue(path, fallback = null) {

    const data =
        loadBeyaData();

    const parts =
        path.split(".");

    let value = data;

    for (const part of parts) {

        if (
            value === null ||
            value === undefined ||
            !(part in value)
        ) {
            return fallback;
        }

        value = value[part];
    }

    return value;
}


/* =========================================================
   SET A VALUE
   ========================================================= */

export function setBeyaValue(path, value) {

    const data =
        loadBeyaData();

    const parts =
        path.split(".");

    let target = data;

    for (
        let i = 0;
        i < parts.length - 1;
        i++
    ) {

        const part =
            parts[i];

        if (
            !target[part] ||
            typeof target[part] !== "object"
        ) {
            target[part] = {};
        }

        target =
            target[part];
    }

    target[
        parts[parts.length - 1]
    ] = value;

    saveBeyaData(data);

    return value;
}


/* =========================================================
   REMOVE A VALUE
   ========================================================= */

export function removeBeyaValue(path) {

    const data =
        loadBeyaData();

    const parts =
        path.split(".");

    let target = data;

    for (
        let i = 0;
        i < parts.length - 1;
        i++
    ) {

        if (
            !target[parts[i]]
        ) {
            return false;
        }

        target =
            target[parts[i]];
    }

    const finalKey =
        parts[parts.length - 1];

    if (
        Object.prototype.hasOwnProperty.call(
            target,
            finalKey
        )
    ) {

        delete target[finalKey];

        saveBeyaData(data);

        return true;
    }

    return false;
}


/* =========================================================
   SETUP STATUS
   ========================================================= */

export function isSetupComplete() {

    return Boolean(
        getBeyaValue(
            "setupComplete",
            false
        )
    );
}


export function markSetupComplete() {

    setBeyaValue(
        "setupComplete",
        true
    );
}


/* =========================================================
   RESET BEYA
   ========================================================= */

export function resetBeyaData() {

    try {

        localStorage.removeItem(
            BEYA_STORAGE_KEY
        );

        return true;

    } catch (error) {

        console.error(
            "Beya: Failed to reset data.",
            error
        );

        return false;
    }
}


/* =========================================================
   COLLECTION HELPERS
   ========================================================= */

export function addToCollection(
    collectionName,
    item
) {

    const data =
        loadBeyaData();

    if (
        !Array.isArray(
            data[collectionName]
        )
    ) {
        data[collectionName] = [];
    }

    const newItem = {
        id:
            crypto.randomUUID
                ? crypto.randomUUID()
                : Date.now().toString(),

        createdAt:
            new Date().toISOString(),

        ...item
    };

    data[collectionName].push(
        newItem
    );

    saveBeyaData(data);

    return newItem;
}


export function updateCollectionItem(
    collectionName,
    id,
    updates
) {

    const data =
        loadBeyaData();

    if (
        !Array.isArray(
            data[collectionName]
        )
    ) {
        return null;
    }

    const index =
        data[collectionName].findIndex(
            item => item.id === id
        );

    if (index === -1) {
        return null;
    }

    data[collectionName][index] = {
        ...data[collectionName][index],
        ...updates,
        updatedAt:
            new Date().toISOString()
    };

    saveBeyaData(data);

    return data[collectionName][index];
}


export function removeCollectionItem(
    collectionName,
    id
) {

    const data =
        loadBeyaData();

    if (
        !Array.isArray(
            data[collectionName]
        )
    ) {
        return false;
    }

    const originalLength =
        data[collectionName].length;

    data[collectionName] =
        data[collectionName].filter(
            item => item.id !== id
        );

    if (
        data[collectionName].length ===
        originalLength
    ) {
        return false;
    }

    saveBeyaData(data);

    return true;
}


export function getCollection(
    collectionName
) {

    const collection =
        getBeyaValue(
            collectionName,
            []
        );

    return Array.isArray(collection)
        ? collection
        : [];
}


/* =========================================================
   EXPORT DEFAULT DATA
   ========================================================= */

export {
    DEFAULT_DATA
};
