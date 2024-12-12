<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { createDirectus, authentication, rest, login } from "@directus/sdk";

const email = ref("");
const password = ref("");

const router = useRouter();
const directus = createDirectus("https://" + import.meta.env.VITE_API_URL)
  .with(authentication("json"))
  .with(rest());

const handleLogin = async () => {
  try {
    const response = await directus.request(login(email.value, password.value));
    console.log("Authentication successful", response);
    await router.push({ name: "home" });
    if (response.access_token) {
      localStorage.setItem("userToken", response.access_token);
    }
  } catch (error) {
    console.error("Authentication failed:", error);
  }
};
</script>

<template>
  <div class="login-container">
    <form @submit.prevent="handleLogin">
      <div class="form-group">
        <label for="email">Email:</label>
        <input type="email" id="email" v-model="email" required />
      </div>

      <div class="form-group">
        <label for="password">Password:</label>
        <input type="password" id="password" v-model="password" required />
      </div>

      <button type="submit">Login</button>
      <p class="signup-link">
        Do not have an account? <RouterLink to="/register">SignUp</RouterLink>
      </p>
    </form>
  </div>
</template>

<style scoped lang="sass">
// Variables
$primary-color: #4caf50
$primary-color-dark: #45a049
$border-color: #ddd
$background-color: #f5f5f5
$shadow-color: rgba(0, 0, 0, 0.1)

.login-container
  display: flex
  justify-content: center
  align-items: center
  min-height: 100vh
  font-family: Arial, sans-serif

form
  padding: 20px
  border: 1px solid $border-color
  border-radius: 4px
  box-shadow: 0 4px 8px $shadow-color
  max-width: 300px
  width: 100%

  .form-group
    margin-bottom: 15px

  label
    display: block
    margin-bottom: 5px

  input[type="email"],
  input[type="password"]
    width: 100%
    padding: 8px
    border: 1px solid $border-color
    border-radius: 4px
    box-sizing: border-box

  button
    width: 100%
    padding: 10px
    border: none
    border-radius: 4px
    background-color: $primary-color
    color: white
    font-size: 16px
    cursor: pointer
    transition: background-color 0.3s

    &:hover
      background-color: $primary-color-dark

.signup-link
  margin-top: 15px
  text-align: center

  a
    color: $primary-color
    text-decoration: none

    &:hover
      text-decoration: underline

</style>