import React from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import SeoJsonLd from '../components/SeoJsonLd';
import {siteConfig} from '../config/site';
import styles from './catalog.module.css';

export default function AboutPage(): React.JSX.Element {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: `About ${siteConfig.name}`,
    url: `${siteConfig.url}/about`,
    mainEntity: {
      '@type': 'EducationalOrganization',
      name: siteConfig.name,
      description: siteConfig.description,
      sameAs: [siteConfig.youtubeUrl, siteConfig.facebookUrl],
    },
  };

  return (
    <Layout title="About" description={siteConfig.description}>
      <SeoJsonLd data={schema} />
      <header className={styles.pageHero}>
        <div className="container">
          <span className={styles.kicker}>About the Platform</span>
          <Heading as="h1">From Mathematics to Real Engineering Systems</Heading>
          <p>Mod's Engineering Mathematics มุ่งอธิบายคณิตศาสตร์วิศวกรรมให้เห็นความหมาย ความเชื่อมโยง และการนำไปใช้จริง</p>
        </div>
      </header>
      <main className={styles.section}>
        <div className="container">
          <div className={styles.introGrid}>
            <article>
              <Heading as="h2">เป้าหมายของเรา</Heading>
              <p>เว็บไซต์นี้พัฒนาขึ้นเพื่อเป็นแหล่งอ้างอิง Engineering Mathematics ภาษาไทยที่มีโครงสร้างชัดเจน และพร้อมขยายเนื้อหาภาษาอังกฤษสำหรับผู้เรียนทั่วโลก</p>
              <p>เนื้อหาครอบคลุม Calculus, Linear Algebra, Differential Equations, Laplace Transform, Signals & Systems, Mathematical Modeling, Control Systems และ Electrical Engineering Applications</p>
              <Heading as="h2">แนวทางการสอน</Heading>
              <p>ทุกบทเรียนใช้กรอบ MOD 4-Step: Meaning → Definition → Technique → Engineering เพื่อให้สูตรไม่ถูกแยกออกจากความหมายและระบบที่นำไปใช้</p>
              <Link className="button button--primary" to="/learn/">Explore Knowledge Hub</Link>
            </article>
            <aside className={styles.panel}>
              <h2>Connect</h2>
              <p>ติดตามบทเรียน วิดีโอ และประกาศเนื้อหาใหม่ผ่านช่องทางทางการของแบรนด์</p>
              <div className={styles.socials}>
                <Link className="button button--secondary" href={siteConfig.youtubeUrl}>YouTube</Link>
                <Link className="button button--secondary" href={siteConfig.facebookUrl}>Facebook</Link>
              </div>
              <hr />
              <h3>Contact</h3>
              <p>ช่องทางอีเมลจะเพิ่มภายหลังเมื่อกำหนดอีเมลธุรกิจอย่างเป็นทางการแล้ว</p>
            </aside>
          </div>
        </div>
      </main>
    </Layout>
  );
}
