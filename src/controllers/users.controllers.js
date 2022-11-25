import { v4 as uuidV4 } from "uuid";
import bcrypt from "bcrypt"; 
import { User, Sessoes } from "../database/db.js"
import { userSchema } from "../models/users.model.js"

export async function postSignup (req, res) {
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
}

export async function postSignin (req, res) {
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
}