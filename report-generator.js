/**
 * Report Generator for GPS Calculator
 * Creates self-contained HTML reports with all data embedded
 */
class ReportGenerator {
    constructor() {
        this.reportTemplate = this.getReportTemplate();
    }

    /**
     * Generate a complete HTML report
     * @param {Object} calculationData - Complete calculation data
     * @param {Object} settings - Application settings
     * @returns {string} - Complete HTML report
     */
    generateReport(calculationData, settings) {
        const reportData = this.prepareReportData(calculationData, settings);
        return this.buildReportHTML(reportData);
    }

    /**
     * Prepare data for report generation
     * @param {Object} calculationData - Raw calculation data
     * @param {Object} settings - Application settings
     * @returns {Object} - Formatted report data
     */
    prepareReportData(calculationData, settings) {
        const unitSystem = settings.unitSystem || 'meters';
        const isReferenceMode = settings.referenceMode || false;
        const isCondensed = settings.condensedOutput || false;

        return {
            title: calculationData.name || 'GPS Calculation Report',
            timestamp: new Date().toLocaleString(),
            coordinates: calculationData.coordinates || [],
            results: calculationData.results || {},
            settings: {
                unitSystem: unitSystem,
                referenceMode: isReferenceMode,
                condensedOutput: isCondensed
            },
            statistics: this.calculateStatistics(calculationData.results, unitSystem),
            calculations: this.formatCalculations(calculationData.results, calculationData.coordinates, unitSystem, isReferenceMode, isCondensed)
        };
    }

    /**
     * Calculate statistics for the report
     * @param {Object} results - Calculation results
     * @param {string} unitSystem - Unit system
     * @returns {Object} - Formatted statistics
     */
    calculateStatistics(results, unitSystem) {
        const stats = {};
        
        if (results.statistics2D) {
            stats.d2d = this.formatDistanceWithUnits(results.statistics2D.min, unitSystem);
            stats.d2dMax = this.formatDistanceWithUnits(results.statistics2D.max, unitSystem);
            stats.d2dAvg = this.formatDistanceWithUnits(results.statistics2D.average, unitSystem);
        }
        
        if (results.statistics3D) {
            stats.d3d = this.formatDistanceWithUnits(results.statistics3D.min, unitSystem);
            stats.d3dMax = this.formatDistanceWithUnits(results.statistics3D.max, unitSystem);
            stats.d3dAvg = this.formatDistanceWithUnits(results.statistics3D.average, unitSystem);
        }
        
        if (results.cumulative2D) {
            stats.cumulative2D = this.formatDistanceWithUnits(results.cumulative2D.totalKm, unitSystem);
        }
        
        if (results.cumulative3D) {
            stats.cumulative3D = this.formatDistanceWithUnits(results.cumulative3D.totalKm, unitSystem);
        }
        
        return stats;
    }

    /**
     * Format calculations for the report
     * @param {Object} results - Calculation results
     * @param {Array} coordinates - Coordinate data
     * @param {string} unitSystem - Unit system
     * @param {boolean} isReferenceMode - Reference mode flag
     * @param {boolean} isCondensed - Condensed output flag
     * @returns {Array} - Formatted calculations
     */
    formatCalculations(results, coordinates, unitSystem, isReferenceMode, isCondensed) {
        const calculations = [];
        
        if (isReferenceMode) {
            // Reference mode calculations
            const referenceIndex = 0; // Assuming first coordinate is reference
            const referenceCoord = coordinates[referenceIndex];
            
            for (let i = 1; i < coordinates.length; i++) {
                const calc = this.calculateDistanceBetween(referenceCoord, coordinates[i], unitSystem);
                calculations.push({
                    from: referenceCoord.name || `Point ${referenceIndex + 1}`,
                    to: coordinates[i].name || `Point ${i + 1}`,
                    horizontal: calc.horizontal,
                    vertical: calc.vertical,
                    total: calc.total,
                    assessment: calc.assessment
                });
            }
        } else {
            // All pairwise calculations
            for (let i = 0; i < coordinates.length; i++) {
                for (let j = i + 1; j < coordinates.length; j++) {
                    const calc = this.calculateDistanceBetween(coordinates[i], coordinates[j], unitSystem);
                    calculations.push({
                        from: coordinates[i].name || `Point ${i + 1}`,
                        to: coordinates[j].name || `Point ${j + 1}`,
                        horizontal: calc.horizontal,
                        vertical: calc.vertical,
                        total: calc.total,
                        assessment: calc.assessment
                    });
                }
            }
        }
        
        return calculations;
    }

