/**
 * Main Application Script
 * Coordinates all components and handles user interactions
 */

class GPSCalculatorApp {
    constructor() {
        this.parser = new CoordinateParser();
        this.converter = new CoordinateConverter();
        this.distanceCalculator = new DistanceCalculator();
        
        this.coordinates = [];
        this.maxCoordinates = 8;
        
        this.initializeEventListeners();
        this.initializeManualMode();
        this.updateReferencePointSelector();
    }

    /**
     * Initialize all event listeners
     */
    initializeEventListeners() {
        // Section 1: Coordinate Converter
        document.getElementById('convert-btn').addEventListener('click', () => this.handleConversion());
        document.getElementById('copy-converted-btn').addEventListener('click', () => this.copyConvertedResult());
        
        // Section 2: Distance Calculator
        document.getElementById('parse-coordinates-btn').addEventListener('click', () => this.handleParseCoordinates());
        document.getElementById('calculate-distance-btn').addEventListener('click', () => this.handleDistanceCalculation());
        document.getElementById('copy-results-btn').addEventListener('click', () => this.copyDistanceResults());
        
        // Mode toggle
        document.querySelectorAll('input[name="input-mode"]').forEach(radio => {
            radio.addEventListener('change', (e) => this.toggleInputMode(e.target.value));
        });
        
        // Manual mode controls
        document.getElementById('add-coordinate-btn').addEventListener('click', () => this.addCoordinateRow());
        document.getElementById('remove-coordinate-btn').addEventListener('click', () => this.removeCoordinateRow());
        
        // Distance options
        document.getElementById('show-2d').addEventListener('change', () => this.updateDistanceOptions());
        document.getElementById('show-3d').addEventListener('change', () => this.updateDistanceOptions());
    }

    /**
     * Handle coordinate conversion
     */
    handleConversion() {
        const input = document.getElementById('coordinate-input').value.trim();
        if (!input) {
            this.showError('Please enter coordinates to convert.');
            return;
        }

        const coordinate = this.parser.parseCoordinate(input);
        if (!coordinate) {
            this.showError('Unable to parse the coordinate format. Please check your input.');
            return;
        }

        // Validate coordinates
        const normalized = this.converter.validateAndNormalize(coordinate.lat, coordinate.lon);
        if (!normalized) {
            this.showError('Invalid coordinate values. Latitude must be between -90 and 90, longitude between -180 and 180.');
            return;
        }

        // Detect format and convert accordingly
        const format = this.parser.detectFormat(input);
        
        if (format === 'dms') {
            // Convert DMS to decimal
            this.displayConversionResult(normalized.lat, normalized.lon, 'dms');
        } else if (format === 'decimal') {
            // Convert decimal to DMS
            this.displayConversionResult(normalized.lat, normalized.lon, 'decimal');
        } else {
            // Default to showing both formats
            this.displayConversionResult(normalized.lat, normalized.lon, 'both');
        }
    }

    /**
     * Display conversion results
     * @param {number} lat - Latitude
     * @param {number} lon - Longitude
     * @param {string} format - Format type
     */
    displayConversionResult(lat, lon, format) {
        const decimalOutput = document.getElementById('decimal-output');
        const dmsOutput = document.getElementById('dms-output');

        // Always show decimal format
        decimalOutput.textContent = this.converter.formatForDisplay(lat, lon);
        
        // Show DMS format
        const dmsResult = this.converter.convertToDMS(lat, lon);
        dmsOutput.textContent = `${dmsResult.lat}, ${dmsResult.lon}`;

        // Store for clipboard copy
        this.lastConvertedLat = lat;
        this.lastConvertedLon = lon;
    }

    /**
     * Copy converted result to clipboard
     */
    async copyConvertedResult() {
        if (this.lastConvertedLat === undefined || this.lastConvertedLon === undefined) {
            this.showError('No converted result to copy.');
            return;
        }

        const clipboardText = this.converter.formatForClipboard(this.lastConvertedLat, this.lastConvertedLon);
        
        try {
            await navigator.clipboard.writeText(clipboardText);
            this.showSuccess('Coordinates copied to clipboard!');
        } catch (err) {
            // Fallback for older browsers
            this.fallbackCopyToClipboard(clipboardText);
        }
    }

    /**
     * Handle parsing of multiple coordinates
     */
    handleParseCoordinates() {
        const input = document.getElementById('coordinates-paste').value.trim();
        if (!input) {
            this.showError('Please enter coordinates to parse.');
            return;
        }

        const parsedCoordinates = this.parser.parseMultipleCoordinates(input);
        
        if (parsedCoordinates.length === 0) {
            this.showError('No valid coordinates found. Please check your input format.');
            return;
        }

        if (parsedCoordinates.length > this.maxCoordinates) {
            this.showError(`Too many coordinates. Maximum ${this.maxCoordinates} allowed.`);
            return;
        }

        // Get default elevation unit
        const defaultElevationUnit = document.querySelector('input[name="default-elevation"]:checked').value;
        
        // Convert elevations to meters and validate coordinates
        this.coordinates = parsedCoordinates.map(coord => {
            let elevation = coord.elevation;
            if (elevation !== null && elevation !== undefined) {
                elevation = this.distanceCalculator.convertElevation(
                    elevation, defaultElevationUnit, 'meters'
                );
            }
            return {
                lat: coord.lat,
                lon: coord.lon,
                elevation: elevation
            };
        }).filter(coord => 
            coord.lat !== null && coord.lon !== null && 
            !isNaN(coord.lat) && !isNaN(coord.lon) &&
            isFinite(coord.lat) && isFinite(coord.lon)
        );

        if (this.coordinates.length === 0) {
            this.showError('No valid coordinates found after parsing. Please check your input format.');
            return;
        }

        // Switch to manual mode to show parsed coordinates
        document.querySelector('input[name="input-mode"][value="manual"]').checked = true;
        this.toggleInputMode('manual');
        this.populateManualMode();
        
        this.showSuccess(`Successfully parsed ${this.coordinates.length} valid coordinate(s).`);
    }

