'use client';

import 'bootstrap/dist/css/bootstrap.min.css';

const ContactPage = () => {
  return (
    <div className="container mt-5">
      <div className="row mb-5">
        <div className="col-12">
          <div className="bg-primary text-white p-4 rounded shadow">
            <h1 className="text-center">Контакты</h1>
          </div>
        </div>
      </div>
      
      <div className="row justify-content-center mb-5">
        <div className="col-lg-10 col-md-12">
          <div className="card shadow mb-4">
            <div className="card-body p-4">
              <p className="lead mb-4">
                Есть вопросы или предложения? Мы всегда рады вашему обращению!
                Свяжитесь с нами любым удобным для вас способом:
              </p>
              
              <div className="row mb-4">
                <div className="col-md-6 mb-4 mb-md-0">
                  <div className="card h-100 text-center">
                    <div className="card-body">
                      <i className="bi bi-envelope-fill text-primary mb-3" style={{ fontSize: '2rem' }}></i>
                      <h4 className="card-title h5">Email</h4>
                      <a href="mailto:support@travelmarathon.ru" className="card-text d-block text-decoration-none">
                        support@travelmarathon.ru
                      </a>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="card mb-4">
                <div className="card-header bg-primary text-white">
                  <h2 className="h5 mb-0">Обратная связь</h2>
                </div>
                <div className="card-body">
                  <form>
                    <div className="mb-3">
                      <label htmlFor="name" className="form-label">Ваше имя</label>
                      <input type="text" className="form-control" id="name" placeholder="Введите ваше имя" />
                    </div>
                    
                    <div className="mb-3">
                      <label htmlFor="email" className="form-label">Email</label>
                      <input type="email" className="form-control" id="email" placeholder="Введите ваш email" />
                    </div>
                    
                    <div className="mb-3">
                      <label htmlFor="message" className="form-label">Сообщение</label>
                      <textarea className="form-control" id="message" rows={4} placeholder="Введите ваше сообщение"></textarea>
                    </div>
                    
                    <button type="submit" className="btn btn-primary">Отправить</button>
                  </form>
                </div>
              </div>
              
              <div className="card bg-light">
                <div className="card-body text-center">
                  <p className="card-text mb-0">
                    Мы ценим ваше мнение и всегда открыты для предложений по улучшению сервиса.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
