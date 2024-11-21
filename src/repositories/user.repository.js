import User from "../models/user.model.js";
import bcrypt from "bcrypt"

//Manejamos la logica de comunicacion con la DB, relacionado a los usuarios
class UserRepository{
    static async obtenerPorId(id){
        const user = await User.findOne({_id: id})
        return user
    }   

    static async obtenerPorEmail(email){
        const user = await User.findOne({email})
        return user
    }

    static async guardarUsuario (user){
        return await user.save()
    }

    static async setEmailVerified(value, user_id){
        const user = await UserRepository.obtenerPorId(user_id)
        if(!user){
            throw new Error('Usuario no encontrado')
        }
        user.emailVerified = value
        return await UserRepository.guardarUsuario(user)
    }

    static async updatePassword(user, newPassword){
        const encriptedPassword = await bcrypt.hash(newPassword, 10)
        user.password = encriptedPassword
        return await UserRepository.guardarUsuario(user)
    }
}

export default UserRepository