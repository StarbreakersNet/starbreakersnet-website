<script lang="ts" setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { createDirectus, registerUser, rest } from "@directus/sdk";

const router = useRouter();

const firstName = ref("");
const lastName = ref("");
const email = ref("");
const password = ref("");

const directus = createDirectus(import.meta.env.VITE_API_URL).with(rest());

const handleSignup = async () => {
  try {
    const response = await directus.request(
      registerUser(email.value, password.value, {
        first_name: firstName.value,
        last_name: lastName.value,
      })
    );
    console.log("Signup successful:", response);
    await router.push({ name: "home" });
  } catch (error) {
    console.error("Signup failed:", error);
  }
};
</script>

<template>
  <div class="signup-container">
    <form @submit.prevent="handleSignup">
      <div class="form-group">
        <label for="firstName">First Name:</label>
        <input id="firstName" v-model="firstName" required type="text" />
      </div>

      <div class="form-group">
        <label for="lastName">Last Name:</label>
        <input id="lastName" v-model="lastName" required type="text" />
      </div>

      <div class="form-group">
        <label for="email">Email Address:</label>
        <input id="email" v-model="email" required type="email" />
      </div>

      <div class="form-group">
        <label for="password">Password:</label>
        <input id="password" v-model="password" required type="password" />
      </div>

      <button type="submit">Signup</button>
      <p class="login-link">
        Already have an account?
        <RouterLink to="/login">Login</RouterLink>
      </p>
    </form>
  </div>
</template>

<style lang="css" scoped>
.signup-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  font-family: Arial, sans-serif;
}

.form-group {
  margin-bottom: 15px;
}

form {
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  max-width: 300px;
  width: 100%;
}

label {
  display: block;
  margin-bottom: 5px;
}

input[type="text"],
input[type="email"],
input[type="password"] {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
}

button {
  width: 100%;
  padding: 10px;
  border: none;
  border-radius: 4px;
  background-color: #4caf50;
  color: white;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
}

button:hover {
  background-color: #45a049;
}

.login-link {
  margin-top: 15px;
  text-align: center;
}

.login-link a {
  color: #4caf50;
  text-decoration: none;
}

.login-link a:hover {
  text-decoration: underline;
}
</style>
