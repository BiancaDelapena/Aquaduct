import {use, useEffect, useState} from "react";

function App() { 
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api')
      .then(response => response.json())
      .then(data => setMessage(data.message))
      .catch(error => console.error('Error fetching message:', error));
  }, []);

  return ( 
    <div>
      <h1>Message from backend</h1>
      <p>{message || 'loading..'}</p>
    </div>
  );
}

export default App;
