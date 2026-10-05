import type {Metadata} from 'next';
import type {ReactNode} from 'react';
import {ManagementProvider} from '@/components/management-provider';
import {Shell} from '@/components/shell';
import {loadManagementState} from '@/lib/management';
import './globals.css';

export const metadata: Metadata = {
  title: 'FPBCraft',
  description: 'FPBPack and FPBCraft server dashboard',
};

export default async function RootLayout({children}: {children: ReactNode}) {
  const initialState = await loadManagementState();

  return (
    <html lang="en">
      <body>
        <ManagementProvider initialState={initialState}>
          <Shell>{children}</Shell>
        </ManagementProvider>
      </body>
    </html>
  );
}
