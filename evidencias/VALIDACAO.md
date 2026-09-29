# Validação das evidências recebidas em 28/09/2026

## Evidências aceitas

- `ddg/tracker-reporting.png`: página, tentativa de requisição ao `doubleclick.net`, DevTools e popup legíveis.
- `ddg/storage-blocking.png`: resultado da página, painel Storage e agregação do popup legíveis.
- `ddg/fingerprinting-canvas.png`: resultados de canvas, painel de rede e popup legíveis.
- `sites-reais/site-1-wikipedia/oceania.png`: página, rede e popup legíveis.
- `sites-reais/site-1-wikipedia/blacklight.png`: resultado principal do Blacklight legível.
- `sites-reais/site-1-wikipedia/ublock-logger.png`: logger legível e sem requisições de rede bloqueadas aparentes.
- `sites-reais/site-1-wikipedia/trafego.har`: HAR 1.2 válido, com 5 entradas e 1 página.
- `sites-reais/site-2-govbr/oceania.png`: popup, página e painel de rede legíveis.
- `sites-reais/site-2-govbr/blacklight.png`: resultado do Blacklight legível.
- `sites-reais/site-2-govbr/ublock-logger.md`: logger textual preservado para conferência.
- `sites-reais/site-2-govbr/trafego.har`: HAR 1.2 válido, com 149 entradas.
- `sites-reais/site-3-monkeytype/oceania.png`: popup, página e painel de rede legíveis; o score pode ser reproduzido pelos componentes visíveis.
- `sites-reais/site-3-monkeytype/blacklight.png`: resultado do Blacklight legível.
- `sites-reais/site-3-monkeytype/ublock-logger.md`: logger textual preservado para conferência.
- `sites-reais/site-3-monkeytype/trafego.har`: HAR 1.2 válido, com 38 entradas.

## Verificação do HAR da Wikipedia

- Criador/navegador: Zen 1.22.3b.
- Início da captura: `2026-09-28T23:04:55.184-03:00`.
- Requisições: 5 `GET`.
- Domínios: somente `www.wikipedia.org`.
- Status: quatro respostas 200 e uma 304.
- Cabeçalhos `Set-Cookie`: 0.
- Cookies únicos enviados: 5 (`GeoIP`, `NetworkProbeLimit`, `WMF-Last-Access`, `WMF-Last-Access-Global`, `WMF-Uniq`).

## Verificação do HAR do gov.br

- Criador/navegador: Zen 1.22.3b.
- Início da captura: `2026-09-28T23:38:06.057-03:00`.
- Requisições: 149 `GET`.
- Domínios terceiros nomeados: 8, em 57 entradas.
- Status: 135 respostas 200, três 302 e onze entradas com status 0.
- Cabeçalhos `Set-Cookie`: 0.
- Cookies únicos enviados: 2 (`Encrypted-Local-Storage-Key`, `I18N_LANGUAGE`).

## Verificação do HAR do Monkeytype

- Criador/navegador: Zen 1.22.3b.
- Início da captura: `2026-09-28T23:41:07.240-03:00`.
- Requisições: 35 `GET` e três `POST`, totalizando 38 entradas.
- Domínios terceiros nomeados: 7, em 9 entradas.
- Status: 30 respostas 200, duas 304 e seis entradas com status 0.
- Cabeçalhos `Set-Cookie`: 0.
- Cookie único enviado: `cf_clearance`.

## Pendências antes da entrega

1. Repetir as capturas finais no Firefox oficial e registrar sua versão.
2. Repetir a captura-base com bloqueadores desativados ou declarar claramente o uso das proteções; as evidências atuais de gov.br e Monkeytype registram bloqueios ativos.
3. Preencher nome, matrícula e URL do repositório no relatório.
4. Exportar `docs/RELATORIO.md` como PDF somente depois de completar as pendências.
