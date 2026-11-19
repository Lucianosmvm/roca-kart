# Diversidade dos itens de corrida

Antes desta etapa, o sorteio só entregava Biodiesel, Piloto Guia e Trovoada, mesmo com outros efeitos definidos no código. A seleção foi ampliada para sete itens, sem ativar novas barreiras sobre a estrada.

## Itens novos

- **Escudo de bolha:** dura 6 segundos ou até absorver um ataque. Protege contra disco, trovoada, girassol, calcário e água; não impede colisões com veículos ou cenário. Ao romper, concede 0,7 segundo de proteção para evitar impacto repetido no mesmo instante. Um jato bloqueado permanece bloqueado para aquela vítima até o fim daquela ativação.
- **Disco de milho:** reutiliza o modelo da moeda de milho, incluindo a versão leve no celular. Não persegue alvos. Viaja em linha reta por até 1,8 segundo, desaparece ao sair da faixa de circulação ou atingir alguém e não atinge seu lançador. O contato considera o segmento percorrido no quadro e a altura dos veículos. Acerta uma vítima por lançamento, com o efeito de impacto já existente.
- **Ímã de milho:** dura 6 segundos e amplia o raio de coleta para 8 metros, respeitando a proximidade de altura. Usa a mesma coleta de moedas existente; cada moeda pode ser recolhida uma única vez. Não gera moedas novas, não altera preços e não ignora o limite de milho que influencia a velocidade.

Escudo e ímã podem coexistir e mostram tempo restante no HUD. O escudo usa partículas do sistema existente; não há nova esfera transparente, malha ou textura pesada. Não foram criados modelos 3D novos: o disco reutiliza geometria salva anteriormente, e as fontes `.blend` e exportações `.glb` existentes permanecem no projeto.

## Sorteio por posição

Os valores são pesos relativos que somam 100 em cada faixa:

| Item | 1º | 2º–3º | 4º–6º |
|---|---:|---:|---:|
| Biodiesel | 30 | 25 | 25 |
| Escudo de bolha | 30 | 20 | 10 |
| Ímã de milho | 20 | 10 | 15 |
| Jato d’água | 15 | 15 | 5 |
| Disco de milho | 5 | 25 | 20 |
| Piloto Guia | 0 | 5 | 20 |
| Trovoada | 0 | 0 | 5 |

O Jato d’água existente passa a sair nas caixas. Trovoada foi tornada mais rara e só escolhe um adversário com colocação melhor que a do lançador. Habilidades próprias das máquinas permanecem separadas dos itens.

IA usa ataques direcionais quando há adversário próximo à frente e evita renovar escudo/ímã enquanto o efeito está ativo, mantendo um tempo máximo de espera para não guardar itens indefinidamente. As descrições aparecem nas opções, e o ícone equipado tem texto explicativo acessível por seu título.

## Avaliação pendente

Esta é uma implementação por leitura e edição. Não foram executados testes, verificações de sintaxe, benchmarks ou o jogo/navegador neste PC. A duração, distribuição, precisão dos discos, proteção contra jatos e leitura dos efeitos ainda precisam de avaliação jogável autorizada; os pesos são um ponto de partida, não um equilíbrio comprovado.
