// No 'server-only' guard here on purpose: importing sharp already makes
// this module unusable in a browser bundle, and keeping it importable by a
// plain script means the pipeline can be run and eyeballed on real photos
// without standing up the whole app.
import sharp from 'sharp'

/**
 * Auto-editing for shop photos.
 *
 * These are pictures taken on a phone, on a shop counter, under mixed
 * tube light and daylight. The fixes that actually matter are the dull
 * ones: get the orientation right, cut the dead space around the object,
 * stretch the contrast so the product separates from the surface, warm or
 * cool the cast out, and land every photo on the same shape so the
 * catalogue grid does not look ragged.
 *
 * Nothing here invents detail or replaces the background. What comes out
 * is the same photograph, tidied — which is what a listing needs and what
 * a customer is entitled to see.
 */

export type EnhanceSettings = {
  /** Cut a uniform border away — the counter, the wall, the empty floor. */
  trim: boolean
  /** How eager the trim is. Higher removes more. */
  trimTolerance: number
  /** Stretch the tonal range so blacks are black and whites are white. */
  autoLevels: boolean
  /** 1 is untouched. Below 1 darkens. */
  brightness: number
  /** 1 is untouched. Above 1 deepens colour. */
  saturation: number
  /** Around 1. Above 1 adds punch. */
  contrast: number
  /** 0 leaves it soft, 3 is crisp. */
  sharpness: number
  /** Neutralise a colour cast from tube light. */
  autoWhiteBalance: boolean
  /**
   * Quarter turns applied after the EXIF orientation. Phones get the
   * orientation flag wrong often enough — and a shot taken over a counter
   * lands sideways often enough — that this is the one correction no amount
   * of levels or cropping can stand in for.
   */
  rotate: 0 | 90 | 180 | 270
  /**
   * A hand-chosen crop, as fractions of the rotated frame (0-1). Undefined
   * means the whole frame, which is what the automatic crop then works on.
   * Stored as fractions rather than pixels so it survives the source being
   * a different size from the preview it was drawn on.
   */
  crop?: { x: number; y: number; w: number; h: number }
  /** The shape every photo ends up. */
  aspect: '4:5' | '1:1' | '3:4' | 'original'
  /** Longest edge of the finished file. */
  maxSize: number
  /**
   * Where the crop keeps.
   *
   * 'centre' trusts the person holding the phone to have put the product in
   * the middle. 'auto' hands the decision to sharp, which keeps whatever
   * part of the frame is busiest — right for a product on a plain counter,
   * wrong against shop shelves, where the shelves win.
   */
  focus: 'centre' | 'auto'
  /**
   * Soften everything outside a centred oval, so the shop stays visible
   * behind the product without competing with it. 0 leaves the photo alone.
   *
   * This is a depth-of-field effect, not a cut-out: it does not know what
   * the product is, it softens by distance from the middle. Which is why
   * it only works when the product is roughly centred — and why a phone's
   * own portrait mode, which does understand the subject, beats it.
   */
  backgroundBlur: number
}

/** A product alone on a plain counter or backdrop. */
export const DEFAULT_SETTINGS: EnhanceSettings = {
  trim: true,
  trimTolerance: 12,
  autoLevels: true,
  brightness: 1.06,
  saturation: 1.08,
  contrast: 1.05,
  sharpness: 1.2,
  autoWhiteBalance: true,
  rotate: 0,
  aspect: '4:5',
  maxSize: 1600,
  focus: 'auto',
  backgroundBlur: 0,
}

/**
 * A product shot against the shop itself.
 *
 * Four of the plain-backdrop defaults actively fight this kind of photo:
 *
 *  - trim finds no uniform border to cut, and where it does find one it
 *    crops off-centre;
 *  - the busiest-region crop picks the shelves and the red pillars over
 *    the product;
 *  - full auto-levels blows out the shop lights behind;
 *  - grey-world white balance reads a warm shop and a brass idol as a
 *    colour cast, and pulls the gold out of the thing being sold.
 */
