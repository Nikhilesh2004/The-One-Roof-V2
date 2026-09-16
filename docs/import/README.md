# Adding products from a spreadsheet

Fill in the template, put every image in one folder, hand both over.
One row is one product.

Use `products-template.xlsx` if you can — it has dropdowns for the columns a
typo would break. `products-template.csv` is the same thing for anyone who
prefers plain text.

## Photos — one per column

Each photo gets its own column, `photo_1` through `photo_6`. Leave the rest
blank; most products need two or three.

| column | value |
|---|---|
| `photo_1` | `krishna-flute-01.jpg` |
| `photo_2` | `krishna-flute-02.jpg` |
| `photo_3` | `krishna-flute-03.jpg` |

These are the pictures on the product's own page, shown in the order listed.

## Thumbnail — the picture in the shop grid

**A separate image, not one of the photos above.** It is the single picture a
customer sees while browsing, before clicking in — so it is the one that has to
sell the product.

    thumbnail    krishna-flute-thumb.jpg

- It goes in the same folder as the photos.
- Name it after the product with `-thumb` on the end, so it is obvious which
  file is which when there are three thousand of them.
- Roughly square works best; the grid crops to a square.
- **Leave it blank and `photo_1` is used instead.** That is a perfectly good
  answer, and better than a bad thumbnail. Only fill it in when someone has
  shot or made an image specifically for the grid.

## Filename rules

This is the part that goes wrong, and the only part nobody can repair
afterwards.

- **No spaces.** Use hyphens.
- Every filename in the sheet must exist in the folder, spelled identically.
  `Krishna-Flute-01.JPG` and `krishna-flute-01.jpg` are different files.
- Send the images that come out of the ChatGPT step, not the originals off the
  phone.

## The columns

| Column | Required | What goes in it |
|---|---|---|
| `title` | **yes** | The product name customers read. |
| `photo_1` … `photo_6` | **`photo_1` yes** | One filename each, in display order. |
| `thumbnail` | no | A separate grid image. Blank falls back to `photo_1`. |
| `price` | **yes** | Selling price in rupees. Numbers only — `3950`, not `₹3,950`. |
| `mrp` | no | The struck-through price. Blank if there is no discount. |
| `stock` | **yes** | How many you have. `0` is fine — it shows as out of stock. |
| `category` | **yes** | One of the eight section codes below. |
| `subCategory` | no | Your own grouping, e.g. `Brass Idols`. Keep spelling consistent. |
| `description` | no | A sentence or two. |
| `occasions` | no | Any of `birthday` `wedding` `festival` `everyday`, semicolon separated. |
| `countryOfOrigin` | no | Legally required on imported goods. |
| `manufacturer` | no | Manufacturer or importer. Also required on imports. |
| `genericName` | no | What the thing is, plainly — `Brass idol`, `Wall clock`. |
| `netQuantity` | no | `1 piece`, `set of 4`. |
| `dimensions` | no | `9 x 4 x 3 in`. |
| `weight` | no | `850 g`. |
| `finish` | no | Material or finish — `Antique brass`, `Genuine leather`. |
| `monthYearOfImport` | no | `09/2026`. |
| `status` | **yes** | `live` to publish, `draft` to hold back, `hidden` to retire. |
| `featured` | no | `yes` puts it in the Shoppable Shorts rail. A handful only. |
| `shortCaption` | no | One line on the Shorts card. Only used when `featured` is `yes`. |
| `shortSticker` | no | Small badge — `Bestseller`, `New`. |

## Section codes

Use the code on the left in the `category` column.

| Code | Section |
|---|---|
| `decor` | Home & Décor |
| `pooja` | Pooja Items |
| `fashion` | Jewellery & Fashion |
| `bags` | Bags |
| `shoes` | Shoes |
| `watches` | Watches |
| `gifting` | Gifting & Dining |
| `lifestyle` | Tech & Lifestyle |

## Before you send it

- Sort by `title` — duplicates jump straight out.
- Check `price` and `stock` contain only numbers.
- Count the folder against the sheet. Every `photo_N` **and** every `thumbnail`
  needs a file.

Send the first fifty rows before the rest is finished. A format mistake caught
on fifty rows costs an hour; caught on a thousand it costs a week.

---

## Note for whoever builds the importer

`thumbnail` has no home in the schema yet. `Products` currently has only the
`photos` upload array, and the storefront uses `photos[0]` for the grid — see
`mainPhoto()` in `src/lib/media.ts` and `ProductCard.tsx`.

Before any import runs, `Products` needs a single `thumbnail` upload field, a
migration for it, and the grid components switched to prefer it with
`photos[0]` as the fallback. The template is the specification; the field does
not exist yet.
