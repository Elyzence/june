export const content = {
  name: 'June Shen',
  // aboutPhotos: ['photos/about-1.jpg'], 
  tagline: [
    'Data-focused IT professional delivering clear, actionable insights.',
    'Open to aviation and finance IT roles.',
  ],
  about: [
    'I am an early-career IT professional with Mathematics background and hands-on experience in data analysis and modelling. I enjoy turning complex problems into clear, practical solutions.',
    'Outside of work I volunteer, travel to learn from different environments, and enjoy industries that value careful thinking and reliability, which is why aviation and finance IT appeal to me.',
  ],

  // Education
  education: [
    {
      degree: 'BSc in Computing Mathematics',
      school: 'City University of Hong Kong',
      period: '2021 – 2026',
      text: [
              ' ',
              'Focuses on mathematical modelling and data analysis,', 
              'with a balance between mathematical theory and practical applications.'
            ],
      tags: ['Data Analysis', 'Modelling', 'Finance', 'Technology'], 
    },
  ],

  experience: [
    {
      featured: true,
      photos: [{ src: 'photos/hko.png', side: 'left', y: 2.4, dz: -1 }],
      // captions: ['Label for photo 1', 'Label for photo 2'], 
      role: 'One-year Placement',
      org: 'Hong Kong Observatory',
      period: 'Jan 2025 – Dec 2025',
      summary: 'Using Delft3D hydrodynamic model to simulating storm surge dynamics in the South China Sea.',
      responsibilities: [
        'Conducted data analysis using techniques such as Fourier transforms to identify time lags.',
        'Investigated complex tide-surge interactions model limitations and improve model accuracy.',
        'Generated and analysed model results that contributed to a research paper under supervisor guidance.',
      ],
      achievements: [
        'Co-contributor to a published research paper.'
      ],
      paper: {
        title: 'Periodic Water Level Anomalies over Coast of Guangdong Due to Tide-Wind Interaction over Taiwan Shoal',
        venue: 'Journal of Marine Science and Engineering, 2026',
        note: 'Responsible for simulation, analysis and results.',
        url: 'https://doi.org/10.3390/jmse14070623',
      },
      tech: ['Delft3D', 'Python', 'Linux', 'R Programming', 'Matlab', 'GIS'],
    },
    {
      role: 'IT Support Summer Intern',
      photos: [{ src: 'photos/cad.png', side: 'left', y: 2.4, dz: -1 }],
      org: 'Civil Aviation Department',
      period: 'Jul 2024 – Aug 2024',
      summary: 'Improve data analysis efficiency.',
      responsibilities: [
        'Debugged and optimized a VBA-based data analysis program.', 
        'Analyzed large flight-operations datasets.',
        'Developed strong knowledge of the aviation industry, particularly in the technical domain.'
      ],

      tech: ['Python', 'VBA'],
    },
    {
      role: 'Website Development (Intern → Part-time)',
      // photos: ['photos/exp3-a.jpg'],
      org: 'AITalk',
      period: 'Jun 2022 – May 2023',
      summary: 'Handling both the frontend and backend of the website.',
      responsibilities: [
        'Developed responsive web interfaces.', 
        'Built backend applications and managed databases for efficient data handling.',
        'Maintained a Linux server environment and configured Apache2.',
      ],
      tech: ['JavaScript', 'HTML/CSS', 'Python', 'Linux', 'PHP', 'SQL', 'Git & GitHub'],
    },
  ],

  additional: [
    {
      title: 'Global Citizen Programme',
      photos: [{ src: 'photos/gcp.png', side: 'left', y: 2.4, dz: 2 }, { src: 'photos/gcp2.png', side: 'left', y: 2.4, dz: 0, size: [2.4, 3.2], fit: 'contain' }],
      captions: ['Rainwater collection system', 'Completion certificate'],
      org: 'Engineers without Borders Hong Kong',
      period: 'Jan 2022 – Jun 2025',
      text: 'Started as a participant and later joined the Organizing Committee, coordinating teams and events. Applied systems and design thinking to study poverty in Hong Kong, linked findings to the “Lantau Tomorrow” initiative, and delivered a TED-style talk on a 2050 carbon-neutral plan. Also designed a STEAM class for Myanmar students and joined a service trip to Malaysia focused on sustainability and village infrastructure.',
    },
    {
      title: 'Student Ambassador',
      // photos: [{ src: 'photos/.png', side: 'left', y: 2.4, dz: 6 }],
      org: 'ICAC',
      period: 'Nov 2023 – Jun 2024',
      text: 'Organized student-focused integrity activities with fellow ambassadors and faculty.',
    },
    {
      title: 'Summer exchange programme',
      photos: [{ src: 'photos/ubc.png', side: 'right', y: 2.4, dz: -3 },{src: 'photos/ubc2.png', side: 'right', y: 2.4, dz: -5 }],
      captions: ['Summer exchange programme 2023', 'A field trip to the Britannia Mine Museum'], 
      org: 'University of British Columbia',
      period: 'July 2023 (one month)',
      text: 'Completed a one-month course in Earth, Ocean and Atmospheric Science, which included field trips to Vancouver’s beaches and countryside, as well as case study projects that provided hands-on experience in environmental observation and analysis.',
    }
  ],

  skills: {
    Technical: ['Python', 'Java', 'JavaScript', 'HTML/CSS', 'VBA', 'R Programming', 'Matlab', 'SQL', 'PHP', 'Linux'],
    Tools: ['Git & GitHub', 'VS Code', 'ArduinoIDE', 'PowerBI', 'Tableau', 'Delft3D', 'GIS'],
    'Soft skills': ['Clear communication', 'Teamwork', 'Problem solving', 'Adaptability'],
    'Domain knowledge': ['Website Development', 'Data Analysis', 'Finance (Probability)', 'Aviation', 'Ocean Science'],
    'Languages': ['Cantonese (Native)', 'English (Fluent)', 'Mandarin (Fliuent)','French (Intermediate)'],
  },

  contact: {
    email: 'june.shen@gmail.com',
  },

};
