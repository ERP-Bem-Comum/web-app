# Request — USR-ME-PHOTO-DISPLAY

> Handoff do **front (web-app v2)** para o **core-api**. Padrão `000-request.md`.
> Origem: tentativa de destravar a **foto de perfil** (Minha Conta / inclusão de usuário) na fatia 024.
> Complementa o `USR-ME-PHOTO.md` (que pediu o **upload** de autosserviço, já entregue no #32).
> Verificado contra `core-api@dev` (commit do #32) em 2026-06-11. **Revalidado em 2026-06-14**: segue
> bloqueado — `get-user.ts` ainda devolve `imageUrl: String(user.photo)` (chave crua), o port
> `ProfilePhotoStorage` continua só com `upload`/`remove`, e o git log do core-api não tem nenhum commit
> de display/presigned desde o `5d3fef6` (o único de foto).

## Título
**Servir a imagem da foto de perfil** (GET por bytes **ou** `imageUrl` renderável) — hoje só há upload

## Size
M

## Contexto
O #32 entregou o **upload/remoção** de foto no autosserviço (`PUT /api/v1/me/photo`, `DELETE /api/v1/me/photo`)
e por admin (`PUT|DELETE /api/v1/users/:id/photo`). O front consegue **enviar** a foto, mas **não consegue
exibi-la** — então a feature de foto fica inútil (o usuário sobe uma imagem que nunca vê) e permanece **gated**
no front (Minha Conta → "Alterar Imagem"; inclusão → "Foto de Perfil").

## Estado atual (verificado)
- `GET /api/v1/me` e `GET /api/v1/users/:id` retornam `imageUrl: string | null`, **mas** o valor é a
  **chave opaca de storage**, não uma URL renderável:
  - `application/use-cases/get-user.ts` → `imageUrl: user.photo === null ? null : String(user.photo)`
    (`user.photo` é um `ProfilePhotoRef`, ex.: `users/<userId>`).
  - persistido em `image_url varchar(1024)` (`adapters/persistence/schemas/mysql.ts`).
- **Não existe rota que sirva os bytes** da foto:
  - `/api/v1/me/photo` e `/api/v1/users/:id/photo` têm **apenas `PUT` e `DELETE`** (nenhum `GET`).
  - o port `ProfilePhotoStorage` (`application/ports/profile-photo-storage.ts`) só tem `upload` e `remove`
    — **sem `read`/`get`/presigned**.
  - o adapter S3/MinIO (`adapters/storage/profile-photo-storage.s3.ts`) implementa só `upload` e `remove`.
- Resultado: o front recebe uma chave que **não dá** para usar em `<img src>`, e não há endpoint para
  buscar os bytes (nem via server function/BFF, pois o core-api não expõe leitura).

## Pedido ao backend

### ✅ Recomendado — Opção 2: rota de bytes (`GET .../photo`), proxied pelo BFF
Espelha o padrão **já em produção** de `GET /contracts/:id/documents/:id/content`. É a opção que melhor
encaixa nesta arquitetura, por dois motivos concretos (não é preferência estética):

1. **Não mexe na CSP do front.** A CSP é `img-src 'self' data:` e `connect-src 'self'`
   (`src/shared/http/security-headers.ts:23,25` — "o browser só fala com o BFF"). O BFF busca os bytes
   server-side (token na sessão), devolve base64 no envelope RPC e o browser monta um **Blob URL**
   (`blob:` ⊂ `'self'` para `<img>`). **Zero alteração de CSP.**
   - A Opção 1 (presigned) obrigaria a **abrir `img-src`** para o host do S3/MinIO — afrouxa a CSP e
     fura a invariante "browser só fala com o BFF". Além disso, presigned em `<img src>` vaza pela
     cache/Referer e exige TTL curto para uma imagem **privada**.
2. **Precedente pronto no front.** O fluxo `get-document-content.query.fn.ts` (server-fn `GET` → bytes
   em base64 → Blob no binding) é copiável quase 1:1 para a foto. Nada de infra nova no front.

**Contrato proposto** (mínimo viável):

```
GET /api/v1/me/photo            (requireAuth; id da sessão)
GET /api/v1/users/:id/photo     (user:read; opcional, p/ o detalhe admin)
  200 → bytes da imagem, Content-Type: image/jpeg|png|webp (o mime salvo no upload)
        (ideal: ETag/Cache-Control p/ o BFF poder revalidar; opcional na 1ª entrega)
  404 → 'photo-not-found' quando imageUrl IS NULL (front cai no fallback de iniciais)
  401/403 → cadeia de erro padrão
```

Isso exige no core-api: **(a)** adicionar `read(key) → bytes+mime` ao port `ProfilePhotoStorage`
(`application/ports/profile-photo-storage.ts`) e ao adapter S3/MinIO; **(b)** o handler `GET` que resolve
`user.photo` (key) → `storage.read` → stream/Buffer.

### Alternativa — Opção 1: `imageUrl` renderável (presigned)
Tornar `imageUrl` uma URL assinada de TTL curto em `GET /me` e `GET /users/:id`. **Mais simples no
backend**, mas **custa no front**: abre a CSP para o host do storage (ver acima) e tem as ressalvas de
cache/Referer de imagem privada. Só preferir se houver razão de infra para não proxiar pelo BFF.

### Critérios de aceite
1. Dado um usuário **com** foto, o front exibe a imagem (Minha Conta + avatar do topo) **sem expor token
   no browser** e **sem alterar a CSP** (`img-src`/`connect-src` seguem `'self'`).
2. Dado um usuário **sem** foto, a rota responde **404 `photo-not-found`** (ou `imageUrl=null`) e o front
   cai no **fallback de iniciais** (já implementado).
3. Vale para o **autosserviço** (`/me`) e, idealmente, para o **detalhe admin** (`/users/:id`).
4. O `Content-Type` retornado é o mime real salvo no upload (jpeg/png/webp), não `application/octet-stream`.

## Impacto no front (hoje)
- "Alterar Imagem" (Minha Conta → Editar Perfil) e "Foto de Perfil" (inclusão) seguem **gated**
  (desabilitados, com dica), com o avatar usando **iniciais**. A gating está **correta** enquanto não há
  exibição — ligar só o upload faria o usuário subir uma imagem que nunca vê.

### Prontidão do front (assim que o backend atender — Opção 2)
Tudo tem padrão-espelho já no repo; estimativa baixa:
- **Exibição**: copiar `src/modules/contracts/.../get-document-content.query.fn.ts` (server-fn `GET` →
  bytes em base64 → Blob no binding) para um `get-me-photo.query.fn.ts`; o avatar troca iniciais por
  `<img src={blobUrl}>` com fallback. Invalida `['users','me']`.
- **Upload** (`PUT /me/photo`, octet-stream): mirror de `attach-signed-document` (picker → base64 →
  validação de borda → bytes). ⚠️ O helper `src/external/core-api/octet-stream-fetch.ts` hoje é
  **hard-coded `method: 'POST'`** — precisa de um `method?: 'POST' | 'PUT'` (aditivo, default `POST`)
  para o `PUT /me/photo`.
- **Delete** (`DELETE /me/photo`): `resultFetch` com `method: 'DELETE'` (retorna o `UserDetail` no corpo).
- A cadeia de erro de foto (`photo-type-unsupported`, `photo-too-large`, `photo-content-mismatch` → 422;
  `photo-storage-unavailable` → 503) entra como novos slugs em `UsersError` + `usersErrorTag`.

> A fatia **024** foi reduzida a "municípios cross-state"; a foto volta ao backlog do front assim que este
> ticket for atendido. (No mesmo épico de Minha Conta, o **e-mail editável** — `USR-ME-PROFILE-FIELDS` — já
> foi destravado e ligado no front, pois o backend já o entregou no #32.)
