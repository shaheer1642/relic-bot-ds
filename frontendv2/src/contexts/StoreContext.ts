import { createContext } from 'react';
import { IUser } from '../interfaces/IUser';

export interface IStoreContext {
  usersList: Record<string, IUser>;
}

export const StoreContext = createContext<IStoreContext | undefined>(undefined);