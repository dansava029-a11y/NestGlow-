import fs from 'fs';
import path from 'path';

export interface Product {
  id: string;
  name: string;
  name_ru: string;
  category: string;
  styles: string[];
  price: number;
  colors: string[];
  image_url: string;
  affiliate_url: string;
  dimensions: { width: number; height: number; depth: number };
}

export function loadProducts(): Product[] {
  const filePath = path.join(process.cwd(), 'data', 'products.json');
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as Product[];
}

export function filterByStyle(products: Product[], style: string): Product[] {
  return products.filter(p => p.styles.includes(style));
}

export function filterByBudget(products: Product[], budget: number): Product[] {
  return products.filter(p => p.price <= budget * 0.45);
}

export function getTop(products: Product[], n: number): Product[] {
  return products.slice(0, n);
}
