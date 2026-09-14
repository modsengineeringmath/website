import React from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import SeoJsonLd from '../../components/SeoJsonLd';
import styles from '../catalog.module.css';

export default function WorkbookPage(): React.JSX.Element {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'Laplace Transform Workbook',
    description: 'ชุดโจทย์ Laplace Transform สำหรับนักศึกษาวิศวกรรม',
    category: 'Digital educational material',
    offers: {
      '@type': 'Offer',
      availability: 'https://schema.org/PreOrder',
      priceCurrency: 'THB',
      url: 'https://modsengineeringmath.com/resources/laplace-transform-workbook',
    },
  };

  return (
    <Layout title="Laplace Transform Workbook" description="ชุดโจทย์ Laplace Transform พร้อมแนวคิดและตัวอย่าง">
      <SeoJsonLd data={schema} />
      <header className={styles.pageHero}>
        <div className="container">
          <span className={styles.kicker}>Digital Resource • Coming Soon</span>
          <Heading as="h1">Laplace Transform Workbook</Heading>
          <p>Canonical problems ที่ช่วยให้ผู้เรียนเข้าใจรูปแบบโจทย์และนำวิธีคิดไปแก้ปัญหาใหม่ได้</p>
        </div>
      </header>
      <main className={styles.section}>
        <div className="container">
          <div className={styles.introGrid}>
            <div>
              <Heading as="h2">สิ่งที่จะได้รับ</Heading>
              <ul>
                <li>สรุปสูตรพร้อมคำอธิบายเงื่อนไขการใช้</li>
                <li>โจทย์ Standard Laplace และ Properties</li>
                <li>Partial Fractions และ Inverse Laplace</li>
                <li>โจทย์ Differential Equations และ Circuit Applications</li>
                <li>แนวคำตอบแบบแสดงวิธีคิด</li>
              </ul>
              <Heading as="h2">ตัวอย่างเนื้อหา</Heading>
              <p>อ่านตัวอย่างบท Inverse Laplace Transform ได้ฟรีก่อนตัดสินใจ</p>
              <Link className="button button--secondary" to="/learn/laplace/inverse-laplace-transform">Open Free Lesson</Link>
            </div>
            <aside className={styles.panel}>
              <h2>Product information</h2>
              <div className={styles.meta}><span>PDF</span><span>80+ pages</span><span>University</span></div>
              <p><strong>Subject:</strong> Laplace Transform</p>
              <p><strong>Language:</strong> Thai with English terminology</p>
              <p><strong>Status:</strong> In development</p>
              <button className={styles.disabledButton} disabled aria-disabled="true">Purchase Coming Soon</button>
            </aside>
          </div>
        </div>
      </main>
    </Layout>
  );
}
