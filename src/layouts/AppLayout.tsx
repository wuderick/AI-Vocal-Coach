import { Outlet } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Container } from '../components/ui/Container';

export function AppLayout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column' }}>
      <Header />
      <main style={{ flex: 1, padding: 'var(--page-padding)' }}>
        <Container>
          <Outlet />
        </Container>
      </main>
      <Footer />
    </div>
  );
}
