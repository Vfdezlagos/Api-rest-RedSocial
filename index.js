import express from "express";
import connection from "./database/connection.js";
import cors from 'cors';
import userRoutes from './routes/userRoutes.js';
import followRoutes from './routes/followRoutes.js';
import publicationRoutes from './routes/publicationRoutes.js';

// Conexion a DB
connection();


// Crear servidor de node
const app = express();
const port = 3000;


// Configurar el cors
app.use(cors());


// Convertir datos del body a objetos json
app.use(express.json());
app.use(express.urlencoded({extended: true}));


// Cargar conf rutas
app.use('/api/user', userRoutes);
app.use('/api/publication', publicationRoutes);
app.use('/api/follow', followRoutes);


// Ruta de prueba
app.get('/ruta-prueba', (req, res) => {
    return res.status(200).json({
        id: 1,
        nombre: 'Vicente',
        web: 'vicefedez.dev'
    });
});


// Poner servidor a escuchar peticiones http
app.listen(port, () => {
    console.log(`Server running at port ${port}`);
});