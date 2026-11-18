# Roça Kart — demo jogável

Kart arcade 3D cartoon com máquinas agrícolas inspiradas na Stara (Three.js no navegador, sem instalar nada).

## Jogar
**Online (celular/tablet/PC):** https://lucianosmvm.github.io/roca-kart/ — publicado pelo GitHub Pages a cada push na `main`.
Local: dê dois cliques em `Jogar.bat` (servidor na porta 8765) ou `python -m http.server 8765` e abra http://localhost:8765

## O que tem na demo
- **Abertura** (tela inicial) + **cutscene** no motor do jogo apresentando Maxi, Absoluta e Imperador (pulável).
- **Menu** com corrida ao vivo no fundo (modo vitrine).
- **3 pistas** com temas: Fazenda Milharal (dia), Vale dos Girassóis (pôr do sol, mais saltos), Cerrado da Soja (terra vermelha, curvas fechadas).
- **Garagem 3D** (galpão com plataforma giratória, arraste para girar): máquina, implemento, pintura, acessório, buzina.
- **Loja** com moedas de milho 🌽: pinturas, acessórios (chapéu de palha, boné, girassol, bandeira, óculos, coroa) e buzinas (Muuu!, Cocoricó...).
  Moedas: prêmio por colocação + moedinhas coletadas na pista. Progresso salvo no navegador.
- **Física**: drift com mini-turbo, rampas com salto e **manobra no ar** (ESPAÇO no ar = turbo ao pousar), engate do implemento balançando, lama, grama, colisões.
- **Habilidades por máquina** (Q / HAB): 🌻 Plantio Relâmpago (Absoluta), 💦 Barras Abertas (Imperador), 💨 Arrancada Turbo (trator solo).
- **Caixas de item**: ⛽ Biodiesel · 🛰️ Piloto Guia · ⚡ Trovoada.
- **Áudio** 100% sintetizado: trilha de baião (zabumba, triângulo, sanfona) no menu/corrida/garagem/pódio, efeitos e buzinas.
- **Efeitos**: partículas (poeira, lama, faíscas, água, confete), tremor de câmera, linhas de velocidade, pódio 3D com confete.
- **Pausa** (ESC / ⏸), **opções** (volume, acelerar sozinho, direção assistida para crianças, qualidade gráfica), créditos.
- Celular: botões na tela, acelera sozinho, câmera adaptada para tela em pé.

Controles (teclado): W/↑ acelera · S/↓ freia · A/D vira · ESPAÇO drift/manobra · E item · Q habilidade · H buzina · C câmera · R volta pra pista · ESC pausa.

## Estrutura
- `js/main.js` — motor: pistas, física, IA, itens, câmeras, cutscene, garagem 3D, pódio.
- `js/ui.js` — telas (splash, menu, pistas, garagem/loja, opções, créditos, pausa, resultado).
- `js/audio.js` — música procedural e efeitos sonoros (WebAudio).
- `js/save.js` — perfil do jogador, catálogo da loja e prêmios.
- `js/tracks.js` — traçado e tema de cada pista.
- `blender/models/*.blend` — **todos os modelos editáveis** (texturas embutidas). Edite e exporte (File → Export → glTF .glb) para `assets/` com o mesmo nome. Rodar os scripts abaixo regera e **sobrescreve** esses .blend.
- `blender/tractor_char.py` — trator Maxi (ST MAX 105) · `blender/imperador_char.py` — Imperador · `blender/absoluta_char.py` — Absoluta.
- `blender/props.py` — props da fazenda · `blender/props_demo.py` — rampa, moeda, pódio, garagem, acessórios, soja, árvore do cerrado.
- `blender/mcp_exec.py` — envia código ao Blender aberto via add-on Blender MCP (porta 9876).
- `docs/design-maquinas.md` — design de máquinas, implementos e habilidades.

Regerar modelos (Blender 5.3):
```
"C:\Program Files\Blender Foundation\Blender 5.3\blender.exe" -b --factory-startup --python blender/tractor_char.py
"C:\Program Files\Blender Foundation\Blender 5.3\blender.exe" -b --factory-startup --python blender/imperador_char.py
"C:\Program Files\Blender Foundation\Blender 5.3\blender.exe" -b --factory-startup --python blender/absoluta_char.py
"C:\Program Files\Blender Foundation\Blender 5.3\blender.exe" -b --factory-startup --python blender/props.py
"C:\Program Files\Blender Foundation\Blender 5.3\blender.exe" -b --factory-startup --python blender/props_demo.py
```
