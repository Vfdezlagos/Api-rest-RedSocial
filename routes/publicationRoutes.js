import express from 'express';
import * as publicationController from '../controllers/publicationController.js';


const publicationRouter = express.Router();

publicationRouter.get('/prueba', publicationController.prueba);


export default publicationRouter;