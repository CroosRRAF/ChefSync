import axios from 'axios';
import { Food, Cuisine, FoodCategory, FoodReview, PaginatedResponse, FoodFilterParams } from '@/types/food';
import authService from './authService';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// Create authenticated API instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Food API endpoints
export const fetchFoods = async (params: FoodFilterParams): Promise<PaginatedResponse<Food>> => {
  const response = await api.get(`/food/foods/`, { params });
  return response.data;
};

export const fetchFood = async (id: number): Promise<Food> => {
  const response = await api.get(`/food/foods/${id}/`);
  return response.data;
};

export const createFood = async (formData: FormData): Promise<Food> => {
  const response = await api.post(`/food/foods/`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const updateFood = async (id: number, formData: FormData): Promise<Food> => {
  const response = await api.patch(`/food/foods/${id}/`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const deleteFood = async (id: number): Promise<void> => {
  await api.delete(`/food/foods/${id}/`);
};

// Cuisine API endpoints
export const fetchCuisines = async (params: { page?: number; search?: string }): Promise<PaginatedResponse<Cuisine>> => {
  const response = await api.get(`/food/cuisines/`, { params });
  return response.data;
};

export const fetchCuisine = async (id: number): Promise<Cuisine> => {
  const response = await api.get(`/food/cuisines/${id}/`);
  return response.data;
};

export const createCuisine = async (formData: FormData): Promise<Cuisine> => {
  const response = await api.post(`/food/cuisines/`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const updateCuisine = async (id: number, formData: FormData): Promise<Cuisine> => {
  const response = await api.patch(`/food/cuisines/${id}/`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const deleteCuisine = async (id: number): Promise<void> => {
  await api.delete(`/food/cuisines/${id}/`);
};

// Category API endpoints
export const fetchFoodCategories = async (params: { page?: number; search?: string; cuisine?: number }): Promise<PaginatedResponse<FoodCategory>> => {
  const response = await api.get(`/food/categories/`, { params });
  return response.data;
};

export const fetchFoodCategory = async (id: number): Promise<FoodCategory> => {
  const response = await api.get(`/food/categories/${id}/`);
  return response.data;
};

export const createFoodCategory = async (formData: FormData): Promise<FoodCategory> => {
  const response = await api.post(`/food/categories/`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const updateFoodCategory = async (id: number, formData: FormData): Promise<FoodCategory> => {
  const response = await api.patch(`/food/categories/${id}/`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const deleteFoodCategory = async (id: number): Promise<void> => {
  await api.delete(`/food/categories/${id}/`);
};

// Review API endpoints
export const fetchFoodReviews = async (params: { food?: number; page?: number }): Promise<PaginatedResponse<FoodReview>> => {
  const response = await api.get(`/food/reviews/`, { params });
  return response.data;
};

export const fetchFoodReview = async (id: number): Promise<FoodReview> => {
  const response = await api.get(`/food/reviews/${id}/`);
  return response.data;
};

export const createFoodReview = async (data: Partial<FoodReview>): Promise<FoodReview> => {
  const response = await api.post(`/food/reviews/`, data);
  return response.data;
};

export const updateFoodReview = async (id: number, data: Partial<FoodReview>): Promise<FoodReview> => {
  const response = await api.patch(`/food/reviews/${id}/`, data);
  return response.data;
};

export const deleteFoodReview = async (id: number): Promise<void> => {
  await api.delete(`/food/reviews/${id}/`);
};