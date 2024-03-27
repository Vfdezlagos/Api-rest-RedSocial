// importar dependencias y modulos
import userModel from '../models/User.js';
import followModel from '../models/Follow.js';
import publicationModel from '../models/Publication.js';
import bcrypt from 'bcrypt';
import * as jwt from '../helpers/jwt.js';
import fs from 'node:fs';
import path from 'node:path';


// Importar servicios
import { followUserIds, followThisUser } from '../helpers/followService.js';
import validate from '../helpers/validate.js';


// Acciones de prueba
const prueba = (req, res) => {
    return res.status(200).send({
        message: 'mensaje enviado desde el controlador controllers/userController.js',
        user: req.user
    });
}

// Registro de usuarios
const register = async (req, res) => {
    // Recoger datos de la peticion
    let params = req.body;
    
    // comprobar que llegan bien (+ validacion)
    if(!params.name || !params.email || !params.password || !params.nick){
        return res.status(400).json({
            status: 'Error',
            message: 'Faltan datos por enviar'
        });
    }

    // Validacion avanzada
    try{
        validate(params);
    }catch(exception){
        return res.status(400).json({
            status: 'Error',
            message: 'Validacion no superada'
        });
    }
    



    // control de usuarios duplicados
    const queryUsers = userModel.find({$or: [
        {email: params.email.toLowerCase()},
        {nick: params.nick.toLowerCase()}
    ]});

    await queryUsers.exec()
    .then( async resultado => {
        if(resultado.length > 0 && resultado != null){
            return res.status(200).send({
                status: 'success',
                message: 'El usuario ya existe :('
            });
        }

        // cifrar contraseña
        await bcrypt.hash(params.password, 10)
            .then( async cifredPass => {
                params.password = cifredPass;

                // Crear objeto de usuario
                let user = new userModel(params);

                // guardar usuario en DB
                await user.save()
                    .then(resultado => {
                        // Si todo OK
                        return res.status(200).json({
                            status: 'success',
                            message: 'Usuario registrado con exito',
                            user: resultado
                        });
                    })
                    .catch(error => {
                        return res.status(400).json({
                            status: 'Error',
                            message: 'Error al insertar usuario en la DB',
                            error
                        });
                    });
            })
            .catch(error => {
                return res.status(400).json({
                    status: 'Error',
                    message: 'Error al encriptar la contraseña',
                    error
                });
            });  
    })
    .catch(error => {
        return res.status(500).json({
            status: 'Error',
            message: 'Error en la consulta de usuarios',
            error
        });
    })
}

const login = async (req, res) => {

    // Recoger parametrso del body
    let params = req.body;

    if(!params.email || !params.password){
        return res.status(400).json({
            status: 'Error',
            message: 'Faltan datos por enviar'
        });
    }

    // buscar en DB si existe el usuario o email
    await userModel.findOne({email: params.email})
                    // .select({"password": 0}) // select es para seleccionar y/o quitar los campos a mostrar de la busqueda
                    .exec()
                    .then(user => {
                        if(user == null || user.length == 0){
                            return res.status(404).json({
                                status: 'Not found',
                                message: 'El usuario No existe'
                            })
                        }
                        // Comprobar su contraseña
                        const pwd = bcrypt.compareSync(params.password, user.password);

                        if(!pwd){
                            return res.status(400).json({
                                status: 'Error',
                                message: 'La contraseña ingresada no es correcta'
                            });
                        }

                        // devolver TOken
                        const token = jwt.createToken(user);


                        // devolver datos del usuario

                        return res.status(200).json({
                            status: 'success',
                            message: 'Usuario identificado correctamente',
                            user:{
                                id: user._id,
                                name: user.name,
                                nick: user.nick,
                                email: user.email
                            },
                            token
                        });
                    })
                    .catch(error => {
                        return res.status(400).json({
                            status: 'Error',
                            message: 'Error al ejecutar la consulta'
                        })
                    });

}

const profile = async (req, res) => {
    // Recibir el parametro del id de usuario por la url
    const id = req.params.id;

    // consulta para sacar los datos del usuario
    await userModel.findById(id)
                    .select({
                        password: 0,
                        role: 0
                    })
                    .exec()
                    .then(async user => {
                        // Posteriormente devolver informacion de follows
                        let followInfo = await followThisUser(req.user.id, id);

                        // devolver el resultado
                        return res.status(200).json({
                            status: 'success',
                            user,
                            following: followInfo.following,
                            follower: followInfo.follower
                        });

                    })
                    .catch(error => {
                        return res.status(404).send({
                            status: 'Error',
                            message: 'El usuario no existe'
                        });
                    });

}

