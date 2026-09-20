import type { Dispatch, ElementRef, ReactElement, RefAttributes, SetStateAction } from 'react';
import type { View } from 'react-native';

export interface ActiveInjectedProps {
  isActive: boolean;
  setIsActive: Dispatch<SetStateAction<boolean>>;
}

export type ActiveBoundaryInjectedProps = ActiveInjectedProps;

export type ActiveChildProps = Partial<ActiveInjectedProps> & RefAttributes<ElementRef<typeof View>>;

export interface ActiveProps {
  children: ReactElement<ActiveChildProps>;
}

export interface ActiveBoundaryProps {
  children: ReactElement<ActiveChildProps>;
}
