import mysql from 'mysql2/promise'
import ENVIRONMENT from '../config/environment.config.js'

const database_pool = mysql.createPool({
    host: ENVIRONMENT.MYSQL.HOST,
    user: ENVIRONMENT.MYSQL.USERNAME, 
    password: ENVIRONMENT.MYSQL.PASSWORD,
    database: ENVIRONMENT.MYSQL.DATABASE,
    connectionLimit: 10
})

const checkConnection = async () => {
    try{
        const connection = await database_pool.getConnection() //Devolver la conexion
        await connection.query('SELECT 1')  //Consulta simple de excusa para verificar la conexion
        console.log('Conexion exitosa con MYSQL')
        connection.release() //Matar la conexion de la pool
    }
    catch(error){
        console.error('Error al conectar con la base de datos', error.message)
    }
}
checkConnection()

export default database_pool