import { AppRouter } from './routes';
import { AuthProvider } from './context/AuthContext';
import { ClassProvider } from './context/ClassContext';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <ClassProvider>
        <AppRouter />
      </ClassProvider>
    </AuthProvider>
  );
}

export default App;