    /**
     * Calculate distance between two coordinates
     * @param {Object} coord1 - First coordinate
     * @param {Object} coord2 - Second coordinate
     * @param {string} unitSystem - Unit system
     * @returns {Object} - Distance calculation results
     */
    calculateDistanceBetween(coord1, coord2, unitSystem) {
        // Calculate horizontal distance
        const deltaLat = coord2.lat - coord1.lat;
        const deltaLon = coord2.lon - coord1.lon;
        
        const latRad = coord1.lat * Math.PI / 180;
        const metersPerDegreeLat = 111132.92 - 559.82 * Math.cos(2 * latRad) + 1.175 * Math.cos(4 * latRad);
        const metersPerDegreeLon = 111412.84 * Math.cos(latRad) - 93.5 * Math.cos(3 * latRad);
        
        const deltaLatMeters = deltaLat * metersPerDegreeLat;
        const deltaLonMeters = deltaLon * metersPerDegreeLon;
        const horizontalDistance = Math.sqrt(deltaLatMeters * deltaLatMeters + deltaLonMeters * deltaLonMeters);
        
        // Calculate vertical distance
        const deltaHeight = coord2.elevation - coord1.elevation;
        const distance3D = Math.sqrt(horizontalDistance * horizontalDistance + deltaHeight * deltaHeight);
        
        return {
            horizontal: this.formatDistanceWithUnits(horizontalDistance / 1000, unitSystem),
            vertical: this.formatDistanceWithUnits(Math.abs(deltaHeight) / 1000, unitSystem),
            total: this.formatDistanceWithUnits(distance3D / 1000, unitSystem),
            assessment: this.getDistanceAssessment(horizontalDistance, Math.abs(deltaHeight))
        };
    }

    /**
     * Format distance with appropriate units
     * @param {number} kmValue - Distance in kilometers
     * @param {string} unitSystem - Unit system
     * @returns {Object} - Formatted distance
     */
    formatDistanceWithUnits(kmValue, unitSystem) {
        if (isNaN(kmValue) || !isFinite(kmValue) || kmValue < 0) {
            return { value: 0, unit: this.getDefaultUnit(unitSystem) };
        }

        switch (unitSystem) {
            case 'feet':
                return this.formatInFeet(kmValue);
            case 'survey-feet':
                return this.formatInSurveyFeet(kmValue);
            case 'meters':
            default:
                return this.formatInMeters(kmValue);
        }
    }

    /**
     * Format in metric units
     * @param {number} kmValue - Distance in kilometers
     * @returns {Object} - Formatted distance
     */
    formatInMeters(kmValue) {
        const meters = kmValue * 1000;
        const centimeters = meters * 100;
        const millimeters = centimeters * 10;

        if (millimeters >= 0.1 && millimeters < 10) {
            return { value: parseFloat(millimeters.toFixed(3)), unit: 'mm' };
        } else if (millimeters >= 10 && millimeters < 1000) {
            return { value: parseFloat((millimeters / 10).toFixed(4)), unit: 'cm' };
        } else if (centimeters >= 100 && centimeters < 10000) {
            return { value: parseFloat((centimeters / 100).toFixed(3)), unit: 'm' };
        } else if (meters >= 0.001 && meters < 1000) {
            if (meters < 1) {
                return { value: parseFloat(meters.toFixed(6)), unit: 'm' };
            } else {
                return { value: parseFloat(meters.toFixed(3)), unit: 'm' };
            }
        } else {
            return { value: parseFloat(kmValue.toFixed(6)), unit: 'km' };
        }
    }

    /**
     * Format in imperial feet
     * @param {number} kmValue - Distance in kilometers
     * @returns {Object} - Formatted distance
     */
    formatInFeet(kmValue) {
        const meters = kmValue * 1000;
        const feet = meters / 0.3048;
        const inches = feet * 12;
        const miles = feet / 5280;

        if (inches >= 0.1 && inches < 12) {
            return { value: parseFloat(inches.toFixed(3)), unit: 'in' };
        } else if (feet >= 1 && feet < 5280) {
            return { value: parseFloat(feet.toFixed(3)), unit: 'ft' };
        } else {
            return { value: parseFloat(miles.toFixed(6)), unit: 'mi' };
        }
    }

