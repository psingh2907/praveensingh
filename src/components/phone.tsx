import Image from "next/image";

type PhoneProps = {
  className?: string;
  sizes?: string;
  preload?: boolean;
  /**
   * "iphone" (default): Apple's official iPhone 18 Pro Max bezel. "android": a
   * frame in the spirit of a Galaxy S25 Ultra, drawn in CSS with no brand on it.
   */
  device?: "iphone" | "android";
  /** Drawn over Apple's Dynamic Island, e.g. a live activity. iPhone only. */
  island?: React.ReactNode;
  /**
   * Drawn over the screen, under the bezel: a button or a demo that
   * says on screen what it is. iPhone only.
   */
  overlay?: React.ReactNode;
} & (
  | { src: string; alt: string; wireframe?: never }
  | { wireframe: React.ReactNode; src?: never; alt?: never }
);

// A plain device frame around a real screenshot. The screen is an image,
// never a UI mocked up to pass as one. The only exception is `wireframe`:
// a deliberately abstract drawing (grey bars, no text or figures) for apps
// that can't be shown, labelled as an illustration wherever it's used.

// Where the screen sits inside Apple's bezel image, as fractions of it.
const screenBox =
  "absolute left-[5.102%] top-[2.2%] h-[95.6%] w-[89.796%] rounded-[14.4%/6.63%]";
export function Phone({
  src,
  alt,
  wireframe,
  device = "iphone",
  className = "",
  sizes = "280px",
  preload = false,
  island,
  overlay,
}: PhoneProps) {
  const screen = src ? (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      preload={preload}
      className="object-cover"
    />
  ) : (
    <div aria-hidden className="absolute inset-0">
      {wireframe}
    </div>
  );

  if (device === "android") {
    // In the spirit of a Galaxy S25 Ultra: a flat titanium edge, gently
    // rounded corners, thin even bezels and a small centred camera hole.
    return (
      <div
        className={`relative aspect-[390/844] rounded-[30px] bg-linear-to-b from-[#c9c9ce] via-[#8f8f95] to-[#5d5d62] p-[2px] shadow-[0_30px_60px_-20px_rgb(29_29_31/0.35)] ${className}`}
      >
        {/* Power and volume keys on the right edge. */}
        <span
          aria-hidden
          className="absolute -right-[2px] top-[22%] h-[12%] w-[3px] rounded-r-sm bg-[#7a7a80]"
        />
        <span
          aria-hidden
          className="absolute -right-[2px] top-[37%] h-[6%] w-[3px] rounded-r-sm bg-[#7a7a80]"
        />
        <div className="h-full w-full rounded-[28px] bg-black p-[3px]">
          <div className="relative h-full w-full overflow-hidden rounded-[25px] bg-surface-2">
            {screen}
            <div className="absolute left-1/2 top-2 h-[8px] w-[8px] -translate-x-1/2 rounded-full bg-black ring-1 ring-white/10" />
          </div>
        </div>
      </div>
    );
  }

  // The iPhone is Apple's own product bezel (iPhone 18 Pro Max, Black, from
  // developer.apple.com/design/resources), used as supplied: scaled, never
  // altered. Its transparent screen opening is 1320 × 2868 px at (75, 66) in
  // the 1470 × 3000 image, with corners of about 190 px; the screen, any
  // overlay and a live island are laid into exactly that box.
  return (
    <div
      className={`relative aspect-[1470/3000] drop-shadow-[0_24px_30px_rgb(29_29_31/0.28)] ${className}`}
    >
      <div className={`${screenBox} overflow-hidden bg-surface-2`}>
        {screen}
        {overlay}
      </div>
      <Image
        src="/hero/iphone-18-pro-max-black.webp"
        alt=""
        aria-hidden
        fill
        sizes={sizes}
        preload={preload}
        className="pointer-events-none select-none"
      />
      {/* Above the bezel, so a live activity can grow out of Apple's island. */}
      {/* A size container, so the island sizes itself in fractions of the screen. */}
      {island && (
        <div
          className={`${screenBox} pointer-events-none [container-type:size] [&>*]:pointer-events-auto`}
        >
          {island}
        </div>
      )}
    </div>
  );
}
