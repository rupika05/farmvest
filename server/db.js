// db.js — File-based JSON database using lowdb (works without MongoDB)
const { Low } = require('lowdb');
const { JSONFileSync } = require('lowdb/node');
const path = require('path');

const file = path.join(__dirname, 'db.json');
const adapter = new JSONFileSync(file);
const db = new Low(adapter, { users: [], products: [], orders: [] });

db.read();

module.exports = db;
