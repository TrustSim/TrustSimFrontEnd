"use client";

import Link from "next/link";
import styles from "./MobileAuth.module.css";

export default function MobileAuthIntro({ onLogin, onRegister }: { onLogin: () => void; onRegister: () => void }) {
  return <section className={styles.intro} aria-label="Giới thiệu TrustSim">
    <div className={styles.introBrand}>Trust<span>Sim</span></div>
    <div className={styles.art} aria-hidden="true"><span className={styles.orbit} /><span className={styles.blob} /><span className={styles.cut} /><span className={styles.spark} /><span className={styles.dot} /></div>
    <div className={styles.introCopy}>
      <h1>Số đẹp của bạn.<br />Giao dịch an tâm.</h1>
      <p>SIM chính chủ, ký quỹ độc lập và hợp đồng điện tử — rõ ràng ở từng bước.</p>
      <div className={styles.introActions}>
        <button type="button" onClick={onRegister}>Đăng ký</button>
        <button type="button" onClick={onLogin}>Đăng nhập</button>
      </div>
      <Link href="/" className={styles.explore}>Khám phá sàn đấu giá</Link>
    </div>
  </section>;
}
