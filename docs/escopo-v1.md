# Roça Kart — escopo da primeira versão comercial

Decisão de produto: concluir um jogo de corrida arcade para PC, com identidade rural própria, antes de expandir o conteúdo. Distribuição pretendida: Steam e itch.io, com compra única. Data do fechamento: 19/11/2026.

## Produto e conteúdo fechado

O jogador escolhe uma máquina cartoon, personaliza seu visual na oficina e disputa corridas com itens, habilidades, atalhos e mini-turbos.

| Área | Conteúdo da versão 1.0 |
|---|---|
| Plataforma inicial | Windows, para um jogador, com funcionamento offline |
| Máquinas | Tatu, Pingo, Pipoca e Bento |
| Implemento | Broto, com as peças já existentes |
| Pistas | Fazenda Milharal, Vale dos Girassóis, Cerrado da Soja e Feira da Colheita |
| Modos | Corrida rápida, Copa da Colheita, contrarrelógio e os três desafios existentes |
| Copa | Três etapas, com pontuação acumulada e troféu |
| Pilotagem | Teclado e controle; drift por dois acionamentos rápidos da mesma direção, mantendo o segundo e soltando para liberar o mini-turbo |
| Oficina | Peças e ajustes existentes, pinturas, acessórios, adesivos e biblioteca de criações |
| Progressão | Moedas obtidas jogando, desbloqueios cosméticos, recordes e fantasma pessoal |
| Apresentação | Paleta e menus atuais, HUD próprio, áudio, introdução e pódio |
| Comercialização | Jogo completo por compra única, sem anúncios ou compras internas na versão 1.0 |

Os controles por toque existentes permanecem no projeto; um lançamento comercial para celular fica para depois. Personalização continua cosmética, com atributos ligados à máquina-base.

## O que não entra nesta versão

- Novas pistas, máquinas, peças ou modos além dos descritos acima.
- Multiplayer online, tela dividida, contas, ranking online ou oficina pública de mods.
- Mundo aberto, campanha narrativa ou editor de pistas.
- Migração para Unity, versões de console ou aplicativo mobile.
- DLC, passe de temporada ou loja com dinheiro real.
- Integrações opcionais de plataforma, como conquistas Steam e nuvem, antes da conclusão do jogo-base.

Uma ideia nova vai para a lista pós-lançamento. Só substitui algo do escopo com decisão explícita do usuário; não aumenta automaticamente o trabalho da versão 1.0.

## Situação real do projeto

Os conteúdos e sistemas acima têm implementação no projeto web, mas isso não comprova seu funcionamento nem seu acabamento. A expansão recente não foi testada.

A versão atual usa armazenamento do navegador, dependências web e controles de teclado/toque. Empacotamento Windows offline, suporte completo a controle e persistência apropriada para o aplicativo ainda são trabalho pendente.

O andamento da copa atualmente dura a sessão, enquanto troféus são persistidos. A interface deve informar isso antes de sair de uma copa. O fantasma pessoal tem limite de gravação de 20 minutos e não participa de colisões.

## Ordem de acabamento

Concluir cada etapa antes de ampliar a seguinte. As evidências de execução abaixo devem ser obtidas em outro ambiente expressamente autorizado.

### 1. Pilotagem e corrida — primeira prioridade

Primeira passagem de correções registrada em [acabamento-pilotagem.md](acabamento-pilotagem.md). Implementação revisada por leitura; avaliação jogável e conclusão desta etapa continuam pendentes.

- Revisar o reconhecimento do toque duplo, sua interrupção e a resposta ao soltar. Uma curva normal não deve acionar drift por repetição automática do teclado.
- Afinar direção, aderência, câmera e mini-turbo; as quatro máquinas devem ser compreensíveis e divertidas, sem exigir memorização de comandos adicionais.
- Revisar chão, saltos, aterrissagens, margens, atalhos e retorno à pista nos quatro circuitos. Evitar prender veículos ou contar voltas indevidas.
- Revisar IA, itens e habilidades: obstáculos devem deixar espaço de desvio. Plantio Relâmpago mantém um girassol por ativação.
- Conferir largada, pausa, reinício, troca de pista, conclusão, pontuação e recompensas únicas em todos os modos.

