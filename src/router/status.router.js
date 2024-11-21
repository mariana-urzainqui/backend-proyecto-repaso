import express from 'express'
import { getPingController } from '../controllers/status.controller.js'
import { verifyApiKeyMiddleware, verifyTokenMiddleware } from '../middlewares/auth.middleware.js'

const statusRouter = express.Router()


statusRouter.get('/protected-route/ping', verifyTokenMiddleware(['admin', 'user']), getPingController)
statusRouter.get('/ping', getPingController)

export default statusRouter