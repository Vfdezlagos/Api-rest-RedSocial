import publicationModel from "../models/Publication.js";
import { followUserIds } from "../helpers/followService.js";
import fs from 'node:fs';
import path from "node:path";

// Acciones de prueba
const prueba = (req, res) => {
    return res.status(200).send({
        message: 'mensaje enviado desde el controlador controllers/publicationController.js'
    });
}

// Guardar publicacion
const save = (req, res) => {

    // Recoger datos del body
    const params = req.body;

    // Si no me llegan dar respuesta negativa
    if(!params.text) return res.status(400).send({
        status: 'Error',
        message: 'Debes enviar el texto de la publicacion'
    })

    // Crear y rellenar el objeto del modelo
    const newPublication = new publicationModel(params);
    newPublication.user = req.user.id;

    // Guardar objeto en BBDD
    newPublication.save()
        .then(publicationStored => {

            if(!publicationStored){
                return res.status(400).send({
                    status: 'Error',
                    message: 'Error: No se ha guardado la publicacion'
                });
            }

            return res.status(200).send({
                status: 'Success',
                message: 'Publicacion guardada con exito',
                publication: publicationStored
            });
        })
        .catch(error => {
            return res.status(400).send({
                status: 'Error',
                message: 'Error al guardar la publicacion'
            });
        })

}

// Sacar una publicacion
const detail = (req, res) => {

    // Sacar id de la publicacion de la url
    const publicationId = req.params.id;

    // find con la condicion de id
    publicationModel.findById(publicationId).exec()
        .then(publication => {

            // Devolver respuesta si devuelve un object vacio
            if(!publication) return res.status(404).send({
                status: 'Not found',
                message: 'No se encontró la publicacion'
            });

            // Devolver la respuesta con la publicacion encontrada
            return res.status(200).json({
                status: 'Success',
                message: 'Publicacion encontrada',
                publication
            });
        })
        .catch(error => {
            // Devolver respuesta de error de ejecucion de la query
            return res.status(400).send({
                status: 'Error',
                message: 'Error al ejecutar la consulta'
            });
        })
}

// Eliminar publicaciones
const deletePublication = (req, res) => {
    // Sacar el id de la publicacion a eliminar
    const publicationId = req.params.id;

    // Find y luego remove
    publicationModel.findOneAndDelete({_id: publicationId, user: req.user.id}).exec()
        .then(deleted => {
            if(!deleted) return res.status(404).send({
                status: 'Not Found',
                message: 'Publicacion no encontrada o el usuario no es el creador de la publicacion'
            });

            return res.status(200).send({
                status: 'Success',
                message: 'Publicacion eliminada con exito',
                deleted_publication: deleted
            });
        })
        .catch(error => {
            return res.status(400).send({
                status: 'Error',
                message: 'Error al ejecutar la consulta'
            });
        })
}

// Listar todas las publicaciones
const listAll = (req, res) => {

    // Verificar si el usuario está logeado
    if(!req.user) {
        return res.status(401).send({
            status: 'Error',
            message: 'Acceso no autorizado, usuario no logeado'
        });
    }

    // hacer un paginate y devolver las publicaciones
    // Configuracion de mongoose paginate

    // controlar en que pagina estamos
    let page = req.params.page ? parseInt(req.params.page) : 1;

    let itemsPerPage = 5;
    
    const myCustomLabels = {
        docs: 'publications',
        limit: 'itemsPerPage',
        totalDocs: 'total',
        totalPages: 'pages'
    }

    const options= {
        page,
        limit: itemsPerPage,
        sort: {created_at: -1},
        customLabels: myCustomLabels
    }

    publicationModel.paginate({}, options)
        .then(data => {

            if(!data) return res.status(404).send({
                status: 'Not Found',
                message: 'Publicaciones no encontradas'
            });

            return res.status(200).send({
                status: 'Success',
                message: 'Listado de todas las publicaciones',
                data
            });
        })
        .catch(error => {
            return res.status(400).send({
                status: 'Error',
                message: 'Error al ejecutar la consulta'
            });
        })
}

