import { Request } from 'express';
import * as UAParser from 'ua-parser-js';

export interface DeviceInfo {
  deviceName: string;
  browser: string;
  operatingSystem: string;
  ipAddress: string;
  location: string | string[];
}

export const getDeviceInfo = (req: Request): DeviceInfo => {
  const parser = new UAParser.UAParser(req.headers['user-agent']);
  const result = parser.getResult();

  return {
    deviceName: result.device.model || 'Unknown Device',
    browser: `${result.browser.name} ${result.browser.version}`,
    operatingSystem: `${result.os.name} ${result.os.version}`,
    ipAddress: req.ip || 'Unknown IP',
    location: req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown Location'
  };
}; 