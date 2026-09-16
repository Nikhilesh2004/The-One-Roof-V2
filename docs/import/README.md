# Adding products from a spreadsheet

Fill in `products-template.csv`, put the photos in one folder, hand both over.
One row is one product.

## The photos

**Name every photo after its product, numbered.** This is the part that goes
wrong, and it is the only part nobody can fix for you afterwards:

    krishna-flute-01.jpg      <- first photo, the one customers see in the grid
    krishna-flute-02.jpg
    krishna-flute-03.jpg

Then list them in the `photos` column separated by semicolons, first one first:

    krishna-flute-01.jpg;krishna-flute-02.jpg

Rules that matter:

- **No spaces in filenames.** Use hyphens.
- **The first photo is the one that shows in the shop grid.** Pick the best one.
- Every filename in the spreadsheet must exist in the folder, spelled identically.
  `Krishna-Flute-01.JPG` and `krishna-flute-01.jpg` are different files.
- Photos come out of the ChatGPT step already sized for the web. Send those, not
  the originals off the phone.

## The columns

| Column | Required | What goes in it |
|---|---|---|
| `title` | **yes** | The product name customers read. |
| `photos` | **yes** | Filenames, semicolon separated, best photo first. |
| `price` | **yes** | Selling price in rupees. Numbers only — `3950`, not `₹3,950`. |
| `mrp` | no | The struck-through price. Leave blank if there is no discount. |
| `stock` | **yes** | How many you have. `0` is fine — it shows as out of stock. |
| `category` | **yes** | One of the eight sections below. Use the short code. |
| `subCategory` | no | Your own grouping, e.g. `Brass Idols`. Keep spelling consistent. |
| `description` | no | A sentence or two. Wrap in "quotes" if it contains a comma. |
| `occasions` | no | Any of `birthday` `wedding` `festival` `everyday`, semicolon separated. |
| `countryOfOrigin` | no | Legally required on imported goods. |
| `manufacturer` | no | Manufacturer or importer. Also legally required on imports. |
| `genericName` | no | What the thing is, plainly — `Brass idol`, `Wall clock`. |
| `netQuantity` | no | `1 piece`, `set of 4`. |
| `dimensions` | no | `9 x 4 x 3 in`. |
| `weight` | no | `850 g`. |
| `finish` | no | Material or finish — `Antique brass`, `Genuine leather`. |
| `monthYearOfImport` | no | `09/2026`. |
| `status` | **yes** | `live` to publish, `draft` to hold it back, `hidden` to retire it. |
| `featured` | no | `yes` puts it in the Shoppable Shorts rail. Keep this to a handful. |
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

- Open it in Excel or Google Sheets and **sort by `title`** — duplicates jump out.
- Check `price` and `stock` columns contain only numbers.
- Check every `category` value is one of the eight codes, spelled exactly.
- Count the photo folder against the spreadsheet. The numbers should match.

Products can be imported in batches. Send the first fifty and we will run them
through before the rest is finished, so any mistake in the format is caught on
fifty rows rather than a thousand.
