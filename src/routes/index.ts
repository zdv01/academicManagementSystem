import { lazy } from 'react';

const UserCreate= lazy(() => import('../pages/Users/Create'));
const UserUpdate= lazy(() => import('../pages/Users/Update'));
const Posts= lazy(() => import('../pages/Posts/List'));
const usersList = lazy(() => import('../pages/Users/List'))

const coreRoutes = [
  {
    path: '/users',
    title: 'User List',
    component: usersList,
  },
  {
    path: '/users/create',
    title: 'Create User',
    component: UserCreate,
  },
  {
    path: '/users/edit/:id',
    title: 'Edit User',
    component: UserUpdate,
  },
  {
    path: '/posts/list',
    title: 'Posts',
    component: Posts,
  },
];

const routes = [...coreRoutes];
export default routes;
