import { Metadata } from 'next';
import { generateMetadata as generateSeoMetadata } from '@/lib/seo/config';

export const metadata: Metadata = generateSeoMetadata('blog');

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