export const SHOP_BACKGROUND_SETTINGS: EnhanceSettings = {
  trim: false,
  trimTolerance: 12,
  autoLevels: false,
  brightness: 1.03,
  saturation: 1.1,
  contrast: 1.06,
  sharpness: 1.4,
  autoWhiteBalance: false,
  rotate: 0,
  aspect: '4:5',
  maxSize: 1600,
  focus: 'centre',
  backgroundBlur: 7,
}

export const PRESETS = {
  plain: DEFAULT_SETTINGS,
  shop: SHOP_BACKGROUND_SETTINGS,
} as const

const ASPECT_RATIOS: Record<Exclude<EnhanceSettings['aspect'], 'original'>, number> = {
  '4:5': 4 / 5,
  '1:1': 1,
  '3:4': 3 / 4,
}

export function coerceSettings(input: unknown): EnhanceSettings {
  const raw = (typeof input === 'object' && input !== null ? input : {}) as Record<string, unknown>
  const num = (key: keyof EnhanceSettings, min: number, max: number) => {
    const value = Number(raw[key])
    if (!Number.isFinite(value)) return DEFAULT_SETTINGS[key] as number
    return Math.min(Math.max(value, min), max)
  }
  const bool = (key: keyof EnhanceSettings) =>
    typeof raw[key] === 'boolean' ? (raw[key] as boolean) : (DEFAULT_SETTINGS[key] as boolean)

  const aspect = ['4:5', '1:1', '3:4', 'original'].includes(String(raw.aspect))
    ? (raw.aspect as EnhanceSettings['aspect'])
    : DEFAULT_SETTINGS.aspect

  const focus = raw.focus === 'centre' || raw.focus === 'auto' ? raw.focus : DEFAULT_SETTINGS.focus

  const rotate = ([0, 90, 180, 270] as const).includes(raw.rotate as 0 | 90 | 180 | 270)
    ? (raw.rotate as EnhanceSettings['rotate'])
    : DEFAULT_SETTINGS.rotate

  const rawCrop = raw.crop as Record<string, unknown> | undefined
  let crop: EnhanceSettings['crop']
  if (rawCrop && ['x', 'y', 'w', 'h'].every((k) => typeof rawCrop[k] === 'number')) {
    /*
     * The offset is capped short of the edge before the size is worked out.
     * Clamping x and y all the way to 1 first left no room at all, so a
     * nonsense rectangle came back with zero height — which sharp then has
     * to be defended from downstream. Leaving 5% means every rectangle that
     * survives this is one it can actually extract.
     */
    const MIN = 0.05
    const x = Math.min(Math.max(rawCrop.x as number, 0), 1 - MIN)
    const y = Math.min(Math.max(rawCrop.y as number, 0), 1 - MIN)
    const w = Math.min(Math.max(rawCrop.w as number, MIN), 1 - x)
    const h = Math.min(Math.max(rawCrop.h as number, MIN), 1 - y)
    // A crop that is the whole frame is the same as no crop; drop it so the
    // cheaper path runs and nothing rounds the image down by a pixel.
    if (w < 0.999 || h < 0.999) crop = { x, y, w, h }
  }

  return {
    crop,
    trim: bool('trim'),
    trimTolerance: num('trimTolerance', 1, 60),
    autoLevels: bool('autoLevels'),
    brightness: num('brightness', 0.5, 1.8),
    saturation: num('saturation', 0, 2),
    contrast: num('contrast', 0.5, 1.8),
    sharpness: num('sharpness', 0, 4),
    autoWhiteBalance: bool('autoWhiteBalance'),
    rotate,
    aspect,
    maxSize: num('maxSize', 400, 2600),
    focus,
    backgroundBlur: num('backgroundBlur', 0, 20),
  }
}

/**
 * Softens the frame outside a centred oval and lays the untouched middle
 * back on top, so the product stays crisp and the shop behind it recedes.
 */
