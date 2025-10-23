const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database setup
const db = new sqlite3.Database('./calculations.db');

// Initialize database
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS calculations (
        id TEXT PRIMARY KEY,
        share_id TEXT UNIQUE,
        data TEXT,
        created_at INTEGER,
        expires_at INTEGER,
        access_count INTEGER DEFAULT 0
    )`);

    // Create index for faster lookups
    db.run(`CREATE INDEX IF NOT EXISTS idx_share_id ON calculations(share_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_expires_at ON calculations(expires_at)`);
});

// Cleanup expired calculations every hour
setInterval(() => {
    const now = Date.now();
    db.run('DELETE FROM calculations WHERE expires_at < ?', [now], (err) => {
        if (err) {
            console.error('Error cleaning up expired calculations:', err);
        } else {
            console.log('Cleaned up expired calculations');
        }
    });
}, 60 * 60 * 1000); // 1 hour

// Routes

// Save calculation
app.post('/api/calculations', (req, res) => {
    const { shareId, data, expiration } = req.body;
    
    if (!shareId || !data) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const now = Date.now();
    const expiresAt = now + (expiration || 24 * 60 * 60 * 1000); // Default 24 hours

    db.run(
        'INSERT INTO calculations (id, share_id, data, created_at, expires_at) VALUES (?, ?, ?, ?, ?)',
        [shareId, shareId, JSON.stringify(data), now, expiresAt],
        function(err) {
            if (err) {
                console.error('Error saving calculation:', err);
                return res.status(500).json({ error: 'Failed to save calculation' });
            }
            
            res.json({ 
                success: true, 
                shareId: shareId,
                expiresAt: expiresAt 
            });
        }
    );
});

// Get calculation by share ID
app.get('/api/calculations/:shareId', (req, res) => {
    const { shareId } = req.params;
    
    db.get(
        'SELECT * FROM calculations WHERE share_id = ? AND expires_at > ?',
        [shareId, Date.now()],
        (err, row) => {
            if (err) {
                console.error('Error fetching calculation:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            
            if (!row) {
                return res.status(404).json({ error: 'Calculation not found or expired' });
            }

            // Update access count
            db.run(
                'UPDATE calculations SET access_count = access_count + 1 WHERE share_id = ?',
                [shareId]
            );

            res.json({
                success: true,
                data: JSON.parse(row.data),
                createdAt: row.created_at,
                expiresAt: row.expires_at,
                accessCount: row.access_count + 1
            });
        }
    );
});

// Get calculation stats
app.get('/api/stats', (req, res) => {
    db.get('SELECT COUNT(*) as total, COUNT(CASE WHEN expires_at > ? THEN 1 END) as active FROM calculations', 
           [Date.now()], (err, row) => {
        if (err) {
            console.error('Error fetching stats:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        res.json({
            totalCalculations: row.total,
            activeCalculations: row.active
        });
    });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: Date.now() });
});

// Serve static files (for production deployment)
app.use(express.static(path.join(__dirname, '../')));

// Handle client-side routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
    console.log(`GPS Calculator API server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down server...');
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        } else {
            console.log('Database connection closed');
        }
        process.exit(0);
    });
});
