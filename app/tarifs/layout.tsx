import { Metadata } from 'next';
import { generateMetadata as generateSeoMetadata } from '@/lib/seo/config';

export const metadata: Metadata = generateSeoMetadata('tarifs');

export default function TarifsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
