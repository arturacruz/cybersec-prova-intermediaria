# Validação das evidências recebidas em 28/09/2026

## Evidências aceitas

- `ddg/tracker-reporting.png`: página, tentativa de requisição ao `doubleclick.net`, DevTools e popup legíveis.
- `ddg/storage-blocking.png`: resultado da página, painel Storage e agregação do popup legíveis.
- `ddg/fingerprinting-canvas.png`: resultados de canvas, painel de rede e popup legíveis.
- `sites-reais/site-1-wikipedia/oceania.png`: página, rede e popup legíveis.
- `sites-reais/site-1-wikipedia/blacklight.png`: resultado principal do Blacklight legível.
- `sites-reais/site-1-wikipedia/ublock-logger.png`: logger legível e sem requisições de rede bloqueadas aparentes.
- `sites-reais/site-1-wikipedia/trafego.har`: HAR 1.2 válido, com 5 entradas e 1 página.

## Verificação do HAR da Wikipedia

- Criador/navegador: Zen 1.22.3b.
- Início da captura: `2026-09-28T23:04:55.184-03:00`.
- Requisições: 5 `GET`.
- Domínios: somente `www.wikipedia.org`.
- Status: quatro respostas 200 e uma 304.
- Cabeçalhos `Set-Cookie`: 0.
- Cookies únicos enviados: 5 (`GeoIP`, `NetworkProbeLimit`, `WMF-Last-Access`, `WMF-Last-Access-Global`, `WMF-Uniq`).

## Pendências antes da entrega

1. Repetir as capturas finais no Firefox oficial e registrar sua versão.
2. Executar dois sites reais adicionais, com HAR, Oceania, Blacklight e uBlock.
3. Preencher nome, matrícula e URL do repositório no relatório.
4. Exportar `docs/RELATORIO_PARCIAL.md` como PDF somente depois de completar as pendências.
