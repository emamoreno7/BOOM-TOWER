import { BlockType } from '../blocks/BlockType';
import { Logger } from '../../core/Logger';

export interface BlockVariant {
  id: string;
  blockType: BlockType;
  colorOverride: number;
  label: string;
  requiredSkin: string;
}

export class BlockVariantSystem {
  private variants: Map<string, BlockVariant> = new Map();
  private activeSkinId = 'classic';

  register(variant: BlockVariant): void {
    this.variants.set(variant.id, variant);
  }

  setActiveSkin(skinId: string): void {
    this.activeSkinId = skinId;
    Logger.info(`[BlockVariantSystem] Active skin: ${skinId}`);
  }

  getColorForType(type: BlockType, fallback: number): number {
    for (const variant of this.variants.values()) {
      if (variant.blockType === type && variant.requiredSkin === this.activeSkinId) {
        return variant.colorOverride;
      }
    }
    return fallback;
  }

  getAll(): BlockVariant[] {
    return [...this.variants.values()];
  }
}