**Condição de conclusão:** jogadores conseguem completar os quatro circuitos e os quatro modos sem bloqueios, com contagem consistente de voltas e recompensas; o drift pode ser aprendido e repetido intencionalmente. Confirmar por sessões jogáveis autorizadas, não apenas leitura de código.

### 2. Leitura visual e facilidade de uso

Primeira passagem implementada em [acabamento-apresentacao.md](acabamento-apresentacao.md), cobrindo sinalização, HUD, menus/garagem, ajuda inicial e áudio. Avaliação visual, sonora e jogável continua pendente em ambiente autorizado.

- Melhorar sinalização de curvas, atalhos, saltos e limites da estrada antes de adicionar decoração.
- Preservar o estilo e as cores aprovados em todos os menus; revisar tamanho de texto, foco, contraste e sobreposição do HUD.
- Tornar claras as diferenças entre máquinas, objetivos dos desafios, progresso da copa e condições de desbloqueio.
- Revisar a oficina: prévia, nomes, miniaturas, salvar, restaurar, importar/exportar e mensagens de falha ou armazenamento indisponível.
- Explicar o drift no primeiro contato e manter instruções acessíveis no menu de ajuda.
- Ajustar volumes e sinais de drift, impacto e resultado; cada som precisa ajudar a entender o que aconteceu.

**Condição de conclusão:** um jogador novo consegue escolher máquina, personalizar, iniciar uma corrida e entender o drift sem orientação externa; nenhum menu ou aviso essencial fica escondido.

### 3. Versão de PC

- Preparar aplicativo Windows com dependências e arquivos locais; abrir sem servidor manual e sem internet.
- Implementar controle tanto na corrida quanto nos menus, incluindo foco visível, voltar, pausa e instruções correspondentes. O gesto de drift deve continuar dispensando botão exclusivo.
- Definir armazenamento persistente do aplicativo, gravação segura, backup/exportação do progresso e comportamento após atualização. Não prometer migração automática dos dados de qualquer navegador.
- Disponibilizar opções de janela/tela cheia, áudio e qualidade; guardar preferências e oferecer saída do aplicativo.
- Definir requisitos mínimos a partir de medições em máquinas autorizadas. Não anunciar desempenho ou compatibilidade ainda não verificados.

**Condição de conclusão:** o pacote instala ou extrai, inicia offline, aceita teclado/controle, salva e recupera progresso após fechar e atualizar, em um Windows de avaliação autorizado.

### 4. Preparação comercial

- Inventariar procedência e licenças de modelos, fontes, músicas, imagens, código e dependências distribuídas; incluir avisos exigidos.
- Revisar referências antigas e material comercial para garantir a identidade própria do produto.
- Produzir trailer curto com captura real, imagens de loja e descrição fiel ao conteúdo entregue.
- Preparar o pacote do jogo completo, com as quatro pistas, quatro máquinas e modos previstos no escopo comercial.
- Preparar página da Steam e publicação na itch.io; cadastro, taxas, preço e publicação dependem de decisão posterior do usuário.

**Condição de conclusão:** pacote e página descrevem a mesma experiência; licenças estão documentadas; não existem promessas de recursos futuros necessárias para justificar a compra.

## Regra para considerar pronto

Não lançar somente porque todas as funcionalidades têm código. Antes da venda, é necessário fechar os bloqueios de corrida, perda de progresso, controles e funcionamento offline; avaliar desempenho e experiência com jogadores; registrar problemas conhecidos e a versão entregue.

Não há data de lançamento ou estimativa comercial fechada antes dessa avaliação.

## Restrições de trabalho preservadas

Não executar testes, verificações de sintaxe, benchmarks, scripts de validação, o jogo ou o navegador neste PC. Avaliações de execução ficam pendentes até existir ambiente explicitamente autorizado. Ler e editar arquivos continua permitido.

Modelos novos ou alterados devem manter fonte em `blender/models/*.blend`, exportação em `assets/*.glb` e script de geração no projeto. A geração de modelos no Blender em segundo plano não representa teste do jogo.

Este fechamento de escopo é documentação de produto; não altera a implementação nem atesta que a versão comercial está pronta.
