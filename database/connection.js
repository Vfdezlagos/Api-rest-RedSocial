import mongoose from "mongoose";

const connection = async () => {
    try{
        await mongoose.connect('mongodb://127.0.0.1:27017/red_social_db');
        console.log('DB red_social_db successfully Connected!!')
    }catch(error){
        console.log(error);
        throw new Error('Can\'t connect to DB red_social_db');
    }
}

export default connection;