import { Metadata } from 'next';
import { generateMetadata as generateSeoMetadata } from '@/lib/seo/config';

export const metadata: Metadata = generateSeoMetadata('signUp');

export default function SignUpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
