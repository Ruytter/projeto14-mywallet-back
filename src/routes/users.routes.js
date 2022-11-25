import { Router } from "express";
import {
  postSignup,
  postSignin
} from "../controllers/users.controllers.js";

const router = Router()

router.post("/sign-up", postSignup);

router.post("/", postSignin);

export default router