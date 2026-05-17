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
<<<<<<< HEAD
const subjectsPage = lazy(() => import('../pages/Subjects/Subjects'));
=======
const RegisterFinalGrades = lazy(() => import('../pages/Evaluations/RegisterFinalGrades'));
>>>>>>> fd258b1fcf62d87f7e0a972a18bc959c8a552095
const groupsPage = lazy(() => import('../pages/Groups/Groups'));
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
    path: '/groups',
    title: 'Groups',
    component: groupsPage,
  },
  {
    path: '/evaluations/grade',
    title: 'Grade Student',
    component: GradeStudent,
  },
  {
    path: '/evaluations/register-final-grades/:groupId',
    title: 'Register Final Grades',
    component: RegisterFinalGrades,
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
  {
    path: '/subjects',
    title: 'Subjects',
    component: subjectsPage,
  },
  {
    path: '/groups',
    title: 'Groups',
    component: groupsPage,
  },
];

const routes = [...coreRoutes];
export default routes;
