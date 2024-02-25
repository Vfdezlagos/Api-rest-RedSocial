import jwt from 'jwt-simple';
import moment from 'moment';
import { secret } from '../helpers/jwt.js';


// Middleware (funcion) de autenticacion

const auth = (req, res, next) => {
    // Comprobar si me llega la cabecera de autenticacion
    if(!req.headers.authorization){
        return res.status(403).send({
            status: 'Error',
            message: 'La peticion no tiene la cabecera de atenticacion'
        });
    }

    // limpiar el token
    let token = req.headers.authorization.replace(/['"]+/g, '');

    // decodificar el token

    try{
        let payload = jwt.decode(token, secret);

        // Comprobar expiracion del token
        if(payload.exp <= moment().unix()){
            return res.status(401).send({
                status: 'Error',
                message: 'Token expirado'
            });
        };

        // agregar datos de usuario a la request
        req.user = payload;
    
    }catch(error){
        return res.status(404).send({
            status: 'Error',
            message: 'Token invalido',
            error
        });
    }


    // Pasar a ejecucion de accion o ruta
    next();
}


export default auth;