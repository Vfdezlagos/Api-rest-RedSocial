import {Schema, model} from "mongoose";
import paginate from 'mongoose-paginate-v2';

const userSchema = Schema({
    name: {
        type: String,
        required: true
    },
    surname: {
        type: String
    },
    nick: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        default: 'role_user'
    },
    image: {
        type: String,
        default: 'default.png'
    },
    bio: {
        type: String
    },
    created_at: {
        type: Date,
        default: Date.now
    }

});

userSchema.plugin(paginate);

const userModel = model('User', userSchema, 'users');

export default userModel;