    /**
     * Populate manual mode with parsed coordinates
     */
    populateManualMode() {
        const table = document.getElementById('coordinates-table');
        table.innerHTML = '';

        this.coordinates.forEach((coord, index) => {
            this.addCoordinateRow(coord, index);
        });
    }

    /**
     * Handle distance calculation
     */
    handleDistanceCalculation() {
        // Update coordinates from manual input first
        this.updateCoordinatesFromManual();
        
        // Filter out invalid coordinates
        const validCoordinates = this.coordinates.filter(coord => 
            coord.lat !== null && coord.lon !== null && 
            !isNaN(coord.lat) && !isNaN(coord.lon) &&
            isFinite(coord.lat) && isFinite(coord.lon)
        );
        
        if (validCoordinates.length < 2) {
            this.showError('At least 2 valid coordinates are required for distance calculation. Please check your input values.');
            return;
        }

        const show2D = document.getElementById('show-2d').checked;
        const show3D = document.getElementById('show-3d').checked;

        if (!show2D && !show3D) {
            this.showError('Please select at least one distance type (2D or 3D).');
            return;
        }

        const results = this.distanceCalculator.calculateDistanceMatrix(
            validCoordinates, show2D, show3D
        );

        if (!results) {
            this.showError('Error calculating distances. Please check your coordinates.');
            return;
        }

        // Debug: Log the results to console
        console.log('Distance calculation results:', results);
        console.log('Valid coordinates used:', validCoordinates);
        this.displayDistanceResults(results);
        document.getElementById('distance-results').style.display = 'block';
    }

    /**
     * Display distance calculation results
     * @param {Object} results - Distance calculation results
     */
    displayDistanceResults(results) {
        const matrixContainer = document.getElementById('distance-matrix');
        const statsContainer = document.getElementById('summary-stats');
        
        matrixContainer.innerHTML = '';
        statsContainer.innerHTML = '';

        // Display detailed calculation breakdown for each pair
        this.displayDetailedCalculations(results.coordinates, matrixContainer);

        // Note: Distance matrices removed as requested - detailed calculations provide better information

        // Display statistics
        const statsGrid = document.createElement('div');
        statsGrid.className = 'stats-grid';
        const unitSystem = document.getElementById('unit-system').value;

        if (results.statistics2D) {
            statsGrid.appendChild(this.createStatCard('2D Minimum', results.statistics2D.min, unitSystem));
            statsGrid.appendChild(this.createStatCard('2D Maximum', results.statistics2D.max, unitSystem));
            statsGrid.appendChild(this.createStatCard('2D Average', results.statistics2D.average, unitSystem));
        }

        if (results.statistics3D) {
            statsGrid.appendChild(this.createStatCard('3D Minimum', results.statistics3D.min, unitSystem));
            statsGrid.appendChild(this.createStatCard('3D Maximum', results.statistics3D.max, unitSystem));
            statsGrid.appendChild(this.createStatCard('3D Average', results.statistics3D.average, unitSystem));
        }

        if (results.cumulative2D) {
            statsGrid.appendChild(this.createStatCard('Cumulative 2D', results.cumulative2D.totalKm, unitSystem));
        }

        if (results.cumulative3D) {
            statsGrid.appendChild(this.createStatCard('Cumulative 3D', results.cumulative3D.totalKm, unitSystem));
        }

        statsContainer.appendChild(statsGrid);

        // Store results for clipboard copy
        this.lastDistanceResults = results;
    }

    /**
     * Display detailed calculation breakdown for coordinate pairs
     * @param {Array} coordinates - Array of coordinates
     * @param {HTMLElement} container - Container to append results to
     */
    displayDetailedCalculations(coordinates, container) {
        if (coordinates.length < 2) return;

        const isReferenceMode = document.getElementById('reference-mode').checked;
        const isCondensed = document.getElementById('condensed-output').checked;
        const unitSystem = document.getElementById('unit-system').value;

        if (isCondensed) {
            this.displayCondensedCalculations(coordinates, container, isReferenceMode, unitSystem);
            return;
        }

        const detailsSection = document.createElement('div');
        detailsSection.className = 'detailed-calculations';
        detailsSection.innerHTML = '<h3>Detailed Distance Calculations</h3>';

        if (isReferenceMode) {
            const referenceIndex = parseInt(document.getElementById('reference-point').value);
            const referenceCoord = coordinates[referenceIndex];
            
            for (let i = 0; i < coordinates.length; i++) {
                if (i !== referenceIndex) {
                    const calculation = this.calculateDetailedDistance(referenceCoord, coordinates[i], referenceIndex + 1, i + 1, unitSystem);
                    detailsSection.appendChild(calculation);
                }
            }
        } else {
            // Calculate detailed breakdown for each pair
            for (let i = 0; i < coordinates.length; i++) {
                for (let j = i + 1; j < coordinates.length; j++) {
                    const coord1 = coordinates[i];
                    const coord2 = coordinates[j];
                    
                    const calculation = this.calculateDetailedDistance(coord1, coord2, i + 1, j + 1, unitSystem);
                    detailsSection.appendChild(calculation);
                }
            }
        }

        container.appendChild(detailsSection);
    }

