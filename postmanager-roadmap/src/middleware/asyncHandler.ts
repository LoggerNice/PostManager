import type { Request, Response, NextFunction } from 'express';

export function asyncHandler<TReq extends Request>(
  fn: (req: TReq, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: TReq, res: Response, next: NextFunction) => {
    void fn(req, res, next).catch(next);
  };
}

