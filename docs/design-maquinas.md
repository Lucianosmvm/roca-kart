# Oficina da Roça — identidade e montagem

Máquinas inventadas numa oficina rural brasileira para disputar o campeonato Roça Kart.
Geometria original construída com primitivas, sem importar modelos de engenharia.

## Elenco e paleta

| Máquina | Silhueta | Papel |
|---|---|---|
| Tatu | Capô em casco, cabine aberta, toldo creme e rodas traseiras enormes | Trator que puxa o Broto; sozinho tem Arrancada Turbo |
| Pingo | Buggy com tanque em gota, quatro rodas iguais e braços curtos | Chuva de Pingo, jatos laterais |
| Pipoca | Mini colheitadeira compacta, coletor exagerado e formas arredondadas | Ágil, boa arrancada e Arrancada Turbo |
| Bento | Caminhão graneleiro curto, cabine gordinha e caçamba com milho | Pesado e estável, com Arrancada Turbo |
| Broto | Plantadeira rebocada com três reservatórios em forma de sementes | Plantio Relâmpago, um girassol por uso |

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
O jogo carrega tatu.glb, pingo.glb, pipoca.glb, bento.glb e broto.glb para as máquinas.
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

## Layout aprovado da oficina

- Referência: `docs/art/oficina-layout-aprovado.png` (conceito visual aprovado pelo usuário).
- PC: prévia 3D na área esquerda; editor lateral com rolagem independente.
- Celular: prévia acima; painel inferior com botão para recolher e abrir. Em telas baixas na horizontal, editor lateral compacto.
- Cabeçalho: voltar, identidade Roça Kart, Montar, Minhas criações e moedas.
- Rodapé: estado do salvamento, atalho para nomear/salvar uma criação e Correr. O atalho de salvamento não equipa itens em prévia.
- Máquina e acessórios preserva a seleção de máquina, implemento, pintura, acessório e buzina.
- Tatu/Pingo: Peças, Proporções e Cores separadas. Broto: Peças e Cores. Atributos e habilidade em seção recolhível.
- A câmera enquadra o conjunto completo no retângulo disponível da prévia; a rotação por arraste funciona com mouse e toque.
- Botões, cartões, painéis e cores comuns também foram aplicados aos menus inicial, de pistas, opções, créditos e pausa.
- Cenário: madeira, plataforma com tábuas e aro azul-petróleo, janela e ferramentas. Salvo em `blender/models/garage.blend` e `assets/garage.glb`.
- O gerador `blender/props_demo.py -- garage` permite regerar somente esse cenário.

Este layout e o enquadramento não foram executados ou testados no PC do usuário. A instrução de não testar permanece em vigor.

## HUD de corrida

A organização segue a imagem de referência enviada pelo usuário, preservando cores, retratos e ícones próprios do jogo.
Cronômetro à esquerda no alto; item ao centro; milho e voltas à direita no alto.
A lateral esquerda mostra os quatro primeiros colocados, com nomes e retratos do elenco; a colocação do jogador permanece destacada no canto inferior esquerdo.
O minimapa ocupa a lateral direita sem painel opaco. O velocímetro no canto inferior direito tem ponteiro, leitura numérica em km/h e uma barra de turbo ativo (normalizada para três segundos).
A habilidade continua separada, com sua barra de carga e o atalho Q.
As regras de posição e tamanho respondem à largura/altura da tela e mantêm os controles por toque separados dos principais indicadores.
Os retratos da classificação só são reconstruídos quando a ordem ou os participantes mudam.

Não foram executados testes, verificações de sintaxe ou validação no navegador para esta alteração, conforme instrução do usuário. Não há novos modelos 3D nesta etapa.

## Expansão de corridas e drift por gesto

A implementação posterior com quatro circuitos elevados, atalhos, Pipoca, Bento, copas, desafios, fantasma pessoal, adesivos e coleção compartilhável está descrita em `docs/expansao-corridas.md`.
O drift foi alterado para dois toques rápidos no mesmo lado, sustentando o segundo toque; não usa mais Space no chão nem botão separado no celular.
Esta expansão também permanece sem testes executados, por orientação do usuário. Os novos modelos e circuitos foram efetivamente gerados e salvos em `.blend` e `.glb`.
