import mongoose from "mongoose";

const connection = async () => {
    try{
        await mongoose.connect('mongodb+srv://vfernandezlagos:u6bPeKSLKQLSj7bc@api-red-social.k9wixul.mongodb.net/?retryWrites=true&w=majority');
        console.log('DB red_social_db successfully Connected!!')
    }catch(error){
        console.log(error);
        throw new Error('Can\'t connect to DB red_social_db');
    }
}

export default connection;