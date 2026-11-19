# Acabamento da pilotagem — primeira passagem

Etapa 1 do [escopo comercial](escopo-v1.md), em 19/11/2026.

Status: alterações de código feitas por inspeção dos arquivos. **Não testadas.** Esta passagem não encerra a etapa de pilotagem nem comprova equilíbrio, desempenho ou diversão.

## Alterações

### Comandos e drift

- A/D e setas do mesmo lado contam como uma direção mantida. Apertar duas teclas equivalentes sem soltar a direção não simula dois toques.
- Direções simultâneas não armam o toque duplo. Repetição automática do teclado não conta.
- Cancelamento de toque, perda de foco e pausa limpam o gesto e a carga de drift sem conceder mini-turbo.
- Ao perder foco ou ocultar a página, uma corrida ou contagem regressiva pausa e exige retomada explícita.
- Drift não carrega no ar. A saída de uma rampa cancela a carga; manobras aéreas continuam sendo um mecanismo separado.
- Itens e habilidades não podem ser acionados na pausa, no contrarrelógio, fora da corrida ou depois da chegada.

### Chão, saltos e colisões

- A busca do piso principal não usa o índice de progresso equivalente de um atalho como se fosse a posição física mais próxima da estrada.
- A altura do salto acompanha a posição mundial do veículo; o chão da nova posição é considerado antes de calcular a aterrissagem.
- A rampa considera sua própria altura em relação ao chão. O veículo que já está voando não é recolocado sobre uma rampa ao passar por cima dela.
- Contatos laterais são resolvidos antes de obter a altura usada na aterrissagem.
- Colisões com o centro de um obstáculo ou outro veículo têm direção de separação definida, mesmo se as posições coincidirem.
- Reboques, jatos, nuvens, girassóis e sulcos consideram diferenças de altura para seus efeitos. Sulcos e nuvens são posicionados na altura da pista.
- Fardos junto da estrada e o pórtico de largada têm altura de posicionamento e colisão coerentes com o terreno.
- Mantido um girassol por ativação do Plantio Relâmpago.

### Progresso, retorno à pista e IA

- Classificação usa avanço acumulado, com deslocamento negativo ao andar de ré. Cruzar a largada de ré não decrementa o número da volta exibida.
- Uma nova volta exige cruzamento para frente, distância acumulada correspondente e os quatro checkpoints ordenados, após a largada inicial.
- Retorno à pista usa o mesmo índice de progresso, inclusive saindo de um atalho, e sincroniza o índice anterior para não simular passagem de checkpoint.
- O retorno limpa velocidade, rotação de impacto, carga de drift, turbo, salto, manobra, reboque e contramão; preserva moedas, item equipado e habilidade acumulada.
- A IA e a assistência respeitam a largura do caminho atual. A mira percorre as amostras do atalho pela distância real e continua na estrada após a saída.
- A IA evita perseguir moedas ou rampas pertencentes a outro caminho próximo.

### Câmera

- Mira suavizada em altura e deslocamento, mantendo as opções de distância existentes.
- Limite inferior em relação ao piso amostrado para reduzir entrada no chão em colinas.
- Reposicionamento direto ao iniciar corrida ou retornar à pista, evitando interpolação desde uma posição distante.

## Avaliação ainda necessária em outro ambiente autorizado

| Situação | Resultado a observar |
|---|---|
| Curva normal, tecla mantida e duas teclas equivalentes | Não iniciar drift sem dois acionamentos separados |
| Dois toques e soltura nas quatro máquinas | Drift intencional e mini-turbo no momento esperado |
| Pausar, trocar de janela ou cancelar toque durante drift | Nenhuma direção presa ou recompensa pela interrupção |
| Saltar em subida e descida, aterrar e passar sobre outra rampa | Sem salto de altura, captura indevida por rampa ou manobra duplicada |
| Percorrer cada atalho e voltar à estrada | Sem salto de classificação, contagem incorreta ou IA presa na saída |
| Cruzar a largada de ré e retornar para frente | Não ganhar volta; classificação acompanha a distância percorrida |
| Retornar à pista antes/depois da largada, checkpoints e atalhos | Sem avanço gratuito, giro residual ou câmera atravessando a cena |
| Colidir com adversários, Broto e obstáculos em desnível | Contato somente quando houver proximidade de altura |
| Completar/repetir os quatro modos e etapas da copa | Chegada, pontos, moedas e desbloqueios consistentes |
| Teclado e toque em sessões completas | Curvas e câmera confortáveis, áudio e instruções compreensíveis |

Não foram criados ou executados testes, verificadores de sintaxe, benchmarks ou scripts de validação. Não foi aberto jogo ou navegador. Nenhum modelo 3D foi alterado; as fontes e exportações existentes permanecem no projeto.
