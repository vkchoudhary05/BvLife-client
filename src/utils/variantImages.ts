/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product, ProductVariant } from '../types';

export interface FormulationPreset {
  id: string;
  label: string;
  form: string;
  image: string;
  galleryImages?: string[];
  description: string;
}

export const FORMULATION_PRESET_IMAGES: FormulationPreset[] = [
  {
    id: 'tablet',
    label: 'Tablets / Vati (Bottle)',
    form: 'tablet',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=800',
    galleryImages: [
      'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1550572017-ed200f5e6343?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?auto=format&fit=crop&q=80&w=800'
    ],
    description: 'Apothecary tablet bottle with botanical wellness tablets / vati'
  },
  {
    id: 'oil',
    label: 'Taila / Oil (Dropper Flask)',
    form: 'oil',
    image: 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&q=80&w=800',
    galleryImages: [
      'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&q=80&w=800'
    ],
    description: 'Amber glass dropper bottle for facial elixirs and therapeutic oils'
  },
  {
    id: 'hair_oil',
    label: 'Hair Taila / Massage Oil Bottle',
    form: 'oil',
    image: 'https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&q=80&w=800',
    galleryImages: [
      'https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1608248597358-1f09564f26b5?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&q=80&w=800'
    ],
    description: 'Herb-infused therapy oil bottle for hair and scalp wellness'
  },
  {
    id: 'churna',
    label: 'Churna / Herbal Powder Jar',
    form: 'churna',
    image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=800',
    galleryImages: [
      'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=800'
    ],
    description: 'Traditional apothecary glass/ceramic jar with organic powdered herbs'
  },
  {
    id: 'syrup',
    label: 'Syrup / Arishta Tonic Bottle',
    form: 'liquid',
    image: 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&q=80&w=800',
    galleryImages: [
      'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800'
    ],
    description: 'Medicinal herbal tonic / kadha / arishta bottle'
  },
  {
    id: 'cream',
    label: 'Lepa / Beauty Cream Jar',
    form: 'cream',
    image: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&q=80&w=800',
    galleryImages: [
      'https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&q=80&w=800'
    ],
    description: 'Herbal cosmetic cream / moisturizer / paste jar'
  },
  {
    id: 'capsule',
    label: 'Vegetarian Capsules Jar',
    form: 'capsule',
    image: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&q=80&w=800',
    galleryImages: [
      'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=800'
    ],
    description: 'Apothecary jar with plant-derived herbal capsules'
  }
];

export const FORMULATION_IMAGES_MAP: Record<string, string> = {
  tablet: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=800',
  oil: 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&q=80&w=800',
  hair_oil: 'https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&q=80&w=800',
  churna: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=800',
  liquid: 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&q=80&w=800',
  syrup: 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&q=80&w=800',
  cream: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&q=80&w=800',
  capsule: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&q=80&w=800'
};

export function getFormulationPresetImage(formType: string): string {
  const normalized = formType.toLowerCase().trim();
  return FORMULATION_IMAGES_MAP[normalized] || FORMULATION_IMAGES_MAP.churna;
}

/**
 * Detect normalized formulation type from variant name, formType, size or category
 */
export function detectFormulationType(variant?: ProductVariant, parentProduct?: Product): string {
  const combinedText = [
    variant?.form,
    variant?.formType,
    variant?.name,
    variant?.size,
    parentProduct?.subcategory,
    parentProduct?.category
  ].filter(Boolean).join(' ').toLowerCase();

  if (combinedText.includes('tablet') || combinedText.includes('vati') || combinedText.includes('tab') || combinedText.includes('pill')) {
    return 'tablet';
  }
  if (combinedText.includes('oil') || combinedText.includes('taila') || combinedText.includes('tailam') || combinedText.includes('serum') || combinedText.includes('dropper') || combinedText.includes('ml')) {
    if (combinedText.includes('hair') || combinedText.includes('scalp')) {
      return 'hair_oil';
    }
    return 'oil';
  }
  if (combinedText.includes('churna') || combinedText.includes('powder') || combinedText.includes('avaleha') || combinedText.includes('paste') || combinedText.includes('jar') || combinedText.includes('gram') || combinedText.includes('kg')) {
    return 'churna';
  }
  if (combinedText.includes('syrup') || combinedText.includes('liquid') || combinedText.includes('arishta') || combinedText.includes('asava') || combinedText.includes('tonic') || combinedText.includes('kadha')) {
    return 'syrup';
  }
  if (combinedText.includes('cream') || combinedText.includes('lepa') || combinedText.includes('lotion') || combinedText.includes('balm') || combinedText.includes('gel')) {
    return 'cream';
  }
  if (combinedText.includes('capsule') || combinedText.includes('cap')) {
    return 'capsule';
  }

  return 'generic';
}

/**
 * Resolves the display image for a product variant.
 * If the variant has a custom image defined, it is returned.
 * If not, but the formulation implies a distinct type (e.g. tablet vs oil vs churna),
 * it returns the appropriate high-res formulation preset photo.
 */
export function getVariantImage(variant?: ProductVariant, parentProduct?: Product): string {
  if (variant?.image && variant.image.trim()) {
    return variant.image.trim();
  }

  if (variant) {
    const formType = detectFormulationType(variant, parentProduct);
    const preset = FORMULATION_PRESET_IMAGES.find(p => p.id === formType || p.form === formType);
    if (preset) {
      return preset.image;
    }
  }

  return parentProduct?.mainImage || FORMULATION_PRESET_IMAGES[0].image;
}

/**
 * Resolves the full multi-image gallery for a product variant.
 * When a user changes variant (e.g. from 100g Churna to Tablet variant):
 * 1. Variant primary image comes first (either custom uploaded or formulation preset).
 * 2. Any custom gallery images uploaded specifically for this variant (variant.images).
 * 3. Formulation preset perspective gallery (e.g. tablet bottle, pills in dish, botanical preparation, label).
 * 4. General product parent images and certifications.
 * Returns a deduplicated, rich array of active images.
 */
export function getVariantGalleryImages(variant?: ProductVariant, parentProduct?: Product): string[] {
  const result: string[] = [];

  const addImage = (img?: string) => {
    if (img && typeof img === 'string') {
      const trimmed = img.trim();
      if (trimmed && !result.includes(trimmed)) {
        result.push(trimmed);
      }
    }
  };

  // 1. Variant's own primary custom image
  if (variant?.image && variant.image.trim()) {
    addImage(variant.image.trim());
  }

  // 2. Variant's custom gallery images if defined
  if (variant?.images && Array.isArray(variant.images)) {
    variant.images.forEach(img => addImage(img));
  }

  // 3. Formulation preset perspective gallery for this variant type
  if (variant) {
    const formType = detectFormulationType(variant, parentProduct);
    const preset = FORMULATION_PRESET_IMAGES.find(p => p.id === formType || p.form === formType);
    if (preset) {
      addImage(preset.image);
      if (preset.galleryImages) {
        preset.galleryImages.forEach(img => addImage(img));
      }
    }
  }

  // 4. Parent product main image (if applicable)
  if (parentProduct?.mainImage) {
    addImage(parentProduct.mainImage);
  }

  // 5. Parent product additional gallery images
  if (parentProduct?.images && Array.isArray(parentProduct.images)) {
    parentProduct.images.forEach(img => addImage(img));
  }

  // 6. Fallback if empty
  if (result.length === 0) {
    result.push(FORMULATION_PRESET_IMAGES[0].image);
  }

  return result;
}
