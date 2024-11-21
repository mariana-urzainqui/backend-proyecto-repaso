import database_pool from "../db/configMysql.js";
import Product from "../models/product.model.js";
//Product Repository MONGODB
/* class ProductRepository{
    //Obtener lista de productos activos
    static async getProducts(){
        return Product.find({active: true})
    }

    static async getProductById(id){
        return Product.findById(id)
    }

    static async createProduct(product_data){
        const new_product = new Product(product_data)
        return new_product.save()
    }

    static async updateProduct(id, updated_product_data){
        return Product.findByIdAndUpdate(id, updated_product_data, {new: true})
    }

    static async deleteProduct(id){
        return Product.findByIdAndUpdate(id, {active: false}, {new: true})
    }
} */

class ProductRepository {
    static async getProducts() {
        const query = 'SELECT * FROM products WHERE active = true'
        const [registros, columnas] = await database_pool.execute(query)
        // Esto devuelve un array con 2 valores
        // El primer valor es el resultado o las rows / filas / registros
        // El segundo valor son las columns
        return registros
    }

    static async getProductById(product_id) {
        const query = `SELECT * FROM products WHERE id = ?`
        //Execute espera como segundo parametro un array con los valores que quieras reemplazar en la query
        const [registros] = await database_pool.execute(query, [product_id])
        return registros.length > 0 ? registros[0] : null
    }

    static async createProduct(product_data) {
        const { title, price, stock, description, category, image_base_64 } = product_data;
        
        const seller_id = product_data.seller_id;
    
        const query = `INSERT INTO products
            (title, price, stock, description, category, image_base_64, seller_id) 
            VALUES 
            (?, ?, ?, ?, ?, ?, ?)`;
    
        const [resultado] = await database_pool.execute(query, [
            title, price, stock, description, category, image_base_64, seller_id
        ]);
    
        return {
            id: resultado.insertId,
            title,
            price,
            stock,
            description,
            category,
            active: true,
            image_base_64,
            seller_id 
        };
    }
    

    static async updateProduct(id, updated_product_data) {

    }

    static async deleteProduct(id) {

    }
}


export default ProductRepository

