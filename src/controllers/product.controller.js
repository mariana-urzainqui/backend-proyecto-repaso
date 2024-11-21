import { isValidObjectId } from "mongoose"
import ProductRepository from "../repositories/product.repository.js"
import ResponseBuilder from "../utils/builders/responseBuilder.js"

/* 1) Crear el schema en mongo db 2) Desarrollar cada controlador */

/* Logica del controlador:
- Que recibo
- Que respondo en caso de que este todo bien
*/


// Que recibo: nada 
// Que respondo: lista de productos activos
export const getAllProductsController = async (req, res) => {
    try {
        const products = await ProductRepository.getProducts()

        if (!products || products.length === 0) {
            const response = new ResponseBuilder()
                .setOk(false)
                .setStatus(404)
                .setMessage('No se encontraron productos')
                .setPayload({
                    detail: 'No hay productos disponibles en este momento'
                })
                .build()
            return res.status(404).json(response)
        }
        const response = new ResponseBuilder()
            .setOk(true)
            .setStatus(200)
            .setMessage('Productos obtenidos')
            .setPayload({ products })
            .build()
        return res.json(response)
    }
    catch (error) {
        console.error('Error al obtener los productos:', error)
        const response = new ResponseBuilder()
            .setOk(false)
            .setStatus(500)
            .setMessage('Error interno del servidor')
            .setPayload({
                detail: 'Ocurrio un error al obtener los productos'
            })
            .build()
        return res.json(response)
    }
}

// Que recibo: id por params 
// Que respondo: producto con el id recibido
export const getProductByIdController = async (req, res) => {
    try {
        const { product_id } = req.params

        if (!/^\d+$/.test(product_id)) {
            const response = new ResponseBuilder()
                .setOk(false)
                .setStatus(400)
                .setMessage('ID de producto invalido')
                .setPayload({
                    detail: 'El ID del producto no tiene un formato valido'
                })
                .build()
            return res.status(400).json(response)
        }

        const product_found = await ProductRepository.getProductById(product_id)

        if (!product_found) {
            const response = new ResponseBuilder()
                .setOk(false)
                .setStatus(404)
                .setMessage('Producto no encontrado')
                .setPayload({
                    detail: `El producto con id ${product_id} no existe`
                })
                .build()
            return res.status(404).json(response)
        }

        const response = new ResponseBuilder()
            .setOk(true)
            .setStatus(200)
            .setMessage('Producto obtenido')
            .setPayload({
                product: product_found
            })
            .build()
        return res.json(response)
    }
    catch (error) {
        console.error('Error al obtener el producto:', error)
        const response = new ResponseBuilder()
            .setOk(false)
            .setStatus(500)
            .setMessage('Error interno del servidor')
            .setPayload({
                detail: error.message || 'Ocurrio un error al obtener el producto'
            })
            .build()
        return res.json(response)
    }
}

