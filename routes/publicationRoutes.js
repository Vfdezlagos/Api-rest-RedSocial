import express from 'express';
import * as publicationController from '../controllers/publicationController.js';
import auth from '../middlewares/auth.js';
import multer from 'multer';


const publicationRouter = express.Router();

// configuracion de subida
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads/publications');
    },

    filename: (req, file, cb) => {
        cb(null, 'pub-' + Date.now() + '-' + file.originalname);
    }
});

// crear el middleware
const uploads = multer({storage});

publicationRouter.get('/prueba', publicationController.prueba);

publicationRouter.post('/save', auth, publicationController.save);
publicationRouter.get('/detail/:id', auth, publicationController.detail);
publicationRouter.delete('/delete/:id', auth, publicationController.deletePublication);

publicationRouter.get('/listall', auth, publicationController.listAll);
publicationRouter.get('/user/:id?/:page?', auth, publicationController.userPosts);

publicationRouter.get('/feed/:page?', auth, publicationController.feedPosts);

publicationRouter.post('/upload/:id', [auth, uploads.single('file0')], publicationController.upload);
publicationRouter.get('/media/:file', publicationController.media);


export default publicationRouter;