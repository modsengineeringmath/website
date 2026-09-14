import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import SeoJsonLd from '../components/SeoJsonLd';
import {courses} from '../config/catalog';
import {siteConfig} from '../config/site';
import styles from './index.module.css';

const knowledgeAreas = [
  ['Calculus', 'อนุพันธ์ ปริพันธ์ และการเปลี่ยนแปลง', '/learn/calculus/derivative-by-definition'],
  ['Linear Algebra', 'เมทริกซ์ ระบบสมการ และ eigenvalues', '/learn/linear-algebra/inverse-matrix'],
  ['Differential Equations', 'แบบจำลองการเปลี่ยนแปลงของระบบ', '/learn/differential-equations/introduction'],
  ['Laplace Transform', 'ย้ายปัญหาจากเวลาไปสู่โดเมน s', '/learn/laplace/introduction'],
  ['Engineering Modeling', 'สร้างสมการจากวงจร กลศาสตร์ และมอเตอร์', '/learn/modeling/dc-motor'],
  ['Control Systems', 'การตอบสนอง เสถียรภาพ และ feedback', '/learn/control/first-order-system'],
  ['Signals & Systems', 'สัญญาณมาตรฐานและระบบ LTI', '/learn/signals/standard-signals'],
  ['Electrical Applications', 'เชื่อมคณิตศาสตร์กับระบบไฟฟ้าจริง', '/learn/electrical/rlc-circuit'],
] as const;

export default function Home(): React.JSX.Element {
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    inLanguage: ['th', 'en'],
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteConfig.url}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <Layout title={siteConfig.tagline} description={siteConfig.description}>
      <SeoJsonLd data={websiteSchema} />
      <header className={styles.hero}>
        <div className="container">
          <div className={styles.heroGrid}>
            <div>
              <span className={styles.kicker}>Engineering Knowledge Platform</span>
              <Heading as="h1">{siteConfig.name}</Heading>
              <p className={styles.lead}>Engineering Mathematics Made Clear</p>
              <p className={styles.sublead}>
                From Calculus and Linear Algebra to Laplace Transform,
                Mathematical Modeling, Control Systems, and real engineering applications.
              </p>
              <p className={styles.thaiLead}>
                เรียนคณิตศาสตร์ให้เห็นความหมาย วิธีคำนวณ และเส้นทางที่นำไปใช้กับระบบวิศวกรรมจริง
              </p>
              <div className={styles.actions}>
                <Link className="button button--primary button--lg" to="/learn/">Start Learning</Link>
                <Link className="button button--secondary button--lg" to="/courses">Explore Courses</Link>
                <Link className="button button--outline button--lg" href={siteConfig.youtubeUrl}>Watch on YouTube</Link>
              </div>
            </div>
            <div className={styles.formulaPanel} aria-label="เส้นทางจากคณิตศาสตร์สู่ระบบวิศวกรรม">
              <span>Function</span><b>→</b><span>Derivative</span><b>→</b>
              <span>Differential Equation</span><b>→</b><span>Laplace Transform</span><b>→</b>
              <span>Transfer Function</span><b>→</b><span>Engineering System</span>
            </div>
          </div>
        </div>
      </header>

      <main>
        <section className={styles.section}>
          <div className="container">
            <div className={styles.sectionHeading}>
              <span>Knowledge Areas</span>
              <Heading as="h2">แผนที่การเรียนรู้จากพื้นฐานสู่การประยุกต์</Heading>
            </div>
            <div className={styles.topicGrid}>
              {knowledgeAreas.map(([title, description, href], index) => (
                <Link className={styles.topicCard} to={href} key={title}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <h3>{title}</h3>
                  <p>{description}</p>
                  <strong>Explore topic →</strong>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className={clsx(styles.section, styles.darkSection)}>
          <div className="container">
            <div className={styles.sectionHeading}>
              <span>MOD 4-Step Engineering Mathematics</span>
              <Heading as="h2">เรียนให้เข้าใจ ไม่ใช่เพียงจำสูตร</Heading>
            </div>
            <div className={styles.steps}>
              {[
                ['01', 'Meaning', 'สิ่งนี้คืออะไร และเรียนไปเพื่ออะไร'],
                ['02', 'Definition', 'สร้างความเข้าใจจากนิยามและหลักการ'],
                ['03', 'Technique', 'ฝึกสูตร วิธีคำนวณ และโจทย์ต้นแบบ'],
                ['04', 'Engineering', 'เชื่อมไปยังปัญหาและระบบจริง'],
              ].map(([number, title, text]) => (
                <article key={number}><b>{number}</b><h3>{title}</h3><p>{text}</p></article>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className="container">
            <div className={styles.sectionHeading}>
              <span>Featured Lessons</span>
              <Heading as="h2">เริ่มจากโจทย์ต้นแบบที่ต่อยอดได้</Heading>
            </div>
            <div className={styles.featureGrid}>
              <article>
                <div className={styles.math}>f'(x)=lim Δx→0</div>
                <h3>Derivative from Definition</h3>
                <p>เข้าใจอัตราการเปลี่ยนแปลงจากนิยาม ก่อนใช้กฎอนุพันธ์</p>
                <Link to="/learn/calculus/derivative-by-definition">อ่านบทเรียน →</Link>
              </article>
              <article>
                <div className={styles.math}>A⁻¹A=I</div>
                <h3>Inverse Matrix</h3>
                <p>เชื่อมการหาเมทริกซ์ผกผันกับการแก้ระบบสมการ</p>
                <Link to="/learn/linear-algebra/inverse-matrix">อ่านบทเรียน →</Link>
              </article>
              <article>
                <div className={styles.math}>F(s)=∫f(t)e⁻ˢᵗdt</div>
                <h3>Laplace Transform</h3>
                <p>แปลงสมการเชิงอนุพันธ์ให้เป็นปัญหาพีชคณิต</p>
                <Link to="/learn/laplace/introduction">อ่านบทเรียน →</Link>
              </article>
            </div>
          </div>
        </section>

        <section className={clsx(styles.section, styles.courseBand)}>
          <div className="container">
            <div className={styles.splitHeading}>
              <div>
                <span>Online Courses</span>
                <Heading as="h2">หลักสูตรที่กำลังพัฒนา</Heading>
              </div>
              <Link to="/courses">ดูหลักสูตรทั้งหมด →</Link>
            </div>
            <div className={styles.coursePreview}>
              {courses.slice(0, 3).map((course) => (
                <article key={course.slug}>
                  <small>{course.subject}</small>
                  <h3>{course.title}</h3>
                  <p>{course.description}</p>
                  <span>{course.access}</span>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className="container">
            <div className={styles.cta}>
              <div>
                <span>Teaching Resources</span>
                <Heading as="h2">เอกสาร ชุดโจทย์ และเครื่องมือสำหรับผู้เรียนและผู้สอน</Heading>
                <p>โครงสร้างพร้อมรองรับ Digital Products และ AI Worksheet Generator ในอนาคต โดยไม่เปิดเผย API key ฝั่งผู้ใช้</p>
              </div>
              <div className={styles.actions}>
                <Link className="button button--primary button--lg" to="/resources">Explore Resources</Link>
                <Link className="button button--secondary button--lg" to="/worksheet-generator">Worksheet Generator</Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
