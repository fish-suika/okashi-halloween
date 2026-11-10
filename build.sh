#!/bin/sh
# 分割ソースを1枚のHTMLに結合する
cd "$(dirname "$0")"

cat src/00-head.html \
    src/10-config.js \
    src/20-logic.js \
    src/40-render.js \
    src/50-audio.js \
    src/60-ui.js \
    src/90-boot.js \
    src/99-tail.html > okashi-halloween.html
cp okashi-halloween.html index.html   # GitHub Pages はルートの index.html を配信する

# 検証ページ（画面を使わないロジックだけ）
cat src/verify-head.html \
    src/10-config.js \
    src/20-logic.js \
    src/verify-tests.js \
    src/99-tail.html > verify.html

echo "built okashi-halloween.html + index.html ($(wc -c < okashi-halloween.html) bytes)"
echo "built verify.html ($(wc -c < verify.html) bytes)"
