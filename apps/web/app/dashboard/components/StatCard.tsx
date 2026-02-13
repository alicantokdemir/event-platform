import { styles } from '../styles';

type Props = {
  title: string;
  value: string;
};

export function StatCard({ title, value }: Props) {
  return (
    <div style={styles.card}>
      <div style={styles.cardLabel}>{title}</div>
      <div style={styles.cardValue}>{value}</div>
    </div>
  );
}
