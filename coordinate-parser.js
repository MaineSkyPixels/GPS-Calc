/**
 * GPS Coordinate Parser
 * Handles parsing of multiple GPS coordinate formats
 */

class CoordinateParser {
    constructor() {
        // Regex patterns for different coordinate formats
        this.patterns = {
            // DMS with symbols: 44° 28' 24.32661" -70° 53' 19.05717"
            dmsWithSymbols: /(-?\d+(?:\.\d+)?)°\s*(\d+(?:\.\d+)?)['′]\s*(\d+(?:\.\d+)?)["″]\s*([NS]?)\s*,?\s*(-?\d+(?:\.\d+)?)°\s*(\d+(?:\.\d+)?)['′]\s*(\d+(?:\.\d+)?)["″]\s*([EW]?)/i,
            
            // DMS with cardinal directions: N44° 28' 24.32661" W70° 53' 19.05717"
            dmsWithCardinal: /([NS])(\d+(?:\.\d+)?)°\s*(\d+(?:\.\d+)?)['′]\s*(\d+(?:\.\d+)?)["″]\s*,?\s*([EW])(\d+(?:\.\d+)?)°\s*(\d+(?:\.\d+)?)['′]\s*(\d+(?:\.\d+)?)["″]/i,
            
            // Decimal degrees: 44.4734245277 -70.88862750833
            decimalDegrees: /^(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)$/,
            
            // Decimal with cardinal: N44.4734245277 W70.88862750833
            decimalWithCardinal: /([NS])(\d+(?:\.\d+)?)\s*,?\s*([EW])(\d+(?:\.\d+)?)/i,

            // Space separated DMS (OPUS style): 41 48 15.79259 112 50 1.04150
            dmsSpaceSeparated: /^(-?\d+)\s+(\d+)\s+(\d+(?:\.\d+)?)\s+(-?\d+)\s+(\d+)\s+(\d+(?:\.\d+)?)$/
        };
    }

    /**
     * Parse a single coordinate string and return decimal coordinates
     * @param {string} input - The coordinate string to parse
     * @returns {Object|null} - {lat: number, lon: number} or null if parsing fails
     */
    parseCoordinate(input) {
        if (!input || typeof input !== 'string') {
            return null;
        }

        const trimmedInput = input.trim();
        
        // Try each pattern in order of specificity
        // Try space-separated DMS first as it's very specific
        let match = this.patterns.dmsSpaceSeparated.exec(trimmedInput);
        if (match) {
            return this.parseDMSSpaceSeparated(match);
        }

        match = this.patterns.dmsWithCardinal.exec(trimmedInput);
        if (match) {
            return this.parseDMSWithCardinal(match);
        }

        match = this.patterns.dmsWithSymbols.exec(trimmedInput);
        if (match) {
            return this.parseDMSWithSymbols(match);
        }

        match = this.patterns.decimalWithCardinal.exec(trimmedInput);
        if (match) {
            return this.parseDecimalWithCardinal(match);
        }

        match = this.patterns.decimalDegrees.exec(trimmedInput);
        if (match) {
            return this.parseDecimalDegrees(match);
        }

        return null;
    }

    /**
     * Parse DMS format separated by spaces
     * @param {Array} match - Regex match array
     * @returns {Object} - {lat: number, lon: number}
     */
    parseDMSSpaceSeparated(match) {
        const [, latDeg, latMin, latSec, lonDeg, lonMin, lonSec] = match;
        
        let lat = this.dmsToDecimal(parseFloat(latDeg), parseFloat(latMin), parseFloat(latSec));
        let lon = this.dmsToDecimal(parseFloat(lonDeg), parseFloat(lonMin), parseFloat(lonSec));
        
        return { lat, lon };
    }

    /**
     * Parse DMS format with cardinal directions
     * @param {Array} match - Regex match array
     * @returns {Object} - {lat: number, lon: number}
     */
    parseDMSWithCardinal(match) {
        const [, latCardinal, latDeg, latMin, latSec, lonCardinal, lonDeg, lonMin, lonSec] = match;
        
        let lat = this.dmsToDecimal(parseFloat(latDeg), parseFloat(latMin), parseFloat(latSec));
        let lon = this.dmsToDecimal(parseFloat(lonDeg), parseFloat(lonMin), parseFloat(lonSec));
        
        // Apply cardinal direction signs
        if (latCardinal.toUpperCase() === 'S') lat = -lat;
        if (lonCardinal.toUpperCase() === 'W') lon = -lon;
        
        return { lat, lon };
    }

    /**
     * Parse DMS format with symbols only
     * @param {Array} match - Regex match array
     * @returns {Object} - {lat: number, lon: number}
     */
    parseDMSWithSymbols(match) {
        const [, latDeg, latMin, latSec, latCardinal, lonDeg, lonMin, lonSec, lonCardinal] = match;
        
        let lat = this.dmsToDecimal(parseFloat(latDeg), parseFloat(latMin), parseFloat(latSec));
        let lon = this.dmsToDecimal(parseFloat(lonDeg), parseFloat(lonMin), parseFloat(lonSec));
        
        // Apply cardinal direction signs
        if (latCardinal && latCardinal.toUpperCase() === 'S') lat = -lat;
        if (lonCardinal && lonCardinal.toUpperCase() === 'W') lon = -lon;
        
        return { lat, lon };
    }

    /**
     * Parse decimal format with cardinal directions
     * @param {Array} match - Regex match array
     * @returns {Object} - {lat: number, lon: number}
     */
    parseDecimalWithCardinal(match) {
        const [, latCardinal, latDeg, lonCardinal, lonDeg] = match;
        
        let lat = parseFloat(latDeg);
        let lon = parseFloat(lonDeg);
        
        // Apply cardinal direction signs
        if (latCardinal.toUpperCase() === 'S') lat = -lat;
        if (lonCardinal.toUpperCase() === 'W') lon = -lon;
        
        return { lat, lon };
    }

    /**
     * Parse simple decimal degrees format
     * @param {Array} match - Regex match array
     * @returns {Object} - {lat: number, lon: number}
     */
    parseDecimalDegrees(match) {
        const [, latStr, lonStr] = match;
        return {
            lat: parseFloat(latStr),
            lon: parseFloat(lonStr)
        };
    }

    /**
     * Convert DMS to decimal degrees
     * @param {number} degrees - Degrees
     * @param {number} minutes - Minutes
     * @param {number} seconds - Seconds
     * @returns {number} - Decimal degrees
     */
    dmsToDecimal(degrees, minutes, seconds) {
        const sign = degrees < 0 ? -1 : 1;
        return sign * (Math.abs(degrees) + minutes / 60 + seconds / 3600);
    }

    /**
     * Parse multiple coordinates from a text input (one per line)
     * @param {string} input - Multi-line coordinate text
     * @returns {Array} - Array of {lat: number, lon: number, elevation?: number}
     */
    parseMultipleCoordinates(input) {
        if (!input || typeof input !== 'string') {
            return [];
        }

        const lines = input.split('\n').filter(line => line.trim());
        const coordinates = [];

        for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;

            // Try to parse coordinate with optional elevation
            const coordWithElevation = this.parseCoordinateWithElevation(trimmedLine);
            if (coordWithElevation) {
                coordinates.push(coordWithElevation);
            }
        }

        return coordinates;
    }

    /**
     * Parse coordinate with optional elevation
     * @param {string} input - Coordinate string with optional elevation
     * @returns {Object|null} - {lat: number, lon: number, elevation?: number}
     */
    parseCoordinateWithElevation(input) {
        // Split by common delimiters and try to extract elevation
        const parts = input.split(/[\s,;|\t]+/).filter(part => part.trim());
        
        if (parts.length < 2) {
            return null;
        }

        // Try different combinations
        let coordinateStr, elevation;
        
        if (parts.length === 2) {
            // Only lat, lon
            coordinateStr = parts.join(' ');
        } else if (parts.length === 3) {
            // lat, lon, elevation
            coordinateStr = parts.slice(0, 2).join(' ');
            elevation = parseFloat(parts[2]);
        } else {
            // More than 3 parts - try to find coordinate pattern
            // Try 6 parts first (for space-separated DMS), then 2 parts (for decimal)
            const coordinateCounts = [6, 2];
            
            for (const count of coordinateCounts) {
                if (parts.length >= count) {
                    for (let i = 0; i <= parts.length - count; i++) {
                        const testStr = parts.slice(i, i + count).join(' ');
                        const coord = this.parseCoordinate(testStr);
                        if (coord) {
                            coordinateStr = testStr;
                            // Check if there's an elevation after the coordinate
                            if (i + count < parts.length) {
                                elevation = parseFloat(parts[i + count]);
                            }
                            break;
                        }
                    }
                }
                if (coordinateStr) break;
            }
            
            if (!coordinateStr) {
                // Fallback: try first two parts as coordinate
                coordinateStr = parts.slice(0, 2).join(' ');
                if (parts.length > 2) {
                    elevation = parseFloat(parts[2]);
                }
            }
        }

        const coordinate = this.parseCoordinate(coordinateStr);
        if (!coordinate) {
            return null;
        }

        return {
            lat: coordinate.lat,
            lon: coordinate.lon,
            elevation: elevation !== undefined ? elevation : null
        };
    }

    /**
     * Detect the format of a coordinate string
     * @param {string} input - Coordinate string
     * @returns {string} - Format type ('dms', 'decimal', 'unknown')
     */
    detectFormat(input) {
        if (!input || typeof input !== 'string') {
            return 'unknown';
        }

        const trimmedInput = input.trim();

        if (this.patterns.dmsWithCardinal.test(trimmedInput) || 
            this.patterns.dmsWithSymbols.test(trimmedInput) ||
            this.patterns.dmsSpaceSeparated.test(trimmedInput)) {
            return 'dms';
        }

        if (this.patterns.decimalWithCardinal.test(trimmedInput) || 
            this.patterns.decimalDegrees.test(trimmedInput)) {
            return 'decimal';
        }

        return 'unknown';
    }

    /**
     * Validate coordinate values
     * @param {number} lat - Latitude
     * @param {number} lon - Longitude
     * @returns {boolean} - True if valid
     */
    validateCoordinates(lat, lon) {
        return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180 && 
               !isNaN(lat) && !isNaN(lon) && isFinite(lat) && isFinite(lon);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CoordinateParser;
}
