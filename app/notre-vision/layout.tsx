import { Metadata } from 'next';
import { generateMetadata as generateSeoMetadata } from '@/lib/seo/config';

export const metadata: Metadata = generateSeoMetadata('notreVision');

export default function NotreVisionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
