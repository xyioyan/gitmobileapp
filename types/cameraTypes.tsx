// types.ts (or wherever you keep types)
export type RootStackParamList = {
    Camera: undefined;
    WriteDescription: { visitData: VisitDataType };
  };
  
  // Example VisitDataType — customize to match your structure
  export type VisitDataType = {
    photoUri: string;
    description: string;
    latitude: number;
    longitude: number;
    userId: string;
    timestamp: string;
    address: string;
  };