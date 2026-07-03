import type { NextApiRequest, NextApiResponse } from "next";

const RATE_DATA = {
  "Times of India": {
    "Delhi NCR": {
      classified: { baseRate: 50, lineRate: 15 },
      display: { baseRate: 200, cm2Rate: 2 },
    },
    "Mumbai": {
      classified: { baseRate: 60, lineRate: 18 },
      display: { baseRate: 250, cm2Rate: 2.5 },
    },
  },
  "Hindustan Times": {
    "Delhi NCR": {
      classified: { baseRate: 45, lineRate: 12 },
      display: { baseRate: 180, cm2Rate: 1.8 },
    },
    "Mumbai": {
      classified: { baseRate: 55, lineRate: 15 },
      display: { baseRate: 220, cm2Rate: 2.2 },
    },
  },
  "Dainik Jagran": {
    "Delhi NCR": {
      classified: { baseRate: 30, lineRate: 8 },
      display: { baseRate: 120, cm2Rate: 1 },
    },
  },
};

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json(RATE_DATA);
}