    /**
     * Calculate detailed distance breakdown between two coordinates
     * @param {Object} coord1 - First coordinate
     * @param {Object} coord2 - Second coordinate
     * @param {number} point1 - Point 1 number
     * @param {number} point2 - Point 2 number
     * @param {string} unitSystem - Unit system to use for display
     * @returns {HTMLElement} - Detailed calculation element
     */
    calculateDetailedDistance(coord1, coord2, point1, point2, unitSystem = 'meters') {
        const calcDiv = document.createElement('div');
        calcDiv.className = 'calculation-breakdown';
        
        // Step 1: Compute horizontal differences
        const deltaLat = coord2.lat - coord1.lat;
        const deltaLon = coord2.lon - coord1.lon;
        
        // Calculate meters per degree at this latitude
        const latRad = coord1.lat * Math.PI / 180;
        const metersPerDegreeLat = 111132.92 - 559.82 * Math.cos(2 * latRad) + 1.175 * Math.cos(4 * latRad);
        const metersPerDegreeLon = 111412.84 * Math.cos(latRad) - 93.5 * Math.cos(3 * latRad);
        
        // Convert to meters
        const deltaLatMeters = deltaLat * metersPerDegreeLat;
        const deltaLonMeters = deltaLon * metersPerDegreeLon;
        
        // Calculate horizontal distance
        const horizontalDistance = Math.sqrt(deltaLatMeters * deltaLatMeters + deltaLonMeters * deltaLonMeters);
        
        // Step 2: Compute vertical difference
        const deltaHeight = coord2.elevation - coord1.elevation;
        
        // Step 3: Calculate 3D distance
        const distance3D = Math.sqrt(horizontalDistance * horizontalDistance + deltaHeight * deltaHeight);
        
        // Format results using selected unit system
        const horizontalFormatted = this.formatDistanceWithDynamicUnits(horizontalDistance / 1000, unitSystem);
        const verticalFormatted = this.formatDistanceWithDynamicUnits(Math.abs(deltaHeight) / 1000, unitSystem);
        const totalFormatted = this.formatDistanceWithDynamicUnits(distance3D / 1000, unitSystem);
        
        const name1 = coord1.name || `Point ${point1}`;
        const name2 = coord2.name || `Point ${point2}`;
        
        calcDiv.innerHTML = `
            <div class="calculation-header">
                <h4>${name1} vs ${name2}</h4>
            </div>
            
            <div class="calculation-steps">
                <div class="step collapsible collapsed">
                    <h5 class="collapsible-header">🔹 Step 1 — Compute Horizontal Difference <span class="toggle-icon">▼</span></h5>
                    <div class="collapsible-content">
                        <p><strong>ΔLat</strong> = ${coord2.lat.toFixed(8)} – ${coord1.lat.toFixed(8)} = ${deltaLat.toFixed(8)}°</p>
                        <p><strong>ΔLon</strong> = ${coord2.lon.toFixed(8)} – (${coord1.lon.toFixed(8)}) = ${deltaLon.toFixed(8)}°</p>
                        <br>
                        <p>At latitude ${coord1.lat.toFixed(2)}° N:</p>
                        <p>1° latitude ≈ ${Math.round(metersPerDegreeLat)} m</p>
                        <p>1° longitude ≈ ${Math.round(metersPerDegreeLon)} m</p>
                        <br>
                        <p>So:</p>
                        <p><strong>ΔLat</strong> = ${deltaLat.toFixed(8)} × ${Math.round(metersPerDegreeLat)} ≈ ${deltaLatMeters.toFixed(4)} m</p>
                        <p><strong>ΔLon</strong> = ${deltaLon.toFixed(8)} × ${Math.round(metersPerDegreeLon)} ≈ ${deltaLonMeters.toFixed(4)} m</p>
                        <br>
                        <p><strong>Horizontal offset</strong> = √(${deltaLatMeters.toFixed(4)}² + ${deltaLonMeters.toFixed(4)}²) ≈ ${horizontalDistance.toFixed(4)} m = <strong>${horizontalFormatted.value} ${horizontalFormatted.unit}</strong></p>
                    </div>
                </div>
                
                <div class="step collapsible collapsed">
                    <h5 class="collapsible-header">🔹 Step 2 — Compute Vertical Difference <span class="toggle-icon">▼</span></h5>
                    <div class="collapsible-content">
                        <p><strong>ΔHeight</strong> = ${coord2.elevation.toFixed(3)} – ${coord1.elevation.toFixed(3)} = ${deltaHeight.toFixed(4)} m = <strong>${verticalFormatted.value} ${verticalFormatted.unit}</strong></p>
                    </div>
                </div>
                
                <div class="step">
                    <h5>🔹 Step 3 — Surveying Accuracy Assessment</h5>
                    <table class="summary-table">
                        <tr>
                            <th>Comparison</th>
                            <th>Horizontal Diff</th>
                            <th>Vertical Diff</th>
                            <th>3D Distance</th>
                            <th>Survey Grade</th>
                        </tr>
                        <tr>
                            <td>${name1} vs ${name2}</td>
                            <td>≈ ${horizontalFormatted.value} ${horizontalFormatted.unit}</td>
                            <td>≈ ${verticalFormatted.value} ${verticalFormatted.unit}</td>
                            <td>≈ ${totalFormatted.value} ${totalFormatted.unit}</td>
                            <td>${this.getDistanceAssessment(horizontalDistance, Math.abs(deltaHeight))} <span class="standards-help" onclick="showStandardsPopup()">❓</span></td>
                        </tr>
                    </table>
                </div>
                
                <div class="conclusion">
                    <h5>✅ Conclusion</h5>
                    <p>${this.getConclusionText(horizontalDistance, Math.abs(deltaHeight), name1, name2)}</p>
                </div>
            </div>
        `;
        
        // Add collapsible functionality
        calcDiv.querySelectorAll('.collapsible-header').forEach(header => {
            header.addEventListener('click', () => {
                const step = header.parentElement;
                const content = step.querySelector('.collapsible-content');
                const icon = header.querySelector('.toggle-icon');
                
                step.classList.toggle('collapsed');
                if (step.classList.contains('collapsed')) {
                    content.style.display = 'none';
                    icon.textContent = '▼';
                } else {
                    content.style.display = 'block';
                    icon.textContent = '▲';
                }
            });
        });
        
        return calcDiv;
    }

