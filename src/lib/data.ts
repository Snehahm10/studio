export type Subject = {
  id: string;
  name: string;
  notesUrl: string;
  qpUrl:string;
};

export const schemes = [
  { value: '2022', label: '2022 Scheme' },
  { value: '2021', label: '2021 Scheme' },
];

export const branches = [
  { value: 'cse', label: 'Computer Science' },
  { value: 'ise', label: 'Information Science' },
  { value: 'ece', label: 'Electronics & Communication' },
  { value: 'me', label: 'Mechanical Engineering' },
  { value: 'cv', label: 'Civil Engineering' },
];

export const years = [
  { value: '1', label: '1st Year' },
  { value: '2', label: '2nd Year' },
  { value: '3', label: '3rd Year' },
  { value: '4', label: '4th Year' },
];

export const semesters = [
  { value: '1', label: '1st Sem' },
  { value: '2', label: '2nd Sem' },
  { value: '3', label: '3rd Sem' },
  { value: '4', label: '4th Sem' },
  { value: '5', label: '5th Sem' },
  { value: '6', label: '6th Sem' },
  { value: '7', label: '7th Sem' },
  { value: '8', label: '8th Sem' },
];


type Resources = {
  [scheme: string]: {
    [branch: string]: {
        [semester: string]: Subject[];
    };
  };
};

// Mock data - in a real app this would come from a database
export const resources: Resources = {
  "2022": {
    "cse": {
      "3": [
        { id: "22CS31", name: "Transform Calculus, Fourier Series and Numerical Techniques", notesUrl: "#", qpUrl: "#" },
        { id: "22CS32", name: "Data Structures and Applications", notesUrl: "#", qpUrl: "#" },
        { id: "22CS33", name: "Analog and Digital Electronics", notesUrl: "#", qpUrl: "#" },
        { id: "22CS34", name: "Computer Organization and Architecture", notesUrl: "#", qpUrl: "#" },
      ],
      "4": [
        { id: "22CS41", name: "Design and Analysis of Algorithms", notesUrl: "#", qpUrl: "#" },
        { id: "22CS42", name: "Microcontroller and Embedded Systems", notesUrl: "#", qpUrl: "#" },
        { id: "22CS43", name: "Operating Systems", notesUrl: "#", qpUrl: "#" },
        { id: "22CS44", name: "Object Oriented Concepts", notesUrl: "#", qpUrl: "#" },
      ]
    }
  },
  "2021": {
    "cse": {
      "5": [
        { id: "21CS51", name: "Management, Entrepreneurship for IT Industry", notesUrl: "#", qpUrl: "#" },
        { id: "21CS52", name: "Computer Networks", notesUrl: "#", qpUrl: "#" },
        { id: "21CS53", name: "Database Management System", notesUrl: "#", qpUrl: "#" },
        { id: "21CS54", name: "Automata Theory and Compiler Design", notesUrl: "#", qpUrl: "#" },
      ],
    }
  }
}
