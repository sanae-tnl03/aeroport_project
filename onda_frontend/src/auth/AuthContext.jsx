import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Vérifier l'authentification au chargement
  useEffect(() => {
    const checkAuth = () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (storedToken && storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          
          // Vérifier si le token n'est pas expiré
          if (isTokenValid(storedToken)) {
            setToken(storedToken);
            setUser(userData);
            setIsAuthenticated(true);
          } else {
            console.log('Token expiré, déconnexion automatique');
            logout();
          }
        } catch (error) {
          console.error('Erreur lors de la récupération des données utilisateur:', error);
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Fonction pour vérifier si le token est encore valide
  const isTokenValid = (tokenToCheck) => {
    try {
      if (!tokenToCheck) return false;
      
      const payload = JSON.parse(atob(tokenToCheck.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      return payload.exp > currentTime;
    } catch (error) {
      return false;
    }
  };

  // Fonction de connexion compatible avec les deux formats d'appel
  const login = async (usernameOrUserData, passwordOrToken) => {
    // Si appelé avec userData et token (depuis ServiceDetails modifié)
    if (typeof usernameOrUserData === 'object' && passwordOrToken && typeof passwordOrToken === 'string') {
      const userData = usernameOrUserData;
      const userToken = passwordOrToken;
      
      // Stocker dans localStorage
      localStorage.setItem('token', userToken);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Mettre à jour l'état
      setToken(userToken);
      setUser(userData);
      setIsAuthenticated(true);
      
      return { success: true, message: 'Connexion réussie' };
    }
    
    // Sinon, format original avec username/password
    const username = usernameOrUserData;
    const password = passwordOrToken;
    
    try {
      setLoading(true);
      
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        const { token: userToken, user: userData } = data;
        
        // Stocker dans localStorage
        localStorage.setItem('token', userToken);
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Mettre à jour l'état
        setToken(userToken);
        setUser(userData);
        setIsAuthenticated(true);
        
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      return { success: false, message: 'Erreur de connexion au serveur' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  const getAuthHeaders = () => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Fonction pour rafraîchir les données utilisateur
  const refreshUser = async () => {
    if (!token) return false;
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/profile', {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        return true;
      } else if (response.status === 401) {
        logout();
        return false;
      }
    } catch (error) {
      console.error('Erreur lors du rafraîchissement du profil:', error);
    }
    
    return false;
  };

  // Fonction pour vérifier si l'utilisateur a les permissions
  const hasPermission = (requiredRole) => {
    if (!user) return false;
    
    const roles = {
      'admin': 3,
      'operator': 2,
      'user': 1
    };
    
    const userLevel = roles[user.role] || 0;
    const requiredLevel = roles[requiredRole] || 0;
    
    return userLevel >= requiredLevel;
  };

  const value = {
    isAuthenticated,
    user,
    token,
    loading,
    login,
    logout,
    getAuthHeaders,
    refreshUser,
    hasPermission,
    isTokenValid: () => isTokenValid(token)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};



