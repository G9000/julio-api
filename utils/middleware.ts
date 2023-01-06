import { NextApiRequest, NextApiResponse } from "next";

export async function runMiddleware(
  req: NextApiRequest,
  res: NextApiResponse,
  fn: any
): Promise<any> {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}