    /**
     * Format in US Survey feet
     * @param {number} kmValue - Distance in kilometers
     * @returns {Object} - Formatted distance
     */
    formatInSurveyFeet(kmValue) {
        const meters = kmValue * 1000;
        const surveyFeet = meters / 0.30480061;
        const inches = surveyFeet * 12;
        const miles = surveyFeet / 5280;

        if (inches >= 0.1 && inches < 12) {
            return { value: parseFloat(inches.toFixed(3)), unit: 'in' };
        } else if (surveyFeet >= 1 && surveyFeet < 5280) {
            return { value: parseFloat(surveyFeet.toFixed(3)), unit: 'ft' };
        } else {
            return { value: parseFloat(miles.toFixed(6)), unit: 'mi' };
        }
    }

    /**
     * Get default unit for system
     * @param {string} unitSystem - Unit system
     * @returns {string} - Default unit
     */
    getDefaultUnit(unitSystem) {
        switch (unitSystem) {
            case 'feet':
            case 'survey-feet':
                return 'ft';
            case 'meters':
            default:
                return 'm';
        }
    }

    /**
     * Get distance assessment
     * @param {number} horizontal - Horizontal distance in meters
     * @param {number} vertical - Vertical distance in meters
     * @returns {string} - Assessment text
     */
    getDistanceAssessment(horizontal, vertical) {
        const total = Math.sqrt(horizontal * horizontal + vertical * vertical);
        
        if (total < 0.001) {
            return "Exceptional precision — sub-millimeter accuracy (First Order Survey)";
        } else if (total < 0.003) {
            return "Excellent precision — sub-3mm accuracy (First Order Survey)";
        } else if (total < 0.01) {
            return "High precision — sub-1cm accuracy (Second Order Class I)";
        } else if (total < 0.03) {
            return "Good precision — sub-3cm accuracy (Second Order Class II)";
        } else if (total < 0.1) {
            return "Acceptable precision — sub-10cm accuracy (Third Order)";
        } else if (total < 0.3) {
            return "Moderate precision — sub-30cm accuracy (Third Order)";
        } else if (total < 1) {
            return "Low precision — sub-1m accuracy (Fourth Order)";
        } else {
            return "Poor precision — 1m+ accuracy (Below survey standards)";
        }
    }

    /**
     * Build the complete HTML report
     * @param {Object} data - Report data
     * @returns {string} - Complete HTML report
     */
    buildReportHTML(data) {
        return this.reportTemplate
            .replace('{{TITLE}}', data.title)
            .replace('{{TIMESTAMP}}', data.timestamp)
            .replace('{{UNIT_SYSTEM}}', data.settings.unitSystem)
            .replace('{{REFERENCE_MODE}}', data.settings.referenceMode ? 'Yes' : 'No')
            .replace('{{CONDENSED_OUTPUT}}', data.settings.condensedOutput ? 'Yes' : 'No')
            .replace('{{COORDINATES_TABLE}}', this.buildCoordinatesTable(data.coordinates))
            .replace('{{CALCULATIONS_TABLE}}', this.buildCalculationsTable(data.calculations))
            .replace('{{STATISTICS}}', this.buildStatistics(data.statistics))
            .replace('{{SURVEYING_STANDARDS}}', this.buildSurveyingStandards());
    }

    /**
     * Build coordinates table HTML
     * @param {Array} coordinates - Coordinate data
     * @returns {string} - HTML table
     */
    buildCoordinatesTable(coordinates) {
        if (!coordinates || coordinates.length === 0) {
            return '<p>No coordinates available.</p>';
        }

        const rows = coordinates.map((coord, index) => `
            <tr>
                <td>${coord.name || `Point ${index + 1}`}</td>
                <td>${coord.lat.toFixed(8)}</td>
                <td>${coord.lon.toFixed(8)}</td>
                <td>${coord.elevation ? coord.elevation.toFixed(3) : 'N/A'}</td>
            </tr>
        `).join('');

        return `
            <table class="report-table">
                <thead>
                    <tr>
                        <th>Point</th>
                        <th>Latitude</th>
                        <th>Longitude</th>
                        <th>Elevation (m)</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        `;
    }