    /**
     * Display condensed calculations in a single table
     * @param {Array} coordinates - Array of coordinates
     * @param {HTMLElement} container - Container to append results to
     * @param {boolean} isReferenceMode - Whether to use reference point mode
     * @param {string} unitSystem - Unit system to use for display
     */
    displayCondensedCalculations(coordinates, container, isReferenceMode, unitSystem = 'meters') {
        const condensedSection = document.createElement('div');
        condensedSection.className = 'condensed-calculations';
        condensedSection.innerHTML = '<h3>Condensed Distance Calculations</h3>';

        const table = document.createElement('table');
        table.className = 'condensed-table';
        
        // Create header
        const headerRow = document.createElement('tr');
        headerRow.innerHTML = `
            <th>From</th>
            <th>To</th>
            <th>Horizontal Distance</th>
            <th>Vertical Distance</th>
            <th>3D Distance</th>
        `;
        table.appendChild(headerRow);

        if (isReferenceMode) {
            const referenceIndex = parseInt(document.getElementById('reference-point').value);
            const referenceCoord = coordinates[referenceIndex];
            
            for (let i = 0; i < coordinates.length; i++) {
                if (i !== referenceIndex) {
                    const row = this.createCondensedRow(referenceCoord, coordinates[i], referenceIndex + 1, i + 1, unitSystem);
                    table.appendChild(row);
                }
            }
        } else {
            // All pairwise comparisons
            for (let i = 0; i < coordinates.length; i++) {
                for (let j = i + 1; j < coordinates.length; j++) {
                    const row = this.createCondensedRow(coordinates[i], coordinates[j], i + 1, j + 1, unitSystem);
                    table.appendChild(row);
                }
            }
        }

        condensedSection.appendChild(table);
        container.appendChild(condensedSection);
    }

    /**
     * Create a single row for condensed calculations
     * @param {Object} coord1 - First coordinate
     * @param {Object} coord2 - Second coordinate
     * @param {number} point1 - Point 1 number
     * @param {number} point2 - Point 2 number
     * @param {string} unitSystem - Unit system to use for display
     * @returns {HTMLElement} - Table row element
     */
    createCondensedRow(coord1, coord2, point1, point2, unitSystem = 'meters') {
        const row = document.createElement('tr');
        
        // Calculate distances
        const deltaLat = coord2.lat - coord1.lat;
        const deltaLon = coord2.lon - coord1.lon;
        
        const latRad = coord1.lat * Math.PI / 180;
        const metersPerDegreeLat = 111132.92 - 559.82 * Math.cos(2 * latRad) + 1.175 * Math.cos(4 * latRad);
        const metersPerDegreeLon = 111412.84 * Math.cos(latRad) - 93.5 * Math.cos(3 * latRad);
        
        const deltaLatMeters = deltaLat * metersPerDegreeLat;
        const deltaLonMeters = deltaLon * metersPerDegreeLon;
        const horizontalDistance = Math.sqrt(deltaLatMeters * deltaLatMeters + deltaLonMeters * deltaLonMeters);
        const deltaHeight = coord2.elevation - coord1.elevation;
        const distance3D = Math.sqrt(horizontalDistance * horizontalDistance + deltaHeight * deltaHeight);
        
        // Format results using selected unit system
        const horizontalFormatted = this.formatDistanceWithDynamicUnits(horizontalDistance / 1000, unitSystem);
        const verticalFormatted = this.formatDistanceWithDynamicUnits(Math.abs(deltaHeight) / 1000, unitSystem);
        const totalFormatted = this.formatDistanceWithDynamicUnits(distance3D / 1000, unitSystem);
        
        const name1 = coord1.name || `Point ${point1}`;
        const name2 = coord2.name || `Point ${point2}`;
        
        row.innerHTML = `
            <td>${name1}</td>
            <td>${name2}</td>
            <td>${horizontalFormatted.value} ${horizontalFormatted.unit}</td>
            <td>${verticalFormatted.value} ${verticalFormatted.unit}</td>
            <td>${totalFormatted.value} ${totalFormatted.unit}</td>
        `;
        
        return row;
    }

    /**
     * Update the reference point selector options
     */
    updateReferencePointSelector() {
        const selector = document.getElementById('reference-point');
        const rows = document.querySelectorAll('.coordinate-row');
        
        // Clear existing options
        selector.innerHTML = '';
        
        // Add options for each coordinate
        rows.forEach((row, index) => {
            const nameInput = row.querySelector('input[data-field="name"]');
            const name = nameInput ? nameInput.value.trim() : '';
            const displayName = name || `Point ${index + 1}`;
            
            const option = document.createElement('option');
            option.value = index;
            option.textContent = displayName;
            selector.appendChild(option);
        });
    }

