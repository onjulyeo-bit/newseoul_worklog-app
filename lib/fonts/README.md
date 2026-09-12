Pretendard (https://github.com/orioncactus/pretendard) — SIL Open Font License 1.1.
Pretendard-Sub.ttf = PretendardVariable 을 정적화 + 한글 전체 사전 서브셋. 서명 합성 PDF(lib/signCompose.ts)의 한글 텍스트 임베드용.
※ static OTF(CFF)는 @pdf-lib/fontkit 서브셋에서 "Not a CFF Font" 오류 → TrueType 사용.
※ pdf-lib embedFont 는 반드시 subset:false — 런타임 서브셋이 이 폰트 글리프를 깨뜨림.

NanumSquare (https://github.com/fonts-archive/NanumSquare) — SIL Open Font License 1.1.
NanumSquareEB-Sub.ttf / NanumSquareR-Sub.ttf = 링크 미리보기(OG) 카드 전용 서브셋. app/opengraph-image.tsx 에서 씀.
카드 문구를 바꾸면 그 글자가 서브셋에 없어 안 그려지므로 아래로 다시 만들 것:

    curl -sL -o /tmp/eb.ttf https://cdn.jsdelivr.net/gh/fonts-archive/NanumSquare/NanumSquareEB.ttf
    curl -sL -o /tmp/r.ttf  https://cdn.jsdelivr.net/gh/fonts-archive/NanumSquare/NanumSquare.ttf
    python3 -m fontTools.subset /tmp/eb.ttf --text='<카드에 쓰는 글자 전부>' --unicodes=U+0020-007E \
      --output-file=lib/fonts/NanumSquareEB-Sub.ttf --layout-features='*' --no-hinting --desubroutinize
    python3 -m fontTools.subset /tmp/r.ttf  --text='<카드에 쓰는 글자 전부>' --unicodes=U+0020-007E \
      --output-file=lib/fonts/NanumSquareR-Sub.ttf  --layout-features='*' --no-hinting --desubroutinize
