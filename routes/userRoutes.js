import express from 'express';
import auth from '../middlewares/auth.js';
import * as userController from '../controllers/userController.js';
import multer from 'multer';


const userRouter = express.Router();

// configuracion de subida
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads/avatars');
    },

    filename: (req, file, cb) => {
        cb(null, 'avatar-' + Date.now() + '-' + file.originalname);
    }
});

// crear el middleware
const uploads = multer({storage});

userRouter.get('/prueba', auth, userController.prueba);

userRouter.post('/register', userController.register);
userRouter.post('/login', userController.login);

userRouter.get('/profile/:id', auth, userController.profile);
userRouter.get('/list/:page?', auth, userController.list);

userRouter.put('/update', auth, userController.update);

userRouter.post('/upload', [auth, uploads.single('file0')], userController.upload);

userRouter.get('/avatar/:file', userController.avatar);

userRouter.get('/counters/:id?', auth, userController.counters);


export default userRouter;