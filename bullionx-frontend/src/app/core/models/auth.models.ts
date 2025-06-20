export interface RegisterRequest {
    firstName: string;
    lastName:  string;
    email:     string;
    password:  string;
  }
  
  export interface LoginRequest {
    email:    string;
    password: string;
  }
  
  export interface AuthResponse {
    token: string;
    user : UserDto;
  }

  export interface UserDto {
    id : number;
    firstName : string;
    lastName : string;
    email : string;
  }
  