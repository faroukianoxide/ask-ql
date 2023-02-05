import * as pg from 'pg'
import * as dotenv from 'dotenv'

dotenv.config();

let pool: pg.Pool = new pg.Pool ({
    connectionString: process.env.POSTGRES_CON_STRING
})

pool.on('connect', () => {
    console.log("database connection successful")
})

export default pool;