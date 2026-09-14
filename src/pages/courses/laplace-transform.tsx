import React from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import SeoJsonLd from '../../components/SeoJsonLd';
import {siteConfig} from '../../config/site';
import styles from '../catalog.module.css';

export default function LaplaceCourse(): React.JSX.Element {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: 'Complete Laplace Transform',
    description: 'หลักสูตร Laplace Transform สำหรับนักศึกษาวิศวกรรม',
    provider: {'@type': 'Organization', name: siteConfig.name, url: siteConfig.url},
    educationalLevel: 'University',
    inLanguage: 'th',
  };

  return (
    <Layout title="Complete Laplace Transform" description="หลักสูตร Laplace Transform จากพื้นฐานสู่การประยุกต์ทางวิศวกรรม">
      <SeoJsonLd data={schema} />
      <header className={styles.pageHero}>
        <div className="container">
          <span className={styles.kicker}>Course • Coming Soon</span>
          <Heading as="h1">Complete Laplace Transform</Heading>
          <p>จากนิยามและตารางแปลง สู่ Inverse Laplace, Differential Equations, Circuit Models และ Transfer Functions</p>
        </div>
      </header>
      <main className={styles.section}>
        <div className="container">
          <div className={styles.introGrid}>
            <div>
              <Heading as="h2">Learning Outcomes</Heading>
              <ul>
                <li>อธิบายความหมายของ Laplace Transform และขอบเขตการใช้งานได้</li>
                <li>ใช้สมบัติและตารางแปลงอย่างมีเหตุผล ไม่จำสูตรอย่างโดดเดี่ยว</li>
                <li>หา Inverse Laplace ด้วย Partial Fractions ได้</li>
                <li>แก้สมการเชิงอนุพันธ์และวิเคราะห์แบบจำลองวงจรได้</li>
              </ul>
              <Heading as="h2">Course Contents</Heading>
              <ol className={styles.curriculum}>
                <li>Meaning, definition and convergence</li>
                <li>Standard transforms and properties</li>
                <li>Unit step and time shifting</li>
                <li>Partial fractions and inverse transforms</li>
                <li>Solving differential equations</li>
                <li>RC, RL and RLC circuit applications</li>
                <li>Transfer functions and control-system bridge</li>
              </ol>
              <Heading as="h2">Sample Lesson</Heading>
              <p>ทดลองเรียนบทนำได้ฟรีใน Knowledge Hub</p>
              <Link className="button button--secondary" to="/learn/laplace/introduction">Open Sample Lesson</Link>
            </div>
            <aside className={styles.panel}>
              <h2>Course information</h2>
              <div className={styles.meta}>
                <span>24 lessons</span><span>12 hours</span><span>TH</span>
              </div>
              <p><strong>Instructor:</strong> Mod's Engineering Mathematics</p>
              <p><strong>Level:</strong> Foundation → Intermediate</p>
              <p><strong>Access:</strong> COURSE</p>
              <p className={styles.notice}>ระบบลงทะเบียนและชำระเงินกำลังพัฒนา</p>
              <button className={styles.disabledButton} disabled aria-disabled="true">Enrollment Coming Soon</button>
            </aside>
          </div>
        </div>
      </main>
    </Layout>
  );
}
