import React from 'react';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import styles from './catalog.module.css';

export default function WorksheetGeneratorPage(): React.JSX.Element {
  return (
    <Layout title="Engineering Math Worksheet Generator" description="สถาปัตยกรรมเตรียมพร้อมสำหรับระบบสร้างใบงานคณิตศาสตร์วิศวกรรม">
      <header className={styles.pageHero}>
        <div className="container">
          <span className={styles.kicker}>Future Integration</span>
          <Heading as="h1">Engineering Math Worksheet Generator</Heading>
          <p>พื้นที่เตรียมพร้อมสำหรับสร้าง Worksheet, Quiz, Problem Set และ Worked Examples อย่างปลอดภัยผ่าน Cloudflare Worker ในอนาคต</p>
        </div>
      </header>
      <main className={styles.section}>
        <div className="container">
          <div className={styles.notice}>Coming Soon — แบบฟอร์มนี้เป็นภาพโครงสร้างฟังก์ชันในอนาคตและยังไม่ส่งข้อมูลหรือเรียก AI API</div>
          <div className={styles.generator} style={{marginTop: '1.5rem'}}>
            <form className={styles.panel + ' ' + styles.formGrid} aria-label="ตัวอย่างการตั้งค่าใบงาน">
              <label>Subject<select disabled><option>Calculus</option></select></label>
              <label>Topic<select disabled><option>Derivative from Definition</option></select></label>
              <label>Difficulty<select disabled><option>Foundation</option></select></label>
              <label>Number of Questions<input disabled type="number" value="10" readOnly /></label>
              <label>Solution<select disabled><option>With solution</option></select></label>
              <button className={styles.disabledButton} type="button" disabled>Create Worksheet — Coming Soon</button>
            </form>
            <section className={styles.preview}>
              <Heading as="h2">Planned secure architecture</Heading>
              <ol>
                <li>ตรวจสอบและจำกัดข้อมูลนำเข้า</li>
                <li>ยืนยันตัวตนและกำหนดโควตาการใช้งาน</li>
                <li>เรียก AI ผ่าน Cloudflare Worker เท่านั้น</li>
                <li>เก็บ API key เป็น Server-side secret</li>
                <li>ตรวจรูปแบบสมการและสร้างไฟล์ส่งออก</li>
              </ol>
              <p><strong>ไม่มี API key หรือ Payment secret อยู่ใน Front-end source code</strong></p>
            </section>
          </div>
        </div>
      </main>
    </Layout>
  );
}
