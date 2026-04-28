// clint/src/utils/fingerprint.js

/**
 * Generates a simple, consistent browser fingerprint
 * Not 100% unique but enough to deter basic multi-account abuse
 */
export const getBrowserFingerprint = () => {
    const {
        userAgent,
        language,
        platform,
        deviceMemory,
        hardwareConcurrency
    } = window.navigator;
    const { width, height, colorDepth } = window.screen;
    const timezoneOffset = new Date().getTimezoneOffset();
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const data = [
        userAgent,
        language,
        platform,
        deviceMemory,
        hardwareConcurrency,
        width,
        height,
        colorDepth,
        timezoneOffset,
        timezone
    ].join('|');

    // Simple hash function
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
        const char = data.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    
    return 'RG-' + Math.abs(hash).toString(36).toUpperCase();
};
