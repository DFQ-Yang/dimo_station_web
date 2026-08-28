"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testConnection = testConnection;
const promise_1 = __importDefault(require("mysql2/promise"));
const pool = promise_1.default.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    port: Number(process.env.MYSQL_PORT) || 3306,
    password: process.env.MYSQL_PASSWORD || '<PASSWORD>',
    database: process.env.MYSQL_DATABASE || 'codebuddy',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});
//Test connection
async function testConnection() {
    pool.getConnection()
        .then(conn => {
        console.log('MySQL connection established successfully');
        conn.release();
    })
        .catch(err => {
        console.error('MySQL connection error:', err.message);
    });
}
exports.default = pool;
