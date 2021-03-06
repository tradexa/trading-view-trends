/* eslint-disable @typescript-eslint/no-explicit-any */
import Axios from 'axios';
import {
  EXCHANGES_ENUM,
  INTERVALS_ENUM,
  INTERVALS_SCHEMA,
  REQUEST_INDICATORS,
  SCREENERS_ENUM,
} from './contracts';
import { ParseTAResponse } from './reponseParser';
const SCAN_URL = 'https://scanner.tradingview.com/';

function getData(symbol: string, interval: INTERVALS_ENUM) {
  const preparedInterval = INTERVALS_SCHEMA?.[interval] || '';
  return {
    symbols: { tickers: [symbol.toUpperCase()], query: { types: [] } },
    columns: REQUEST_INDICATORS.map((i) => i.replace('{}', preparedInterval)),
  };
}

export class TradingViewScan {
  constructor(
    public screener: SCREENERS_ENUM,
    public exchange: EXCHANGES_ENUM,
    public symbol: string,
    public interval: INTERVALS_ENUM,
    private axiosInstance: typeof Axios = Axios,
  ) {}
  public async analyze(): Promise<any> {
    this.validateExchange();
    this.validateScreener();
    this.validateSymbol();

    return await this._makeRequest();
  }

  public async _makeRequest(): Promise<any> {
    const exch_smbl = `${this.exchange.toUpperCase()}:${this.symbol.toUpperCase()}`;
    const reqData = getData(exch_smbl, this.interval);
    const { data } = await this.axiosInstance.post(
      `${SCAN_URL}${this.screener.toLowerCase()}/scan`,
      reqData,
    );
    const result = new ParseTAResponse(data).parse();

    return {
      screener: this.screener,
      exchange: this.exchange,
      symbol: this.symbol,
      interval: this.interval,
      time: new Date().toDateString(),
      ...result,
    };
  }
  public async validateExchange(): Promise<void> {
    if (Object.values(EXCHANGES_ENUM).indexOf(this.exchange) === -1) {
      throw new Error(`Exchange "${this.exchange}" is not valid`);
    }
  }
  public async validateScreener(): Promise<void> {
    if (Object.values(SCREENERS_ENUM).indexOf(this.screener) === -1) {
      throw new Error(`Screener "${this.screener}" is not valid`);
    }
  }
  public async validateSymbol(): Promise<void> {
    if (typeof this.symbol !== 'string') {
      throw new Error(`Symbol "${this.symbol}" is not valid`);
    }
  }
}
