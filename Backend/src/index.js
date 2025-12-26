
import dotenv from 'dotenv';
dotenv.config({path:'./.env'});

import { app } from './app.js';

app.listen(5500,()=>{
    console.log("Server is running on port",process.env.PORT || 5500);
})