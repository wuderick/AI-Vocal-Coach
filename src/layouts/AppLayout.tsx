import { Outlet } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

export function AppLayout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column' }}>
      <Header />
      <main style={{ flex: 1, padding: 'var(--spacing-medium)' }}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