export const createProductController = async (req, res) => {
    try {
        const { title, price, stock, description, category, image } = req.body
        const seller_id = req.user.id
        if (!title || typeof title !== 'string') {
            const response = new ResponseBuilder()
                .setOk(false)
                .setStatus(400)
                .setMessage('Error de titulo')
                .setPayload({
                    detail: 'Titulo invalido o campo esta vacio'
                })
                .build()
            return res.status(400).json(response)
        }
        if (!price && price < 1) {
            const response = new ResponseBuilder()
                .setOk(false)
                .setStatus(400)
                .setMessage('Error de precio')
                .setPayload({
                    detail: 'Precio invalido o campo vacio, solo valor numerico permitido mayor a 0'
                })
                .build()
            return res.status(400).json(response)
        }
        if (!stock && isNaN(stock)) {
            const response = new ResponseBuilder()
                .setOk(false)
                .setStatus(400)
                .setMessage('Error de stock')
                .setPayload({
                    detail: 'Stock invalido o campo vacio, solo valor numerico permitido'
                })
                .build()
            return res.status(400).json(response)
        }
        if (!description || typeof description !== 'string') {
            const response = new ResponseBuilder()
                .setOk(false)
                .setStatus(400)
                .setMessage('Error de descripcion')
                .setPayload({
                    detail: 'Campo vacio, debe ingresar una descripcion'
                })
                .build()
            return res.status(400).json(response)
        }
        if (!category || typeof category !== 'string') {
            const response = new ResponseBuilder()
                .setOk(false)
                .setStatus(400)
                .setMessage('Error de categoria')
                .setPayload({
                    detail: 'cateogria invalida o campo vacio'
                })
                .build()
            return res.status(400).json(response)
        }
        if (image && Buffer.byteLength(image, 'base64') > 2 * 1024 * 1024) {
            console.error('Imagen muy grande')
            return res.sendStatus(400)
        }
        const newProduct = {
            title,
            price,
            stock,
            description,
            category,
            image_base_64: image,
            seller_id
        }
        const newProductSaved = await ProductRepository.createProduct(newProduct)
        const response = new ResponseBuilder()
            .setOk(true)
            .setStatus(200)
            .setMessage('Producto Creado')
            .setPayload(
                {
                    data: {
                        title: newProductSaved.title,
                        price: newProductSaved.price,
                        stock: newProductSaved.stock,
                        description: newProductSaved.description,
                        category: newProductSaved.category,
                        id: newProductSaved._id
                    }
                }
            )
            .build()
        res.json(response)
    }
    catch (error) {
        const response = new ResponseBuilder()
            .setOk(false)
            .setStatus(500)
            .setMessage('Internal Server Error')
            .setPayload({
                detail: error.message
            })
            .build()
        res.status(500).json(response)
    }
}
export const updateProductController = async (req, res) => {
    try {
        const { product_id } = req.params
        const { title, price, stock, description, category } = req.body
        const seller_id = req.user.id

        if (!title && price == null && stock == null && !description && !category) {
            const response = new ResponseBuilder()
                .setOk(false)
                .setStatus(400)
                .setMessage('No se proporcionaron campos para actualizar')
                .setPayload({
                    detail: 'Debe proporcionar al menos un campo válido para actualizar'
                })
                .build()
            return res.status(400).json(response)
        }

        const product_found = await ProductRepository.getProductById(product_id)

        if (!product_found) {
            const response = new ResponseBuilder()
                .setOk(false)
                .setStatus(404)
                .setMessage('Producto no encontrado')
                .setPayload({
                    detail: `El producto con ID ${product_id} no existe.`
                })
                .build()
            return res.status(404).json(response)
        }

        if (seller_id !== product_found.seller_id.toString()) {
            const response = new ResponseBuilder()
                .setOk(false)
                .setStatus(403)
                .setMessage('Acceso denegado')
                .setPayload({
                    detail: 'No tienes permiso para actualizar este producto'
                })
                .build()
            return res.status(403).json(response)
        }

        const new_product_data = {}
        if (title) {
            if (!title || typeof title !== 'string') {
                const response = new ResponseBuilder()
                    .setOk(false)
                    .setStatus(400)
                    .setMessage('Error de titulo')
                    .setPayload({
                        detail: 'El título es obligatorio y debe ser una cadena de texto válida.'
                    })
                    .build()
                return res.status(400).json(response)
            }
            new_product_data.title = title
        }
        if (price != null) {
            if (!price && price < 1) {
                const response = new ResponseBuilder()
                    .setOk(false)
                    .setStatus(400)
                    .setMessage('Error de precio')
                    .setPayload({
                        detail: 'Precio invalido o campo vacio, solo valor numerico permitido mayor a 0'
                    })
                    .build()
                return res.status(400).json(response)
            }
            new_product_data.price = price
        }
        if (stock != null) {
            if (!stock && isNaN(stock)) {
                const response = new ResponseBuilder()
                    .setOk(false)
                    .setStatus(400)
                    .setMessage('Error de stock')
                    .setPayload({
                        detail: 'stock invalido o campo vacio, solo valor numerico permitido'
                    })
                    .build()
                return res.status(400).json(response)
            }
            new_product_data.stock = stock
        }
        if (description) {
            if (!description || typeof description !== 'string') {
                const response = new ResponseBuilder()
                    .setOk(false)
                    .setStatus(400)
                    .setMessage('Error de descripcion')
                    .setPayload({
                        detail: 'campo vacio, debe ingresar una descripcion'
                    })
                    .build()
                return res.status(400).json(response)
            }
            new_product_data.description = description
        }
        if (category) {
            if (!category || typeof category !== 'string') {
                const response = new ResponseBuilder()
                    .setOk(false)
                    .setStatus(400)
                    .setMessage('Error de categoria')
                    .setPayload({
                        detail: 'La categoría es obligatoria y debe ser una cadena de texto válida.'
                    })
                    .build()
                return res.status(400).json(response)
            }
            new_product_data.category = category
        }

        const updatedProduct = await ProductRepository.updateProduct(product_id, new_product_data)

        const response = new ResponseBuilder()
            .setOk(true)
            .setStatus(200)
            .setMessage('Producto actualizado con exito!')
            .setPayload(
                {
                    data: {
                        title: updatedProduct.title,
                        price: updatedProduct.price,
                        stock: updatedProduct.stock,
                        description: updatedProduct.description,
                        category: updatedProduct.category
                    }
                }
            )
            .build()
        res.json(response)
    }
    catch (error) {
        const response = new ResponseBuilder()
            .setOk(false)
            .setStatus(500)
            .setMessage('Internal Server Error')
            .setPayload({
                detail: error.message
            })
            .build()
        res.status(500).json(response)
    }
}

