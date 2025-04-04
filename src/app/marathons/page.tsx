'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useRouter } from 'next/navigation';
import { marathonsData } from '@/app/data/marathons';

// The tokens are available in these data elements
const AVAILABLE_TOKENS = [
  'moscow', 'saint-petersburg', 'kazan', 'sochi', 'vladivostok', 
  'ekaterinburg', 'novosibirsk', 'omsk', 'krasnoyarsk'
];

const MarathonList = () => {
  // States for filters
  const [cityFilter, setCityFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortedMarathons, setSortedMarathons] = useState([...marathonsData]);
  const itemsPerPage = 9;
  const router = useRouter();

  // Sort marathons by date when component loads
  useEffect(() => {
    // Create a copy and sort by date
    const sorted = [...marathonsData].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    setSortedMarathons(sorted);
  }, []);

  // Handle end date validation - should not be earlier than start date
  useEffect(() => {
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      setEndDate(startDate);
    }
  }, [startDate, endDate]);

  // Filter marathons based on city substring and date range
  const filteredMarathons = sortedMarathons.filter((m) => {
    // City filter – case insensitive search in location
    const cityMatch = cityFilter
      ? m.location.toLowerCase().includes(cityFilter.toLowerCase())
      : true;
    
    // Date filtering – compare if date falls between start and end (if provided)
    const marathonDate = new Date(m.date).getTime();
    const startMatch = startDate ? marathonDate >= new Date(startDate).getTime() : true;
    const endMatch = endDate ? marathonDate <= new Date(endDate).getTime() : true;
    
    return cityMatch && startMatch && endMatch;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredMarathons.length / itemsPerPage);
  const paginatedMarathons = filteredMarathons.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: any) => {
    setCurrentPage(page);
  };

  // Reset filters function
  const resetFilters = () => {
    setCityFilter('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  // Helper function to check if detailed info is available
  const hasDetailPage = (token: any) => {
    return token && AVAILABLE_TOKENS.includes(token);
  };

  // Card click handler
  const handleCardClick = (token: any) => {
    if (hasDetailPage(token)) {
      router.push(`/marathons/${token}`);
    }
  };

  return (
    <div className="container my-5">
      <h1 className="text-center mb-4">Список марафонов России</h1>

      {/* Filters */}
      <br/>
      <div className="card mb-4 shadow-sm">
        <div className="card-body">
          <form className="row g-3">
            <div className="col-md-4">
              <label htmlFor="city" className="form-label">
                Город
              </label>
              <input
                type="text"
                id="city"
                className="form-control"
                placeholder="Введите название города..."
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <label htmlFor="startDate" className="form-label">
                Начальная дата
              </label>
              <input
                type="date"
                id="startDate"
                className="form-control"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <label htmlFor="endDate" className="form-label">
                Конечная дата
              </label>
              <input
                type="date"
                id="endDate"
                className="form-control"
                value={endDate}
                min={startDate} // Prevent selecting a date earlier than start date
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="col-md-2 d-flex align-items-end">
              <button 
                type="button" 
                className="btn btn-secondary w-100" 
                onClick={resetFilters}
              >
                Сбросить
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Marathon Cards */}
      <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
        {paginatedMarathons.map((m, idx) => {
          const hasDetails = hasDetailPage(m.token);
          
          return (
            <div key={idx} className="col">
              <div 
                className="card h-100 shadow-sm" 
                style={{ cursor: hasDetails ? 'pointer' : 'default' }}
                onClick={() => hasDetails && handleCardClick(m.token)}
              >
                <img
                  src={m.logo}
                  className="card-img-top p-3"
                  alt={`${m.name} logo`}
                  style={{ height: '250px', objectFit: 'contain' }}
                />
                <div className="card-body">
                  <h5 className="card-title">
                    {hasDetails ? (
                      <Link href={`/marathons/${m.token}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        {m.name}
                      </Link>
                    ) : (
                      m.name
                    )}
                  </h5>
                  <p className="card-text">
                    <strong>Дата:</strong> {new Date(m.date).toLocaleDateString('ru-RU')}
                    <br />
                    <strong>Место:</strong> {m.location}
                    <br />
                    <strong>Дистанция:</strong> {m.distance}
                  </p>
                  <p className="card-text">{m.description}</p>
                  {hasDetails && (
                    <Link href={`/marathons/${m.token}`}>
                      <button className="btn btn-secondary">Подробнее о марафоне</button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {paginatedMarathons.length === 0 && (
          <div className="col-12">
            <div className="alert alert-warning text-center" role="alert">
              Марафоны не найдены по заданным фильтрам.
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      <nav aria-label="Pagination" className="mt-4">
        <ul className="pagination justify-content-center">
          <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
            <button
              className="page-link"
              onClick={() => handlePageChange(currentPage - 1)}
            >
              Предыдущая
            </button>
          </li>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <li
              key={page}
              className={`page-item ${currentPage === page ? 'active' : ''}`}
            >
              <button className="page-link" onClick={() => handlePageChange(page)}>
                {page}
              </button>
            </li>
          ))}
          <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
            <button
              className="page-link"
              onClick={() => handlePageChange(currentPage + 1)}
            >
              Следующая
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default MarathonList;