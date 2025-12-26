import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config({path:'./.env'});
const app = express();

app.use(cors(
    {
        origin: process.env.CORS_ORIGIN,//only frontend url will be allowed to use backend not any other url
        credentials: true // allow session cookie from browser to pass through
    }
));

app.use(express.json())
app.use(express.urlencoded({extended:true}))

app.use(express.static('public'));

import ocrenable from "./routes/ocrenable.routes.js"
app.use("/upload", ocrenable)

export {app}