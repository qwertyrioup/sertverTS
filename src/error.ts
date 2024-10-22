import { CustomError } from "./interfaces";


  export const createError = (status: number, message: string): CustomError => {
    const err: CustomError = new Error(message) as CustomError;
    err.status = status;
    return err;
  };
