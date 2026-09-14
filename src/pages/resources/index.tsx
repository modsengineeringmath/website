import React from 'react';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import CatalogCard from '../../components/CatalogCard';
import SeoJsonLd from '../../components/SeoJsonLd';
import {resources} from '../../config/catalog';
import styles from '../catalog.module.css';

export default function ResourcesPage(): React.JSX.Element {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Engineering Mathematics Teaching Resources',
    itemListElement: resources.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {'@type': 'DigitalDocument', name: item.title, description: item.description},
    })),
  };

  return (
    <Layout title="Resources & Store" description="เอกสาร ชุดโจทย์ และสื่อการสอนคณิตศาสตร์วิศวกรรม">
      <SeoJsonLd data={schema} />
      <header className={styles.pageHero}>
        <div className="container">
          <span className={styles.kicker}>Teaching Resources</span>
          <Heading as="h1">Resources & Digital Store</Heading>
          <p>Lecture notes, worked examples, problem sets, formula sheets และสื่อประกอบการสอนที่ออกแบบให้เข้าใจวิธีคิดและนำไปต่อยอดได้</p>
        </div>
      </header>
      <main className={styles.section}>
        <div className="container">
          <div className={styles.notice}>สินค้า Digital Product ยังไม่เปิดจำหน่าย ปุ่มซื้อจะเปิดเมื่อเชื่อม Checkout ที่ปลอดภัยแล้ว</div>
          <div className={styles.grid} style={{marginTop: '1.5rem'}}>
            {resources.map((item) => (
              <div id={item.slug} key={item.slug}>
                <CatalogCard
                  eyebrow={item.subject}
                  title={item.title}
                  description={item.description}
                  meta={[item.level, item.pages, item.fileType]}
                  href={item.slug === 'laplace-transform-workbook' ? '/resources/laplace-transform-workbook' : `/resources#${item.slug}`}
                  status={item.access}
                  actionLabel={item.slug === 'laplace-transform-workbook' ? 'Preview Product' : 'View Details'}
                />
              </div>
            ))}
          </div>
        </div>
      </main>
    </Layout>
  );
}
