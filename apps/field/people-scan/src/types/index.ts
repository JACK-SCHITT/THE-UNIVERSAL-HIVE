export interface SearchData {
  // Basic Identity
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
  alias: string;
  gender: string;
  ageFrom: string;
  ageTo: string;
  dateOfBirth: string;
  ssn: string;

  // Location
  city: string;
  state: string;
  zipCode: string;
  country: string;
  previousCity: string;
  previousState: string;

  // Contact
  phoneNumber: string;
  email: string;
  alternatePhone: string;
  alternateEmail: string;

  // Online Presence
  username: string;
  facebookUrl: string;
  twitterHandle: string;
  instagramHandle: string;
  linkedinUrl: string;
  tiktokHandle: string;
  snapchatHandle: string;
  youtubeChannel: string;
  redditUsername: string;
  githubUsername: string;
  website: string;

  // Relationships
  relativeName: string;
  spouseName: string;
  associateName: string;

  // Professional & Education
  employer: string;
  jobTitle: string;
  industry: string;
  school: string;
  graduationYear: string;

  // Assets & Legal
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: string;
  licensePlate: string;
  licensePlateState: string;
  propertyAddress: string;

  // Legal & Records
  hasCourtRecords: string;
  hasCriminalRecord: string;
  bankruptcyHistory: string;

  // Additional
  additionalNotes: string;
}

export const defaultSearchData: SearchData = {
  firstName: '', middleName: '', lastName: '', suffix: '', alias: '', gender: '',
  ageFrom: '', ageTo: '', dateOfBirth: '', ssn: '',
  city: '', state: '', zipCode: '', country: 'United States', previousCity: '', previousState: '',
  phoneNumber: '', email: '', alternatePhone: '', alternateEmail: '',
  username: '', facebookUrl: '', twitterHandle: '', instagramHandle: '', linkedinUrl: '',
  tiktokHandle: '', snapchatHandle: '', youtubeChannel: '', redditUsername: '', githubUsername: '', website: '',
  relativeName: '', spouseName: '', associateName: '',
  employer: '', jobTitle: '', industry: '', school: '', graduationYear: '',
  vehicleMake: '', vehicleModel: '', vehicleYear: '', licensePlate: '', licensePlateState: '', propertyAddress: '',
  hasCourtRecords: '', hasCriminalRecord: '', bankruptcyHistory: '',
  additionalNotes: '',
};

export interface SearchSource {
  name: string;
  url: string;
  category: string;
  description: string;
  icon: string;
  buildUrl: (data: SearchData) => string;
}
