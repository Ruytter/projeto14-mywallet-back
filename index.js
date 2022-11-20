import express, { json } from "express";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
import dayjs from "dayjs";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import joi from "joi";
import { v4 as uuidV4 } from "uuid";

const userSchema = joi.object({
  name: joi.string().required().min(3).max(100),
  email: joi.string().required().min(1),
  password: joi.string().required().min(6),
  // valorentrada:
  // valorsaida:
  // descricao:
});

const app = express();
dotenv.config();
app.use(cors());
app.use(json());

const mongoClient = new MongoClient(process.env.MONGO_URI);

try {
  await mongoClient.connect();
  console.log("mongodb conectato");
} catch (err) {
  console.log(err);
}

const db = mongoClient.db("mywallet");
const User = db.collection("user");
const Entrada = db.collection("entrada");
const Saida = db.collection("Saida");

app.post("/sign-up", async (req, res) => {
  const user = req.body;

  try {
    const userExiste = await User.findOne({ email: user.email });
    if (userExiste) {
      return res.status(409).send("E-mail já cadastrato");
    }

    const { error } = userSchema.validate(user, { abortEarly: false });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return res.status(400).send(errors);
    }

    const hashPassword = bcrypt.hashSync(user.password, 10);
    User.insertOne({ ...user, password: hashPassword });
    res.sendStatus(201);
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }

  res.send();
});

app.post("/", async (req, res) => {
  const { email, password } = req.body;

  const token = uuidV4();

  try {
    const userExiste = await User.findOne({ email });
    if (!userExiste) {
      return res.sendStatus(401);
    }

    const passwordOk = bcrypt.compareSync(password, userExiste.password);
    if (!passwordOk) {
      return res.sendStatus(401);
    }

    await db.collection("session").insertOne({
      token,
      userId: userExiste._id
    })

    res.send({ message: `Olá, ${userExiste.name}`, token });
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
});

app.post("/entrada", async (req, res) => {
  const { entrada, descricao } = req.body;
  console.log(dayjs().format('DD/MM'))
  res.send({ entrada });
});

app.post("/saida", async (req, res) => {
  const { saida, descricao } = req.body;
  
  res.send({ saida });
});

app.listen(5000, () => console.log("runing in port 5000"));
