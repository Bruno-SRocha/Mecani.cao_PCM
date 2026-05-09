import { AppDataSource } from "../config/database";
import { DiagnosticoHistorico } from "../entities/diagnostico-historico.entity";

export const DiagnosticoHistoricoRepository = AppDataSource.getRepository(DiagnosticoHistorico).extend({});
