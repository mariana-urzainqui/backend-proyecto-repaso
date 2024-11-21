import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true
        },
        price: {
            type: Number,
            required: true
        },
        stock: {
            type: Number,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        category: {
            type: String,
            required: true
        },
        active: {
            type: Boolean,
            required: true,
            default: true
        },
        image_base_64: {
            type: String
        },
        seller_id: {
            type: mongoose.Schema.Types.ObjectId, //Debe ser el mismo tipo que el de la coleccion User
            ref: 'User',
            required: true
        },
        creation_date: {
            type: Date,
            default: Date.now
        }
    }
)

const Product = mongoose.model('Product', productSchema)

export default Product