import type { ImageSource } from './types.js';
import { useEffect, useRef } from 'react';

import {
  arToHeight,
  devicePixelRatios,
  safeParams,
  formatSizes,
} from './helpers.js';

type UseImageContext = {
  breakpoints: Record<string, string>;
};

type UseImageParams = {
  sizes: string;
  source: ImageSource;
  ar?: string;
};

export function _useImage(
  this: UseImageContext,
  { source, sizes, ar }: UseImageParams,
) {
  const { breakpoints } = this;
  const { _id, altText } = source;
  const base64 = source.base64[ar ?? 'null'];

  const hotspot = source.hotspot ?? {};
  const [fpX, fpY] = [hotspot.x, hotspot.y];

  const baseWidths = sizes
    .split(' ')
    .map((s) => s.match(/([0-9]+)px/)![1])
    .map((width) => parseInt(width));
  const defaultWidth = Math.max(...baseWidths);
  const widths = devicePixelRatios(baseWidths);

  const params = safeParams({ w: defaultWidth, ar, fpX, fpY, fm: 'jpg' });
  const baseSrc = `/api/image/${_id}`;
  const defaultSrc = `${baseSrc}?${params}`;

  const jpegs = widths
    .map((width) => {
      const params = safeParams({ w: width, ar, fpX, fpY, fm: 'jpg' });
      return `${baseSrc}?${params} ${width}w`;
    })
    .join(', ');

  const webps = widths
    .map((width) => {
      const params = safeParams({ w: width, ar, fpX, fpY, fm: 'webp' });
      return `${baseSrc}?${params} ${width}w`;
    })
    .join(', ');

  sizes = formatSizes(sizes, breakpoints);
  const width = source.width;
  const height = ar ? arToHeight(ar, width) : source.height;

  const imageRef = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const image = imageRef.current!;
    if (image.complete) return; // skip loaded images

    image.style.opacity = '0';
    const listener = () => {
      image.style.opacity = '1';
    };

    // fade image in on load
    image.addEventListener('load', listener);
    image.addEventListener('error', listener);

    return () => {
      image.removeEventListener('load', listener);
      image.removeEventListener('error', listener);
    };
  }, []);

  return { base64, webps, jpegs, imageRef, defaultSrc, altText, width, height };
}
