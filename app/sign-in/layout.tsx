import { Metadata } from 'next';
import { generateMetadata as generateSeoMetadata } from '@/lib/seo/config';

export const metadata: Metadata = generateSeoMetadata('signIn');

export default function SignInLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
