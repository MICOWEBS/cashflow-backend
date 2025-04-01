import { Request, Response, NextFunction } from 'express';

type ControllerFunction = (req: Request, res: Response) => Promise<any>;

export const asyncHandler = (fn: ControllerFunction) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res)).catch(next);
  };
}; 