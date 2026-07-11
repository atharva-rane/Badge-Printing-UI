import "../styles/home.css";
import VolunteerAttendance from "./VolunteerAttendance";

const Home = () => {
  return (
    <div className="home-container">
      <div className="home-card">
        <h1>Welcome to Utsav Badge Printing 🎉</h1>

        <p>You have successfully logged in.</p>

        <VolunteerAttendance />

        <button
          onClick={() => {
            localStorage.removeItem("token");
            window.location.href = "/";
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Home;
