// Importar modelos
import followModel from "../models/Follow.js";


// Importar servicios o helpers
import { followUserIds } from "../helpers/followService.js";


// Acciones de prueba
const prueba = (req, res) => {
    return res.status(200).send({
        message: 'mensaje enviado desde el controlador controllers/followController.js'
    });
}

// Accion de guardar un follow o seguir
const save = (req, res) => {
    // Conseguir datos por body
    const params = req.body;

    // Sacar id del usuario identificado
    const identity = req.user;

    // crear objeto con modelo follow
    const userToFollow = new followModel({
        user: identity.id,
        followed: params.followed
    });

    // guardar objeto en DB
    userToFollow.save()
                .then(followStored => {

                    if(!followStored || followStored === null){
                        return res.status(500).send({
                            status: 'Error',
                            message: 'Error al guardar el follow'
                        });
                    }

                    return res.status(200).send({
                        status: 'Success',
                        identity,
                        follow: followStored
                    });
                })
                .catch(error => {
                    return res.status(400).send({
                        status: 'Error',
                        message: 'Error al ejecutar la consulta'
                    });
                })
}

// Borrar un follow o dejar de seguir
const unfollow = (req, res) => {
    // Conseguir datos por params
    const userToUnfollowId = req.params.id;

    // Conseguir datos del user identificado
    const identityId = req.user.id;

    // Hacer la busqueda del follow por id de ambos y eiminar el follow
    const queryDeleteFollow = followModel.findOneAndDelete({
        user: identityId,
        followed: userToUnfollowId
    });

    // Ejecutar query
    queryDeleteFollow.exec()
    .then(result => {
        if(!result || result === null){
            return res.status(404).send({
                status: 'Not Found',
                message: 'Follow No encontrado'
            });
        }

        return res.status(200).send({
            status: 'Success',
            message: 'Haz eliminado el follow (haz dejado de seguir)',
            result
        });
    })
    .catch(error => {
        return res.status(400).send({
            status: 'Error',
            message: 'Error al ejecutar la consulta'
        });
    })
}

// Listado de usuarios que cualquier usuario esta siguiendo
const following = async (req, res) => {
    // Sacar el id de usuario identificado
    // let userId = req.user.id;

    // Comprobar si llega id por parametro de url
    const userId = req.params.id ? req.params.id : req.user.id;
    // if(req.params.id) userId = req.params.id;

    // Comprobar si me llega la page de url
    const page = req.params.page ? req.params.page : 1;
    // let page = 1;
    // if(req.params.page) page = req.params.page;

    // Cuantos usuarios por pagina mostrar
    const itemsPerPage = 5;

    // Find a follows, popular los datos de los usuarios, paginar con paginate
    const myCustomLabels = {
        docs: 'users',
        limit: 'itemsPerPage',
        totalDocs: 'total',
        totalPages: 'pages'
    }

    const options= {
        populate: {path:'user followed', select: '-password -role -__v -email'}, 
        page,
        limit: itemsPerPage,
        customLabels: myCustomLabels
    }

    await followModel.paginate({user: userId}, options)
    .then(async result => {

        // Sacar array de ids de los usuarios que me siguen y los que sigo como vicente
        let followUserIdsArray = await followUserIds(req.user.id);

        return res.status(200).send({
            status: 'Success',
            message: 'Listado de usurios que sigues o sigue el usuarios',
            follows: result.users,
            total: result.total,
            pages: result.pages,
            itemsPerPage: result.itemsPerPage,
            User_following: followUserIdsArray.followingClean,
            user_followed_by: followUserIdsArray.followersClean
        });
    })
    .catch(error => {
        return res.status(400).send({
            status: 'Error',
            message: 'Error al ejecutar la consulta',
        });
    });



    // Listado de usuarios de trinity, y yo soy vicente, devolver que usuarios que siguen a trinity me siguen a mi
    // Sacar array de ids de los usuarios que me siguen y los que sigo como vicente

    // return res.status(200).send({
    //     status: 'Success',
    //     message: 'Accion  de listado de usuarios que sigues',
    // });

}

// Listado de usuarios que siguen a cualquier usuario
const followers = async (req, res) => {

    // Sacar el id de usuario identificado
    // let userId = req.user.id;

    // Comprobar si llega id por parametro de url
    const userId = req.params.id ? req.params.id : req.user.id;
    // if(req.params.id) userId = req.params.id;

    // Comprobar si me llega la page de url
    const page = req.params.page ? req.params.page : 1;
    // let page = 1;
    // if(req.params.page) page = req.params.page;

    // Cuantos usuarios por pagina mostrar
    const itemsPerPage = 5;

    // Find a follows, popular los datos de los usuarios, paginar con paginate
    const myCustomLabels = {
        docs: 'users',
        limit: 'itemsPerPage',
        totalDocs: 'total',
        totalPages: 'pages'
    }

    const options= {
        populate: {path:'user', select: '-password -role -__v -email'}, 
        page,
        limit: itemsPerPage,
        customLabels: myCustomLabels
    }

    await followModel.paginate({followed: userId}, options)
    .then(async result => {

        // Sacar array de ids de los usuarios que me siguen y los que sigo como vicente
        let followUserIdsArray = await followUserIds(req.user.id);

        return res.status(200).send({
            status: 'Success',
            message: 'Listado de usurios que me siguen',
            follows: result.users,
            total: result.total,
            pages: result.pages,
            itemsPerPage: result.itemsPerPage,
            User_following: followUserIdsArray.followingClean,
            user_followed_by: followUserIdsArray.followersClean
        });
    })
    .catch(error => {
        return res.status(400).send({
            status: 'Error',
            message: 'Error al ejecutar la consulta',
        });
    });

}



// Exportar acciones
export {
    prueba,
    save,
    unfollow,
    following,
    followers
}