# Roça Kart — Pista 1: Fazenda Milharal

Kart arcade 3D com máquinas agrícolas, estilo cartoon (Three.js no navegador).

## Jogar
**Online (celular/tablet/PC):** https://lucianosmvm.github.io/roca-kart/ — publicado pelo GitHub Pages a cada push na `main`.

Dê dois cliques em `Jogar.bat` (sobe um servidor local na porta 8765 e abre o navegador).
Ou: `python -m http.server 8765` nesta pasta e abra http://localhost:8765

Escolha em 2 etapas: **máquina** (Maxi = Trator ST MAX 105, ou Imperador = pulverizador autopropelido) e, se for trator, **implemento engatado** (Absoluta ou nenhum).
Habilidade (tecla **Q** / botão HAB, barra enche dirigindo, no drift, nas caixas e ultrapassando) vem da aplicação da máquina:
- 🌻 **Plantio Relâmpago** (Absoluta) — fileira de girassóis gigantes atrás. Passiva: mudinhas atrapalham quem vem colado.
- 💦 **Barras Abertas** (Imperador) — abre as barras e empurra quem está do lado.
- 💨 **Arrancada Turbo** (trator sem implemento).
No celular/tablet: botões na tela, acelera sozinho; opção de direção assistida para crianças.

Controles: W/↑ acelera · S/↓ freio/ré · A/D vira · ESPAÇO drift (solte = turbo) · E/SHIFT item · R volta pra pista · C câmera.
Caixas de item (universais): ⛽ Biodiesel (turbo) · 🛰️ Piloto Guia · ⚡ Trovoada (raio no 1º). Itens fortes saem mais para quem está atrás. Segure acelerar no "1" da largada = turbo.

## Estrutura
- `blender/models/*.blend` — **todos os modelos editáveis** (trator, Imperador, Absoluta, props), texturas embutidas. Abra no Blender, edite e exporte (File → Export → glTF .glb) para `assets/` com o mesmo nome. Rodar os scripts abaixo regera e **sobrescreve** esses .blend.
- `blender/tractor_char.py` — **trator personagem atual** (olhos no para-brisa, sorriso na grade, faixa ST MAX 105), baseado na arte de referência e nas medidas de `Assembly/Tractor/StMax105.blend`. Gera `assets/tractor.glb` + `blender/models/tractor.blend`.
- `blender/tractor.py` — versão anterior (low-poly com fazendeiro); rodar sobrescreve `assets/tractor.glb`.
- `blender/imperador_char.py` — personagem Imperador (pulverizador autopropelido, coroa + bigode). Gera `assets/imperador.glb` (barras `BoomL/BoomR` separadas, pivô na frente) + `blender/models/imperador.blend`.
- `blender/absoluta_char.py` — plantadeira Absoluta (implemento de arrasto puxado pelo trator; rosto na frente, olhos acima das tampas, marca na traseira). Gera `assets/absoluta.glb` + `blender/models/absoluta.blend`.
- `blender/mcp_exec.py` — envia código ao Blender aberto via add-on Blender MCP (porta 9876).
- `blender/props.py` — props da fazenda (milho, trigo, girassol, fardos, celeiro, silo, cerca, árvores, vaca, espantalho, cata-vento, portal, nuvem, caixa de item, tomate).
- `blender/common.py` — helpers de modelagem/export.
- `js/main.js` — jogo (pista, física, IA, itens, HUD).

Regerar modelos:
```
"C:\Program Files\Blender Foundation\Blender 5.3\blender.exe" -b --factory-startup --python blender/tractor_char.py
"C:\Program Files\Blender Foundation\Blender 5.3\blender.exe" -b --factory-startup --python blender/imperador_char.py
"C:\Program Files\Blender Foundation\Blender 5.3\blender.exe" -b --factory-startup --python blender/props.py
```
