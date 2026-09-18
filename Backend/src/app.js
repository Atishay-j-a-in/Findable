<<<<<<< HEAD
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

=======
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

>>>>>>> 79bfc919c7813b3c0f68aeb5fb5a5b53fca2cbb7
export {app}