import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5010/api';

const dashboardService = {
  getDashboardStats: async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/dashboard/stats`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  }
};

export default dashboardService;
