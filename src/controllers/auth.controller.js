import ENVIRONMENT from "../config/environment.config.js"
import User from "../models/user.model.js"
import ResponseBuilder from "../utils/builders/responseBuilder.js"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { sendEmail } from "../utils/mail.util.js"
import UserRepository from "../repositories/user.repository.js"



export const registerUserController = async (req, res) => {
    try {
        const { name, email, password } = req.body

        const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s'-]+$/
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

        if (!name || !nameRegex.test(name)) {
            const response = new ResponseBuilder()
                .setOk(false)
                .setStatus(400)
                .setMessage('Bad request')
                .setPayload({
                    errors: {
                        name: 'El nombre no es válido. Debe contener solo letras, espacios o guiones'
                    }
                })
                .build()
            return res.status(400).json(response)
        }
        if (!email || !emailRegex.test(email)) {
            const response = new ResponseBuilder()
                .setOk(false)
                .setStatus(400)
                .setMessage('Bad request')
                .setPayload({
                    errors: {
                        email: 'El email no es válido'
                    }
                })
                .build()
            return res.status(400).json(response)
        }
        if (!password || password.length < 8) {
            const response = new ResponseBuilder()
                .setOk(false)
                .setStatus(400)
                .setMessage('Bad request')
                .setPayload({
                    errors: {
                        password: 'La contraseña debe tener al menos 8 caracteres'
                    }
                })
                .build()
            return res.status(400).json(response)
        }

        const existentUser = await UserRepository.obtenerPorEmail(email)
        if (existentUser) {
            const response = new ResponseBuilder()
                .setOk(false)
                .setStatus(400)
                .setMessage('Bad request')
                .setPayload(
                    {
                        errors: {
                            email: 'El email ya esta en uso'
                        }
                    }
                )
                .build()
            return res.status(400).json(response)
        }

        // hash lleva: valor a hashear y salt(nivel de dificultad)
        const hashedPassword = await bcrypt.hash(password, 10)
        // token de verificacion: permite transformar los objetos a string y protegerlos(firmandolos con la clave secreta que esta en el env) y tiene una fecha de expiracion
        const verificationToken = jwt.sign({ email: email }, ENVIRONMENT.JWT_SECRET, {
            expiresIn: '1d'
        })

        const url_verification = `https://backend-proyecto-repaso.vercel.app/api/auth/verify/${verificationToken}`

        await sendEmail({
            to: email,
            subject: 'Valida tu correo electrónico',
            html: `
            <div style="
                font-family: Arial, sans-serif; 
                color: #333; 
                max-width: 500px; 
                margin: 0 auto; 
                padding: 20px; 
                border: 1px solid #ddd; 
                border-radius: 8px;
                background-color: #f9f9f9;
            ">
                <h1 style="
                    color: #4CAF50; 
                    font-size: 24px; 
                    text-align: center;
                ">Verificación de correo electrónico</h1>
                <p style="
                    font-size: 16px; 
                    line-height: 1.5; 
                    text-align: center;
                    margin: 20px 0;
                ">
                Por favor, confirma tu correo electrónico haciendo clic en el botón de abajo.
                </p>
                <div style="text-align: center; margin-top: 20px;">
                    <a href=${url_verification} style="
                        display: inline-block;
                        background-color: #333; 
                        color: white;
                        padding: 10px 20px;
                        font-size: 16px;
                        border-radius: 5px;
                        text-decoration: none;">
                        Verificar correo
                    </a>
                </div> 
                <p style="
                    font-size: 14px; 
                    color: #777; 
                    text-align: center; 
                    margin-top: 30px;
                ">
                    Si no solicitaste esta verificación, puedes ignorar este mensaje.
                </p>
            </div>
        `
        })

        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            verificationToken: verificationToken,
            emailVerified: false
        })
        // Metodo save: nos permite guardar el objeto en la DB
        await newUser.save()

        const response = new ResponseBuilder()
            .setOk(true)
            .setStatus(200)
            .setMessage('Created')
            .setPayload({})
            .build()
        return res.status(200).json(response)
    }
    catch (error) {
        console.error('Error al registrar usuario', error)
        const response = new ResponseBuilder()
            .setOk(false)
            .setStatus(500)
            .setMessage('Internal server error')
            .setPayload(
                {
                    detail: error.message
                }
            )
            .build()
        return res.status(500).json(response)
    }
}

