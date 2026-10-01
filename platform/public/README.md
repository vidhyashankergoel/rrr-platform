# `public/`

Files served at the site root.

## `founder.jpg` — NOT YET PRESENT

The founder card on `/about` looks for `/founder.jpg`. Until the file exists
the card renders the founder's initials instead, which is why the page does
not look broken without it — see `src/components/FounderCard.tsx`.

Save a portrait here as `founder.jpg`. Square or portrait crop, at least
600 × 600; the card renders it at 92px and crops to a circle from the top, so
a head-and-shoulders shot works and a full-body one does not.

```bash
cp ~/Downloads/<your-photo>.jpg platform/public/founder.jpg
```

Nothing else needs changing — the card picks it up on the next page load.
