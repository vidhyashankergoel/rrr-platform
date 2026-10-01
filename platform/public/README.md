# `public/`

Files served at the site root.

## `founder.jpg`

The founder card on `/about` loads `/founder.jpg`. If the file is missing the
card renders the founder's initials instead, so the page never shows a broken
image — see `src/components/FounderCard.tsx`.

**The extension matters.** The code asks for `.jpg`; a file saved as `.jpeg`
is a different URL and silently falls back to initials. That is exactly what
happened the first time.

To replace the photo, drop any portrait in and re-run the crop rather than
copying a camera file straight in — the card shows it at 92px, and a 1106x1422
original is 242 KB of download for a 92px circle.

```bash
node -e "
const sharp = require('sharp');
sharp('<your-photo>')
  .rotate()
  .resize(400, 400, { fit: 'cover', position: sharp.strategy.attention })
  .jpeg({ quality: 86, mozjpeg: true })
  .toFile('public/founder.jpg');
"
```

`strategy.attention` crops by salience rather than geometry, which on a
portrait lands on the face. A plain centre crop of a tall photo takes the top
of the head off.
