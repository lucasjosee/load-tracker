#!/usr/bin/env bash
# Baixa a Saira do Google Fonts para assets/fonte/, um arquivo por peso.
# Rode de dentro de mobile/:  ./scripts/baixar-fontes.sh
# Precisa só do curl.
#
# Por que um arquivo por peso: no Google a Saira é uma fonte variável (um
# arquivo só, com eixos de peso e de largura), mas o React Native não mexe em
# eixo. A API do Google gera um arquivo estático quando se pede um valor exato
# de cada eixo: wdth é a largura (100 = normal, 112.5 = semiexpandida) e wght
# é o peso. O curl recebe .ttf porque não se identifica como navegador (um
# navegador receberia .woff2, que o iOS não carrega).
#
# A licença é a SIL Open Font License: pode embutir no app, desde que o texto
# da licença vá junto (assets/fonte/OFL.txt).
set -euo pipefail

DESTINO=assets/fonte

# nome do arquivo, largura, peso
FONTES=(
  "Saira-Regular 100 400"
  "Saira-Medium 100 500"
  "Saira-SemiBold 100 600"
  "Saira-Bold 100 700"
  "Saira-ExtraBold 100 800"
  "SairaLarga-Bold 112.5 700"
  "SairaLarga-ExtraBold 112.5 800"
)

for linha in "${FONTES[@]}"; do
  read -r nome largura peso <<< "$linha"
  css=$(curl -fsS "https://fonts.googleapis.com/css2?family=Saira:wdth,wght@$largura,$peso")
  url=$(grep -o 'https://[^)]*\.ttf' <<< "$css")
  curl -fsS "$url" -o "$DESTINO/$nome.ttf"
  echo "$nome.ttf"
done

curl -fsS https://raw.githubusercontent.com/google/fonts/main/ofl/saira/OFL.txt -o "$DESTINO/OFL.txt"
echo "Fontes em $DESTINO"
