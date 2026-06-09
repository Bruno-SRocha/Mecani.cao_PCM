# 🔑 Usuários para Desenvolvimento e Testes

Este arquivo serve como guia de referência rápida para os dados de login e senhas dos usuários configurados no ambiente de desenvolvimento do **Mecâni.cão PCM**. 

Sempre que um novo tipo de usuário for adicionado ou as credenciais forem alteradas nos seeds, lembre-se de manter este arquivo atualizado para facilitar os testes.

---

## 📋 Tabela Geral de Credenciais

| Login (Usuário) | Senha Ativa | Nível / Papel | E-mail de Teste | Descrição / Permissões |
| :--- | :--- | :--- | :--- | :--- |
| **`admin`** | `Admin@Mecanicao2026` | **ADMIN** | `admin@mecanicao.com.br` | Acesso total ao sistema, gerenciamento de usuários, auditoria. |
| **`gestor`** | `Gestor@2026!` | **GESTOR** | `gestor@mecanicao.com.br` | Aprovação/rejeição de substituições de componentes, relatórios. |
| **`tecnico`** | `Tecnico@2026!` | **TECNICO** | `tecnico@mecanicao.com.br` | Lançamento de ordens, reporte de substituição de componentes. |
| **`tecnico2`** | `tecnico@123` | **TECNICO** | `tecnico2@mecanicao.com.br` | Lançamento de ordens, reporte de substituição de componentes. (Não alterou primeiro acesso) |
| **`tecnico3`** | `tecnico@123` | **TECNICO** | `tecnico3@mecanicao.com.br` | Lançamento de ordens, reporte de substituição de componentes. (Não alterou primeiro acesso) |

---

## 🛠️ Blocos de Cópia Rápida

Para facilitar e agilizar o login durante os testes, utilize as caixas abaixo para copiar rapidamente as credenciais:

### 👤 Administrador (ADMIN)
* **Login:** `admin`
* **Senha:** `Admin@Mecanicao2026`
```text
Login: admin | Senha: Admin@Mecanicao2026 | Tipo de usuario: Admin
```

### 👥 Gestor (GESTOR)
* **Login:** `gestor`
* **Senha:** `Gestor@2026!`
```text
Login: gestor | Senha: Gestor@2026! | Tipo de usuario: Gestor
```

### 🔧 Técnico 1 (TECNICO)
* **Login:** `tecnico`
* **Senha:** `Tecnico@2026!`
```text
Login: tecnico | Senha: Tecnico@2026! | Tipo de usuario: Tecnico
```

### 🔧 Técnico 2 (TECNICO)
* **Login:** `tecnico2`
* **Senha:** `tecnico@123`
```text
Login: tecnico2 | Senha: tecnico@123 | Tipo de usuario: Tecnico
```

### 🔧 Técnico 3 (TECNICO)
* **Login:** `tecnico3`
* **Senha:** `tecnico@123`
```text
Login: tecnico3 | Senha: tecnico@123 | Tipo de usuario: Tecnico
```

---

> ⚠️ **Aviso de Segurança:** Estas credenciais são exclusivas para o ambiente de desenvolvimento e testes locais. Nunca utilize ou mantenha essas senhas padronizadas em ambientes de homologação ou produção!
