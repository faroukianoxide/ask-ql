import express from "express" 
import router from "./routes";
import * as path from 'path'

import * as dotenv from 'dotenv'

dotenv.config();
let app:express.Application = express();
app.use("/", express.static(path.join(__dirname,'view')))

app.use(router)


export default app;

