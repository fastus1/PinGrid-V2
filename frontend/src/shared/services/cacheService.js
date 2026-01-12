/**
 * Cache Service - IndexedDB
 * 
 * Manages static page caching for View mode.
 * Uses IndexedDB for persistent, structured storage.
 */

const DB_NAME = 'pingrid-cache';
const DB_VERSION = 1;
const STORE_NAME = 'page-cache';

let db = null;

/**
 * Initialize IndexedDB connection
 * @returns {Promise<IDBDatabase>}
 */
async function initDB() {
    if (db) return db;

    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const database = event.target.result;

            // Create object store for page caches
            if (!database.objectStoreNames.contains(STORE_NAME)) {
                database.createObjectStore(STORE_NAME, { keyPath: 'pageId' });
            }
        };
    });
}

/**
 * Save page cache to IndexedDB
 * @param {string} pageId - UUID of the page
 * @param {object} data - Full page data including sections, groups, bookmarks
 * @returns {Promise<boolean>}
 */
export async function savePageCache(pageId, data) {
    try {
        const database = await initDB();

        return new Promise((resolve, reject) => {
            const transaction = database.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);

            const cacheEntry = {
                pageId,
                generatedAt: new Date().toISOString(),
                data
            };

            const request = store.put(cacheEntry);

            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('Error saving page cache:', error);
        return false;
    }
}

/**
 * Get cached page from IndexedDB
 * @param {string} pageId - UUID of the page
 * @returns {Promise<object|null>} Cached page data or null
 */
export async function getPageCache(pageId) {
    try {
        const database = await initDB();

        return new Promise((resolve, reject) => {
            const transaction = database.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(pageId);

            request.onsuccess = () => {
                const result = request.result;
                resolve(result ? result.data : null);
            };
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('Error getting page cache:', error);
        return null;
    }
}

/**
 * Get all cached pages
 * @returns {Promise<object>} Map of pageId -> cached data
 */
export async function getAllPageCaches() {
    try {
        const database = await initDB();

        return new Promise((resolve, reject) => {
            const transaction = database.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => {
                const caches = {};
                request.result.forEach(entry => {
                    caches[entry.pageId] = entry.data;
                });
                resolve(caches);
            };
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('Error getting all page caches:', error);
        return {};
    }
}

/**
 * Clear specific page cache
 * @param {string} pageId - UUID of the page
 * @returns {Promise<boolean>}
 */
export async function clearPageCache(pageId) {
    try {
        const database = await initDB();

        return new Promise((resolve, reject) => {
            const transaction = database.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(pageId);

            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('Error clearing page cache:', error);
        return false;
    }
}

/**
 * Clear all caches
 * @returns {Promise<boolean>}
 */
export async function clearAllCaches() {
    try {
        const database = await initDB();

        return new Promise((resolve, reject) => {
            const transaction = database.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.clear();

            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('Error clearing all caches:', error);
        return false;
    }
}

/**
 * Check if a cached page exists and get its age
 * @param {string} pageId - UUID of the page
 * @returns {Promise<{exists: boolean, age: number|null}>} Age in milliseconds
 */
export async function getCacheInfo(pageId) {
    try {
        const database = await initDB();

        return new Promise((resolve, reject) => {
            const transaction = database.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(pageId);

            request.onsuccess = () => {
                const result = request.result;
                if (!result) {
                    resolve({ exists: false, age: null });
                } else {
                    const age = Date.now() - new Date(result.generatedAt).getTime();
                    resolve({ exists: true, age, generatedAt: result.generatedAt });
                }
            };
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('Error getting cache info:', error);
        return { exists: false, age: null };
    }
}

export default {
    savePageCache,
    getPageCache,
    getAllPageCaches,
    clearPageCache,
    clearAllCaches,
    getCacheInfo
};
