# 🚀 Guia da Desenvolvedora — ERP Frontend

> Este guia foi feito para te ajudar a navegar, testar e desenvolver no projeto com confiança.

---

## 📍 Onde acessar a aplicação

O frontend já está rodando em: **http://localhost:3000**

O backend está em: **http://localhost:3003**

> 💡 **Dica:** Mantenha os dois abertos no navegador. O frontend chama o backend automaticamente.

---

## 🔓 Autenticação — Como entrar no sistema

### A boa notícia: você não precisa de login real! 🎉

O projeto tem um **"bypass de autenticação"** ativo para desenvolvimento. Isso significa que, ao acessar `http://localhost:3000`, você já entra no sistema como se estivesse logada.

### Se quiser testar o login real:
1. Acesse: **http://localhost:3000/login**
2. Use as credenciais de um usuário cadastrado no backend
3. Se der erro 401/403, é porque o usuário não existe no banco ou a senha está errada

### Como o sistema protege as páginas
- Páginas como `/login`, `/recuperar-senha` → **públicas** (qualquer um acessa)
- Todas as outras páginas do ERP → **protegidas** (precisa estar logada)
- A proteção acontece no arquivo `src/app/(main)/layout.tsx`

---

## 🗺️ Módulos da aplicação — Onde tudo fica

Acesse pelo navegador ou pelo menu lateral (sidebar) da aplicação:

| Módulo | URL para testar | O que faz |
|--------|-----------------|-----------|
| **Contratos** | `/contratos` | Lista, cadastra, edita contratos |
| | `/contratos/adicionar` | Formulário de novo contrato |
| **Financeiro — Contas a Pagar** | `/contas-pagar` | Despesas, aprovações, pagamentos |
| | `/contas-pagar/lancar-despesas` | Lançar nova despesa |
| **Financeiro — Contas a Receber** | `/contas-receber` | Receitas, recebimentos |
| **Financeiro — Contas Bancárias** | `/contas-bancarias` | Cadastro de bancos |
| **Financeiro — Cartão** | `/cartao` | Cartões de crédito |
| **Gestão de Parceiros** | `/colaboradores` | Pessoas dos programas |
| | `/fornecedores` | Fornecedores |
| | `/financiadores` | Quem financia os programas |
| **Programas** | `/programas` | Programas sociais/institucionais |
| **Usuários** | `/usuarios` | Usuários do sistema |
| **Plano Orçamentário** | `/planejamento` | Orçamento anual |
| | `/consolidado` | Visão consolidada |
| **Relatórios** | `/geral`, `/equipe`, `/fluxocaixa` | Diversos relatórios financeiros |
| | `/realizado`, `/semcontratos` | Análises específicas |

> 💡 **Experimente:** Abra `http://localhost:3000/contratos` e depois `http://localhost:3000/contas-pagar` para ver como cada módulo se comporta.

---

## 🎨 Sistema de estilos — Como estilizar no projeto

O projeto usa **dois sistemas** simultaneamente. Isso é normal — ele está em transição:

### 1. Tailwind CSS (o moderno) — use este! ✅

Tailwind é um framework de classes utilitárias. Você escreve classes direto no HTML/JSX:

```tsx
// Exemplo: um botão azul com borda arredondada
<button className="bg-erp-primary text-white px-4 py-2 rounded-lg hover:bg-blue-500">
  Salvar
</button>
```

**Cores do projeto (Tailwind):**
| Token | Cor | Uso |
|-------|-----|-----|
| `bg-erp-primary` | `#32C6F4` (ciano) | Botões principais, destaques |
| `bg-erp-secondary` | `#FAA21A` (laranja) | Ações secundárias |
| `bg-erp-success` | `#64BC47` (verde) | Sucesso, aprovado |
| `bg-erp-danger` | `#FF5353` (vermelho) | Erro, excluir |
| `bg-erp-warning` | `#F5D35E` (amarelo) | Alertas |
| `bg-erp-background` | `#E8EEF0` (cinza claro) | Fundo das páginas |
| `bg-erp-nav` | `#464E78` (azul escuro) | Sidebar/menu |

**Função `cn()` — muito usada no projeto:**
```tsx
import { cn } from "@/lib/utils";

// Une classes e resolve conflitos automaticamente
<div className={cn("base-class", isActive && "active-class", className)}>
```

### 2. MUI / Material-UI (o legado)

Algumas páginas mais antigas usam componentes MUI:

```tsx
import { Box, TextField, Button } from "@mui/material";

<Box sx={{ display: "flex", gap: 2 }}>
  <TextField label="Nome" variant="outlined" />
</Box>
```

> ⚠️ **Regra de ouro:** Se você está criando algo **novo**, use **Tailwind + shadcn/ui**. Se está editando uma página antiga, pode manter o MUI ou migrar gradualmente.

---

## 🧱 Componentes base — shadcn/ui

Em `src/components/ui/` você encontra componentes prontos e customizados:

| Componente | Arquivo | Uso |
|------------|---------|-----|
| Botão | `button.tsx` | Várias variantes: `erpPrimary`, `erpSecondary`, `outlinedSecondary`... |
| Card | `card.tsx` | Card, CardHeader, CardTitle, CardContent |
| Avatar | `avatar.tsx` | Foto do usuário |
| Alert Dialog | `alert-dialog.tsx` | Modal de confirmação |

**Como usar um componente shadcn:**
```tsx
import { Button } from "@/components/ui/button";

<Button variant="erpPrimary" size="lg">
  Criar contrato
</Button>
```

