import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface CartItem {
    productId: bigint;
    quantity: bigint;
}
export type Time = bigint;
export interface Order {
    id: bigint;
    total: bigint;
    user: Principal;
    timestamp: Time;
    items: Array<CartItem>;
}
export interface Product {
    id: bigint;
    name: string;
    description: string;
    stock: bigint;
    imageUrl: string;
    category: Category;
    price: bigint;
}
export enum Category {
    groceries = "groceries",
    snacks = "snacks",
    beverages = "beverages",
    personalCare = "personalCare",
    household = "household"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addProduct(name: string, description: string, price: bigint, category: Category, imageUrl: string, stock: bigint): Promise<void>;
    addToCart(productId: bigint, quantity: bigint): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    clearCart(): Promise<void>;
    getAllProducts(): Promise<Array<Product>>;
    getCallerUserRole(): Promise<UserRole>;
    getCart(): Promise<Array<CartItem>>;
    getOrderHistory(user: Principal): Promise<Array<Order>>;
    getProduct(id: bigint): Promise<Product>;
    getProductsByCategory(category: Category): Promise<Array<Product>>;
    isCallerAdmin(): Promise<boolean>;
    placeOrder(): Promise<void>;
    removeFromCart(productId: bigint): Promise<void>;
    removeProduct(id: bigint): Promise<void>;
    seedWithSampleProducts(): Promise<void>;
    updateCartItem(productId: bigint, quantity: bigint): Promise<void>;
    updateProduct(id: bigint, name: string, description: string, price: bigint, category: Category, imageUrl: string, stock: bigint): Promise<void>;
}
