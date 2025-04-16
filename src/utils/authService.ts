
const API_BASE_URL = "/api";

export const checkAuth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/check-auth/`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        "Content-Type": "application/json",
      },
    });
    return await response.json();
  } catch (error) {
    return { success: false, message: "Network error" };
  }
};

export const loginUser = async (username: string, password: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/login/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });
    return await response.json();
  } catch (error) {
    return { success: false, message: "Network error" };
  }
};

export const verifyOTP = async (user_id: string, otp: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/verify-otp/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user_id, otp }),
    });
    return await response.json();
  } catch (error) {
    return { success: false, message: "Network error" };
  }
};

export const resendOTP = async (user_id: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/resend-otp/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user_id }),
    });
    return await response.json();
  } catch (error) {
    return { success: false, message: "Network error" };
  }
};

export const forgotPassword = async (email: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/forgot-password/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });
    return await response.json();
  } catch (error) {
    return { success: false, message: "Network error" };
  }
};

export const resetPassword = async (
  user_id: string,
  otp: string,
  new_password: string,
  confirm_password: string
) => {
  try {
    const response = await fetch(`${API_BASE_URL}/reset-password/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id,
        otp,
        new_password,
        confirm_password,
      }),
    });
    return await response.json();
  } catch (error) {
    return { success: false, message: "Network error" };
  }
};

export const logoutUser = async () => {
  try {
    const refresh = localStorage.getItem("refresh_token");
    const response = await fetch(`${API_BASE_URL}/logout/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh }),
    });
    return await response.json();
  } catch (error) {
    return { success: false, message: "Network error" };
  }
};
