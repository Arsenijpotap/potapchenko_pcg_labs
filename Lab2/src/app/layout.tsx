import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Image Info',
  description: 'Просмотр параметров графических файлов',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="ru"><body>{children}</body></html>;
}
