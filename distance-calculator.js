/**
 * Distance Calculator
 * Calculates 2D and 3D distances between GPS coordinates
 */

class DistanceCalculator {
    constructor() {
        // Earth's radius in kilometers
        this.earthRadiusKm = 6371;
        this.earthRadiusMiles = 3959;
    }

    /**
     * Calculate 2D distance using Haversine formula
     * @param {number} lat1 - Latitude of first point
     * @param {number} lon1 - Longitude of first point
     * @param {number} lat2 - Latitude of second point
     * @param {number} lon2 - Longitude of second point
     * @returns {Object} - {km: number, miles: number}
     */
    calculate2DDistance(lat1, lon1, lat2, lon2) {
        // Validate inputs
        if (!this.validateCoordinates(lat1, lon1) || !this.validateCoordinates(lat2, lon2)) {
            return null;
        }

        // Convert to radians
        const lat1Rad = this.toRadians(lat1);
        const lon1Rad = this.toRadians(lon1);
        const lat2Rad = this.toRadians(lat2);
        const lon2Rad = this.toRadians(lon2);

        // Calculate differences
        const deltaLat = lat2Rad - lat1Rad;
        const deltaLon = lon2Rad - lon1Rad;

        // Haversine formula
        const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
                  Math.cos(lat1Rad) * Math.cos(lat2Rad) *
                  Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
        const distanceKm = this.earthRadiusKm * c;
        const distanceMiles = this.earthRadiusMiles * c;

        return {
            km: parseFloat(distanceKm.toFixed(6)),
            miles: parseFloat(distanceMiles.toFixed(6))
        };
    }

    /**
     * Calculate 3D distance accounting for elevation
     * @param {number} lat1 - Latitude of first point
     * @param {number} lon1 - Longitude of first point
     * @param {number} elev1 - Elevation of first point (in meters)
     * @param {number} lat2 - Latitude of second point
     * @param {number} lon2 - Longitude of second point
     * @param {number} elev2 - Elevation of second point (in meters)
     * @returns {Object} - {km: number, miles: number}
     */
    calculate3DDistance(lat1, lon1, elev1, lat2, lon2, elev2) {
        // Calculate 2D distance first
        const distance2D = this.calculate2DDistance(lat1, lon1, lat2, lon2);
        if (!distance2D) {
            return null;
        }

        // Validate elevations
        if (isNaN(elev1) || isNaN(elev2) || !isFinite(elev1) || !isFinite(elev2)) {
            return distance2D; // Return 2D distance if elevation is invalid
        }

        // Calculate elevation difference
        const elevationDiff = Math.abs(elev1 - elev2);

        // Calculate 3D distance using Pythagorean theorem
        // Convert 2D distance to meters for calculation
        const distance2DMeters = distance2D.km * 1000;
        const distance3DMeters = Math.sqrt(
            Math.pow(distance2DMeters, 2) + Math.pow(elevationDiff, 2)
        );

        // Convert back to km and miles
        const distance3DKm = distance3DMeters / 1000;
        const distance3DMiles = distance3DKm * 0.621371;

        return {
            km: parseFloat(distance3DKm.toFixed(6)),
            miles: parseFloat(distance3DMiles.toFixed(6))
        };
    }