export const verifyMailValidationTokenController = async (req, res) => {
    try {
        const { verification_token } = req.params

        if (!verification_token) {
            const response = new ResponseBuilder()
                .setOk(false)
                .setStatus(400)
                .setMessage()
                .setPayload({
                    'detail': 'Falta enviar token'
                })
                .build()
            return res.json(response)
        }
        // Verificamos la firma del token, debe ser la misma que mi clave secreta, eso asegura que este token sea emitido por mi servidor
        //Si falla la lectura/verificacion/expiracion va directo al catch
        //La constante decoded tiene el payload de mi token
        const decoded = jwt.verify(verification_token, ENVIRONMENT.JWT_SECRET)
        //Busco al usuario en mi DB por email
        const user = await UserRepository.obtenerPorEmail(decoded.email)
        if (!user) {
            //Logica de error de not found
            const response = new ResponseBuilder()
                .setOk(false)
                .setStatus(404)
                .setMessage('Usuario no encontrado')
                .setPayload({
                    detail: 'No se econtró un usuario con el correo especificado'
                })
                .build()
            return res.json(response)
        }
        if (user.emailVerified) {
            //Logica de email ya verificado
            const response = new ResponseBuilder()
                .setOk(false)
                .setStatus(400)
                .setMessage('Correo ya verificado')
                .setPayload({
                    detail: 'Este correo electrónico ya ha sido verificado'
                })
                .build()
            return res.json(response)
        }
        //Compara el verificationToken del usuario con el token enviado
        if (user.verificationToken !== verification_token) {
            const response = new ResponseBuilder()
                .setOk(false)
                .setStatus(400)
                .setMessage('Token invalido')
                .setPayload({
                    detail: 'El token de verificacion no es válido'
                })
                .build()
            return res.json(response)
        }
        //Si pasa todas las validaciones,
        await UserRepository.setEmailVerified(true, user._id)

        const response = new ResponseBuilder()
            .setOk(true)
            .setStatus(200)
            .setMessage('Email verificado con éxito')
            .setPayload({
                message: 'Usuario validado'
            })
            .build()
        return res.json(response)
    }
    catch (error) {
        console.error('Error al verificar el email:', error)
        const response = new ResponseBuilder()
            .setOk(false)
            .setStatus(500)
            .setMessage('Error interno del servidor')
            .setPayload({
                detail: 'Ocurrio un error al verificar el correo electronico'
            })
            .build()
        return res.json(response)
    }
}

export const loginController = async (req, res) => {
    try {
        const { email, password } = req.body

        const user = await UserRepository.obtenerPorEmail(email)
        if (!user) {
            const response = new ResponseBuilder()
                .setOk(false)
                .setStatus(404)
                .setMessage('Usuario no encontrado')
                .setPayload({
                    errors: {
                        email: 'El email no esta registrado'
                    }
                })
                .build()
            return res.json(response)
        }
        if (!user.emailVerified) {
            //No dejar que el usuario ingrese hasta que no haya verificado su email
            const response = new ResponseBuilder()
                .setOk(false)
                .setStatus(403) //Contenido prohibido para usuarios que no tengan su email verificado
                .setMessage('Email no verificado')
                .setPayload({
                    errors: {
                        email: 'Por favor, verifica tu email antes de iniciar sesión'
                    }
                })
                .build()
            return res.json(response)
        }

        //Verificacion de la contraseña
        const isValidPassword = await bcrypt.compare(password, user.password)
        if (!isValidPassword) {
            const response = new ResponseBuilder()
                .setOk(false)
                .setStatus(401)
                .setMessage('Credenciales incorrectas')
                .setPayload({
                    errors: {
                        password: 'La contraseña es incorrecta'
                    }
                })
                .build()
            return res.json(response)
        }
        //Generamos un token firmado con el email y id del usuario, la fecha de expiracion es cuanto dura la sesion iniciada
        const token = jwt.sign(
            {
                email: user.email,
                id: user._id,
                role: user.role
            },
            ENVIRONMENT.JWT_SECRET,
            { expiresIn: '1d' }
        )
        const response = new ResponseBuilder()
            .setOk(true)
            .setStatus(200)
            .setMessage('Logueado')
            .setPayload({
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            })
            .build()
        return res.json(response)
    }
    catch (error) {
        const response = new ResponseBuilder()
            .setOk(false)
            .setStatus(500)
            .setMessage('Internal Server Error')
            .setPayload({
                errors: {
                    general: error.message
                }
            })
            .build()
        return res.json(response)
    }

}

