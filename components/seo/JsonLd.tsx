import { StructuredData } from '@/lib/seo/structured-data';

interface JsonLdProps {
  data: object | object[];
}

/**
 * Composant pour injecter les données structurées JSON-LD dans le head
 * 
 * Utilisation :
 * <JsonLd data={generateOrganizationSchema()} />
 */
export function JsonLd({ data }: JsonLdProps) {
  return <StructuredData data={data} />;
}
