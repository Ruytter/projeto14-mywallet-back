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
const User = db.collection("users");
const Entradas = db.collection("entradas");
const Saidas = db.collection("saidas");
const Sessoes = db.collection("sessions");

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

    const sessionExiste = await Sessoes.findOne({ userId: userExiste._id });
    if (!sessionExiste) {
      await Sessoes.insertOne({
        token,
        userId: userExiste._id
      })
      res.send({ user: userExiste.name, token });
      return
    }

    res.send({ user: userExiste.name, token: sessionExiste.token });
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
});

app.post("/entrada", async (req, res) => {
  const { entrada, descricao } = req.body;
  const { authorization } = req.headers;
  const token = authorization?.replace("Bearer ", "");
  if (!token) {
    return res.sendStatus(401);
  }

  const sessionExiste = await Sessoes.findOne({ token });
  if (!sessionExiste) {
    return res.sendStatus(401);
  }

  await Entradas.insertOne({
    userId: sessionExiste.userId,
    date: dayjs().format('DD/MM'),
    entrada,
    descricao
  })

  res.send(200);
});

app.post("/saida", async (req, res) => {
  const { saida, descricao } = req.body;
  const { authorization } = req.headers;
  const token = authorization?.replace("Bearer ", "");
  if (!token) {
    return res.sendStatus(401);
  }
  const sessionExiste = await Sessoes.findOne({ token });
  if (!sessionExiste) {
    return res.sendStatus(401);
  }

  await Saidas.insertOne({
    userId: sessionExiste.userId,
    date: dayjs().format('DD/MM'),
    saida,
    descricao
  })
  
  res.sendStatus(200);
});

app.get("/fluxo", async (req, res) => {
  const { authorization } = req.headers;
  const token = authorization?.replace("Bearer ", "");
  if (!token) {
    return res.sendStatus(401);
  }
  const sessionExiste = await Sessoes.findOne({ token });
  if (!sessionExiste) {
    return res.sendStatus(401);
  }
  
  try {
    const entradas = await Entradas.find({userId: sessionExiste.userId }).toArray();
    const saidas = await Saidas.find({userId: sessionExiste.userId }).toArray();
    res.send({entradas, saidas});
  } catch (err) {
    res.sendStatus(500);
  }
})

app.listen(5000, () => console.log("runing in port 5000"));
