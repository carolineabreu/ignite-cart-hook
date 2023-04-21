import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      let newCart = [...cart]
      const productExists = cart.find((product) => product.id === productId);

      const productStock = await api.get(`/stock/${productId}`)

      const amount = productExists ? productExists.amount : 0

      if (amount + 1 > productStock.data.amount) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      if (productExists) {
        productExists.amount = amount + 1;
      } else {
        const product = await api.get(`/products/${productId}`)

        const addToCart = {
          ...product.data,
          amount: 1
        }

        newCart.push(addToCart)
      }
      setCart(newCart)
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart))
    } catch {
      toast.error("Erro na adição do produto")
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const newCart = [...cart]
      const findProductIndex = newCart.findIndex(product => product.id === productId)

      if (findProductIndex >= 0) {
        newCart.splice(findProductIndex, 1)
        setCart(newCart)
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart))
      } else {
        throw Error()
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const newCart = [...cart];
      if (amount <= 0) {
        return;
      }

      const productStock = await api.get(`/stock/${productId}`)

      if (amount > productStock.data.amount) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      const productExists = cart.find((product) => product.id === productId);
      if (productExists) {
        productExists.amount = amount;
        setCart(newCart)
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart))
      } else {
        throw Error()
      }

    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
