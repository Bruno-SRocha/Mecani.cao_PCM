/**
 * Seed: Usuário Administrador Padrão
 *
 * Cria o usuário administrador padrão na primeira execução do sistema.
 * Este seed é executado automaticamente ao iniciar o servidor.
 *
 * Credenciais padrão (devem ser alteradas em produção):
 *   Usuário: admin
 *   Senha:   admin@123
 *   Nível:   ADMIN
 *
 * Se o usuário "admin" já existir no banco, o seed é ignorado,
 * garantindo idempotência (pode rodar múltiplas vezes sem duplicar).
 */

import { UserRepository } from "../repositories/user.repository";
import { NivelUsuario } from "../entities/user.entity";

/**
 * Cria o usuário admin padrão caso ele não exista no banco.
 * Chamado automaticamente durante a inicialização do servidor.
 */
export async function seedAdminUser(): Promise<void> {
  /* Verifica se já existe um usuário "admin" */
  const adminExistente = await UserRepository.findByNomeUsuario("admin");

  if (adminExistente) {
    console.log("ℹ️  Usuário admin já existe. Seed ignorado.");
    return;
  }

  /* Cria o usuário admin padrão */
  const admin = UserRepository.create({
    nomeUsuario: "admin",
    senha: "admin@123",
    nome: "Administrador do Sistema",
    nivel: NivelUsuario.ADMIN,
  });

  await UserRepository.save(admin);

  console.log("✅ Usuário admin padrão criado (admin / admin@123)");
  console.log("⚠️  ATENÇÃO: Altere a senha padrão em produção!");
}
