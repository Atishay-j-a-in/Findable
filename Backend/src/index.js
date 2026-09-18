<<<<<<< HEAD

import dotenv from 'dotenv';
dotenv.config({path:'./.env'});

import { app } from './app.js';

app.listen(5500,()=>{
    console.log("Server is running on port",process.env.PORT || 5500);
=======

import dotenv from 'dotenv';
dotenv.config({path:'./.env'});

import { app } from './app.js';

app.listen(5500,()=>{
    console.log("Server is running on port",process.env.PORT || 5500);
>>>>>>> 79bfc919c7813b3c0f68aeb5fb5a5b53fca2cbb7
})