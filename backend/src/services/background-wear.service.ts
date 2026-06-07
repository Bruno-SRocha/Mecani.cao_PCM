import { ComponenteRepository } from "../repositories/componente.repository";
import { AlertaRepository } from "../repositories/alerta.repository";

let intervalId: NodeJS.Timeout | null = null;

/**
 * Inicializa o serviço em background que calcula periodicamente o desgaste de todos os componentes.
 * Regras:
 * - Desgaste = (Horas Atuais / Vida Útil * 100)
 * - Se Desgaste >= 100% => Status muda para "Crítico" e gera alerta
 * - Se Desgaste >= 85% e < 100% => Status muda para "Atenção" e gera alerta
 * - Se Desgaste < 85% => Status muda para "Saudável"
 * 
 * @param intervalMs - Intervalo de execução do loop em milissegundos
 */
export function startBackgroundWearCalculator(intervalMs: number = 5000) {
  if (intervalId) return;

  console.log(`⏳ Serviço de background para cálculo de desgaste iniciado (${intervalMs / 1000}s)`);

  intervalId = setInterval(async () => {
    try {
      const componentes = await ComponenteRepository.find({
        relations: ["equipamento"],
      });

      for (const comp of componentes) {
        if (!comp.vidaUtilNominal || comp.vidaUtilNominal <= 0) continue;

        const wear = (comp.horasOperacionais / comp.vidaUtilNominal) * 100;
        let newStatus = "Saudável";

        if (wear >= 100) {
          newStatus = "Crítico";
        } else if (wear >= 85) {
          newStatus = "Atenção";
        }

        // Se o status mudou, atualiza e gera alerta
        if (comp.status !== newStatus) {
          const oldStatus = comp.status;
          comp.status = newStatus;
          await ComponenteRepository.save(comp);
          console.log(`⚙️ Componente "${comp.nome}" atualizou status: ${oldStatus} → ${newStatus} (Desgaste: ${wear.toFixed(1)}%)`);

          // Gera alertas apenas se mudou para Atenção ou Crítico
          if (newStatus === "Atenção" || newStatus === "Crítico") {
            // Evita criar alertas duplicados não lidos do mesmo tipo para o mesmo componente
            const existingAlert = await AlertaRepository.findOne({
              where: {
                componenteId: comp.id,
                tipo: newStatus,
                lido: false,
              },
            });

            if (!existingAlert) {
              const equipName = comp.equipamento ? comp.equipamento.nome : "Equipamento Desconhecido";
              const equipTag = comp.equipamento ? comp.equipamento.tag : "TAG-?";
              const msg = `O componente "${comp.nome}" do equipamento "${equipName}" (${equipTag}) atingiu ${wear.toFixed(1)}% de desgaste (status: ${newStatus}).`;

              const alerta = AlertaRepository.create({
                mensagem: msg,
                tipo: newStatus,
                componenteId: comp.id,
                lido: false,
              });

              await AlertaRepository.save(alerta);
              console.log(`🔔 Novo alerta gerado: [${newStatus}] ${msg}`);
            }
          }
        }
      }
    } catch (error) {
      console.error("❌ Erro no cálculo de desgaste em background:", error);
    }
  }, intervalMs);
}

/**
 * Para a execução do serviço de background.
 */
export function stopBackgroundWearCalculator() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log("🛑 Serviço de background para cálculo de desgaste parado");
  }
}