    /**
     * Get distance assessment text based on surveying standards
     * @param {number} horizontal - Horizontal distance in meters
     * @param {number} vertical - Vertical distance in meters
     * @returns {string} - Assessment text
     */
    getDistanceAssessment(horizontal, vertical) {
        const total = Math.sqrt(horizontal * horizontal + vertical * vertical);
        
        // Surveying accuracy standards (in meters)
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
     * Get conclusion text based on surveying standards
     * @param {number} horizontal - Horizontal distance in meters
     * @param {number} vertical - Vertical distance in meters
     * @param {number} point1 - Point 1 number
     * @param {number} point2 - Point 2 number
     * @returns {string} - Conclusion text
     */
    getConclusionText(horizontal, vertical, point1, point2) {
        const horizontalFormatted = this.formatDistanceWithDynamicUnits(horizontal / 1000);
        const verticalFormatted = this.formatDistanceWithDynamicUnits(vertical / 1000);
        const total = Math.sqrt(horizontal * horizontal + vertical * vertical);
        const totalFormatted = this.formatDistanceWithDynamicUnits(total / 1000);
        
        // Surveying accuracy assessment
        let surveyGrade = "";
        let recommendation = "";
        
        if (total < 0.001) {
            surveyGrade = "First Order Survey Quality";
            recommendation = "Suitable for high-precision engineering and geodetic control";
        } else if (total < 0.003) {
            surveyGrade = "First Order Survey Quality";
            recommendation = "Excellent for precise engineering surveys";
        } else if (total < 0.01) {
            surveyGrade = "Second Order Class I Quality";
            recommendation = "Good for most engineering and construction surveys";
        } else if (total < 0.03) {
            surveyGrade = "Second Order Class II Quality";
            recommendation = "Acceptable for general construction and mapping";
        } else if (total < 0.1) {
            surveyGrade = "Third Order Quality";
            recommendation = "Suitable for general mapping and lower-precision surveys";
        } else if (total < 0.3) {
            surveyGrade = "Third Order Quality";
            recommendation = "Basic mapping accuracy";
        } else if (total < 1) {
            surveyGrade = "Fourth Order Quality";
            recommendation = "Rough mapping only";
        } else {
            surveyGrade = "Below Survey Standards";
            recommendation = "Not suitable for surveying applications";
        }
        
        return `Surveying Assessment: <strong>${surveyGrade}</strong><br>
                Total 3D distance: ~${totalFormatted.value} ${totalFormatted.unit}<br>
                Horizontal difference: ~${horizontalFormatted.value} ${horizontalFormatted.unit}<br>
                Vertical difference: ~${verticalFormatted.value} ${verticalFormatted.unit}<br>
                <em>${recommendation}</em>`;
    }

    /**
     * Create distance table
     * @param {Array} matrix - Distance matrix
     * @param {Array} coordinates - Coordinate labels
     * @param {string} type - Table type ('2D' or '3D')
     * @returns {HTMLElement} - Table element
     */
    createDistanceTable(matrix, coordinates, type) {
        const table = document.createElement('table');
        table.className = 'distance-table';
        
        // Create header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        const emptyHeader = document.createElement('th');
        emptyHeader.textContent = `${type} Distance Matrix`;
        headerRow.appendChild(emptyHeader);
        
        coordinates.forEach(coord => {
            const th = document.createElement('th');
            th.textContent = coord.label;
            headerRow.appendChild(th);
        });
        
        thead.appendChild(headerRow);
        table.appendChild(thead);

        // Create body
        const tbody = document.createElement('tbody');
        
        matrix.forEach((row, i) => {
            const tr = document.createElement('tr');
            
            const labelCell = document.createElement('td');
            labelCell.textContent = coordinates[i].label;
            tr.appendChild(labelCell);
            
            row.forEach((distance, j) => {
                const td = document.createElement('td');
                if (distance) {
                    const kmValue = distance.km;
                    const milesValue = distance.miles;
                    
                    // Dynamic unit scaling for precise measurements
                    const { value, unit } = this.formatDistanceWithDynamicUnits(kmValue);
                    td.textContent = `${value} ${unit}`;
                    td.title = `${milesValue.toFixed(6)} miles`;
                } else {
                    td.textContent = '-';
                }
                tr.appendChild(td);
            });
            
            tbody.appendChild(tr);
        });
        
        table.appendChild(tbody);
        return table;
    }

    /**
     * Create statistics card
     * @param {string} label - Stat label
     * @param {number} value - Stat value
     * @param {string} unit - Unit
     * @returns {HTMLElement} - Stat card element
     */
    createStatCard(label, value, unitSystem) {
        const card = document.createElement('div');
        card.className = 'stat-item';
        
        const valueDiv = document.createElement('div');
        valueDiv.className = 'stat-value';
        
        // Use dynamic unit scaling for statistics with selected unit system
        const { value: formattedValue, unit: formattedUnit } = this.formatDistanceWithDynamicUnits(value, unitSystem);
        valueDiv.textContent = `${formattedValue} ${formattedUnit}`;
        
        const labelDiv = document.createElement('div');
        labelDiv.className = 'stat-label';
        labelDiv.textContent = label;
        
        card.appendChild(valueDiv);
        card.appendChild(labelDiv);
        
        return card;
    }

    /**
     * Format distance with dynamic unit scaling based on selected unit system
     * @param {number} kmValue - Distance in kilometers
     * @param {string} unitSystem - 'meters', 'feet', or 'survey-feet'
     * @returns {Object} - {value: number, unit: string}
     */
    formatDistanceWithDynamicUnits(kmValue, unitSystem = 'meters') {
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
     * Format distance in metric units (mm, cm, m, km)
     * @param {number} kmValue - Distance in kilometers
     * @returns {Object} - {value: number, unit: string}
     */
    formatInMeters(kmValue) {
        const meters = kmValue * 1000;
        const centimeters = meters * 100;
        const millimeters = centimeters * 10;

        if (millimeters >= 0.1 && millimeters < 10) {
            return {
                value: parseFloat(millimeters.toFixed(3)),
                unit: 'mm'
            };
        } else if (millimeters >= 10 && millimeters < 1000) {
            return {
                value: parseFloat((millimeters / 10).toFixed(4)),
                unit: 'cm'
            };
        } else if (centimeters >= 100 && centimeters < 10000) {
            return {
                value: parseFloat((centimeters / 100).toFixed(3)),
                unit: 'm'
            };
        } else if (meters >= 0.001 && meters < 1000) {
            if (meters < 1) {
                return {
                    value: parseFloat(meters.toFixed(6)),
                    unit: 'm'
                };
            } else {
                return {
                    value: parseFloat(meters.toFixed(3)),
                    unit: 'm'
                };
            }
        } else {
            return {
                value: parseFloat(kmValue.toFixed(6)),
                unit: 'km'
            };
        }
    }

    /**
     * Format distance in imperial feet units (in, ft, mi)
     * @param {number} kmValue - Distance in kilometers
     * @returns {Object} - {value: number, unit: string}
     */
    formatInFeet(kmValue) {
        const meters = kmValue * 1000;
        const feet = meters / 0.3048;
        const inches = feet * 12;
        const miles = feet / 5280;

        if (inches >= 0.1 && inches < 12) {
            return {
                value: parseFloat(inches.toFixed(3)),
                unit: 'in'
            };
        } else if (feet >= 1 && feet < 5280) {
            return {
                value: parseFloat(feet.toFixed(3)),
                unit: 'ft'
            };
        } else {
            return {
                value: parseFloat(miles.toFixed(6)),
                unit: 'mi'
            };
        }
    }

    /**
     * Format distance in US Survey feet units (in, ft, mi)
     * @param {number} kmValue - Distance in kilometers
     * @returns {Object} - {value: number, unit: string}
     */
    formatInSurveyFeet(kmValue) {
        const meters = kmValue * 1000;
        const surveyFeet = meters / 0.30480061;
        const inches = surveyFeet * 12;
        const miles = surveyFeet / 5280;

        if (inches >= 0.1 && inches < 12) {
            return {
                value: parseFloat(inches.toFixed(3)),
                unit: 'in'
            };
        } else if (surveyFeet >= 1 && surveyFeet < 5280) {
            return {
                value: parseFloat(surveyFeet.toFixed(3)),
                unit: 'ft'
            };
        } else {
            return {
                value: parseFloat(miles.toFixed(6)),
                unit: 'mi'
            };
        }
    }

    /**
     * Get default unit for unit system
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
     * Copy distance results to clipboard
     */
    async copyDistanceResults() {
        if (!this.lastDistanceResults) {
            this.showError('No results to copy.');
            return;
        }

        let clipboardText = 'GPS Distance Calculation Results\n\n';
        
        // Add coordinate list
        clipboardText += 'Coordinates:\n';
        this.lastDistanceResults.coordinates.forEach((coord, index) => {
            clipboardText += `${coord.label}: ${coord.lat.toFixed(6)}, ${coord.lon.toFixed(6)}`;
            if (coord.elevation !== null && coord.elevation !== undefined) {
                clipboardText += `, ${coord.elevation.toFixed(2)}m`;
            }
            clipboardText += '\n';
        });
        
        clipboardText += '\n';

        // Add statistics with dynamic units
        if (this.lastDistanceResults.statistics2D) {
            clipboardText += '2D Distance Statistics:\n';
            const min2D = this.formatDistanceWithDynamicUnits(this.lastDistanceResults.statistics2D.min);
            const max2D = this.formatDistanceWithDynamicUnits(this.lastDistanceResults.statistics2D.max);
            const avg2D = this.formatDistanceWithDynamicUnits(this.lastDistanceResults.statistics2D.average);
            clipboardText += `Min: ${min2D.value} ${min2D.unit}\n`;
            clipboardText += `Max: ${max2D.value} ${max2D.unit}\n`;
            clipboardText += `Average: ${avg2D.value} ${avg2D.unit}\n\n`;
        }

        if (this.lastDistanceResults.statistics3D) {
            clipboardText += '3D Distance Statistics:\n';
            const min3D = this.formatDistanceWithDynamicUnits(this.lastDistanceResults.statistics3D.min);
            const max3D = this.formatDistanceWithDynamicUnits(this.lastDistanceResults.statistics3D.max);
            const avg3D = this.formatDistanceWithDynamicUnits(this.lastDistanceResults.statistics3D.average);
            clipboardText += `Min: ${min3D.value} ${min3D.unit}\n`;
            clipboardText += `Max: ${max3D.value} ${max3D.unit}\n`;
            clipboardText += `Average: ${avg3D.value} ${avg3D.unit}\n\n`;
        }

        try {
            await navigator.clipboard.writeText(clipboardText);
            this.showSuccess('Results copied to clipboard!');
        } catch (err) {
            this.fallbackCopyToClipboard(clipboardText);
        }
    }

    /**
     * Toggle between input modes
     * @param {string} mode - Mode ('paste' or 'manual')
     */
    toggleInputMode(mode) {
        const pasteMode = document.getElementById('paste-mode');
        const manualMode = document.getElementById('manual-mode');
        
        if (mode === 'paste') {
            pasteMode.style.display = 'block';
            manualMode.style.display = 'none';
        } else {
            pasteMode.style.display = 'none';
            manualMode.style.display = 'block';
        }
    }

    /**
     * Initialize manual mode with default rows
     */
    initializeManualMode() {
        this.addCoordinateRow();
        this.addCoordinateRow();
    }

    /**
     * Add a coordinate row to manual mode
     * @param {Object} coord - Optional coordinate data
     * @param {number} index - Optional index
     */
    addCoordinateRow(coord = null, index = null) {
        if (this.coordinates.length >= this.maxCoordinates) {
            this.showError(`Maximum ${this.maxCoordinates} coordinates allowed.`);
            return;
        }

        const table = document.getElementById('coordinates-table');
        const rowIndex = index !== null ? index : this.coordinates.length;
        
        const row = document.createElement('div');
        row.className = 'coordinate-row';
        row.dataset.index = rowIndex;
        
        row.innerHTML = `
            <div class="coordinate-label">Point ${rowIndex + 1}</div>
            <input type="text" class="coordinate-input" placeholder="Name/ID (optional)" data-field="name" 
                   value="${coord && coord.name ? coord.name : ''}">
            <input type="text" class="coordinate-input" placeholder="Latitude" data-field="lat" 
                   value="${coord ? coord.lat : ''}">
            <input type="text" class="coordinate-input" placeholder="Longitude" data-field="lon" 
                   value="${coord ? coord.lon : ''}">
            <input type="text" class="coordinate-input" placeholder="Elevation" data-field="elevation" 
                   value="${coord && coord.elevation ? coord.elevation : ''}">
            <div class="elevation-unit-row">
                <label><input type="radio" name="elevation-${rowIndex}" value="meters" checked> Meters</label>
                <label><input type="radio" name="elevation-${rowIndex}" value="feet"> Feet</label>
                <label><input type="radio" name="elevation-${rowIndex}" value="survey-feet"> Survey Ft</label>
            </div>
        `;
        
        table.appendChild(row);
        
        // Update reference point selector
        this.updateReferencePointSelector();
        
        // Add event listeners for input changes
        row.querySelectorAll('input[data-field]').forEach(input => {
            input.addEventListener('input', () => this.updateCoordinatesFromManual());
        });
        
        row.querySelectorAll('input[name^="elevation-"]').forEach(radio => {
            radio.addEventListener('change', () => this.updateCoordinatesFromManual());
        });

        if (coord) {
            // Set elevation unit if coordinate has elevation
            if (coord.elevation !== null && coord.elevation !== undefined) {
                // Default to meters for parsed coordinates
                row.querySelector('input[name="elevation-' + rowIndex + '"][value="meters"]').checked = true;
            }
        } else {
            // Add to coordinates array for new rows
            this.coordinates.push({ lat: null, lon: null, elevation: null });
        }
    }

    /**
     * Remove a coordinate row from manual mode
     */
    removeCoordinateRow() {
        if (this.coordinates.length <= 2) {
            this.showError('Minimum 2 coordinates required.');
            return;
        }

        const table = document.getElementById('coordinates-table');
        const lastRow = table.lastElementChild;
        if (lastRow) {
            table.removeChild(lastRow);
            this.coordinates.pop();
            this.updateCoordinateLabels();
        }
    }

    /**
     * Update coordinate labels after removal
     */
    updateCoordinateLabels() {
        const rows = document.querySelectorAll('.coordinate-row');
        rows.forEach((row, index) => {
            const label = row.querySelector('.coordinate-label');
            label.textContent = `Point ${index + 1}`;
            row.dataset.index = index;
        });
    }

    /**
     * Update coordinates array from manual input
     */
    updateCoordinatesFromManual() {
        const rows = document.querySelectorAll('.coordinate-row');
        
        this.coordinates = [];
        rows.forEach((row, index) => {
            const nameInput = row.querySelector('input[data-field="name"]');
            const latInput = row.querySelector('input[data-field="lat"]');
            const lonInput = row.querySelector('input[data-field="lon"]');
            const elevInput = row.querySelector('input[data-field="elevation"]');
            const elevUnit = row.querySelector('input[name^="elevation-"]:checked');
            
            const name = nameInput.value.trim();
            const lat = parseFloat(latInput.value) || null;
            const lon = parseFloat(lonInput.value) || null;
            let elevation = parseFloat(elevInput.value) || null;
            
            // Convert elevation to meters
            if (elevation !== null && elevUnit) {
                elevation = this.distanceCalculator.convertElevation(
                    elevation, elevUnit.value, 'meters'
                );
            }
            
            this.coordinates.push({ 
                name: name || `Point ${index + 1}`, 
                lat, 
                lon, 
                elevation 
            });
        });
    }

    /**
     * Update distance calculation options
     */
    updateDistanceOptions() {
        // This could be used to dynamically update the UI based on selected options
        // For now, it's handled in the calculation function
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        this.showMessage(message, 'error');
    }

    /**
     * Show success message
     * @param {string} message - Success message
     */
    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    /**
     * Show message to user
     * @param {string} message - Message text
     * @param {string} type - Message type ('error' or 'success')
     */
    showMessage(message, type) {
        // Remove existing messages
        const existingMessages = document.querySelectorAll('.error, .success');
        existingMessages.forEach(msg => msg.remove());
        
        // Create new message
        const messageDiv = document.createElement('div');
        messageDiv.className = type;
        messageDiv.textContent = message;
        
        // Insert at the top of the container
        const container = document.querySelector('.container');
        container.insertBefore(messageDiv, container.firstChild);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 5000);
    }

    /**
     * Fallback copy to clipboard for older browsers
     * @param {string} text - Text to copy
     */
    fallbackCopyToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            this.showSuccess('Results copied to clipboard!');
        } catch (err) {
            this.showError('Failed to copy to clipboard. Please copy manually.');
        }
        
