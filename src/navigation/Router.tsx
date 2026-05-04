import React from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import AuthenticatedLayout from '../layout/AuthenticatedLayout'
import Layout from '../layout/Layout'
import DashboardPage from '../pages/DashboardPage'
import LoginPage from '../pages/authentication/LoginPage'
import RegisterPage from '../pages/authentication/RegisterPage'

export const routes = {
  home: '/home',
  login: '/',
  register: '/register',
}

export const Router = () => (
  <BrowserRouter>
    <Routes>
      <Route element={<Layout />}>
        <Route path={routes.login} element={<LoginPage />} />
        <Route path={routes.register} element={<RegisterPage />} />
      </Route>
      <Route element={<AuthenticatedLayout />}>
        <Route path={routes.home} element={<DashboardPage />} />
      </Route>
    </Routes>
  </BrowserRouter>
)
