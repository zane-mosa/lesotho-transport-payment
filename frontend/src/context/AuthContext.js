// context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(localStorage.getItem('token'));

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    const loadUser = async () => {
        try {
            const response = await authService.getProfile();
            setUser(response.data.user);
        } catch (error) {
            console.error('Failed to load user:', error);
            logout();
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            loadUser();
        } else {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    const login = async (credentials) => {
        try {
            const response = await authService.login(credentials);
            const { token, user } = response.data;
            localStorage.setItem('token', token);
            setToken(token);
            setUser(user);
            return { success: true, user };
        } catch (error) {
            return { 
                success: false, 
                error: error.response?.data?.error || 'Login failed' 
            };
        }
    };

    const register = async (userData) => {
        try {
            const response = await authService.register(userData);
            const { token, user } = response.data;
            localStorage.setItem('token', token);
            setToken(token);
            setUser(user);
            return { success: true, user };
        } catch (error) {
            return { 
                success: false, 
                error: error.response?.data?.error || 'Registration failed' 
            };
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};