async function softenSurroundings(image: Buffer, sigma: number): Promise<Buffer> {
  const { width, height } = await sharp(image).metadata()
  if (!width || !height) return image

  /*
   * The mask is built pixel by pixel rather than from an SVG gradient,
   * because it has to be an ellipse that is tall and narrow, and a round
   * one is the wrong shape here.
   *
   * A product standing in a 4:5 frame fills nearly the whole height but
   * only the middle of the width. A round mask big enough to keep its base
   * sharp is also big enough to reach the corners, and blurs nothing —
   * measured, on a real photo. Reaching past the top and bottom edges
   * while staying narrow across leaves exactly the side margins soft,
   * which is where the shop shelves are.
   */
  const cx = width / 2
  const cy = height / 2
  const rx = width * 0.36 // sharp across the middle ~72% of the width
  const ry = height * 0.62 // and past the top and bottom edges entirely
  const fade = 1.75 // distance at which the blur is fully applied

  // RGBA, because 'dest-in' tests the mask's ALPHA. A greyscale mask is
  // fully opaque whatever its brightness, so it keeps the entire image and
  // the blur silently does nothing.
  const mask = Buffer.alloc(width * height * 4)
  for (let y = 0; y < height; y++) {
    const dy = (y - cy) / ry
    for (let x = 0; x < width; x++) {
      const dx = (x - cx) / rx
      const d = Math.sqrt(dx * dx + dy * dy)
      let keep: number
      if (d <= 1) keep = 1
      else if (d >= fade) keep = 0
      else {
        // Smoothstep, so the transition has no visible edge.
        const t = (d - 1) / (fade - 1)
        keep = 1 - t * t * (3 - 2 * t)
      }
      const i = (y * width + x) * 4
      mask[i] = 255
      mask[i + 1] = 255
      mask[i + 2] = 255
      mask[i + 3] = Math.round(keep * 255)
    }
  }

  const maskPng = await sharp(mask, { raw: { width, height, channels: 4 } })
    .png()
    .toBuffer()

  const [blurred, middle] = await Promise.all([
    sharp(image).blur(sigma).png().toBuffer(),
    sharp(image)
      .ensureAlpha()
      .composite([{ input: maskPng, blend: 'dest-in' }])
      .png()
      .toBuffer(),
  ])

  return sharp(blurred)
    .composite([{ input: middle, blend: 'over' }])
    .png()
    .toBuffer()
}

/**
 * Grey-world white balance: on average, a photograph of ordinary things
 * should be roughly neutral. If the red channel's mean sits well above the
 * blue's, the tube light was warm, and each channel is scaled back toward
 * the overall mean. Correction is capped, or a genuinely red product gets
 * argued out of its own colour.
 */
async function whiteBalance(image: sharp.Sharp): Promise<sharp.Sharp> {
  const { channels } = await image.clone().stats()
  if (!channels || channels.length < 3) return image

  const [r, g, b] = channels.map((c) => c.mean)
  const grey = (r + g + b) / 3
  if (!grey) return image

  const clamp = (v: number) => Math.min(Math.max(v, 0.82), 1.18)
  return image.linear([clamp(grey / r), clamp(grey / g), clamp(grey / b)], [0, 0, 0])
}

export type EnhanceResult = {
  buffer: Buffer
  width: number
  height: number
  bytes: number
}

