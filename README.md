# Roça Kart — Pista 1: Fazenda Milharal

Kart arcade 3D com máquinas agrícolas, estilo cartoon (Three.js no navegador).

## Jogar
Dê dois cliques em `Jogar.bat` (sobe um servidor local na porta 8765 e abre o navegador).
Ou: `python -m http.server 8765` nesta pasta e abra http://localhost:8765

Personagens: **Maxi** (Trator ST MAX 105, equilibrado) e **Imperador** (Pulverizador, rápido e pesado, curva pior). Escolha no menu.
No celular/tablet: botões na tela, acelera sozinho; opção de direção assistida para crianças.

Controles: W/↑ acelera · S/↓ freio/ré · A/D vira · ESPAÇO drift (solte = turbo) · E/SHIFT item · R volta pra pista · C câmera.
Itens: 🔥 Turbo · 🌾 Fardo (solta atrás) · 🍅 Tomate (arremessa pra frente). Segure acelerar no "1" da largada = turbo.

## Estrutura
- `blender/tractor_char.py` — **trator personagem atual** (olhos no para-brisa, sorriso na grade, faixa ST MAX 105), baseado na arte de referência e nas medidas de `Assembly/Tractor/StMax105.blend`. Gera `assets/tractor.glb` + `blender/tractor_character.blend`.
- `blender/tractor.py` — versão anterior (low-poly com fazendeiro); rodar sobrescreve `assets/tractor.glb`.
- `blender/imperador_char.py` — personagem Imperador (pulverizador autopropelido, coroa + bigode). Gera `assets/imperador.glb` (barras `BoomL/BoomR` separadas, pivô na frente) + `blender/imperador_character.blend`.
- `blender/mcp_exec.py` — envia código ao Blender aberto via add-on Blender MCP (porta 9876).
- `blender/props.py` — props da fazenda (milho, trigo, girassol, fardos, celeiro, silo, cerca, árvores, vaca, espantalho, cata-vento, portal, nuvem, caixa de item, tomate).
- `blender/common.py` — helpers de modelagem/export.
- `js/main.js` — jogo (pista, física, IA, itens, HUD).

Regerar modelos:
```
"C:\Program Files\Blender Foundation\Blender 5.3\blender.exe" -b --factory-startup --python blender/tractor_char.py
"C:\Program Files\Blender Foundation\Blender 5.3lender.exe" -b --factory-startup --python blender/imperador_char.py
"C:\Program Files\Blender Foundation\Blender 5.3\blender.exe" -b --factory-startup --python blender/props.py
```
