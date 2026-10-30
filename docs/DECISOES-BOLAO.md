# Decisões operacionais propostas — Bolão XV

Estas regras foram implementadas localmente como defaults seguros e precisam de confirmação de negócio antes de ativação em produção.

- O prazo fecha dez minutos antes do horário oficial. Reagendamento antes do prazo recalcula o fechamento; depois do prazo não reabre palpite nem multiplicador.
- Partida cancelada não pontua e fica fora da eficiência. Multiplicador já bloqueado permanece congelado, sem transferência.
- WO e partida interrompida só pontuam após resultado oficial finalizado pela Diretoria.
- Ausência de palpite vale zero, mas não é erro. Erro é palpite enviado que recebeu zero.
- Eficiência considera partidas finalizadas desde o primeiro palpite: máximo 10 por jogo, ou 20 quando o multiplicador daquele jogo estiver bloqueado. Assim, a eficiência nunca ultrapassa 100%.
- A classificação usa pontos, depois quantidades de tiers base 10, 8, 7 e 5. Persistindo empate, usa posição de competição (1º, 1º, 3º).