export async function enhance(
  input: Buffer,
  settings: EnhanceSettings,
  options?: { previewWidth?: number },
): Promise<EnhanceResult> {
  // rotate() with no argument applies the EXIF orientation, which is why
  // phone photos otherwise arrive on their side.
  let image = sharp(input, { failOn: 'none' }).rotate()

  // Applied here, before trim or crop, so every later step measures the
  // frame the way it will actually be seen.
  if (settings.rotate) image = image.rotate(settings.rotate)

  if (settings.crop) {
    /*
     * Extract the hand-drawn region first. Rounding is clamped back inside
     * the frame because fractions of an odd pixel count can otherwise ask
     * sharp for one row more than exists, which throws.
     */
    const meta = await image.metadata()
    const W = meta.width ?? 0
    const H = meta.height ?? 0
    if (W > 0 && H > 0) {
      const left = Math.min(Math.round(settings.crop.x * W), W - 1)
      const top = Math.min(Math.round(settings.crop.y * H), H - 1)
      const width = Math.max(1, Math.min(Math.round(settings.crop.w * W), W - left))
      const height = Math.max(1, Math.min(Math.round(settings.crop.h * H), H - top))
      try {
        const cut = await image
          .clone()
          .extract({ left, top, width, height })
          .toBuffer({ resolveWithObject: true })
        image = sharp(cut.data, { failOn: 'none' })
      } catch {
        /* an impossible rectangle: keep the whole frame */
      }
    }
  }

  if (settings.trim) {
    // Trim throws when the whole frame is one colour; that is a photo with
    // nothing in it, so the untrimmed original is the right fallback.
    try {
      const trimmed = await image
        .clone()
        .trim({ threshold: settings.trimTolerance })
        .toBuffer({ resolveWithObject: true })
      if (trimmed.info.width > 80 && trimmed.info.height > 80) {
        image = sharp(trimmed.data, { failOn: 'none' })
      }
    } catch {
      /* keep the untrimmed frame */
    }
  }

  if (settings.autoWhiteBalance) image = await whiteBalance(image)
  if (settings.autoLevels) image = image.normalise()

  if (settings.brightness !== 1 || settings.saturation !== 1) {
    image = image.modulate({ brightness: settings.brightness, saturation: settings.saturation })
  }

  if (settings.contrast !== 1) {
    // Pivot around mid-grey so raising contrast does not also brighten.
    const offset = 128 * (1 - settings.contrast)
    image = image.linear(settings.contrast, offset)
  }

  if (settings.sharpness > 0) {
    image = image.sharpen({ sigma: 0.6 + settings.sharpness * 0.4 })
  }

  const target = options?.previewWidth ?? settings.maxSize

  if (settings.aspect === 'original') {
    image = image.resize({ width: target, withoutEnlargement: true })
  } else {
    const ratio = ASPECT_RATIOS[settings.aspect]
    const width = target
    const height = Math.round(target / ratio)
    image = image.resize({
      width,
      height,
      fit: 'cover',
      // 'attention' keeps the busiest region, which is the product on a
      // plain surface but the shelving in a shop. 'centre' is the safe
      // choice whenever the background has anything going on.
      position: settings.focus === 'auto' ? sharp.strategy.attention : 'centre',
      withoutEnlargement: false,
    })
  }

  // The blur has to happen after the crop, or the softened ring sits in
  // the wrong place once the frame is trimmed to shape.
  if (settings.backgroundBlur > 0) {
    const cropped = await image.png().toBuffer()
    image = sharp(await softenSurroundings(cropped, settings.backgroundBlur))
  }

  // A flat white ground behind anything transparent, so PNGs from a phone
  // editor do not land on black in dark mode.
  image = image.flatten({ background: '#ffffff' })

  const { data, info } = await image
    .jpeg({ quality: options?.previewWidth ? 78 : 88, mozjpeg: true, progressive: true })
    .toBuffer({ resolveWithObject: true })

  return { buffer: data, width: info.width, height: info.height, bytes: data.length }
}

/** The untouched photo, scaled down for the before/after comparison. */
/**
 * The untouched frame, for the before/after and for drawing a crop on.
 *
 * It takes the user's rotation as well as the EXIF one: the crop is stored
 * as fractions of the ROTATED frame, so if this showed the photo the other
 * way up, every box drawn on a turned photo would land somewhere else.
 */
export async function previewOriginal(
  input: Buffer,
  width: number,
  rotate: EnhanceSettings['rotate'] = 0,
): Promise<Buffer> {
  const base = sharp(input, { failOn: 'none' }).rotate()
  return (rotate ? base.rotate(rotate) : base)
    .resize({ width, withoutEnlargement: true })
    .jpeg({ quality: 74, mozjpeg: true })
    .toBuffer()
}

export const toDataUrl = (buffer: Buffer): string =>
  `data:image/jpeg;base64,${buffer.toString('base64')}`
