import styles from "./MobileAuth.module.css";

export default function AuthShowcase() {
  return <section className={`${styles.intro} auth-showcase`} aria-label="Giới thiệu TrustSim">
    <div className={styles.art} aria-hidden="true"><span className={styles.orbit} /><span className={styles.blob} /><span className={styles.cut} /><span className={styles.spark} /><span className={styles.dot} /></div>
    <div className={styles.introCopy}>
      <h2>Số đẹp của bạn.<br />Giao dịch an tâm.</h2>
      <p>SIM chính chủ, ký quỹ độc lập và hợp đồng điện tử — rõ ràng ở từng bước.</p>
    </div>
  </section>;
}
