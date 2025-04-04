'use client';

import { useRouter } from 'next/navigation'; // NextJs Router for navigation
import 'bootstrap/dist/css/bootstrap.min.css'; // Bootstrap styles

const Layout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();

  return (
    <html lang="ru">
      <body className="d-flex flex-column min-vh-100">
        {/* Header */}
        <header className="bg-dark text-white py-3">
          <div className="container d-flex justify-content-between align-items-center">
          <img 
                src="https://i.imgur.com/QmbsRKv.png"  
                alt="Логотип сайта"
                style={{ height: '70px', marginRight: '5px' }}
              />
            <h1 className="fs-3">Марафоны и путешествия</h1>
            <div>
              <button
                className="btn btn-outline-light rounded me-2"
                onClick={() => router.push('/')}
              >
                Карта Марафонов
              </button>
              <button
                className="btn btn-outline-light rounded me-2"
                onClick={() => router.push('/marathons')}
              >
                Список Марафонов
              </button>
              <button
                className="btn btn-outline-light rounded me-2"
                onClick={() => router.push('/about')}
              >
                О проекте
              </button>
              <button
                className="btn btn-outline-light rounded me-2"
                onClick={() => router.push('/contact')}
              >
                Контакты
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-grow-1">{children}</main>

        {/* Footer */}
        <footer className="bg-dark text-white text-center py-3 mt-auto">
          <p>© 2025 Путешествия и Марафоны | Все права защищены</p>
        </footer>
      </body>
    </html>
  );
};

export default Layout;