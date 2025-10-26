import {
  Cuisine,
  Food,
  FoodCategory,
  FoodFilterParams,
  FoodReview,
  PaginatedResponse,
} from "@/types/food";
import apiClient from "@/utils/fetcher";

// Food API endpoints
export const fetchFoods = async (
  params: FoodFilterParams
): Promise<PaginatedResponse<Food>> => {
  return apiClient.get(`/food/admin/foods/`, { params });
};

// Customer-specific food fetching (for menu page)
export const fetchCustomerFoods = async (
  params: FoodFilterParams = {}
): Promise<PaginatedResponse<Food>> => {
  return apiClient.get(`/food/customer/foods/`, { params });
};

export const fetchFood = async (id: number): Promise<Food> => {
  return apiClient.get(`/food/admin/foods/${id}/`);
};

export const createFood = async (formData: FormData): Promise<Food> => {
  return apiClient.post(`/food/admin/foods/`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const updateFood = async (
  id: number,
  formData: FormData
): Promise<Food> => {
  return apiClient.patch(`/food/admin/foods/${id}/`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const deleteFood = async (id: number): Promise<void> => {
  await apiClient.delete(`/food/admin/foods/${id}/`);
};

// Cuisine API endpoints
export const fetchCuisines = async (params: {
  page?: number;
  search?: string;
}): Promise<PaginatedResponse<Cuisine>> => {
  return apiClient.get(`/food/cuisines/`, { params });
};

export const fetchCuisine = async (id: number): Promise<Cuisine> => {
  return apiClient.get(`/food/cuisines/${id}/`);
};

export const createCuisine = async (formData: FormData): Promise<Cuisine> => {
  return apiClient.post(`/food/cuisines/`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const updateCuisine = async (
  id: number,
  formData: FormData
): Promise<Cuisine> => {
  return apiClient.patch(`/food/cuisines/${id}/`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const deleteCuisine = async (id: number): Promise<void> => {
  await apiClient.delete(`/food/cuisines/${id}/`);
};

// Category API endpoints
export const fetchFoodCategories = async (params: {
  page?: number;
  search?: string;
  cuisine?: number;
}): Promise<PaginatedResponse<FoodCategory>> => {
  return apiClient.get(`/food/categories/`, { params });
};

export const fetchFoodCategory = async (id: number): Promise<FoodCategory> => {
  return apiClient.get(`/food/categories/${id}/`);
};

export const createFoodCategory = async (
  formData: FormData
): Promise<FoodCategory> => {
  return apiClient.post(`/food/categories/`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const updateFoodCategory = async (
  id: number,
  formData: FormData
): Promise<FoodCategory> => {
  return apiClient.patch(`/food/categories/${id}/`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const deleteFoodCategory = async (id: number): Promise<void> => {
  await apiClient.delete(`/food/categories/${id}/`);
};

// Review API endpoints
export const fetchFoodReviews = async (params: {
  food?: number;
  page?: number;
}): Promise<PaginatedResponse<FoodReview>> => {
  return apiClient.get(`/food/reviews/`, { params });
};

export const fetchFoodReview = async (id: number): Promise<FoodReview> => {
  return apiClient.get(`/food/reviews/${id}/`);
};

export const createFoodReview = async (
  data: Partial<FoodReview>
): Promise<FoodReview> => {
  return apiClient.post(`/food/reviews/`, data);
};

export const updateFoodReview = async (
  id: number,
  data: Partial<FoodReview>
): Promise<FoodReview> => {
  return apiClient.patch(`/food/reviews/${id}/`, data);
};

export const deleteFoodReview = async (id: number): Promise<void> => {
  await apiClient.delete(`/food/reviews/${id}/`);
};

// Bulk operations (used by FoodMenuManagement)
export const bulkUpdateFoodAvailability = async (
  foodIds: number[],
  available: boolean
): Promise<void> => {
  // Use PATCH requests to individual foods since bulk endpoint doesn't exist
  await Promise.all(
    foodIds.map((id) =>
      apiClient.patch(`/food/admin/foods/${id}/`, { is_available: available })
    )
  );
};

export const bulkDeleteFoods = async (foodIds: number[]): Promise<void> => {
  // Use DELETE requests to individual foods since bulk endpoint doesn't exist
  await Promise.all(
    foodIds.map((id) => apiClient.delete(`/food/admin/foods/${id}/`))
  );
};

// Food approval/rejection operations
export const approveFood = async (
  id: number,
  comments?: string
): Promise<Food> => {
  return apiClient.post(`/food/approval/${id}/approve/`, { comments });
};

export const rejectFood = async (
  id: number,
  reason: string
): Promise<{ message: string; reason: string }> => {
  return apiClient.post(`/food/approval/${id}/reject/`, { reason });
};

// Toggle food availability
export const toggleFoodAvailability = async (
  id: number,
  isAvailable: boolean
): Promise<Food> => {
  return apiClient.patch(`/food/admin/foods/${id}/`, {
    is_available: isAvailable,
  });
};

// Default export with all functions
const foodService = {
  // Food operations
  fetchFoods,
  fetchFood,
  createFood,
  updateFood,
  deleteFood,
  bulkUpdateFoodAvailability,
  bulkDeleteFoods,
  approveFood,
  rejectFood,
  toggleFoodAvailability,

  // Cuisine operations
  fetchCuisines,
  fetchCuisine,
  createCuisine,
  updateCuisine,
  deleteCuisine,

  // Category operations
  fetchFoodCategories,
  fetchFoodCategory,
  createFoodCategory,
  updateFoodCategory,
  deleteFoodCategory,

  // Review operations
  fetchFoodReviews,
  fetchFoodReview,
  createFoodReview,
  updateFoodReview,
  deleteFoodReview,
};

export default foodService;
