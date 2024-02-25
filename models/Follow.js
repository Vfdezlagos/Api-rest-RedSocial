import { Schema, model } from 'mongoose';
import paginate from 'mongoose-paginate-v2';

const followSchema = Schema({
    user: {
        type: Schema.ObjectId,
        ref: "User"
    },
    followed: {
        type: Schema.ObjectId,
        ref: "User"
    },
    created_at: {
        type: Date,
        default: Date.now
    }

});

followSchema.plugin(paginate);

const followModel = model('Follow', followSchema, 'follows');

export default followModel;