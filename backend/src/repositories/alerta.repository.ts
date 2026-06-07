import { AppDataSource } from "../config/database";
import { Alerta } from "../entities/alerta.entity";

export const AlertaRepository = AppDataSource.getRepository(Alerta).extend({
  async findPendentes(): Promise<Alerta[]> {
    return this.find({
      where: { lido: false },
      relations: ["componente", "componente.equipamento"],
      order: { criadoEm: "DESC" },
    });
  },

  async findAllAlertas(): Promise<Alerta[]> {
    return this.find({
      relations: ["componente", "componente.equipamento"],
      order: { criadoEm: "DESC" },
    });
  },
});
