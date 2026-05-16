import { lazy } from 'react';

// const Posts= lazy(() => import('../pages/Posts/List'));
//En users list faltala carrera(via matricula)
const usersPage = lazy(() => import('../pages/Users/Users'));
const AssociateRubric = lazy(() => import('../pages/Evaluations/AssociateRubric'));
const careersPage = lazy(() => import('../pages/Careers/Career'));
const semestersPage = lazy(() => import('../pages/Semesters/Semester'));
const studyPlanPage = lazy(() => import('../pages/StudyPlans/StudyPlans'));
// const prb = lazy(() => import('../pages/Prove'));

const coreRoutes = [
  // {
  //   path: "/prove",
  //   component: prb,
  // },
  {
    path: '/users',
    title: 'User List',
    component: usersPage,
  },
  {
    path: '/evaluations/associate-rubric',
    title: 'Associate Rubric',
    component: AssociateRubric,
  },
  {
    path: '/careers',
    title: 'Careers',
    component: careersPage,
  },
  {
    path: '/semesters',
    title: 'Semesters',
    component: semestersPage,
  },
  {
    path: '/study-plan',
    title: 'Study Plan',
    component: studyPlanPage,
  },
];

const routes = [...coreRoutes];
export default routes;
