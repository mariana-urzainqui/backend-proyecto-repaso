// Conexion con la base de datos
import mongoose from 'mongoose'
import ENVIRONMENT from '../config/environment.config.js'

mongoose.connect(ENVIRONMENT.DB_URL)
.then(
    () => {
        console.log('Conexión exitosa con MONGO_DB')
    }
)
.catch(
    (error) => {
        console.error('Error de conexión')
    }
)

export default mongoose