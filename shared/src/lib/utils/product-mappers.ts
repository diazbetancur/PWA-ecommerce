import { ProductResponse } from '@pwa/core';
import { ProductCardData } from '../ui/product-card/product-card.component';

/**
 * Mapea un ProductResponse del backend a ProductCardData para el componente de tarjeta
 */
export function mapProductToCard(product: ProductResponse): ProductCardData {
  return {
    id: product.id,
    name: product.name,
    price: product.price,
    imageUrl: product.mainImageUrl || '',
    stock: product.stock,
  };
}

/**
 * Mapea múltiples productos del backend a ProductCardData
 */
export function mapProductsToCards(
  products: ProductResponse[]
): ProductCardData[] {
  return products.map(mapProductToCard);
}
