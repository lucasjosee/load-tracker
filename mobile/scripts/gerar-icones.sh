#!/usr/bin/env bash
# Gera os PNGs de ícone e splash a partir de assets/fonte/simbolo.svg.
# Rode de dentro de mobile/:  ./scripts/gerar-icones.sh
# Precisa do rsvg-convert (pacote librsvg) e do ImageMagick (magick).
#
# Mudou o símbolo ou a cor? Edite o SVG e rode de novo: os PNGs nunca são
# editados à mão, para o ícone e o splash não saírem diferentes um do outro.
set -euo pipefail

FONTE=assets/fonte/simbolo.svg
SAIDA=assets/images
FUNDO='#2B3036' # cores.fundo
TEMP=$(mktemp -d)
trap 'rm -rf "$TEMP"' EXIT

# Ícone do app: símbolo sobre o fundo escuro, sem transparência (o iOS recusa
# ícone com canal alfa).
rsvg-convert -w 1024 -h 1024 --background-color "$FUNDO" "$FONTE" -o "$TEMP/icone.png"
magick "$TEMP/icone.png" -alpha off "$SAIDA/icon.png"

# Splash: só o símbolo, recortado rente, com fundo transparente. A cor de
# fundo do splash vem do app.json.
sed 's/viewBox="0 0 1024 1024"/viewBox="217 222 590 580"/' "$FONTE" > "$TEMP/rente.svg"
rsvg-convert -w 590 -h 580 "$TEMP/rente.svg" -o "$SAIDA/splash-icon.png"

# Android (ícone adaptativo): o sistema corta as bordas, então o símbolo fica
# em 2/3 do tamanho, no meio. O monocromático é o mesmo desenho em branco.
sed 's/viewBox="0 0 1024 1024"/viewBox="-256 -256 1536 1536"/' "$FONTE" > "$TEMP/reduzido.svg"
rsvg-convert -w 512 -h 512 "$TEMP/reduzido.svg" -o "$SAIDA/android-icon-foreground.png"
sed 's/#E3B86A/#FFFFFF/g' "$TEMP/reduzido.svg" > "$TEMP/branco.svg"
rsvg-convert -w 432 -h 432 "$TEMP/branco.svg" -o "$SAIDA/android-icon-monochrome.png"
magick -size 512x512 "xc:$FUNDO" "$SAIDA/android-icon-background.png"

rsvg-convert -w 48 -h 48 --background-color "$FUNDO" "$FONTE" -o "$SAIDA/favicon.png"

echo "Ícones gerados em $SAIDA"
