import { PropsWithChildren } from 'react';
import { uiContainerStyles } from './uiStyles';

export function Container({ children }: PropsWithChildren<unknown>) {
  return <div style={uiContainerStyles}>{children}</div>;
}
