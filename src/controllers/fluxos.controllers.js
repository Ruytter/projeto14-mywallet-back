import dayjs from "dayjs";
import { Entradas, Saidas, Sessoes } from "../database/db.js"
import { saldoSchema } from "../models/saldo.model.js";

async function getSession(req, res){
  const { authorization } = req.headers;
  const token = authorization?.replace("Bearer ", "");
  if (!token) {
    return res.sendStatus(401);
  }

  const sessionExiste = await Sessoes.findOne({ token });
  if (!sessionExiste) {
    return res.sendStatus(401);
  }
  return sessionExiste
}

export async function postEntrada (req, res) {
  const { entrada, descricao } = req.body;
  const sessionExiste = getSession(req, res)

  const { error } = saldoSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map((detail) => detail.message);
    return res.status(400).send(errors);
  }

  await Entradas.insertOne({
    userId: sessionExiste.userId,
    date: dayjs().format('DD/MM'),
    entrada,
    descricao
  })

  res.send(200);
}

export async function postSaida (req, res) {
  const { saida, descricao } = req.body;
  const sessionExiste = getSession(req, res)

  const { error } = saldoSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map((detail) => detail.message);
    return res.status(400).send(errors);
  }


  await Saidas.insertOne({
    userId: sessionExiste.userId,
    date: dayjs().format('DD/MM'),
    saida,
    descricao
  })
  
  res.sendStatus(200);
}

export async function postFluxo (req, res) {
  const sessionExiste = getSession(req, res)
  
  try {
    const entradas = await Entradas.find({userId: sessionExiste.userId }).toArray();
    const saidas = await Saidas.find({userId: sessionExiste.userId }).toArray();
    res.send({entradas, saidas});
  } catch (err) {
    res.sendStatus(500);
  }
}