export const forgotPasswordController = async (req, res) => {
    try {
        const { email } = req.body
        if (!email) {
            const response = new ResponseBuilder()
                .setOk(false)
                .setStatus(400)
                .setMessage('Bad Request')
                .setPayload({
                    errors: {
                        email: 'El email es requerido'
                    }
                })
                .build()
            return res.status(400).json(response)
        }
        const user = await UserRepository.obtenerPorEmail(email)
        if (!user) {
            const response = new ResponseBuilder()
                .setOk(false)
                .setStatus(404)
                .setMessage('Usuario no encontrado')
                .setPayload({
                    errors: {
                        email: 'No se encontro un usuario registrado con el correo proporcionado'
                    }
                })
                .build()
            return res.status(404).json(response)
        }
        const resetToken = jwt.sign({ email: user.email }, ENVIRONMENT.JWT_SECRET, {
            expiresIn: '1h'
        })
        const resetUrl = `${ENVIRONMENT.URL_FRONT}/reset-password/${resetToken}`
        sendEmail({
            to: user.email,
            subject: 'Restablecer contraseña',
            html: `
    <div style="
        font-family: Arial, sans-serif;
        color: #333;
        max-width: 500px;
        margin: 0 auto;
        padding: 20px;
        border: 1px solid #ddd;
        border-radius: 8px;
        background-color: #f9f9f9;
    ">
        <h1 style="
            color: #4CAF50;
            font-size: 24px;
            text-align: center;
        ">Solicitud para restablecer contraseña</h1>
        <p style="
            font-size: 16px;
            line-height: 1.5;
            text-align: center;
            margin: 20px 0;
        ">
            Has solicitado restablecer tu contraseña. Haz clic en el enlace de abajo para continuar con el proceso:
        </p>
        <div style="text-align: center; margin-top: 20px;">
            <a href='${resetUrl}' style="
                display: inline-block;
                background-color: #333;
                color: #fff;
                padding: 10px 20px;
                font-size: 16px;
                border-radius: 5px;
                text-decoration: none;
            ">
                Restablecer contraseña
            </a>
        </div>
        <p style="
            font-size: 14px;
            color: #777;
            text-align: center;
            margin-top: 30px;
        ">
            Si no solicitaste este cambio, ignora este mensaje.
        </p>
    </div>
    `
        })
        const response = new ResponseBuilder()
            .setOk(true)
            .setStatus(200)
            .setMessage('Se envio el correo')
            .setPayload({
                detail: 'Se envio un correo electronico con las instrucciones para restablecer tu contraseña'
            })
            .build()
        return res.status(200).json(response)

    }
    catch (error) {
        console.error('Error en el proceso de restablecimiento de contraseña', error)
        const response = new ResponseBuilder()
            .setOk(false)
            .setStatus(500)
            .setMessage('Error interno del servidor')
            .setPayload({
                errors: {
                    general: 'Ocurrió un error al procesar la solicitud de restablecimiento'
                }
            })
            .build()
        return res.status(500).json(response)
    }
}

export const resetTokenController = async (req, res) => {
    try {
        const { password } = req.body
        const { reset_token } = req.params
        if (!password || password.length < 8) {
            const response = new ResponseBuilder()
                .setOk(false)
                .setStatus(400)
                .setMessage('Bad request')
                .setPayload({
                    detail: 'La contraseña debe tener al menos 8 caracteres'
                })
                .build()
            return res.status(400).json(response)
        }
        if (!reset_token) {
            const response = new ResponseBuilder()
                .setOk(false)
                .setStatus(400)
                .setMessage('Token incorrecto')
                .setPayload({
                    detail: 'El reset token expiro o no es valido'
                })
                .build()
            return res.json(response)
        }

        const decoded = jwt.verify(reset_token, ENVIRONMENT.JWT_SECRET)
        if (!decoded) {
            const response = new ResponseBuilder()
                .setOk(false)
                .setStatus(400)
                .setMessage('Token Incorrecto')
                .setPayload({
                    detail: 'Fallo token de verificacion'
                })
                .build()
            return res.json(response)
        }

        const { email } = decoded

        const user = await UserRepository.obtenerPorEmail(email)

        if (!user) {
            const response = new ResponseBuilder()
                .setOk(false)
                .setStatus(400)
                .setMessage('No se encontro el usuario')
                .setPayload({
                    detail: 'Usuario inexistente o invalido'
                })
                .build()
            return res.json(response)
        }

        await UserRepository.updatePassword(user, password)

        const response = new ResponseBuilder()
            .setOk(true)
            .setStatus(200)
            .setMessage('Contraseña restablecida')
            .setPayload({
                detail: 'Se actualizo la contraseña correctamente'
            })
        return res.status(200).json(response)
    }
    catch (error) {
        console.error('Error al restablecer la contraseña:', error)
        const response = new ResponseBuilder()
            .setOk(false)
            .setStatus(500)
            .setMessage('Error interno del servidor')
            .setPayload({
                detail: 'Ocurrió un error al intentar restablecer la contraseña'
            })
            .build()
        return res.status(500).json(response)
    }
}