// Listar publicaciones de un usuario
const userPosts = (req, res) => {

    // Recibir id por parametro, sino utilizar el id del usuario logeado
    let userId = req.params.id ? req.params.id : req.user.id;

    // Configurar el paginate
    
    let page = req.params.page ? req.params.page : 1;

    let itemsPerPage = 5;

    const myCustomLabels = {
        docs: 'publications',
        limit: 'itemsPerPage',
        totalDocs: 'total',
        totalPages: 'pages'
    }

    const options= {
        page,
        limit: itemsPerPage,
        sort: {created_at: -1},
        customLabels: myCustomLabels
    }

    // Hacer una paginate para mostrar las publicaciones del usuario

    publicationModel.paginate({user: userId}, options)
        .then(data => {

            if(!data || data.publications.length === 0) return res.status(404).send({
                status: 'Not Found',
                message: 'El usuario no tiene publicaciones'
            });

            return res.status(200).json({
                status: 'Success',
                message: 'Listado de publicaciones del usuario',
                data
            });
        })
        .catch(error => {
            return res.status(400).send({
                status: 'Error',
                message: 'Error al ejecutar la consulta'
            });
        });
}

// Subir ficheros
const upload = (req, res) => {

    // Recoger id de la publicacion desde la url
    const publicationId = req.params.id;

    // Recoger el fichero de imagen y comprobar que existe
    if(!req.file){
        return res.status(404).send({
            status: 'Error',
            message: 'Peticion no incluye la imagen'
        });
    }

    // Conseguir el nombre del archivo
    const image = req.file;
    const imageOriginalName = image.originalname;

    // Sacar la extension del archivo
    const splitImageName = imageOriginalName.split('\.');
    const extension = splitImageName[splitImageName.length - 1].toLowerCase();

    // comprobar extension

    // Si No es correcta, borrar el archivo
    if(extension !== 'jpg' && extension !== 'jpeg' && extension !== 'png' && extension !== 'gif'){

        // Borrar archivo subido
        const filePath = req.file.path;
        const deletedFile = fs.unlinkSync(filePath);

        return res.status(400).send({
            status: 'Error',
            message: 'El tipo de archivo no es compatible, debe ser jpg, jpeg, png o gif'
        });
    }

    // Si SI es correcta, guardar imagen en DB
    const queryUpdate = publicationModel.findOneAndUpdate({user: req.user.id, _id: publicationId}, {file: req.file.filename}, {new: true});


    queryUpdate.exec()
    .then(result => {
        // Devolver respuesta

        if(!result || result.length === 0){
            // Borrar archivo subido
            const filePath = req.file.path;
            const deletedFile = fs.unlinkSync(filePath);

            return res.status(404).json({
                status: 'Not Found',
                message: 'Publicacion no encontrada',
                result
            });
        }

        return res.status(200).json({
            status: 'Success',
            message: 'Imagen subida con exito y aplicada a la publicacion',
            result
        });
    })
    .catch(error => {

        // Borrar archivo subido
        const filePath = req.file.path;
        const deletedFile = fs.unlinkSync(filePath);

        return res.status(500).send({
            status: 'Error',
            message: 'Error al actualizar el campo image'
        });
    })

}

// Devolver archvos multimedia imagenes
const media = (req, res) => {

    // Recoger el parametro de la url
    const file = req.params.file;

    // montar el path real de la imagen
    const filePath = './uploads/publications/' + file;

    // Comprobar que existe
    fs.stat(filePath, (error, exist) => {
        if(!exist || error) return res.status(404).send({
            status: 'Error',
            message: 'File Not Found'
        });

        console.log(path.resolve(filePath));

        return res.sendFile(path.resolve(filePath));
    })

}

// Listar todas las publicaciones de los usuarios que sigo (FEED)
const feedPosts = async (req, res) => {

    // Obtener id del usuario logeado
    const userId = req.user.id;

    // Obtener el listado de userId de usuarios que sigo (Array)
    const following = await followUserIds(userId)
        .then(data => {
            if(!data) return [];

            return data.followingClean;
        })
        .catch(error => {
            return [];
        });

    // Configurar el paginate
    
    let page = req.params.page ? req.params.page : 1;

    let itemsPerPage = 5;

    const myCustomLabels = {
        docs: 'publications',
        limit: 'itemsPerPage',
        totalDocs: 'total',
        totalPages: 'pages'
    }

    const options= {
        page,
        select: {__v: 0},
        limit: itemsPerPage,
        sort: {created_at: -1},
        customLabels: myCustomLabels
    }

    // Hacer un paginate para posts de los usuarios que sigo

    publicationModel.paginate({user: {$in: following}}, options)
        .then(data => {

            if(!data) return res.status(404).send({
                status: 'Not Found',
                message: 'Publications not found'
            });

            return res.status(200).json({
                status: 'Success',
                message: 'Feed posts',
                data
            });
        })
        .catch(error => {
            return res.status(400).send({
                status: 'Error',
                message: 'Error al ejecutar la consulta'
            });
        });
}


// Exportar acciones
export {
    prueba,
    save,
    detail,
    deletePublication,
    listAll,
    userPosts,
    feedPosts,
    upload,
    media
}