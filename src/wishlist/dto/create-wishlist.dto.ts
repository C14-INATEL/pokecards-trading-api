// dto/create-wishlist.dto.ts
import { WishlistItemType } from '@prisma/client';
import {
  IsString,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsEnum,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

export class WishlistItemDto {
  @IsEnum(WishlistItemType)
  itemType: WishlistItemType;

  @IsOptional()
  @IsUUID('4')
  cardId?: string;

  @IsOptional()
  @IsString()
  filterType?: string;

  @IsOptional()
  @IsString()
  filterRarity?: string;
}

export class CreateWishlistDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WishlistItemDto)
  items: WishlistItemDto[];
}
