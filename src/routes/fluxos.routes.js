import { Router } from "express";
import{
  postEntrada,
  postSaida,
  postFluxo
} from "../controllers/fluxos.controllers.js"

const router = Router()

router.post("/entrada", postEntrada);

router.post("/saida", postSaida);

router.get("/fluxo", postFluxo)

export default router
