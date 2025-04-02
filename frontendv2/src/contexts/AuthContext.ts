import { createContext } from 'react';
import { IAuthUser } from '../interfaces/IAuthUser';

export interface IAuthContext {
  user: IAuthUser | null;
  login: (callback?: () => void) => void;
  logout: (callback?: () => void) => void;
}

export const AuthContext = createContext<IAuthContext | undefined>(undefined);

// TODO: Verify types