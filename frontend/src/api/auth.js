import api from './index';

/**
 * @param {string} email
 * @param {string} password 
 * @returns {Promise<object>}
 */
export const loginUser = async (email, password) => {
  try {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<object>}
 */
export const signupUser = async (email, password) => {
  try {
    const response = await api.post('/auth/signup', { email, password });
    return response.data;
  } catch (error) {
    throw error;
  }
};