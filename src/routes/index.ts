import { lazy } from 'react';

// const Posts= lazy(() => import('../pages/Posts/List'));
//En users list faltala carrera(via matricula)
const usersPage = lazy(() => import('../pages/Users/Users'));
const AssociateRubric = lazy(() => import('../pages/Evaluations/AssociateRubric'));
const careersPage = lazy(() => import('../pages/Careers/Career'));
const semestersPage = lazy(() => import('../pages/Semesters/Semester'));
const studyPlanPage = lazy(() => import('../pages/StudyPlans/StudyPlans'));
const CreateRubric = lazy(() => import('../pages/Rubrics/CreateRubric'));
const DefineScales = lazy(() => import('../pages/Rubrics/DefineScales'));
const GradeStudent = lazy(() => import('../pages/Evaluations/GradeStudent'));
// const prb = lazy(() => import('../pages/Prove'));

const coreRoutes = [
  // {
  //   path: "/prove",
  //   component: prb,
  // },
  {
    path: '/rubrics/create',
    title: 'Create Rubric',
    component: CreateRubric,
  },
  {
    path: '/rubrics/:rubricId/scales',
    title: 'Define Scales',
    component: DefineScales,
  },
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
    path: '/evaluations/grade',
    title: 'Grade Student',
    component: GradeStudent,
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
