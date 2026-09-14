import React from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

export default function NotFound(): React.JSX.Element {
  return (
    <Layout title="Page Not Found">
      <main className="container" style={{padding: '6rem 1rem', textAlign: 'center'}}>
        <p style={{fontWeight: 800, color: 'var(--ifm-color-primary)'}}>404</p>
        <Heading as="h1">ไม่พบหน้าที่ต้องการ</Heading>
        <p>เนื้อหาอาจถูกย้าย หรือบทเรียนนี้ยังอยู่ระหว่างการพัฒนา</p>
        <Link className="button button--primary" to="/learn/">กลับไปยัง Knowledge Hub</Link>
      </main>
    </Layout>
  );
}
