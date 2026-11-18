# Oficina da Roça — identidade e montagem

Máquinas inventadas numa oficina rural brasileira para disputar o campeonato Roça Kart.
Geometria original construída com primitivas, sem importar modelos de engenharia.

## Elenco e paleta

| Máquina | Silhueta | Papel |
|---|---|---|
| Tatu | Capô em casco, cabine aberta, toldo creme e rodas traseiras enormes | Trator que puxa o Broto; sozinho tem Arrancada Turbo |
| Pingo | Buggy com tanque em gota, quatro rodas iguais e braços curtos | Chuva de Pingo, jatos laterais |
| Broto | Plantadeira rebocada com três reservatórios em forma de sementes | Plantio Relâmpago, fileira de girassóis |

Azul Oficina `#216C79`, creme `#FFF0CF`, coral `#E87578`, palha `#E9C46A`.
Contornos em azul escuro. Vegetação mantém suas cores naturais.

## Editor com encaixes

A inspiração é a liberdade de montagem de jogos como SPORE, com peças próprias.
O jogador escolheu encaixes definidos e ajustes de tamanho para a primeira versão.

- **Tatu:** capôs casco, caixote ou cápsula; toldo, cabine aberta ou santo-antônio; para-choque simples, duplo ou sem barra.
- **Pingo:** tamanho do tanque em gota e comprimento dos braços de irrigação.
- **Ambos:** tamanho independente dos pneus dianteiros e traseiros, largura dos pneus, distância lateral entre rodas e cores livres de carroceria, detalhes e acabamento.
- A prévia 3D atualiza imediatamente. Cada máquina tem uma montagem própria salva no navegador e usada na corrida.
- Restaurar montagem repõe apenas o visual da máquina selecionada.
- Montagens são cosméticas. Colisões, velocidade, aceleração e habilidades continuam ligadas à máquina-base.
- Não há arraste livre de peças nem deformação de malha nesta versão.
- Escolher uma pintura na loja ou garagem substitui a cor livre da carroceria.

## Broto modular e coleção

Com Tatu e Broto selecionados, **Montar → Broto** oferece cartões ilustrados para reservatórios de sementes, barris ou caixotes e rodas pequenas, largas ou duplas.
Chassi, reservatórios, detalhes e acabamento têm cores próprias, independentes da pintura do Tatu.
O motor usa as mesmas peças GLB salvas em disco. Não há mudança de habilidade ou atributos.

**Minhas criações** guarda montagens nomeadas no perfil local. A criação captura a máquina atual, sua montagem, o Broto, as cores, pintura, acessório e buzina.
Carregar uma criação substitui a montagem atual e respeita a propriedade de itens da loja. Não altera moedas, recordes ou pista selecionada.
Excluir uma criação remove apenas sua entrada da coleção, preservando o visual equipado.
As miniaturas da coleção usam o retrato da máquina-base e desenhos das peças do Broto, sem capturas da montagem 3D.

O script `blender/broto_parts.py` gera os arquivos `broto_hoppers_seed`, `broto_hoppers_barrel`, `broto_hoppers_crate`, `broto_wheels_small`, `broto_wheels_wide` e `broto_wheels_double`, cada um em `.blend` e `.glb`.
As coordenadas são relativas ao engate do Broto, com eixos de rodas independentes para animação.

## Arquivos e reprodução

`blender/oficina.py` gera os GLBs, arquivos Blender editáveis e retratos com fundo transparente.
`js/customize.js` contém peças alternativas, encaixes e limites de proporção.
`docs/art/oficina-conceito.png` é a prancha gerada com a ferramenta integrada de imagens;
o prompt está em `docs/art/oficina-prompt.txt`. Os retratos no jogo vêm das malhas reais.

Rodas têm origem no eixo e rotação neutra para animação. O Broto tem origem no engate.
O jogo carrega exclusivamente tatu.glb, pingo.glb e broto.glb para as máquinas.
Os arquivos anteriores permanecem como histórico e não são utilizados pelo jogo atual.

## Validação anterior à personalização do Broto

- Carregamento dos três GLBs com GLTFLoader do Three.js 0.160.
- 54 combinações: dimensões válidas, rodas no chão, pintura e isolamento do modelo-base.
- Migração das seleções preservando moedas, compras, recordes e montagens salvas.
- Sintaxe JavaScript e presença de todos os modelos carregados pelo jogo.
- Teste visual jogável pendente: ferramenta de controle do navegador interrompida por não conseguir confirmar a URL no Windows.

O teste `tests/oficina.cjs` usa as bibliotecas Three.js 0.160 em um diretório passado como argumento.
O diretório deve conter roca-three-0160.mjs, roca-GLTFLoader.mjs e roca-BufferGeometryUtils.mjs,
com imports locais entre os três arquivos. Não é necessário mudar as dependências do jogo.

## Etapa atual: sem testes locais

Por instrução expressa do usuário, não foram executados testes, verificações de sintaxe ou validação no navegador para a personalização do Broto e Minhas criações.
O teste existente foi atualizado para as peças e a coleção, mas não foi executado.
O Blender foi usado apenas em segundo plano para produzir e salvar os arquivos 3D.
