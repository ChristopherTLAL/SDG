import { PortableText } from '@portabletext/react';
import type { PortableTextBlock } from 'sanity';
import { urlFor } from '../lib/sanity/image';

const SanityImageComponent = ({ value }: { value: any }) => {
  if (!value?.asset?._ref) {
    return null;
  }
  
  return (
    <img
      src={urlFor(value)?.width(1000).auto('format').url()}
      alt={value.alt || ' '}
      loading="lazy"
      className="my-6 rounded-lg shadow-lg max-h-[70vh] mx-auto"
    />
  );
};

const ptComponents = {
  types: {
    image: SanityImageComponent,
  },
};

export default function ContentView({ value }: { value: PortableTextBlock[] }) {
  // The line below is the one that was likely causing the syntax error.
  // The correct syntax is `components={ptComponents}`.
  return <PortableText value={value} components={ptComponents} />;
}