/**
 * Middleware: Autorização por Nível de Acesso
 *
 * Verifica se o usuário autenticado possui o nível de acesso
 * necessário para acessar uma rota protegida.
 *
 * No contexto de PCM, os níveis de acesso são:
 * - ADMIN:   Acesso total (CRUD em todas as entidades)
 * - GESTOR:  Gerenciamento de equipamentos, aprovação de reportes
 * - TECNICO: Apenas leitura de equipamentos, registro de diagnósticos
 *
 * Uso nas rotas:
 *   router.post("/rota", authMiddleware, authorize("ADMIN", "GESTOR"), controller);
 */

import { Request, Response, NextFunction } from "express";

/**
 * Middleware factory de autorização baseada em nível de acesso.
 *
 * Recebe uma lista de níveis permitidos e retorna um middleware
 * que verifica se o nível do usuário autenticado está na lista.
 *
 * @param niveis - Níveis de acesso permitidos (ex: "ADMIN", "GESTOR")
 * @returns Middleware Express que bloqueia acesso não autorizado
 */
export function authorize(...niveis: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    /* O nível do usuário é injetado pelo authMiddleware */
    const userNivel = req.userNivel;

    if (!userNivel) {
      res.status(401).json({ error: "Usuário não autenticado." });
      return;
    }

    /* Verifica se o nível do usuário está entre os permitidos */
    if (!niveis.includes(userNivel)) {
      res.status(403).json({
        error: "Acesso negado. Você não tem permissão para esta operação.",
      });
      return;
    }

    /* Nível autorizado — permite a continuação */
    next();
  };
}
