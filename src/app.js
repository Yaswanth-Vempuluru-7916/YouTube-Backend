import express from "express";
import cookieParser from "cookie-parser";
import cors from 'cors'
const app = express()

//! app.use()  --> Middleware
app.use(cors({
    origin : process.env.CORS_ORIGIN,
    credentials : true
}))

app.use(express.json({limit : "16kb"}))
//url encoder   --> 'space' --> %20
app.use(express.urlencoded({extended :true , limit : "16kb"}))

//pdf images --> public assets server lo store
app.use(express.static("public"))
app.use(cookieParser())

//! (err,req,res,next)  --> next anedhi middleware  between client and server various checks will happen like authentication access. after the first check it will next telling my check is over 

export {app}