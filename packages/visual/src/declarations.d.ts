declare module 'pngjs' {
  export class PNG {
    width: number;
    height: number;
    data: Buffer;
    constructor(options?: { width?: number; height?: number });
    static sync: {
      read(buffer: Buffer): PNG;
      write(png: PNG): Buffer;
    };
  }
}

declare module 'pixelmatch' {
  interface PixelmatchOptions {
    threshold?: number;
    includeAA?: boolean;
    alpha?: number;
    aaColor?: [number, number, number];
    diffColor?: [number, number, number];
    diffColorAlt?: [number, number, number];
    diffMask?: boolean;
  }

  function pixelmatch(
    img1: Buffer | Uint8Array,
    img2: Buffer | Uint8Array,
    output: Buffer | Uint8Array | null,
    width: number,
    height: number,
    options?: PixelmatchOptions
  ): number;

  export default pixelmatch;
}
