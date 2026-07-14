export interface InflationYear {
  year: number;
  rate: number;
}

/** Georgia's annual average CPI inflation, National Statistics Office of Georgia (Geostat). */
export const georgiaInflationHistory: InflationYear[] = [
  { year: 2020, rate: 5.7 },
  { year: 2021, rate: 9.6 },
  { year: 2022, rate: 11.9 },
  { year: 2023, rate: 2.5 },
  { year: 2024, rate: 3.1 },
];

export const georgiaInflationAverage =
  georgiaInflationHistory.reduce((sum, y) => sum + y.rate, 0) / georgiaInflationHistory.length;
