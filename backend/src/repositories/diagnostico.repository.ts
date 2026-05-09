import { AppDataSource } from "../config/database";
import { Diagnostico } from "../entities/diagnostico.entity";

export const DiagnosticoRepository = AppDataSource.getRepository(Diagnostico).extend({
  // Podemos adicionar métodos customizados aqui depois se necessário
});
