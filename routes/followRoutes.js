import express from 'express';
import * as followController from '../controllers/followController.js';
import auth from '../middlewares/auth.js'


const followRouter = express.Router();

followRouter.get('/prueba', followController.prueba);

followRouter.post('/save', auth, followController.save);
followRouter.delete('/unfollow/:id', auth, followController.unfollow);

followRouter.get('/following/:id?/:page?', auth, followController.following);
followRouter.get('/followers/:id?/:page?', auth, followController.followers);



export default followRouter;