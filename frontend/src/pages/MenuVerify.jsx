import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";

export default function MenuVerifyPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("loading"); // loading, success, error
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const verifyQR = async () => {
      const table = searchParams.get("table");
      const token = searchParams.get("token");

      if (!table || !token) {
        setStatus("error");
        setError({
          code: "MISSING_PARAMS",
          message: "Invalid QR code. Missing parameters.",
        });
        return;
      }

      try {
        const apiUrl =
          import.meta.env.VITE_API_URL || "http://localhost:4000/api";
        const response = await axios.get(`${apiUrl}/menu/verify`, {
          params: { table, token },
        });

        if (response.data.valid) {
          setStatus("success");
          setData(response.data.table);
        } else {
          setStatus("error");
          setError(response.data);
        }
      } catch (err) {
        setStatus("error");
        setError({
          code: err.response?.data?.code || "NETWORK_ERROR",
          message:
            err.response?.data?.message ||
            "Unable to verify QR code. Please try again.",
        });
      }
    };

    verifyQR();
  }, [searchParams]);

  if (status === "loading") {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.spinner}></div>
          <h2 style={styles.title}>Verifying QR Code...</h2>
          <p style={styles.text}>Please wait</p>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div style={styles.container}>
        <div style={{ ...styles.card, borderTop: "4px solid #27ae60" }}>
          <div style={styles.successIcon}>✓</div>
          <h1 style={{ ...styles.title, color: "#27ae60" }}>QR Code Valid!</h1>
          <h2 style={styles.subtitle}>
            {data?.name || `Table ${data?.number}`}
          </h2>

          <div style={styles.infoBox}>
            <p style={styles.infoText}>Welcome to our restaurant!</p>
            <p style={styles.infoText}>Your table has been verified.</p>
          </div>

          <div style={styles.nextSteps}>
            <h3 style={styles.nextStepsTitle}>Next Steps:</h3>
            <ol style={styles.stepsList}>
              <li>Browse our menu</li>
              <li>Place your order</li>
              <li>Enjoy your meal!</li>
            </ol>
          </div>

          <button
            style={styles.button}
            onClick={() => alert("Menu page coming soon!")}
          >
            View Menu
          </button>

          <p style={styles.footer}>Table: {data?.number}</p>
        </div>
      </div>
    );
  }

  // Error state
  return (
    <div style={styles.container}>
      <div style={{ ...styles.card, borderTop: "4px solid #e74c3c" }}>
        <div style={styles.errorIcon}>✕</div>
        <h1 style={{ ...styles.title, color: "#e74c3c" }}>Invalid QR Code</h1>

        <div style={styles.errorBox}>
          <p style={styles.errorCode}>Error Code: {error?.code}</p>
          <p style={styles.errorMessage}>{error?.message}</p>
        </div>

        <div style={styles.helpBox}>
          <h3 style={styles.helpTitle}>What to do?</h3>
          <ul style={styles.helpList}>
            <li>Ask staff for a new QR code</li>
            <li>Make sure you scanned the correct code</li>
            <li>Check if the table is active</li>
          </ul>
        </div>

        <button
          style={{ ...styles.button, backgroundColor: "#e74c3c" }}
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    padding: "20px",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  card: {
    backgroundColor: "white",
    borderRadius: "16px",
    padding: "40px",
    maxWidth: "500px",
    width: "100%",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
    textAlign: "center",
  },
  spinner: {
    width: "50px",
    height: "50px",
    margin: "0 auto 20px",
    border: "4px solid #f3f3f3",
    borderTop: "4px solid #667eea",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  successIcon: {
    width: "80px",
    height: "80px",
    margin: "0 auto 20px",
    backgroundColor: "#27ae60",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "48px",
    color: "white",
    fontWeight: "bold",
  },
  errorIcon: {
    width: "80px",
    height: "80px",
    margin: "0 auto 20px",
    backgroundColor: "#e74c3c",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "48px",
    color: "white",
    fontWeight: "bold",
  },
  title: {
    fontSize: "28px",
    fontWeight: "bold",
    margin: "0 0 10px 0",
    color: "#2c3e50",
  },
  subtitle: {
    fontSize: "20px",
    color: "#7f8c8d",
    margin: "0 0 30px 0",
  },
  text: {
    color: "#7f8c8d",
    fontSize: "16px",
  },
  infoBox: {
    backgroundColor: "#e8f8f5",
    borderRadius: "8px",
    padding: "20px",
    marginBottom: "30px",
  },
  infoText: {
    margin: "5px 0",
    color: "#27ae60",
    fontSize: "16px",
  },
  errorBox: {
    backgroundColor: "#fadbd8",
    borderRadius: "8px",
    padding: "20px",
    marginBottom: "20px",
  },
  errorCode: {
    fontWeight: "bold",
    color: "#c0392b",
    marginBottom: "10px",
  },
  errorMessage: {
    color: "#e74c3c",
    fontSize: "16px",
    lineHeight: "1.5",
  },
  nextSteps: {
    textAlign: "left",
    marginBottom: "30px",
    backgroundColor: "#f8f9fa",
    padding: "20px",
    borderRadius: "8px",
  },
  nextStepsTitle: {
    fontSize: "18px",
    color: "#2c3e50",
    marginBottom: "10px",
  },
  stepsList: {
    margin: "0",
    paddingLeft: "20px",
    color: "#7f8c8d",
  },
  helpBox: {
    textAlign: "left",
    marginBottom: "30px",
    backgroundColor: "#fff3cd",
    padding: "20px",
    borderRadius: "8px",
  },
  helpTitle: {
    fontSize: "18px",
    color: "#856404",
    marginBottom: "10px",
  },
  helpList: {
    margin: "0",
    paddingLeft: "20px",
    color: "#856404",
  },
  button: {
    backgroundColor: "#27ae60",
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "15px 40px",
    fontSize: "18px",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "all 0.3s",
    width: "100%",
  },
  footer: {
    marginTop: "20px",
    color: "#95a5a6",
    fontSize: "14px",
  },
};

// Add CSS animation for spinner
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  button:hover {
    opacity: 0.9;
    transform: translateY(-2px);
  }
  button:active {
    transform: translateY(0);
  }
`;
document.head.appendChild(styleSheet);
