import transporter from "../config/transporter.config.js"

/* Envia un mail con el texto y el destinatario especificado como parametro */
const sendEmail = async (options) => {
    try{
        let response = await transporter.sendMail(options)
        console.log(response)
        }
    catch(error){
        //Para poder trackear mejor el error y arreglarlo
        console.error('Error al enviar mail:', error)
        //Para que la funcion que invoque a esta funcion tambien le salte el error
        throw error
    }
    
}

export {sendEmail}