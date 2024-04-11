import mongoose from "mongoose";
import config from "../config.js";

const connection = async () => {
    try{
        await mongoose.connect(config.HOST);
        console.log('DB red_social_db successfully Connected!!')
    }catch(error){
        console.log(error);
        throw new Error('Can\'t connect to DB red_social_db');
    }
}

export default connection;