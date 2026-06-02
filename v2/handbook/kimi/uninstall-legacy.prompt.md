# Prompt de IA — desinstalar o Kimi legado de um Mac (com segurança)

Cole o bloco abaixo num agente de terminal (kimi-code, Claude Code, etc.). Ele conduz a
remoção do **kimi-cli legado (Python, `~/.kimi/`)** sem tocar no **kimi-code novo (Node,
`~/.kimi-code/`)**. Se preferir o caminho determinístico, use o script irmão
[`uninstall-legacy.sh`](./uninstall-legacy.sh) — o prompt pode, inclusive, só rodá-lo.

---

```text
Você vai me ajudar a desinstalar o Kimi LEGADO (kimi-cli, versão Python) deste Mac.
Trabalhe em passos pequenos, peça aprovação antes de QUALQUER comando destrutivo e
explique o que cada um faz. Responda em pt-BR.

INVARIANTES DE SEGURANÇA (não negociáveis):
1. NUNCA remova nem altere `~/.kimi-code/` nem o binário `~/.kimi-code/bin/kimi` — essa é
   a versão NOVA (Node) e deve ficar intacta. O legado é `~/.kimi/` (ou $KIMI_SHARE_DIR).
2. NUNCA rode `rm -rf` em `$HOME`, `/`, caminho vazio ou em qualquer coisa sob `~/.kimi-code/`.
3. `~/.kimi/` contém CREDENCIAIS e sessões. Antes de apagá-lo:
   - me avise que, se eu ainda não migrei, devo rodar `kimi migrate` primeiro (ele lê de ~/.kimi);
   - ofereça um backup: `tar -czf ~/kimi-legacy-backup-$(date +%Y%m%d-%H%M%S).tgz -C ~ .kimi`.
4. Ao inspecionar `~/.zshrc`/`~/.zprofile`/etc., reporte apenas NOMES de arquivo e NÚMEROS
   de linha — NÃO imprima o conteúdo das linhas (pode conter tokens/segredos). Não edite
   esses arquivos automaticamente; só me diga o que revisar.

PASSOS:
A. Inventário (read-only): rode e me mostre o resultado de
   `type -a kimi`; `command -v uv pipx pip3 brew`; `uv tool list 2>/dev/null | grep -i kimi`;
   `pipx list 2>/dev/null | grep -i kimi`; `pip3 show kimi-cli 2>/dev/null`;
   `brew list --formula 2>/dev/null | grep -iE '^kimi'`;
   `ls -ld ~/.kimi ~/.kimi-code 2>/dev/null`.
   Diga claramente o que é legado x o que é a versão nova. Se NÃO houver nada legado,
   pare e me avise que não há o que remover.
B. Remover o pacote pelo gerenciador que o instalou (o que o inventário achou):
   `uv tool uninstall kimi-cli` | `pipx uninstall kimi-cli` |
   `pip3 uninstall -y kimi-cli` | `brew uninstall kimi`. Peça aprovação a cada um.
C. Dados (`~/.kimi/`): só depois do aviso de migração e da oferta de backup, e só com meu OK
   explícito, remova com `rm -rf ~/.kimi` — após confirmar que o caminho NÃO é `~/.kimi-code`.
D. Referências de shell: `grep -niE 'kimi' ~/.zshrc | grep -vi kimi-code | cut -d: -f1`
   (só números de linha). Liste para eu revisar à mão.
E. Resumo final: rode `type -a kimi` e `kimi --version`; confirme que o `kimi` restante
   (se houver) é o `~/.kimi-code/bin/kimi` novo. Liste o que foi removido e o que ficou.

Comece pelo passo A e aguarde meu OK antes do B.
```

---

## Variante "só rode o script"

Se você já tem o `uninstall-legacy.sh` ao lado, o prompt pode ser uma linha:

```text
Rode `bash handbook/kimi/uninstall-legacy.sh --dry-run` e me mostre a saída. Em seguida,
se fizer sentido, rode sem --dry-run (com --backup) e me peça confirmação nos passos
destrutivos. NUNCA toque em ~/.kimi-code (versão nova).
```
