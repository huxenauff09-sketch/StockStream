export class CreateUserDto {
    name?: string;
    username?: string;
  email: string;
  password: string;
}

export class UpdateUserDto {
    name?: string;
    username?: string;
  email?: string;
  password?: string;
  oldPassword?: string;
}

export class LoginUserDto {
  email: string;
  password: string;
}
