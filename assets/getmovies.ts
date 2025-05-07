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
    title: 'Click to Capture',
    poster: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTU5YiWkzjpx3HRdarejs8gw_FXftMq90LtZw&s',
    backdrop: 'https://www.pressconnects.com/gcdn/-mm-/4e57f417ab56d8147a59ed2deb8f3a4b0b446da3/c=0-108-2120-1306/local/-/media/2017/11/03/CNYGroup/Binghamton/636453341781285258-GettyImages-504707404.jpg',
    rating: 8.1,
    description: 'Tap to instantly snap a photo and capture your current location. Ideal for quick field documentation.',
    releaseDate: '2025-05-07',
    genres: ['Photo', 'Geo-tagging', 'Quick Capture'],
    navigateTo: '/clerk/cdashboard/Camera',

  },
  {
    key: 'custom-2',
    title: 'Inspection Journal',
    poster: 'https://virtualfieldtrips.org/wp-content/uploads/2018/05/Icon_5_Research_Opt.png',
    backdrop: 'http://smb-si.com/wp-content/uploads/2021/12/tracking-field-employees.jpg',
    rating: 7.5,
    description: 'Detailed record of recent site visits, inspections, and observations.',
    releaseDate: '2023-05-15',
    genres: ['Fieldwork', 'Documentation', 'Report'],
    navigateTo: '/clerk/visits',

  }
  ,  
  {
    key: 'custom-3',
    title: 'Upload Backlog',
    poster: 'https://static.vecteezy.com/system/resources/previews/026/994/785/non_2x/upload-symbol-tiny-people-uploading-data-files-from-smartphone-and-laptop-load-sign-data-exchange-concept-modern-flat-cartoon-style-illustration-on-white-background-vector.jpg',
    backdrop: 'https://47231785.fs1.hubspotusercontent-na1.net/hub/47231785/hubfs/Imported_Blog_Media/syncmobile@2x-Feb-27-2025-06-52-47-2150-PM.jpg?width=1920&name=syncmobile@2x-Feb-27-2025-06-52-47-2150-PM.jpg',
    description: 'Manage and upload pending field visits that haven’t yet been synced. Keep your data complete and up to date.',
    releaseDate: '2024-03-22',
    genres: ['Data Sync', 'Offline Upload'],
    navigateTo: '/clerk/visits/UploadBacklog',
    
  },
  {
    key: 'custom-4',
    title: 'User Profile',
    poster: 'https://st3.depositphotos.com/15648834/17930/v/450/depositphotos_179308454-stock-illustration-unknown-person-silhouette-glasses-profile.jpg',
    backdrop: 'https://inoxoft.com/wp-content/uploads/2025/02/Best-Practices-on-User-Profile-Page-Design-1-1920x820.jpg',
    description: 'Manage your personal information, view and update your profile settings, and ensure your data is accurate and up-to-date for a seamless experience.',
    releaseDate: '2025-05-07',
    genres: ['User Management', 'Profile Settings'],
    navigateTo: '/clerk/profile',
  },
  
  ];
  
  export const getMovies = async (): Promise<Movie[]> => {
    return [...CUSTOM_MOVIES];
  };
  