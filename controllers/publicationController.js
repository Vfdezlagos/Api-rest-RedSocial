

// Acciones de prueba
const prueba = (req, res) => {
    return res.status(200).send({
        message: 'mensaje enviado desde el controlador controllers/publicationController.js'
    });
}


// Exportar acciones
export {
    prueba
}