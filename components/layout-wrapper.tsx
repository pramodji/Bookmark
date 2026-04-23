'use client';

import { LoadingBar } from './loading-bar';
import { useLoading } from './loading-provider';
import { LoginGate } from './login-gate';

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const { isLoading } = useLoading();

  return (
    <LoginGate>
      {isLoading && <LoadingBar />}
      {children}
    </LoginGate>
  );
}
