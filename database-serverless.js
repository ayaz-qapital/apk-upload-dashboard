const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');

// Use /tmp directory for serverless environment
const DB_PATH = '/tmp/dashboard.db';
const SALT_ROUNDS = 12;

class Database {
    constructor() {
        this.db = null;
    }

    // Initialize database connection and create tables
    async init() {
        return new Promise((resolve, reject) => {
            // Ensure /tmp directory exists
            if (!fs.existsSync('/tmp')) {
                fs.mkdirSync('/tmp', { recursive: true });
            }

            this.db = new sqlite3.Database(DB_PATH, (err) => {
                if (err) {
                    console.error('Error opening database:', err);
                    reject(err);
                } else {
                    console.log('Connected to SQLite database in serverless environment');
                    this.createTables()
                        .then(() => this.seedDefaultUsers())
                        .then(resolve)
                        .catch(reject);
                }
            });
        });
    }

    // Create necessary tables
    async createTables() {
        return new Promise((resolve, reject) => {
            const createUsersTable = `
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    role TEXT DEFAULT 'user',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    last_login DATETIME,
                    is_active BOOLEAN DEFAULT 1
                )
            `;

            this.db.run(createUsersTable, (err) => {
                if (err) {
                    console.error('Error creating users table:', err);
                    reject(err);
                } else {
                    console.log('Users table created or already exists');
                    resolve();
                }
            });
        });
    }

    // Seed default users if they don't exist
    async seedDefaultUsers() {
        try {
            const adminExists = await this.getUserByUsername('admin');
            const userExists = await this.getUserByUsername('user');

            if (!adminExists) {
                await this.createUser('admin', 'password123', 'admin');
                console.log('Default admin user created');
            }

            if (!userExists) {
                await this.createUser('user', 'user123', 'user');
                console.log('Default user created');
            }
        } catch (error) {
            console.error('Error seeding default users:', error);
        }
    }

    // Hash password using bcrypt
    async hashPassword(password) {
        return bcrypt.hash(password, SALT_ROUNDS);
    }

    // Verify password against hash
    async verifyPassword(password, hash) {
        return bcrypt.compare(password, hash);
    }

    // Create a new user
    async createUser(username, password, role = 'user') {
        return new Promise(async (resolve, reject) => {
            try {
                const passwordHash = await this.hashPassword(password);
                const query = `
                    INSERT INTO users (username, password_hash, role)
                    VALUES (?, ?, ?)
                `;

                this.db.run(query, [username, passwordHash, role], function(err) {
                    if (err) {
                        console.error('Error creating user:', err);
                        reject(err);
                    } else {
                        console.log(`User ${username} created with ID: ${this.lastID}`);
                        resolve({
                            id: this.lastID,
                            username,
                            role
                        });
                    }
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    // Get user by username
    async getUserByUsername(username) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT id, username, password_hash, role, created_at, last_login, is_active
                FROM users 
                WHERE username = ? AND is_active = 1
            `;

            this.db.get(query, [username], (err, row) => {
                if (err) {
                    console.error('Error getting user:', err);
                    reject(err);
                } else {
                    resolve(row || null);
                }
            });
        });
    }

    // Authenticate user
    async authenticateUser(username, password) {
        try {
            const user = await this.getUserByUsername(username);
            if (!user) {
                return null;
            }

            const isValidPassword = await this.verifyPassword(password, user.password_hash);
            if (!isValidPassword) {
                return null;
            }

            // Update last login
            await this.updateLastLogin(user.id);

            return {
                id: user.id,
                username: user.username,
                role: user.role
            };
        } catch (error) {
            console.error('Authentication error:', error);
            return null;
        }
    }

    // Update last login timestamp
    async updateLastLogin(userId) {
        return new Promise((resolve, reject) => {
            const query = `
                UPDATE users 
                SET last_login = CURRENT_TIMESTAMP 
                WHERE id = ?
            `;

            this.db.run(query, [userId], (err) => {
                if (err) {
                    console.error('Error updating last login:', err);
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    // Change user password
    async changePassword(userId, currentPassword, newPassword) {
        return new Promise(async (resolve, reject) => {
            try {
                // First, get the user to verify current password
                const getUserQuery = `
                    SELECT password_hash FROM users 
                    WHERE id = ? AND is_active = 1
                `;

                this.db.get(getUserQuery, [userId], async (err, row) => {
                    if (err) {
                        console.error('Error getting user for password change:', err);
                        reject(err);
                        return;
                    }

                    if (!row) {
                        reject(new Error('User not found'));
                        return;
                    }

                    // Verify current password
                    const isCurrentPasswordValid = await this.verifyPassword(currentPassword, row.password_hash);
                    if (!isCurrentPasswordValid) {
                        reject(new Error('Current password is incorrect'));
                        return;
                    }

                    // Hash new password
                    const newPasswordHash = await this.hashPassword(newPassword);

                    // Update password
                    const updateQuery = `
                        UPDATE users 
                        SET password_hash = ? 
                        WHERE id = ?
                    `;

                    this.db.run(updateQuery, [newPasswordHash, userId], (updateErr) => {
                        if (updateErr) {
                            console.error('Error updating password:', updateErr);
                            reject(updateErr);
                        } else {
                            console.log(`Password updated for user ID: ${userId}`);
                            resolve();
                        }
                    });
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    // Get all users (for admin purposes)
    async getAllUsers() {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT id, username, role, created_at, last_login, is_active
                FROM users 
                ORDER BY created_at DESC
            `;

            this.db.all(query, [], (err, rows) => {
                if (err) {
                    console.error('Error getting all users:', err);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Close database connection
    close() {
        if (this.db) {
            this.db.close((err) => {
                if (err) {
                    console.error('Error closing database:', err);
                } else {
                    console.log('Database connection closed');
                }
            });
        }
    }
}

module.exports = Database;
