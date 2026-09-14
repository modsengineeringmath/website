import React from 'react';
import Head from '@docusaurus/Head';

type Props = {
  data: Record<string, unknown> | Array<Record<string, unknown>>;
};

export default function SeoJsonLd({data}: Props): React.JSX.Element {
  return (
    <Head>
      <script type="application/ld+json">{JSON.stringify(data)}</script>
    </Head>
  );
}
