'use client';
import { useState } from 'react';
import Image from 'next/image';
import Lightbox from 'yet-another-react-lightbox';
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails';
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/thumbnails.css';
import type { HotelImage } from '../domain/types';

export function HotelGallery({ name, images }: { name: string; images: readonly HotelImage[] }) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const slides = images.map((image) => ({ src: image.src, alt: image.alt }));
  function openAt(next: number) {
    setIndex(next);
    setOpen(true);
  }
  return (
    <>
      <div className="details-gallery" aria-label={`گالری تصاویر ${name}`}>
        {images.map((image, imageIndex) => (
          <button
            key={`${image.src}-${imageIndex}`}
            type="button"
            className={imageIndex === 0 ? 'gallery-hero' : 'gallery-thumb'}
            onClick={() => openAt(imageIndex)}
            aria-label={`باز کردن ${image.alt}`}
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes={
                imageIndex === 0
                  ? '(max-width: 768px) 100vw, 70vw'
                  : '(max-width: 768px) 50vw, 30vw'
              }
              priority={imageIndex === 0}
            />
          </button>
        ))}
        <span className="gallery-caption">فضای نمایشی اقامتگاه</span>
      </div>
      <Lightbox
        open={open}
        close={() => setOpen(false)}
        index={index}
        slides={slides}
        plugins={[Thumbnails]}
        carousel={{ finite: images.length <= 1 }}
        controller={{ closeOnBackdropClick: true }}
        labels={{
          Next: 'تصویر بعد',
          Previous: 'تصویر قبل',
          Close: 'بستن گالری',
        }}
      />
    </>
  );
}
