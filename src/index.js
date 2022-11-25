import express, { json } from "express";
import cors from "cors";
import dotenv from "dotenv";
import usersRouters from "./routes/users.routes.js"
import fluxosRouters from "./routes/fluxos.routes.js"

const app = express();
dotenv.config();
app.use(cors());
app.use(json());
app.use(usersRouters);
app.use(fluxosRouters);

app.listen(5000, () => console.log("runing in port 5000"));
