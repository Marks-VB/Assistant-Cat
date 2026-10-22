# Análise dos arquivos recebidos

## ZIP de referência 1

Identificado como conteúdo extraído do aplicativo Aptoide, pacote `cm.aptoide.pt`, versão `9.22.5.3`. Contém 3.171 arquivos e aproximadamente 35 MB descompactados. A referência `referencia-orion-arm-pte-ltd` é um arquivo vazio. A comparação com o manifesto de digests e a tabela de recursos encontrou 919 recursos ausentes: 579 PNG e 340 XML. Todos colidem por maiúsculas/minúsculas com nomes existentes, sugerindo perda durante uma extração em sistema de arquivos que não diferencia esses nomes. O ZIP passa no teste de integridade, mas o conjunto extraído está incompleto.

## ZIP de referência 2

Identificado como produto de referência, pacote `app.de.referencia`, versão `3.2`, código `7831`, com 2.546 arquivos e 58.487.744 bytes descompactados. Cinco arquivos DEX e um bundle Hermes de 17.253.688 bytes compõem boa parte do código cliente. Todos os 1.613 caminhos de recursos referenciados pela tabela do pacote base foram encontrados. Os cinco DEX passaram nas verificações internas SHA-1 e Adler-32; o bundle passou na verificação de hash do rodapé. Isso verifica consistência interna, não autenticidade do aplicativo ou segurança em execução.

O manifesto exige split APKs de arquitetura e densidade. Esses pacotes e as bibliotecas nativas não estão no ZIP. Foram identificadas referências a servidor, calendário, tarefas, memória, voz, e-mail, agendamento, coordenação e automações. Não foi identificado arquivo de modelo local de IA nos formatos examinados. O backend, seus prompts e suas regras não foram recuperados.

## Referências visuais

Foram inspecionados 18 screenshots e uma gravação de aproximadamente 7,2 segundos fornecidos pelo usuário. A interface confirma a separação entre afazeres dentro de Calendar e coordenação/automações dentro de Tasks, além de personalização do assistente, memória, integrações e preferências. O vídeo mostra o carrossel de aparências. Informações pessoais visíveis nesses materiais não são usadas como dados fictícios do novo projeto.

A análise foi estática e visual. O aplicativo não foi executado pelo assistente e as APIs do serviço não foram chamadas.
