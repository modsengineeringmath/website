import React from 'react';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import CatalogCard from '../../components/CatalogCard';
import SeoJsonLd from '../../components/SeoJsonLd';
import {courses} from '../../config/catalog';
import {siteConfig} from '../../config/site';
import styles from '../catalog.module.css';

export default function CoursesPage(): React.JSX.Element {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Online Courses',
    itemListElement: courses.map((course, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Course',
        name: course.title,
        description: course.description,
        provider: {'@type': 'Organization', name: siteConfig.name},
      },
    })),
  };

  return (
    <Layout title="Online Courses" description="หลักสูตรออนไลน์คณิตศาสตร์วิศวกรรมและระบบควบคุม">
      <SeoJsonLd data={schema} />
      <header className={styles.pageHero}>
        <div className="container">
          <span className={styles.kicker}>Online Learning</span>
          <Heading as="h1">Online Courses</Heading>
          <p>หลักสูตรที่วางลำดับจากความหมายและนิยาม ไปสู่เทคนิคการคำนวณและระบบวิศวกรรมจริง รองรับ Free, YouTube Member, Premium และ Course access ในอนาคต</p>
        </div>
      </header>
      <main className={styles.section}>
        <div className="container">
          <div className={styles.notice}>
            ระบบชำระเงินและสมาชิกยังไม่เปิดใช้งาน รายการหลักสูตรจึงแสดงสถานะ Coming Soon อย่างชัดเจน
          </div>
          <div className={styles.grid} style={{marginTop: '1.5rem'}}>
            {courses.map((course) => (
              <div id={course.slug} key={course.slug}>
                <CatalogCard
                  eyebrow={course.subject}
                  title={course.title}
                  description={course.description}
                  meta={[course.level, `${course.lessons} lessons`, course.duration]}
                  href={course.slug === 'laplace-transform' ? '/courses/laplace-transform' : `/courses#${course.slug}`}
                  status={course.access}
                  actionLabel={course.slug === 'laplace-transform' ? 'View Course' : 'View Details'}
                />
              </div>
            ))}
          </div>
        </div>
      </main>
    </Layout>
  );
}
