import "./../styles/Loader.css";

const Loader = ({ loading, progress = null, text = "Loading..." }) => {
  if (!loading) return null;

  return (
    <div className="loader-overlay">
      <div className="loader-container">
        <div className="loader-spinner"></div>

        <h3 className="loader-title">{text}</h3>

        {progress !== null && (
          <>
            <div className="loader-progress-bar">
              <div
                className="loader-progress-fill"
                style={{
                  width: `${progress}%`,
                }}
              ></div>
            </div>

            <p className="loader-percentage">{progress}%</p>
          </>
        )}
      </div>
    </div>
  );
};

export default Loader;
