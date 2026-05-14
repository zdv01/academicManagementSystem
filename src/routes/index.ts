import { lazy } from 'react';

// const Posts= lazy(() => import('../pages/Posts/List'));
//En users list faltala carrera(via matricula)
const usersList = lazy(() => import('../pages/Users/Users'))
const AssociateRubric = lazy(() => import('../pages/Evaluations/AssociateRubric'));
// const prb = lazy(() => import('../pages/Prove'));

const coreRoutes = [
  // {
  //   path: "/prove",
  //   component: prb,
  // },
  {
    path: '/users',
    title: 'User List',
    component: usersList,
  },
  {
  path: '/evaluations/associate-rubric',
  title: 'Associate Rubric',
  component: AssociateRubric,
},
];

const routes = [...coreRoutes];
export default routes;
