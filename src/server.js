import ENVIRONMENT from "./config/environment.config.js"
import express from "express"
import mongoose from "./db/config.js" // Este import es la conexion con la DB (NO BORRAR)
import cors from 'cors'
import productRouter from "./router/products.router.js"
import authRouter from "./router/auth.router.js"
import statusRouter from "./router/status.router.js"
import { verifyApiKeyMiddleware } from "./middlewares/auth.middleware.js"
import database_pool from "./db/configMysql.js" //Conexion con la db (NO BORRAR)
import ProductRepository from "./repositories/product.repository.js"


const app = express()
const PORT = ENVIRONMENT.PORT || 3000

app.use(cors())
app.use(express.json({limit: '5mb'}))
app.use(verifyApiKeyMiddleware)

app.use('/api/status', statusRouter)
app.use('/api/auth', authRouter)
app.use('/api/products', productRouter)

ProductRepository.getProducts()

app.listen(PORT, () => {
    console.log(`El servidor se esta escuchando en http://localhost:${PORT}`)
})