    /**
     * Build calculations table HTML
     * @param {Array} calculations - Calculation data
     * @returns {string} - HTML table
     */
    buildCalculationsTable(calculations) {
        if (!calculations || calculations.length === 0) {
            return '<p>No calculations available.</p>';
        }

        const rows = calculations.map(calc => `
            <tr>
                <td>${calc.from}</td>
                <td>${calc.to}</td>
                <td>${calc.horizontal.value} ${calc.horizontal.unit}</td>
                <td>${calc.vertical.value} ${calc.vertical.unit}</td>
                <td>${calc.total.value} ${calc.total.unit}</td>
                <td class="assessment">${calc.assessment}</td>
            </tr>
        `).join('');

        return `
            <table class="report-table">
                <thead>
                    <tr>
                        <th>From</th>
                        <th>To</th>
                        <th>Horizontal Distance</th>
                        <th>Vertical Distance</th>
                        <th>3D Distance</th>
                        <th>Survey Assessment</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        `;
    }

    /**
     * Build statistics HTML
     * @param {Object} stats - Statistics data
     * @returns {string} - HTML statistics
     */
    buildStatistics(stats) {
        let html = '<div class="statistics-grid">';
        
        if (stats.d2d) {
            html += `
                <div class="stat-card">
                    <h4>2D Distances</h4>
                    <p><strong>Minimum:</strong> ${stats.d2d.value} ${stats.d2d.unit}</p>
                    <p><strong>Maximum:</strong> ${stats.d2dMax.value} ${stats.d2dMax.unit}</p>
                    <p><strong>Average:</strong> ${stats.d2dAvg.value} ${stats.d2dAvg.unit}</p>
                </div>
            `;
        }
        
        if (stats.d3d) {
            html += `
                <div class="stat-card">
                    <h4>3D Distances</h4>
                    <p><strong>Minimum:</strong> ${stats.d3d.value} ${stats.d3d.unit}</p>
                    <p><strong>Maximum:</strong> ${stats.d3dMax.value} ${stats.d3dMax.unit}</p>
                    <p><strong>Average:</strong> ${stats.d3dAvg.value} ${stats.d3dAvg.unit}</p>
                </div>
            `;
        }
        
        if (stats.cumulative2D) {
            html += `
                <div class="stat-card">
                    <h4>Cumulative 2D</h4>
                    <p><strong>Total:</strong> ${stats.cumulative2D.value} ${stats.cumulative2D.unit}</p>
                </div>
            `;
        }
        
        if (stats.cumulative3D) {
            html += `
                <div class="stat-card">
                    <h4>Cumulative 3D</h4>
                    <p><strong>Total:</strong> ${stats.cumulative3D.value} ${stats.cumulative3D.unit}</p>
                </div>
            `;
        }
        
        html += '</div>';
        return html;
    }

    /**
     * Build surveying standards HTML
     * @returns {string} - HTML standards table
     */
    buildSurveyingStandards() {
        return `
            <table class="standards-table">
                <thead>
                    <tr>
                        <th>Survey Grade</th>
                        <th>Accuracy Range</th>
                        <th>Applications</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>First Order</strong></td>
                        <td>±1mm to ±3mm</td>
                        <td>Geodetic control, high-precision engineering</td>
                    </tr>
                    <tr>
                        <td><strong>Second Order Class I</strong></td>
                        <td>±3mm to ±10mm</td>
                        <td>Precise engineering surveys</td>
                    </tr>
                    <tr>
                        <td><strong>Second Order Class II</strong></td>
                        <td>±10mm to ±30mm</td>
                        <td>General construction surveys</td>
                    </tr>
                    <tr>
                        <td><strong>Third Order</strong></td>
                        <td>±30mm to ±1m</td>
                        <td>Mapping and lower-precision surveys</td>
                    </tr>
                    <tr>
                        <td><strong>Fourth Order</strong></td>
                        <td>±1m+</td>
                        <td>Rough mapping only</td>
                    </tr>
                </tbody>
            </table>
        `;
    }

