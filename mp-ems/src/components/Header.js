const Header = ({ title }) => {
  return (
    <div className="header">
      <h1>{title}</h1>
      <button className="logout-btn">Logout</button>
    </div>
  );
};

export default Header;