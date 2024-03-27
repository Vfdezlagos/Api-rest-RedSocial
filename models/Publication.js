import { Schema, model } from "mongoose";
import paginate from 'mongoose-paginate-v2';

const publicationSchema = Schema({
    user: {
        type: Schema.ObjectId,
        ref: "User"
    },
    text: {
        type: String,
        required: true
    },
    file: String,
    created_at: {
        type: Date,
        default: Date.now
    }
})

publicationSchema.plugin(paginate);

const publicationModel = model("Publication", publicationSchema, "publications");

export default publicationModel;