---

## ✅ Checklist para verificar se tudo funciona

Use esta lista sempre que subir o projeto:

### 1. Servidores estão rodando?
```bash
# Verifique se o frontend está na porta 3000
curl http://localhost:3000

# Verifique se o backend responde
curl http://localhost:3003
```

### 2. Página inicial carrega?
- Abra `http://localhost:3000`
- Você deve ver o layout com sidebar azul escuro (`#464E78`) e conteúdo no centro

### 3. Sidebar funciona?
- Clique nos itens do menu lateral
- As páginas devem trocar sem erro

### 4. API está respondendo?
- Acesse `/contratos` ou `/contas-pagar`
- Se aparecerem dados em tabelas → backend está conectado ✅
- Se ficar em branco ou der erro → verifique o backend

### 5. Erros no console do navegador?
- Abra o DevTools (F12) → aba **Console**
- Erros `401` ou `403` são normais se você não fez login real
- Erros `500` ou `Network Error` → problema no backend

---

## 🐛 Fluxo de teste e debug

### Testando uma página nova ou editada:

1. **Edite o arquivo** (ex: `src/app/(main)/contratos/page.tsx`)
2. **Salve** — o Next.js recarrega automaticamente (Fast Refresh)
3. **Olhe o navegador** — a página atualiza sozinha
4. **Olhe o terminal** — erros de compilação aparecem lá
5. **Use o DevTools (F12)** para inspecionar elementos e ver o console

### Encontrou um erro?

| Tipo de erro | Onde olhar | Solução comum |
|--------------|------------|---------------|
| Tela branca | Console do navegador | Provavelmente erro de JavaScript |
| "Cannot find module" | Terminal do dev server | Import errado ou pacote não instalado |
| Erro 401/403 | Console do navegador | Problema de autenticação |
| Erro 500 | Terminal do backend | Backend caiu ou endpoint com erro |
| Estilo não aplica | Elemento no DevTools | Classe Tailwind errada ou conflito com MUI |

---

## 📁 Estrutura de pastas — onde fica o que

```
src/
├── app/                    ← Páginas e rotas (Next.js App Router)
│   ├── (main)/             ← Páginas logadas (com sidebar)
│   │   ├── (contracts)/    ← Módulo de contratos
│   │   ├── (financeiro)/   ← Módulo financeiro
│   │   ├── (reports)/      ← Relatórios
│   │   └── layout.tsx      ← Layout com sidebar e autenticação
│   ├── (auth)/             ← Páginas de login (sem sidebar)
│   └── api/auth/           ← Endpoint de autenticação
├── components/
│   ├── ui/                 ← Componentes base (shadcn/ui)
│   ├── layout/             ← Sidebar, header, containers
│   ├── modals/             ← Modais reutilizáveis
│   └── [domínio]/          ← Componentes específicos de módulo
├── hooks/                  ← Hooks customizados
├── services/               ← Chamadas de API (Axios)
├── types/                  ← Tipos TypeScript
├── contexts/               ← Contextos React (estado global)
└── styles/                 ← CSS global
```

---

## 🛠️ Comandos úteis

```bash
# Subir o frontend (modo desenvolvimento)
yarn dev

# Gerar tipos da API a partir do Swagger (se o doc.yaml existir)
yarn api:generate

# Verificar erros de TypeScript
yarn typecheck

# Verificar lint
yarn lint

# Build de produção
yarn build
```

---

## 🎯 Dicas para começar a desenvolver

### Quer editar uma página existente?
1. Descubra a rota (ex: `/contratos`)
2. O arquivo está em: `src/app/(main)/(contracts)/contratos/page.tsx`
3. Edite, salve e veja a mudança no navegador instantaneamente

### Quer criar uma página nova?
1. Crie uma pasta dentro do grupo adequado (ex: `src/app/(main)/minha-pagina/`)
2. Crie o arquivo `page.tsx` dentro dela
3. Acesse `http://localhost:3000/minha-pagina`

### Quer criar um componente novo?
1. Se for genérico (botão, input, card) → coloque em `src/components/ui/`
2. Se for de um módulo específico → coloque em `src/components/[nome-do-modulo]/`
3. Use Tailwind para estilizar

### Quer chamar uma API?
1. Verifique se já existe um serviço em `src/services/`
2. Se não existir, veja como os outros arquivos usam `axios` ou os hooks do React Query
3. O React Query cuida do cache e do loading automaticamente

---

## 📞 Quando pedir ajuda

- ❌ **Não conseguiu subir o projeto** → verifique se o backend está rodando na porta 3003
- ❌ **Página fica em branco** → abra o DevTools (F12) e veja o Console
- ❌ **Estilo não funciona** → confira se está usando Tailwind ou MUI naquela página
- ❌ **Não sabe onde está um componente** → use a busca do VS Code (Ctrl+Shift+F ou Cmd+Shift+F)

---

## 📚 Próximos passos recomendados

1. ✅ Acesse `http://localhost:3000` e navegue pelos módulos
2. ✅ Abra o DevTools (F12) e explore o Console e a aba Network
3. ✅ Edite uma cor no `tailwind.config.ts` e veja a mudança
4. ✅ Escolha um módulo e tente entender como a página é montada (page.tsx → componentes → serviços)

---

> 💬 **Lembrete:** Todo mundo começa assim. Explore sem medo — o Next.js recarrega automaticamente e você não vai quebrar nada permanentemente no ambiente de desenvolvimento!
