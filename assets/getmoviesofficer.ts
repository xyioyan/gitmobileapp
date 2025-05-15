export interface Movie {
    key: string;
    title: string;
    description: string;
    poster: string;
    backdrop: string;
    genres: string[];
    navigateTo: string;
  }


const CUSTOM_MOVIES = [
 {
  key: 'custom-1',
  title: 'Track Visits',
  poster: 'https://virtualfieldtrips.org/wp-content/uploads/2018/05/Icon_5_Research_Opt.png',
  backdrop: 'https://www.bigrentz.com/blog/wp-content/uploads/2021/01/site-inspection.jpg',
  rating: 8.1,
  description: 'Monitor and visualize all submitted field visits in real time using interactive maps. Ideal for supervisors and officers overseeing fieldwork.',
  releaseDate: '2025-05-07',
  genres: ['Visit Tracking', 'Geolocation', 'Field Oversight'],
  navigateTo: '/officer/visits/maps/MapView',
},{
  key: 'custom-2',
  title: 'Assign Tasks',
  poster: 'https://venture-lab.org/wp-content/webpc-passthru.php?src=https://venture-lab.org/wp-content/uploads/2022/02/5-Uncommon-Assignment-Writing-Tips-for-Students-1024x810.jpg&nocache=1',
  backdrop: 'https://img.freepik.com/free-photo/colleagues-working-together-assignment_23-2149333536.jpg',
  rating: 7.5,
  description: 'Easily assign tasks to field employees and monitor their progress. Define objectives, set deadlines, and streamline field operations with clarity and control.',
  releaseDate: '2023-05-15',
  genres: ['Task Assignment', 'Field Management', 'Work Delegation'],
  navigateTo: '/officer/list',
}

  ,  
  {
  key: 'custom-3',
  title: 'Track Employees',
  poster: 'https://www.ecoonline.com/wp-content/uploads/2024/12/Everything-you-need-to-know-about-employee-monitoring-systems-StaySafe-3.jpeg',
  backdrop: 'https://www.verizonconnect.com/resources/images/blog/employee-tracking-software-header.jpg',
  description: 'Monitor the real-time locations of field employees and stay updated on their routes and activity. Ideal for oversight and coordination during field operations.',
  releaseDate: '2024-03-22',
  genres: ['Real-time Tracking', 'Employee Monitoring', 'Field Operations'],
  navigateTo: '/officer/visits/maps/OfficerRealtimeTracking',
}
,
  {
  key: 'custom-4',
  title: 'User Profile',
  poster: 'https://st3.depositphotos.com/15648834/17930/v/450/depositphotos_179308454-stock-illustration-unknown-person-silhouette-glasses-profile.jpg',
  backdrop: 'https://img.freepik.com/free-photo/profile-settings-interface-parameters-personal-data-concept_53876-124622.jpg',
  description: 'Access and update your personal profile, including contact details and user role. Keep your information accurate for a personalized experience.',
  releaseDate: '2025-05-07',
  genres: ['Profile', 'Account Management', 'Settings'],
  navigateTo: '/officer/profile',
}
,
  
  ];
  
  export const getMovies = async (): Promise<Movie[]> => {
    return [...CUSTOM_MOVIES];
  };
  