export const deleteProductController = async (req, res) => {
    try {
        const { product_id } = req.params
        const seller_id = req.user.id
        const role = req.user.role
        if (!product_id) {
            const response = new ResponseBuilder()
                .setOk(false)
                .setStatus(400)
                .setMessage('ID de producto es obligatorio')
                .setPayload({
                    detail: 'Por favor, proporciona un ID de producto valido'
                })
                .build()
            return res.status(400).json(response)
        }
        const product_found = await ProductRepository.getProductById(product_id)
        if (!product_found) {
            const response = new ResponseBuilder()
                .setOk(false)
                .setStatus(404)
                .setMessage('Producto no encontrado')
                .setPayload({
                    detail: `El producto con ID ${product_id} no existe.`
                })
                .build()
            return res.status(404).json(response)
        }

        if (role !== 'admin' && seller_id !== product_found.seller_id.toString()) {
            const response = new ResponseBuilder()
                .setOk(false)
                .setStatus(403)
                .setMessage('Acceso denegado')
                .setPayload({
                    detail: 'No tienes permiso para eliminar este producto'
                })
                .build()
            return res.status(403).json(response)
        }
        const productoAEliminar = await ProductRepository.deleteProduct(product_id)
        if (!productoAEliminar) {
            const response = new ResponseBuilder()
                .setOk(false)
                .setStatus(500)
                .setMessage('No se pudo eliminar el producto')
                .setPayload({
                    detail: 'El producto no se econtro o ya fue eliminado'
                })
                .build()
            return res.status(500).json(response)
        }

        const response = new ResponseBuilder()
            .setOk(true)
            .setStatus(200)
            .setMessage('Producto eliminado con exito!')
            .setPayload(
                {
                    data: {
                        id: productoAEliminar.id,
                        title: productoAEliminar.title,
                    }
                }
            )
            .build()
        res.json(response)
    }
    catch (error) {
        const response = new ResponseBuilder()
            .setOk(false)
            .setStatus(500)
            .setMessage('Internal Server Error')
            .setPayload({
                detail: error.message
            })
            .build()
        res.status(500).json(response)
    }
}