const list = async (req, res) => {

    // controlar en que pagina estamos
    let page = req.params.page ? parseInt(req.params.page) : 1;


    // Consulta con mongoose paginate
    let itemsPerPage = 5;
    
    const myCustomLabels = {
        docs: 'users',
        limit: 'itemsPerPage',
        totalDocs: 'total',
        totalPages: 'pages'
    }

    const options= {
        page,
        select: {password: 0, email: 0, __v: 0, role: 0},
        limit: itemsPerPage,
        sort: {_id: 1},
        customLabels: myCustomLabels
    }



    await userModel.paginate({}, options)
            .then(async result => {
                if(result.length === 0 && result == null){
                    return res.status(404).send({
                        status: 'Error',
                        message: 'No se encontraron usuarios'
                    })
                }

                // Sacar array de ids de los usuarios que me siguen y los que sigo como vicente
                let followUserIdsArray = await followUserIds(req.user.id);

                // Devolver resultado (poesteriormente info de follows)
                return res.status(200).json({
                    status: 'success',
                    users: result.users,
                    following: followUserIdsArray.followingClean,
                    followed_by: followUserIdsArray.followersClean,
                    page: result.page,
                    itemsPerPage: result.itemsPerPage,
                    total: result.total,
                    pages: result.pages
                });
            })
            .catch(error => {
                return res.status(500).send({
                    status: 'Error',
                    message: 'Error al ejecutar la consulta'
                })
            })

}

const update = async (req, res) => {

    // Recoger info del usuario a actualizar
    const userIdentity = req.user;
    let userToUpdate = req.body

    // Eliminar campos sobrantes
    delete userToUpdate.iat;
    delete userToUpdate.exp;
    delete userToUpdate.role;
    delete userToUpdate.image;

    // Comprobar si el usuario ya existe
    // control de usuarios duplicados
    const queryUsers = userModel.find({$or: [
        {email: userToUpdate.email},
        {nick: userToUpdate.nick}
    ]});

    await queryUsers.exec()
    .then( async users => {
        
        let userIsSet = false;

        users.forEach(user => {
            if(user && user._id != userIdentity.id) userIsSet = true;
        });

        if(userIsSet){
            return res.status(200).send({
                status: 'success',
                message: 'El usuario ya existe'
            });
        }

        // Si me llega la contraseña, cifrarla
        if(userToUpdate.password){
            let pwd = await bcrypt.hash(userToUpdate.password, 10);
            userToUpdate.password = pwd;
        }else {
            delete userToUpdate.password;
        }


        // Buscar y actualizar el usuario
        const queryFindUpdate = userModel.findByIdAndUpdate({_id: userIdentity.id}, userToUpdate, {new: true});
        // const queryFindUpdate = userModel.findByIdAndUpdate(123123123, userToUpdate, {new: true});

        queryFindUpdate.exec()
        .then(updatedUser => {
            return res.status(200).json({
                status: 'Success',
                message: 'Usuario actualizado',
                updatedUser
            });
        })
        .catch(error => {
            return res.status(500).send({
                status: 'Error',
                message: 'Error al ejecutar la query de actualizacion',
            })
        })
    });
}

const upload = (req, res) => {

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
    const queryUpdate = userModel.findOneAndUpdate({_id: req.user.id}, {image: req.file.filename}, {new: true});


    queryUpdate.exec()
    .then(result => {
        // Devolver respuesta

        if(!result || result.length === 0){
            // Borrar archivo subido
            const filePath = req.file.path;
            const deletedFile = fs.unlinkSync(filePath);

            return res.status(404).json({
                status: 'Not Found',
                message: 'Usuario no encontrado',
                result
            });
        }

        return res.status(200).json({
            status: 'Success',
            message: 'Imagen subida con exito y aplicada al usuario',
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

const avatar = (req, res) => {

    // Recoger el parametro de la url
    const file = req.params.file;

    // montar el path real de la imagen
    const filePath = './uploads/avatars/' + file;

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

const counters = async (req, res) => {

    // Obtener id del usuario logeado
    let userId = req.user.id;

    if(req.params.id) {
        userId = req.params.id;
    }


    try{

        const following = await followModel.countDocuments({user: userId}).exec();

        const followed = await followModel.countDocuments({followed: userId}).exec();
        
        const publications = await publicationModel.countDocuments({user: userId}).exec();

        return res.status(200).json({
            status: 'Success',
            message: 'Contador de follows y posts',
            following,
            followed,
            publications
        });
    
    }catch(exception){
        return res.status(500).send({
            status: 'Error',
            message: 'Error al ejecutar la consulta'
        });
    }

}

// Exportar acciones
export {
    prueba,
    register,
    login,
    profile,
    list,
    update,
    upload,
    avatar,
    counters
}