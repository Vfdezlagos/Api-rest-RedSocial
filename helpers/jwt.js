import jwt from 'jwt-simple'
import moment from 'moment'

// Clave secreta
const secret = "ClAvE_SEcReTA_dEL_PROyECTo_DE_LA_rED_sOCiAL_1827547";

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

