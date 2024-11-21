import ENVIRONMENT from "../config/environment.config.js"
import ResponseBuilder from "../utils/builders/responseBuilder.js"
import jwt from 'jsonwebtoken'

//roles_permitidos es un parametro que en caso de estar deberia ser un array de roles o en caso de no estar debe ser un array vacio
//se invoca el verifyTokenMiddleware y recibe los roles permitidos, y luego esa funcion retorna el middleware
export const verifyTokenMiddleware = (roles_permitidos = []) => {
    return (req, res, next) => {
        try {
            const auth_header = req.headers['authorization']
            if (!auth_header) {
                const response = new ResponseBuilder()
                    .setOk(false)
                    .setStatus(401)
                    .setMessage('Falta token de autorizacion')
                    .setPayload({
                        detail: 'Se espera un token de autorización'
                    })
                    .build()
                return res.status(401).json(response)
            }
            /* 'Bearer token' => split ['Bearer', 'token'] => [1] para acceder al token*/
            const access_token = auth_header.split(' ')[1]
            if (!access_token) {
                const response = new ResponseBuilder()
                    .setOk(false)
                    .setStatus(401)
                    .setMessage('El token de autorización esta malformado')
                    .setPayload({
                        detail: 'No se proporcionó un token de autorización válido o el formato es incorrecto.'
                    })
                    .build()
                return res.status(401).json(response)
            }
            const decoded = jwt.verify(access_token, ENVIRONMENT.JWT_SECRET)
            req.user = decoded

            //Si hay roles y no esta incluido el rol del usuario dentro de los roles permitidos, tiramos error
            if (roles_permitidos.length && !roles_permitidos.includes(req.user.role)) {
                const response = new ResponseBuilder()
                    .setOk(false)
                    .setStatus(403)
                    .setMessage('Acceso restringido')
                    .setPayload({
                        detail: 'No tienes los permisos necesarios para realizar esta operacion.'
                    })
                    .build()
                return res.status(401).json(response)
            }
            return next() //Pasamos al sig controlador
        }
        catch (error) {
            const response = new ResponseBuilder()
                .setOk(false)
                .setStatus(401)
                .setMessage('Fallo al autentificar')
                .setPayload({
                    detail: error.message
                })
                .build()
            return res.status(500).json(response)
        }
    }
}

export const verifyApiKeyMiddleware = (req, res, next) => {
    try {
        const apikey_header = req.headers['x-api-key']
        if (!apikey_header) {
            const response = new ResponseBuilder()
                .setOk(false)
                .setStatus(401)
                .setMessage('Unauthorized')
                .setPayload({
                    detail: 'Se espera un api-key'
                })
                .build()
            return res.status(401).json(response)
        }
        if (apikey_header !== ENVIRONMENT.API_KEY_INTERN) {
            const response = new ResponseBuilder()
                .setOk(false)
                .setStatus(401)
                .setMessage('Unauthorized')
                .setPayload({
                    detail: 'Se espera un api-key valido'
                })
                .build()
            return res.status(401).json(response)
        }
        next()
    }
    catch (error) {
        const response = new ResponseBuilder()
            .setOk(false)
            .setStatus(500)
            .setMessage('Internal server error')
            .setPayload({
                detail: 'No se pudo validar la api-key'
            })
            .build()
        return res.status(500).json(response)
    }
}

