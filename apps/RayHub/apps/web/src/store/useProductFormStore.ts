import { create } from 'zustand';

interface ProductFormState {
  name: string;
  sku: string;
  shopeePrice: number;
  cost: number;
  shopeeCommission: number; // percentual estimado da Shopee (%)

  setField: <K extends keyof Omit<ProductFormState, 'setField' | 'getMargin' | 'reset'>>(
    key: K,
    value: ProductFormState[K],
  ) => void;

  getMargin: () => {
    lucroAbsoluto: number;
    margemPercent: number;
  };

  reset: () => void;
}

const DEFAULT_STATE = {
  name: '',
  sku: '',
  shopeePrice: 0,
  cost: 0,
  shopeeCommission: 15, // 15% padrão Shopee
};

export const useProductFormStore = create<ProductFormState>((set, get) => ({
  ...DEFAULT_STATE,

  setField: (key, value) => set({ [key]: value } as Pick<ProductFormState, typeof key>),

  getMargin: () => {
    const { shopeePrice, cost, shopeeCommission } = get();
    const taxaShopee = (shopeePrice * shopeeCommission) / 100;
    const lucroAbsoluto = shopeePrice - cost - taxaShopee;
    const margemPercent = shopeePrice > 0 ? (lucroAbsoluto / shopeePrice) * 100 : 0;
    return { lucroAbsoluto, margemPercent };
  },

  reset: () => set(DEFAULT_STATE),
}));