    /**
     * Calculate distance matrix for multiple coordinates
     * @param {Array} coordinates - Array of {lat: number, lon: number, elevation?: number}
     * @param {boolean} include2D - Include 2D distances
     * @param {boolean} include3D - Include 3D distances
     * @returns {Object} - Distance matrix and statistics
     */
    calculateDistanceMatrix(coordinates, include2D = true, include3D = true) {
        if (!coordinates || coordinates.length < 2) {
            return null;
        }

        const n = coordinates.length;
        const matrix2D = include2D ? this.createEmptyMatrix(n) : null;
        const matrix3D = include3D ? this.createEmptyMatrix(n) : null;
        
        const distances2D = [];
        const distances3D = [];

        // Calculate all pairwise distances
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (i === j) {
                    // Same point - distance is 0
                    if (matrix2D) matrix2D[i][j] = { km: 0, miles: 0 };
                    if (matrix3D) matrix3D[i][j] = { km: 0, miles: 0 };
                } else {
                    const coord1 = coordinates[i];
                    const coord2 = coordinates[j];

                    // Calculate 2D distance
                    if (matrix2D) {
                        const dist2D = this.calculate2DDistance(
                            coord1.lat, coord1.lon, coord2.lat, coord2.lon
                        );
                        matrix2D[i][j] = dist2D;
                        if (dist2D) distances2D.push(dist2D.km);
                    }

                    // Calculate 3D distance
                    if (matrix3D) {
                        const dist3D = this.calculate3DDistance(
                            coord1.lat, coord1.lon, coord1.elevation || 0,
                            coord2.lat, coord2.lon, coord2.elevation || 0
                        );
                        matrix3D[i][j] = dist3D;
                        if (dist3D) distances3D.push(dist3D.km);
                    }
                }
            }
        }

        // Calculate statistics
        const stats2D = include2D ? this.calculateStatistics(distances2D) : null;
        const stats3D = include3D ? this.calculateStatistics(distances3D) : null;

        // Calculate cumulative distance (following sequence 1→2→3→...→n)
        const cumulative2D = include2D ? this.calculateCumulativeDistance(coordinates, false) : null;
        const cumulative3D = include3D ? this.calculateCumulativeDistance(coordinates, true) : null;

        return {
            matrix2D,
            matrix3D,
            statistics2D: stats2D,
            statistics3D: stats3D,
            cumulative2D,
            cumulative3D,
            coordinates: coordinates.map((coord, index) => ({
                ...coord,
                label: `Point ${index + 1}`
            }))
        };
    }

    /**
     * Calculate cumulative distance following the sequence of coordinates
     * @param {Array} coordinates - Array of coordinates
     * @param {boolean} include3D - Include elevation in calculation
     * @returns {Object} - Cumulative distance statistics
     */
    calculateCumulativeDistance(coordinates, include3D = false) {
        if (!coordinates || coordinates.length < 2) {
            return null;
        }

        let totalDistanceKm = 0;
        let totalDistanceMiles = 0;
        const segmentDistances = [];

        for (let i = 0; i < coordinates.length - 1; i++) {
            const coord1 = coordinates[i];
            const coord2 = coordinates[i + 1];

            let distance;
            if (include3D) {
                distance = this.calculate3DDistance(
                    coord1.lat, coord1.lon, coord1.elevation || 0,
                    coord2.lat, coord2.lon, coord2.elevation || 0
                );
            } else {
                distance = this.calculate2DDistance(
                    coord1.lat, coord1.lon, coord2.lat, coord2.lon
                );
            }

            if (distance) {
                totalDistanceKm += distance.km;
                totalDistanceMiles += distance.miles;
                segmentDistances.push({
                    from: i + 1,
                    to: i + 2,
                    distance: distance
                });
            }
        }

        return {
            totalKm: parseFloat(totalDistanceKm.toFixed(6)),
            totalMiles: parseFloat(totalDistanceMiles.toFixed(6)),
            segments: segmentDistances
        };
    }

    /**
     * Calculate statistics for an array of distances
     * @param {Array} distances - Array of distance values in km
     * @returns {Object} - Statistics object
     */
    calculateStatistics(distances) {
        if (!distances || distances.length === 0) {
            return null;
        }

        const sorted = [...distances].sort((a, b) => a - b);
        const sum = distances.reduce((acc, val) => acc + val, 0);
        const average = sum / distances.length;

        return {
            min: parseFloat(sorted[0].toFixed(6)),
            max: parseFloat(sorted[sorted.length - 1].toFixed(6)),
            average: parseFloat(average.toFixed(6)),
            count: distances.length
        };
    }

    /**
     * Create empty matrix for distance calculations
     * @param {number} size - Matrix size
     * @returns {Array} - Empty matrix
     */
    createEmptyMatrix(size) {
        const matrix = [];
        for (let i = 0; i < size; i++) {
            matrix[i] = new Array(size);
        }
        return matrix;
    }

    /**
     * Convert degrees to radians
     * @param {number} degrees - Degrees
     * @returns {number} - Radians
     */
    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    /**
     * Convert radians to degrees
     * @param {number} radians - Radians
     * @returns {number} - Degrees
     */
    toDegrees(radians) {
        return radians * (180 / Math.PI);
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

    /**
     * Format distance for display
     * @param {number} distance - Distance value
     * @param {string} unit - Unit ('km' or 'miles')
     * @param {number} precision - Decimal places
     * @returns {string} - Formatted distance string
     */
    formatDistance(distance, unit, precision = 6) {
        if (isNaN(distance) || !isFinite(distance)) {
            return 'N/A';
        }
        
        return `${distance.toFixed(precision)} ${unit}`;
    }

    /**
     * Convert elevation between different units
     * @param {number} elevation - Elevation value
     * @param {string} fromUnit - Source unit
     * @param {string} toUnit - Target unit
     * @returns {number} - Converted elevation
     */
    convertElevation(elevation, fromUnit, toUnit) {
        if (fromUnit === toUnit) {
            return elevation;
        }

        // Convert to meters first
        let meters;
        switch (fromUnit) {
            case 'meters':
                meters = elevation;
                break;
            case 'feet':
                meters = elevation * 0.3048;
                break;
            case 'survey-feet':
                meters = elevation * 0.30480061;
                break;
            default:
                return elevation;
        }

        // Convert from meters to target unit
        switch (toUnit) {
            case 'meters':
                return meters;
            case 'feet':
                return meters / 0.3048;
            case 'survey-feet':
                return meters / 0.30480061;
            default:
                return meters;
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DistanceCalculator;
}
