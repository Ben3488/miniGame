import { Routes, Route, Link } from 'react-router-dom';

function Home() {
  return (
    <div className="home-container">
      <header className="header">
        <h1>BOARD GAMES</h1>
        <div className="subtitle">經典對弈 ‧ 智慧傳承</div>
      </header>
      
      <div className="games-grid">
        <Link to="/gomoku" className="game-card gomoku">
          <div className="card-content">
            <div className="icon-container">⚫⚪</div>
            <h2 className="game-title">五子棋</h2>
            <p className="game-desc">極致簡約的五子連線對戰，挑戰你的佈局策略與洞察力。</p>
            <div className="play-btn">開始遊戲</div>
          </div>
        </Link>
        {/* We will add other games here as we migrate them */}
        <Link to="/sanguosha" className="game-card sanguosha">
          <div className="card-content">
            <div className="icon-container">殺</div>
            <h2 className="game-title">三國殺</h2>
            <p className="game-desc">主公、忠臣、反賊、內奸，運籌帷幄的史詩級身分局對戰。</p>
            <div className="play-btn">進入遊戲</div>
          </div>
        </Link>
      </div>
    </div>
  );
}

function Placeholder({ title }) {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2>{title}</h2>
      <p>正在開發中...</p>
      <Link to="/" style={{ color: '#38bdf8' }}>返回大廳</Link>
    </div>
  );
}

function App() {
  return (
    <div className="app-root">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/gomoku" element={<Placeholder title="五子棋" />} />
        <Route path="/sanguosha" element={<Placeholder title="三國殺" />} />
      </Routes>
    </div>
  );
}

export default App;
