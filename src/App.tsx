import { lazy } from 'react'
import { createBrowserRouter, createRoutesFromElements, Navigate, Route, RouterProvider } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'
import { ConfirmHost } from './components/ConfirmHost'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Toaster } from './components/Toaster'
import { AdminLayout } from './components/layout/AdminLayout'
import { Login } from './pages/Login'
import { NotFound } from './pages/NotFound'

// Admin pages load on demand; AdminLayout shows a spinner while one downloads.
const VideoList = lazy(() => import('./pages/videos/VideoList').then((m) => ({ default: m.VideoList })))
const AddVideo = lazy(() => import('./pages/videos/AddVideo').then((m) => ({ default: m.AddVideo })))
const EditVideo = lazy(() => import('./pages/videos/EditVideo').then((m) => ({ default: m.EditVideo })))
const VideoDetails = lazy(() => import('./pages/videos/VideoDetails').then((m) => ({ default: m.VideoDetails })))
const Drafts = lazy(() => import('./pages/videos/Drafts').then((m) => ({ default: m.Drafts })))
const Studios = lazy(() => import('./pages/Studios').then((m) => ({ default: m.Studios })))
const Pornstars = lazy(() => import('./pages/Pornstars').then((m) => ({ default: m.Pornstars })))
const Categories = lazy(() => import('./pages/Categories').then((m) => ({ default: m.Categories })))

// A data router, so forms can warn before navigating away with unsaved changes (useBlocker).
const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        {/* Publishing drafts is the main job, so the admin opens on the queue. */}
        <Route index element={<Navigate to="/video/drafts" replace />} />
        <Route path="video/drafts" element={<Drafts />} />
        <Route path="video/list" element={<VideoList />} />
        <Route path="video/add" element={<AddVideo />} />
        <Route path="video/edit/:slug" element={<EditVideo />} />
        <Route path="video/details/:slug" element={<VideoDetails />} />
        <Route path="studios" element={<Studios />} />
        <Route path="pornstars" element={<Pornstars />} />
        <Route path="category" element={<Categories />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </>,
  ),
)

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster />
      <ConfirmHost />
    </QueryClientProvider>
  )
}
