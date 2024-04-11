import jwt from 'jwt-simple'
import moment from 'moment'
import config from '../config.js';

// Clave secreta
const secret = config.JWT_KEY;

// Crear funcion para generar token
const createToken = (user) => {
    const payload = {
        id: user._id,
        name: user.name,
        surname: user.surname,
        nick: user.nick,
        email: user.email,
        role: user.role,
        image: user.image,
        iat: moment().unix(),
        exp: moment().add(30, 'days').unix(),
    };

    // Devolver jwt token codificado
    return jwt.encode(payload, secret);

}

export {
    createToken,
    secret
} 

