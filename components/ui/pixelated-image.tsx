"use client"

import Image, { type ImageProps } from "next/image"
export function PixelatedImage({ alt, ...props }: ImageProps) {
  return (
    <Image {...props} alt={alt} />
)
}
