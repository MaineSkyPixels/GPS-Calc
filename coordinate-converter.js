/**
 * GPS Coordinate Converter
 * Converts between decimal degrees and degrees/minutes/seconds formats
 */

class CoordinateConverter {
    constructor() {
        this.decimalPrecision = 10; // Decimal places for decimal degrees
        this.dmsPrecision = 5; // Decimal places for seconds
    }

    /**
     * Convert decimal degrees to DMS format
     * @param {number} decimalDegrees - Decimal degrees
     * @param {boolean} includeCardinal - Include cardinal direction (N/S/E/W)
     * @returns {Object} - {degrees: number, minutes: number, seconds: number, cardinal: string}
     */
    decimalToDMS(decimalDegrees, includeCardinal = false) {
        if (isNaN(decimalDegrees) || !isFinite(decimalDegrees)) {
            return null;
        }

        const isNegative = decimalDegrees < 0;
        const absDegrees = Math.abs(decimalDegrees);
        
        const degrees = Math.floor(absDegrees);
        const minutesFloat = (absDegrees - degrees) * 60;
        const minutes = Math.floor(minutesFloat);
        const seconds = (minutesFloat - minutes) * 60;
        
        let cardinal = '';
        if (includeCardinal) {
            cardinal = isNegative ? 'S' : 'N';
        }

        return {
            degrees: isNegative ? -degrees : degrees,
            minutes: minutes,
            seconds: parseFloat(seconds.toFixed(this.dmsPrecision)),
            cardinal: cardinal
        };
    }

    /**
     * Convert DMS to decimal degrees
     * @param {number} degrees - Degrees
     * @param {number} minutes - Minutes
     * @param {number} seconds - Seconds
     * @param {string} cardinal - Cardinal direction (N/S/E/W)
     * @returns {number} - Decimal degrees
     */
    dmsToDecimal(degrees, minutes, seconds, cardinal = '') {
        if (isNaN(degrees) || isNaN(minutes) || isNaN(seconds)) {
            return null;
        }

        const isNegative = degrees < 0 || cardinal.toUpperCase() === 'S' || cardinal.toUpperCase() === 'W';
        const absDegrees = Math.abs(degrees);
        
        const decimal = absDegrees + minutes / 60 + seconds / 3600;
        return isNegative ? -decimal : decimal;
    }

    /**
     * Format DMS coordinates as a string
     * @param {Object} dms - DMS object from decimalToDMS
     * @param {boolean} includeSymbols - Include degree symbols (°, ', ")
     * @returns {string} - Formatted DMS string
     */
    formatDMS(dms, includeSymbols = true) {
        if (!dms) return '';

        const { degrees, minutes, seconds, cardinal } = dms;
        
        if (includeSymbols) {
            return `${Math.abs(degrees)}° ${minutes}' ${seconds.toFixed(this.dmsPrecision)}"${cardinal ? ' ' + cardinal : ''}`;
        } else {
            return `${Math.abs(degrees)} ${minutes} ${seconds.toFixed(this.dmsPrecision)}${cardinal ? ' ' + cardinal : ''}`;
        }
    }

    /**
     * Format decimal degrees as a string
     * @param {number} decimalDegrees - Decimal degrees
     * @param {number} precision - Number of decimal places
     * @returns {string} - Formatted decimal string
     */
    formatDecimal(decimalDegrees, precision = this.decimalPrecision) {
        if (isNaN(decimalDegrees) || !isFinite(decimalDegrees)) {
            return '';
        }
        
        return decimalDegrees.toFixed(precision);
    }

    /**
     * Convert a coordinate pair from decimal to DMS
     * @param {number} lat - Latitude in decimal degrees
     * @param {number} lon - Longitude in decimal degrees
     * @returns {Object} - {lat: string, lon: string}
     */
    convertToDMS(lat, lon) {
        const latDMS = this.decimalToDMS(lat, true);
        const lonDMS = this.decimalToDMS(lon, true);
        
        return {
            lat: this.formatDMS(latDMS),
            lon: this.formatDMS(lonDMS)
        };
    }

    /**
     * Convert a coordinate pair from DMS to decimal
     * @param {string} latStr - Latitude in DMS format
     * @param {string} lonStr - Longitude in DMS format
     * @returns {Object} - {lat: number, lon: number}
     */
    convertToDecimal(latStr, lonStr) {
        // This would typically use the CoordinateParser to parse DMS strings
        // For now, assuming the input is already parsed DMS components
        return {
            lat: parseFloat(latStr),
            lon: parseFloat(lonStr)
        };
    }

    /**
     * Format coordinates for clipboard copy (tab-separated)
     * @param {number} lat - Latitude
     * @param {number} lon - Longitude
     * @returns {string} - Tab-separated coordinate string
     */
    formatForClipboard(lat, lon) {
        return `${this.formatDecimal(lat)}\t${this.formatDecimal(lon)}`;
    }

    /**
     * Format coordinates for display with proper spacing
     * @param {number} lat - Latitude
     * @param {number} lon - Longitude
     * @param {string} separator - Separator between lat and lon
     * @returns {string} - Formatted coordinate string
     */
    formatForDisplay(lat, lon, separator = ' ') {
        return `${this.formatDecimal(lat)}${separator}${this.formatDecimal(lon)}`;
    }

    /**
     * Convert coordinates with elevation for distance calculations
     * @param {number} lat - Latitude
     * @param {number} lon - Longitude
     * @param {number} elevation - Elevation value
     * @param {string} elevationUnit - Unit of elevation ('meters', 'feet', 'survey-feet', 'ellipsoidal')
     * @returns {Object} - {lat: number, lon: number, elevation: number} (elevation in meters)
     */
    convertWithElevation(lat, lon, elevation, elevationUnit = 'meters') {
        let elevationInMeters = elevation;
        
        if (elevationUnit === 'feet') {
            elevationInMeters = elevation * 0.3048;
        } else if (elevationUnit === 'survey-feet') {
            elevationInMeters = elevation * 0.30480061;
        } else if (elevationUnit === 'ellipsoidal') {
            // Treat as meters (height above ellipsoid)
            elevationInMeters = elevation;
        }
        // 'meters' is already in meters, no conversion needed
        
        return {
            lat: lat,
            lon: lon,
            elevation: elevationInMeters
        };
    }

    /**
     * Validate and normalize coordinate values
     * @param {number} lat - Latitude
     * @param {number} lon - Longitude
     * @returns {Object|null} - Normalized coordinates or null if invalid
     */
    validateAndNormalize(lat, lon) {
        if (isNaN(lat) || isNaN(lon) || !isFinite(lat) || !isFinite(lon)) {
            return null;
        }

        // Normalize longitude to [-180, 180]
        let normalizedLon = lon;
        while (normalizedLon > 180) normalizedLon -= 360;
        while (normalizedLon < -180) normalizedLon += 360;

        // Validate latitude range
        if (lat < -90 || lat > 90) {
            return null;
        }

        return {
            lat: lat,
            lon: normalizedLon
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CoordinateConverter;
}
