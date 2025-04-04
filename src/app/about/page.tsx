'use client';

import 'bootstrap/dist/css/bootstrap.min.css';

const AboutPage = () => {
  return (
    <div className="container mt-5">
      <div className="row mb-5">
        <div className="col-12">
          <div className="bg-primary text-white p-4 rounded shadow">
            <h1 className="text-center">О проекте Путешествия и марафоны</h1>
          </div>
        </div>
      </div>
      
      <div className="row">
        <div className="col-lg-10 col-md-12 mx-auto">
          <div className="card shadow mb-5">
            <div className="card-body p-4">
              <p className="lead mb-4">
                <strong className="text-primary">Путешествия и марафоны</strong> — это ваш путеводитель по марафонам России. 
                Исследуйте маршруты марафонов, детали и достопримечательности поблизости — все в одном месте!
              </p>
              
              <div className="mb-4">
                <h2 className="text-primary h4 mb-3">Наша миссия</h2>
                <p>
                  Мы стремимся объединить любителей бега и путешествий, предоставляя им актуальную
                  информацию о марафонах в различных городах России. Наш проект помогает
                  бегунам планировать свои поездки, знакомиться с местами проведения
                  соревнований и открывать для себя новые туристические направления.
                </p>
              </div>
              
              <div className="mb-4">
                <h2 className="text-primary h4 mb-3">Что мы предлагаем</h2>
                <ul className="list-group list-group-flush mb-3">
                  <li className="list-group-item">Подробные описания марафонов в городах России</li>
                  <li className="list-group-item">Интерактивные карты с маршрутами забегов</li>
                  <li className="list-group-item">Информацию о достопримечательностях вблизи мест проведения соревнований</li>
                  <li className="list-group-item">Рекомендации по размещению и питанию для участников</li>
                  <li className="list-group-item">Советы по подготовке к забегам</li>
                </ul>
              </div>
              
              <div>
                <h2 className="text-primary h4 mb-3">Для кого этот проект</h2>
                <p>
                  Наш сайт будет полезен как опытным марафонцам, так и новичкам,
                  которые только начинают свой путь в мире бега на длинные дистанции.
                  Также мы предоставляем ценную информацию для любителей активного туризма,
                  желающих совместить участие в марафоне с путешествием и знакомством с новыми городами.
                </p>
              </div>
              
              <hr className="my-4" />
              
              <div className="text-center">
                <p className="mb-0 text-muted">
                  Присоединяйтесь к нам в путешествии по марафонам России!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
