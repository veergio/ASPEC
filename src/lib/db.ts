import mysql from "mysql2/promise";

let pool: mysql.Pool | null = null;

export function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.MYSQL_SERVER,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DB,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }
  return pool;
}

/**
 * Execute a parameterized query and return the rows.
 */
export async function query<T = Record<string, unknown>>(
  sql: string,
  params?: any[]
): Promise<T[]> {
  const db = getPool();
  const [rows] = await db.execute(sql, params);
  return rows as T[];
}
