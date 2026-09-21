import mysql from 'mysql2/promise';

async function createDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
    });
    await connection.query('DROP DATABASE IF EXISTS faturacao;');
    await connection.query('CREATE DATABASE faturacao;');
    console.log('Database "faturacao" recreated successfully.');
    await connection.end();
  } catch (error) {
    console.error('Error creating database:', error);
  }
}

createDatabase();
