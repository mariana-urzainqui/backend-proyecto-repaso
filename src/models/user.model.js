// Modelo del usuario
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String, 
        required: true
    },
    emailVerified: {
        type: Boolean,
        default: false
    },
    verificationToken: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true,
        default: 'user'
    }
})

const User = mongoose.model('User', userSchema)

export default User