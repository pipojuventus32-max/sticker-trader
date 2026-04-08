import { WC_2026_TEAM_CODES, type Wc2026TeamCode } from './stickers';

/** Display names aligned with the official album order (same as sticker sections). */
const WC_2026_SECTION_NAMES: Record<Wc2026TeamCode, string> = {
  FWC: 'Panini + Stadiums',
  MEX: 'Mexico',
  RSA: 'South Africa',
  KOR: 'South Korea',
  CZE: 'Czechia',
  CAN: 'Canada',
  BIH: 'Bosnia and Herzegovina',
  QAT: 'Qatar',
  SUI: 'Switzerland',
  BRA: 'Brazil',
  MAR: 'Morocco',
  HAI: 'Haiti',
  SCO: 'Scotland',
  USA: 'United States',
  PAR: 'Paraguay',
  AUS: 'Australia',
  TUR: 'Türkiye',
  GER: 'Germany',
  CUW: 'Curaçao',
  CIV: "Côte d'Ivoire",
  ECU: 'Ecuador',
  NED: 'Netherlands',
  JPN: 'Japan',
  SWE: 'Sweden',
  TUN: 'Tunisia',
  BEL: 'Belgium',
  EGY: 'Egypt',
  IRN: 'Iran',
  NZL: 'New Zealand',
  ESP: 'Spain',
  CPV: 'Cape Verde',
  KSA: 'Saudi Arabia',
  URU: 'Uruguay',
  FRA: 'France',
  SEN: 'Senegal',
  IRQ: 'Iraq',
  NOR: 'Norway',
  ARG: 'Argentina',
  ALG: 'Algeria',
  AUT: 'Austria',
  JOR: 'Jordan',
  POR: 'Portugal',
  COD: 'DR Congo',
  UZB: 'Uzbekistan',
  COL: 'Colombia',
  ENG: 'England',
  CRO: 'Croatia',
  GHA: 'Ghana',
  PAN: 'Panama',
};

export type Wc2026CountryRow = {
  code: Wc2026TeamCode;
  /** Section title without code */
  name: string;
  /** e.g. "Mexico - MEX" */
  listLabel: string;
};

/** Same order as stickers in the album (FWC first, then nations). */
export const WC_2026_COUNTRY_ROWS: readonly Wc2026CountryRow[] = WC_2026_TEAM_CODES.map((code) => {
  const name = WC_2026_SECTION_NAMES[code];
  return {
    code,
    name,
    listLabel: `${name} - ${code}`,
  };
});

export function wc2026RowForCode(code: string): Wc2026CountryRow | undefined {
  return WC_2026_COUNTRY_ROWS.find((r) => r.code === code);
}
