import { Metadata } from 'next';
import { generateMetadata as generateSeoMetadata } from '@/lib/seo/config';

export const metadata: Metadata = generateSeoMetadata('contact');

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
