export function useStorePurchases() {
  return {
    connected: false,
    products: [],
    purchaseSku: async () => {
      throw new Error("Les achats ne sont pas disponibles sur le web.");
    },
    restore: async () => {
      throw new Error("Les achats ne sont pas disponibles sur le web.");
    },
  };
}