    /**
     * Get the HTML report template
     * @returns {string} - HTML template
     */
    getReportTemplate() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{TITLE}} - GPS Calculation Report</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #e1e8ed;
            background-color: #1a1a1a;
            padding: 20px;
        }
        
        .report-container {
            max-width: 1200px;
            margin: 0 auto;
            background: #2c2c2c;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }
        
        .report-header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #667eea;
        }
        
        .report-header h1 {
            color: #667eea;
            font-size: 2.5rem;
            margin-bottom: 10px;
        }
        
        .report-header h2 {
            color: #e1e8ed;
            font-size: 1.5rem;
            margin-bottom: 10px;
        }
        
        .report-meta {
            color: #888;
            font-size: 0.9rem;
        }
        
        .section {
            margin: 30px 0;
            padding: 20px;
            background: #1a1a1a;
            border-radius: 6px;
            border: 1px solid #404040;
        }
        
        .section h3 {
            color: #667eea;
            margin-bottom: 20px;
            font-size: 1.3rem;
            border-bottom: 1px solid #404040;
            padding-bottom: 10px;
        }
        
        .report-table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            font-size: 14px;
        }
        
        .report-table th,
        .report-table td {
            padding: 12px 15px;
            text-align: left;
            border: 1px solid #404040;
        }
        
        .report-table th {
            background: #667eea;
            color: white;
            font-weight: 500;
        }
        
        .report-table tr:nth-child(even) {
            background: #2c2c2c;
        }
        
        .report-table .assessment {
            font-size: 12px;
            max-width: 200px;
        }
        
        .statistics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        
        .stat-card {
            background: #2c2c2c;
            padding: 20px;
            border-radius: 6px;
            border: 1px solid #404040;
        }
        
        .stat-card h4 {
            color: #667eea;
            margin-bottom: 15px;
            font-size: 1.1rem;
        }
        
        .stat-card p {
            margin: 8px 0;
            color: #e1e8ed;
        }
        
        .standards-table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            font-size: 13px;
        }
        
        .standards-table th,
        .standards-table td {
            padding: 10px 12px;
            text-align: left;
            border: 1px solid #404040;
        }
        
        .standards-table th {
            background: #667eea;
            color: white;
            font-weight: 500;
        }
        
        .standards-table tr:nth-child(even) {
            background: #2c2c2c;
        }
        
        .settings-info {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 15px 0;
        }
        
        .setting-item {
            background: #2c2c2c;
            padding: 15px;
            border-radius: 4px;
            border: 1px solid #404040;
        }
        
        .setting-item strong {
            color: #667eea;
        }
        
        @media print {
            body {
                background: white;
                color: black;
            }
            
            .report-container {
                background: white;
                box-shadow: none;
            }
            
            .section {
                background: #f8f9fa;
                border: 1px solid #ddd;
            }
            
            .report-table th {
                background: #333;
                color: white;
            }
            
            .report-table tr:nth-child(even) {
                background: #f5f5f5;
            }
        }
    </style>
</head>
<body>
    <div class="report-container">
        <div class="report-header">
            <h1>GPS Calculation Report</h1>
            <h2>{{TITLE}}</h2>
            <div class="report-meta">
                Generated on {{TIMESTAMP}}<br>
                GPS Coordinate Calculator for Surveyors
            </div>
        </div>
        
        <div class="section">
            <h3>Calculation Settings</h3>
            <div class="settings-info">
                <div class="setting-item">
                    <strong>Unit System:</strong> {{UNIT_SYSTEM}}
                </div>
                <div class="setting-item">
                    <strong>Reference Mode:</strong> {{REFERENCE_MODE}}
                </div>
                <div class="setting-item">
                    <strong>Condensed Output:</strong> {{CONDENSED_OUTPUT}}
                </div>
            </div>
        </div>
        
        <div class="section">
            <h3>Coordinate Data</h3>
            {{COORDINATES_TABLE}}
        </div>
        
        <div class="section">
            <h3>Distance Calculations</h3>
            {{CALCULATIONS_TABLE}}
        </div>
        
        <div class="section">
            <h3>Statistics Summary</h3>
            {{STATISTICS}}
        </div>
        
        <div class="section">
            <h3>Surveying Accuracy Standards Reference</h3>
            <p style="margin-bottom: 15px; color: #888;">
                The following table provides reference for interpreting the accuracy of your measurements 
                based on established surveying standards.
            </p>
            {{SURVEYING_STANDARDS}}
        </div>
        
        <div class="section" style="text-align: center; margin-top: 40px; padding: 20px; background: #1a1a1a; border: 1px solid #404040;">
            <p style="color: #888; font-size: 0.9rem;">
                This report was generated by GPS Coordinate Calculator for Surveyors<br>
                For more information, visit: <a href="https://github.com/MaineSkyPixels/GPS-Calc" style="color: #667eea;">GitHub Repository</a>
            </p>
        </div>
    </div>
</body>
</html>`;
    }
}
