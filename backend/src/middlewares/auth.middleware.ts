/**
 * Middleware: Autenticação JWT
 *
 * Intercepta requisições para rotas protegidas (área privada)
 * e verifica se o token JWT é válido.
 *
 * Fluxo:
 * 1. Extrai o token do header Authorization (formato: "Bearer <token>")
 * 2. Verifica e decodifica o token usando a chave JWT_SECRET
 * 3. Se válido, adiciona os dados do usuário ao objeto req
 * 4. Se inválido, retorna 401 Unauthorized
 *
 * Uso nas rotas:
 *   router.get("/rota-protegida", authMiddleware, controller);
 */

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

/**
 * Interface dos dados decodificados do token JWT.
 * Corresponde ao payload inserido durante o login.
 */
interface JwtPayload {
  id: string;
  nomeUsuario: string;
  nivel: string;
}

/**
 * Estende a interface Request do Express para incluir
 * os dados do usuário autenticado (vindos do token JWT).
 */
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userNomeUsuario?: string;
      userNivel?: string;
    }
  }
}

/**
 * Middleware de autenticação JWT.
 *
 * Deve ser aplicado em todas as rotas que exigem login.
 * Após a verificação bem-sucedida, os dados do usuário ficam
 * disponíveis em req.userId, req.userNomeUsuario e req.userNivel.
 */
export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  /* Extrai o header Authorization */
  const authHeader = req.headers.authorization;

  /* Verifica se o header está presente */
  if (!authHeader) {
    res.status(401).json({ error: "Token de autenticação não fornecido." });
    return;
  }

  /* O formato esperado é "Bearer <token>" */
  const parts = authHeader.split(" ");

  if (parts.length !== 2 || parts[0] !== "Bearer") {
    res.status(401).json({ error: "Formato de token inválido. Use: Bearer <token>" });
    return;
  }

  const token = parts[1];

  try {
    /* Verifica e decodifica o token JWT */
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    /* Injeta os dados do usuário no objeto Request */
    req.userId = decoded.id;
    req.userNomeUsuario = decoded.nomeUsuario;
    req.userNivel = decoded.nivel;

    /* Permite que a requisição continue para o próximo handler */
    next();
  } catch {
    /* Token expirado ou inválido */
    res.status(401).json({ error: "Token inválido ou expirado." });
  }
}