        document.body.removeChild(textArea);
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new GPSCalculatorApp();
});

// Global function for standards popup
function showStandardsPopup() {
    const popup = document.createElement('div');
    popup.className = 'standards-popup';
    popup.innerHTML = `
        <div class="popup-content">
            <div class="popup-header">
                <h3>📐 Surveying Accuracy Standards</h3>
                <button class="close-popup" onclick="closeStandardsPopup()">×</button>
            </div>
            <div class="popup-body">
                <p><strong>Official Reference:</strong> <a href="https://www.ngs.noaa.gov/INFO/standards.shtml" target="_blank">NGS Standards and Specifications</a></p>
                <table class="standards-table">
                    <tr>
                        <th>Survey Grade</th>
                        <th>Accuracy Range</th>
                        <th>Applications</th>
                    </tr>
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
                </table>
                <p><em>Source: National Geodetic Survey (NGS) Standards and Specifications for Geodetic Control Networks</em></p>
            </div>
        </div>
    `;
    
    document.body.appendChild(popup);
}

function closeStandardsPopup() {
    const popup = document.querySelector('.standards-popup');
    if (popup) {
        popup.remove();
    }
}

// Global function for help popups
function showHelpPopup(section) {
    const helpContent = {
        'converter': {
            title: 'Coordinate Format Converter',
            content: `
                <p><strong>Purpose:</strong> Convert GPS coordinates between different formats</p>
                <p><strong>Supported Formats:</strong></p>
                <ul>
                    <li>Decimal Degrees: <code>44.4734245277 -70.88862750833</code></li>
                    <li>DMS with symbols: <code>44° 28' 24.32661" -70° 53' 19.05717"</code></li>
                    <li>DMS with cardinal: <code>N44° 28' 24.32661" W70° 53' 19.05717"</code></li>
                    <li>Space separated DMS: <code>41 48 15.79259 112 50 1.04150</code> (Defaults to North/West)</li>
                </ul>
                <p><strong>Coordinate Signs:</strong></p>
                <ul>
                    <li><strong>Latitude:</strong> North is positive (+), South is negative (-)</li>
                    <li><strong>Longitude:</strong> East is positive (+), West is negative (-)</li>
                </ul>
                <p><strong>How to use:</strong></p>
                <ol>
                    <li>Paste coordinates in any supported format</li>
                    <li>Click "Convert" to see both decimal and DMS formats</li>
                    <li>Use "Copy to Clipboard" to copy tab-separated decimal coordinates</li>
                </ol>
            `
        },
        'distance-calculator': {
            title: 'Distance Calculator',
            content: `
                <p><strong>Purpose:</strong> Calculate distances between multiple GPS coordinates</p>
                <p><strong>Two Input Methods:</strong></p>
                <ul>
                    <li><strong>Paste Mode:</strong> Paste multiple coordinates at once</li>
                    <li><strong>Manual Entry:</strong> Enter coordinates one by one with names/IDs</li>
                </ul>
                <p><strong>Features:</strong></p>
                <ul>
                    <li>2D distances (Haversine formula)</li>
                    <li>3D distances (including elevation)</li>
                    <li>Reference point mode</li>
                    <li>Condensed output table</li>
                    <li>Surveying accuracy assessments</li>
                </ul>
            `
        },
        'paste-mode': {
            title: 'Paste Mode',
            content: `
                <p><strong>How to use:</strong></p>
                <ol>
                    <li>Paste multiple coordinate sets, one per line</li>
                    <li>Format: <code>latitude longitude elevation</code></li>
                    <li>Example: <code>41 48 15.79259 112 50 1.04150 1234.5</code></li>
                    <li>Click "Parse Coordinates" to process</li>
                </ol>
                <p><strong>Supported separators:</strong> spaces, commas, tabs</p>
                <p><strong>Coordinate Signs:</strong> West is negative (-), East is positive (+)</p>
                <p><strong>Elevation units:</strong> Set default unit for all coordinates</p>
            `
        },
        'manual-mode': {
            title: 'Manual Entry Mode',
            content: `
                <p><strong>How to use:</strong></p>
                <ol>
                    <li>Enter coordinates in the table format</li>
                    <li>Add optional names/IDs for each point</li>
                    <li>Set elevation units for each coordinate individually</li>
                    <li>Use "+ Add" to add more points (up to 8 total)</li>
                </ol>
                <p><strong>Reference Point:</strong> Select which coordinate to use as reference for comparisons</p>
            `
        },
        'elevation-units': {
            title: 'Elevation Units',
            content: `
                <p><strong>Available Units:</strong></p>
                <ul>
                    <li><strong>Meters:</strong> Standard metric unit (1.0)</li>
                    <li><strong>Feet:</strong> International foot (0.3048 m)</li>
                    <li><strong>US Survey Feet:</strong> US survey foot (0.30480061 m)</li>
                </ul>
                <p><strong>Note:</strong> All calculations are performed in meters internally</p>
            `
        },
        'reference-mode': {
            title: 'Reference Point Mode',
            content: `
                <p><strong>Purpose:</strong> Compare all coordinates against a single reference point</p>
                <p><strong>How it works:</strong></p>
                <ol>
                    <li>Select a reference point from the dropdown</li>
                    <li>All other points are compared only to this reference</li>
                    <li>Useful for surveying from a known control point</li>
                </ol>
                <p><strong>Use cases:</strong></p>
                <ul>
                    <li>Control point surveys</li>
                    <li>Quality control against reference standard</li>
                    <li>Construction layout verification</li>
                </ul>
            `
        },
        'condensed-output': {
            title: 'Condensed Output',
            content: `
                <p><strong>Purpose:</strong> Display all calculations in a single, clean table</p>
                <p><strong>Features:</strong></p>
                <ul>
                    <li>Single table with all distance measurements</li>
                    <li>No detailed step-by-step calculations</li>
                    <li>No survey grade assessments</li>
                    <li>Clean format for quick reference</li>
                </ul>
                <p><strong>Perfect for:</strong></p>
                <ul>
                    <li>Field reports</li>
                    <li>Data export</li>
                    <li>Quick reference</li>
                    <li>Professional reports</li>
                </ul>
            `
        },
        'unit-system': {
            title: 'Unit System Selection',
            content: `
                <p><strong>Purpose:</strong> Choose the unit system for all distance calculations</p>
                <p><strong>Available Systems:</strong></p>
                <ul>
                    <li><strong>Meters:</strong> Metric system (mm, cm, m, km)</li>
                    <li><strong>Feet:</strong> Imperial system (in, ft, mi)</li>
                    <li><strong>US Survey Feet:</strong> US survey system (in, ft, mi)</li>
                </ul>
                <p><strong>Unit Scaling:</strong></p>
                <ul>
                    <li><strong>Meters:</strong> mm → cm → m → km</li>
                    <li><strong>Feet/Survey Feet:</strong> in → ft → mi</li>
                </ul>
                <p><strong>Note:</strong> All calculations are performed in meters internally, then converted to the selected unit system for display.</p>
            `
        }
    };

    const help = helpContent[section];
    if (!help) return;

    const popup = document.createElement('div');
    popup.className = 'help-popup';
    popup.innerHTML = `
        <div class="popup-content">
            <div class="popup-header">
                <h3>${help.title}</h3>
                <button class="close-popup" onclick="closeHelpPopup()">×</button>
            </div>
            <div class="popup-body">
                ${help.content}
            </div>
        </div>
    `;
    
    document.body.appendChild(popup);
}

function closeHelpPopup() {
    const popup = document.querySelector('.help-popup');
    if (popup) {
        popup.remove();
    }
}
