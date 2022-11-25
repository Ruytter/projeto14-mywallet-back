import joi from "joi";

export const saldoSchema = joi.object({
  entrada: joi.number(),
  saida: joi.number(),
  descricao: joi.string().required()
});
