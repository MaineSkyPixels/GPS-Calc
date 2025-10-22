/**
 * Storage Manager for GPS Calculator
 * Handles local storage, expiration, and sharing functionality
 */
class StorageManager {
    constructor() {
        this.storageKey = 'gps_calculations';
        this.sharedKey = 'gps_shared';
        this.maxLocalItems = 50; // Maximum local calculations to store
        this.cleanupInterval = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        
        // Start cleanup interval
        this.startCleanupInterval();
    }

    /**
     * Generate a shareable ID in format: YYYY-NNNN-XXXX
     * @returns {string} - Shareable ID
     */
    generateShareId() {
        const year = new Date().getFullYear();
        const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        const randomLetters = this.generateRandomLetters(4);
        return `${year}-${randomNum}-${randomLetters}`;
    }

    /**
     * Generate random letters
     * @param {number} length - Number of letters to generate
     * @returns {string} - Random letters
     */
    generateRandomLetters(length) {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += letters.charAt(Math.floor(Math.random() * letters.length));
        }
        return result;
    }

    /**
     * Save calculation with expiration
     * @param {Object} calculation - Calculation data
     * @param {string} expiration - Expiration period (1hr, 24hr, 3days, 7days, 14days)
     * @returns {string} - Share ID if shared, null if local only
     */
    async saveCalculation(calculation, expiration = '24hr', share = false) {
        const shareId = share ? this.generateShareId() : null;
        const expirationTime = this.getExpirationTime(expiration);
        
        const calculationData = {
            id: shareId || this.generateLocalId(),
            data: calculation,
            timestamp: Date.now(),
            expiration: expirationTime,
            shared: share,
            shareId: shareId
        };

        // Save locally
        this.saveToLocalStorage(calculationData);

        // Save to server if shared
        if (share) {
            try {
                await this.saveToServer(calculationData);
                return shareId;
            } catch (error) {
                console.error('Failed to save to server:', error);
                // Still return share ID for local sharing
                return shareId;
            }
        }

        return null;
    }

    /**
     * Get expiration time in milliseconds
     * @param {string} period - Expiration period
     * @returns {number} - Expiration timestamp
     */
    getExpirationTime(period) {
        const now = Date.now();
        const periods = {
            '1hr': 60 * 60 * 1000,
            '24hr': 24 * 60 * 60 * 1000,
            '3days': 3 * 24 * 60 * 60 * 1000,
            '7days': 7 * 24 * 60 * 60 * 1000,
            '14days': 14 * 24 * 60 * 60 * 1000
        };
        return now + (periods[period] || periods['24hr']);
    }

    /**
     * Generate local ID
     * @returns {string} - Local ID
     */
    generateLocalId() {
        return 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Save to local storage
     * @param {Object} calculationData - Calculation data to save
     */
    saveToLocalStorage(calculationData) {
        try {
            const existing = this.getLocalCalculations();
            existing.push(calculationData);
            
            // Keep only the most recent calculations
            if (existing.length > this.maxLocalItems) {
                existing.sort((a, b) => b.timestamp - a.timestamp);
                existing.splice(this.maxLocalItems);
            }
            
            localStorage.setItem(this.storageKey, JSON.stringify(existing));
        } catch (error) {
            console.error('Failed to save to local storage:', error);
        }
    }

    /**
     * Get all local calculations
     * @returns {Array} - Array of calculations
     */
    getLocalCalculations() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Failed to get local calculations:', error);
            return [];
        }
    }

    /**
     * Get calculation by ID
     * @param {string} id - Calculation ID
     * @returns {Object|null} - Calculation data or null
     */
    getCalculation(id) {
        const calculations = this.getLocalCalculations();
        return calculations.find(calc => calc.id === id) || null;
    }

    /**
     * Get shared calculation by share ID
     * @param {string} shareId - Share ID
     * @returns {Object|null} - Calculation data or null
     */
    async getSharedCalculation(shareId) {
        // First check local storage
        const calculations = this.getLocalCalculations();
        const localCalc = calculations.find(calc => calc.shareId === shareId);
        if (localCalc && !this.isExpired(localCalc)) {
            return localCalc;
        }

        // Try to fetch from server
        try {
            const data = await this.fetchFromServer(shareId);
            if (data) {
                return { data: data, shareId: shareId };
            }
            return null;
        } catch (error) {
            console.error('Failed to fetch shared calculation:', error);
            return null;
        }
    }

    /**
     * Check if calculation is expired
     * @param {Object} calculation - Calculation data
     * @returns {boolean} - True if expired
     */
    isExpired(calculation) {
        return Date.now() > calculation.expiration;
    }

    /**
     * Clean up expired calculations
     */
    cleanupExpired() {
        const calculations = this.getLocalCalculations();
        const validCalculations = calculations.filter(calc => !this.isExpired(calc));
        
        if (validCalculations.length !== calculations.length) {
            localStorage.setItem(this.storageKey, JSON.stringify(validCalculations));
            console.log(`Cleaned up ${calculations.length - validCalculations.length} expired calculations`);
        }
    }

    /**
     * Start cleanup interval
     */
    startCleanupInterval() {
        setInterval(() => {
            this.cleanupExpired();
        }, this.cleanupInterval);
    }

    /**
     * Delete calculation
     * @param {string} id - Calculation ID
     */
    deleteCalculation(id) {
        const calculations = this.getLocalCalculations();
        const filtered = calculations.filter(calc => calc.id !== id);
        localStorage.setItem(this.storageKey, JSON.stringify(filtered));
    }

    /**
     * Save to server (Cloudflare Workers API)
     * @param {Object} calculationData - Calculation data with id, data, timestamp, expiration, shared, shareId
     */
    async saveToServer(calculationData) {
        try {
            // Use Cloudflare Workers API endpoint
            const apiUrl = 'https://gps-calc-server.maine-sky-pixels.workers.dev/api/share';
            
            // Extract the calculation period from expiration timestamp
            const now = Date.now();
            const expirationMs = calculationData.expiration - now;
            let expirationPeriod = '24hr'; // default
            
            // Map milliseconds back to period string
            if (expirationMs <= 60 * 60 * 1000) {
                expirationPeriod = '1hr';
            } else if (expirationMs <= 24 * 60 * 60 * 1000) {
                expirationPeriod = '24hr';
            } else if (expirationMs <= 3 * 24 * 60 * 60 * 1000) {
                expirationPeriod = '3days';
            } else if (expirationMs <= 7 * 24 * 60 * 60 * 1000) {
                expirationPeriod = '7days';
            } else {
                expirationPeriod = '14days';
            }
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    data: calculationData.data,
                    expirationPeriod: expirationPeriod
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
            }

            const result = await response.json();
            console.log('Saved to server with share ID:', result.shareId);
            return { success: true, shareId: result.shareId };
        } catch (error) {
            console.error('Error saving to server:', error);
            // Fallback to local storage if server fails
            return { success: false, error: error.message };
        }
    }

    /**
     * Fetch from server (Cloudflare Workers API)
     * @param {string} shareId - Share ID
     */
    async fetchFromServer(shareId) {
        try {
            // Use Cloudflare Workers API endpoint
            const apiUrl = `https://gps-calc-server.maine-sky-pixels.workers.dev/api/share/${shareId}`;
            
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (response.status === 404) {
                return null; // Calculation not found
            }

            if (response.status === 410) {
                throw new Error('Calculation has expired');
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            return result.data; // Return the calculation data
        } catch (error) {
            console.error('Error fetching from server:', error);
            return null;
        }
    }

    /**
     * Generate QR code for sharing
     * @param {string} shareId - Share ID
     * @returns {Promise<string|null>} - Promise that resolves to QR code data URL
     */
    async generateQRCode(shareId) {
        const url = `${window.location.origin}${window.location.pathname}?share=${shareId}`;
        
        return new Promise((resolve) => {
            try {
                // Check if QRCode library is available
                if (typeof QRCode === 'undefined') {
                    console.warn('QRCode library not loaded');
                    resolve(null);
                    return;
                }
                
                // Create a canvas element to generate QR code
                const canvas = document.createElement('canvas');
                
                // Use QRCode.toCanvas with proper async handling
                QRCode.toCanvas(canvas, url, {
                    width: 200,
                    height: 200,
                    margin: 2,
                    color: {
                        dark: '#000000',
                        light: '#FFFFFF'
                    }
                }, (error) => {
                    if (error) {
                        console.error('QR code generation error:', error);
                        resolve(null);
                        return;
                    }
                    
                    // Successfully generated - convert to data URL
                    try {
                        const dataUrl = canvas.toDataURL('image/png');
                        console.log('QR code generated successfully');
                        resolve(dataUrl);
                    } catch (err) {
                        console.error('Error converting canvas to data URL:', err);
                        resolve(null);
                    }
                });
            } catch (error) {
                console.error('QR code generation failed:', error);
                resolve(null);
            }
        });
    }

    /**
     * Get sharing URL
     * @param {string} shareId - Share ID
     * @returns {string} - Sharing URL
     */
    getSharingUrl(shareId) {
        return `${window.location.origin}${window.location.pathname}?share=${shareId}`;
    }
}
